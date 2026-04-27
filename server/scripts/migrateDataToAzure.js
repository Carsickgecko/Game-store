import dotenv from "dotenv";
import sql from "mssql";

dotenv.config();

const sourceConfig = {
  server: process.env.SOURCE_DB_SERVER || process.env.DB_SERVER || "localhost",
  port: Number(process.env.SOURCE_DB_PORT || process.env.DB_PORT || 1433),
  database: process.env.SOURCE_DB_NAME || process.env.DB_NAME || "GameStoreDB",
  user: process.env.SOURCE_DB_USER || process.env.DB_USER,
  password: process.env.SOURCE_DB_PASSWORD || process.env.DB_PASSWORD,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

const targetConfig = {
  server: process.env.TARGET_DB_SERVER,
  port: Number(process.env.TARGET_DB_PORT || 1433),
  database: process.env.TARGET_DB_NAME || "GameStoreDB",
  user: process.env.TARGET_DB_USER,
  password: process.env.TARGET_DB_PASSWORD,
  options: {
    encrypt: true,
    trustServerCertificate: false,
  },
};

if (!targetConfig.server || !targetConfig.user || !targetConfig.password) {
  console.error("Missing target Azure SQL connection details.");
  process.exit(1);
}

function quoteName(name) {
  return `[${String(name).replace(/]/g, "]]")}]`;
}

function formatDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString().replace("T", " ").replace("Z", "");
}

function escapeString(value) {
  return String(value).replace(/'/g, "''");
}

function toSqlLiteral(value) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "NULL";
  }
  if (typeof value === "bigint") {
    return value.toString();
  }
  if (typeof value === "boolean") {
    return value ? "1" : "0";
  }
  if (value instanceof Date) {
    return `N'${formatDate(value)}'`;
  }
  if (Buffer.isBuffer(value)) {
    return `0x${value.toString("hex")}`;
  }
  return `N'${escapeString(value)}'`;
}

async function getTables(pool) {
  const result = await pool.request().query(`
    SELECT
      s.name AS schema_name,
      t.name AS table_name
    FROM sys.tables t
    JOIN sys.schemas s ON s.schema_id = t.schema_id
    WHERE t.is_ms_shipped = 0
      AND t.name <> 'sysdiagrams'
    ORDER BY s.name, t.name
  `);
  return result.recordset;
}

async function getColumns(pool, schemaName, tableName) {
  const result = await pool.request()
    .input("schemaName", sql.NVarChar, schemaName)
    .input("tableName", sql.NVarChar, tableName)
    .query(`
      SELECT
        c.name AS column_name
      FROM sys.columns c
      JOIN sys.tables t ON t.object_id = c.object_id
      JOIN sys.schemas s ON s.schema_id = t.schema_id
      WHERE s.name = @schemaName
        AND t.name = @tableName
      ORDER BY c.column_id
    `);
  return result.recordset.map((row) => row.column_name);
}

async function getIdentityColumn(pool, schemaName, tableName) {
  const result = await pool.request()
    .input("schemaName", sql.NVarChar, schemaName)
    .input("tableName", sql.NVarChar, tableName)
    .query(`
      SELECT c.name AS column_name
      FROM sys.identity_columns ic
      JOIN sys.columns c
        ON c.object_id = ic.object_id
       AND c.column_id = ic.column_id
      JOIN sys.tables t ON t.object_id = ic.object_id
      JOIN sys.schemas s ON s.schema_id = t.schema_id
      WHERE s.name = @schemaName
        AND t.name = @tableName
    `);
  return result.recordset[0]?.column_name || null;
}

async function getRows(pool, schemaName, tableName) {
  const result = await pool.request().query(
    `SELECT * FROM ${quoteName(schemaName)}.${quoteName(tableName)}`
  );
  return result.recordset;
}

function chunkArray(items, size) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

async function disableConstraints(pool, tables) {
  for (const table of tables) {
    const fullName = `${quoteName(table.schema_name)}.${quoteName(table.table_name)}`;
    await pool.request().batch(`ALTER TABLE ${fullName} NOCHECK CONSTRAINT ALL;`);
  }
}

async function enableConstraints(pool, tables) {
  for (const table of tables) {
    const fullName = `${quoteName(table.schema_name)}.${quoteName(table.table_name)}`;
    await pool.request().batch(`ALTER TABLE ${fullName} WITH CHECK CHECK CONSTRAINT ALL;`);
  }
}

async function clearTargetTables(pool, tables) {
  for (const table of [...tables].reverse()) {
    const fullName = `${quoteName(table.schema_name)}.${quoteName(table.table_name)}`;
    await pool.request().batch(`DELETE FROM ${fullName};`);
  }
}

async function importTable(sourcePool, targetPool, table) {
  const { schema_name: schemaName, table_name: tableName } = table;
  const fullName = `${quoteName(schemaName)}.${quoteName(tableName)}`;
  const columns = await getColumns(sourcePool, schemaName, tableName);
  const identityColumn = await getIdentityColumn(sourcePool, schemaName, tableName);
  const rows = await getRows(sourcePool, schemaName, tableName);

  if (!rows.length) {
    console.log(`Skipping ${schemaName}.${tableName}: no rows`);
    return;
  }

  const columnList = columns.map(quoteName).join(", ");
  const batches = chunkArray(rows, 50);

  if (identityColumn) {
    await targetPool.request().batch(`SET IDENTITY_INSERT ${fullName} ON;`);
  }

  for (const batchRows of batches) {
    const valuesSql = batchRows.map((row) => {
      const values = columns.map((column) => toSqlLiteral(row[column]));
      return `(${values.join(", ")})`;
    }).join(",\n");

    const insertSql = `
      INSERT INTO ${fullName} (${columnList})
      VALUES
      ${valuesSql};
    `;

    await targetPool.request().batch(insertSql);
  }

  if (identityColumn) {
    await targetPool.request().batch(`SET IDENTITY_INSERT ${fullName} OFF;`);
  }

  console.log(`Imported ${rows.length} rows into ${schemaName}.${tableName}`);
}

async function main() {
  console.log("Connecting to source SQL Server...");
  const sourcePool = await sql.connect(sourceConfig);

  console.log("Connecting to target Azure SQL...");
  const targetPool = await new sql.ConnectionPool(targetConfig).connect();

  try {
    const tables = await getTables(sourcePool);
    console.log(`Found ${tables.length} tables to migrate.`);

    await disableConstraints(targetPool, tables);
    await clearTargetTables(targetPool, tables);

    for (const table of tables) {
      await importTable(sourcePool, targetPool, table);
    }

    await enableConstraints(targetPool, tables);
    console.log("Data migration completed successfully.");
  } finally {
    await sourcePool.close();
    await targetPool.close();
  }
}

main().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
