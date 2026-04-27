import sql from "mssql";
import dotenv from "dotenv";

dotenv.config();

function isTruthy(value, fallback = false) {
  const raw = String(value ?? "").trim().toLowerCase();
  if (!raw) return fallback;
  return ["1", "true", "yes", "on"].includes(raw);
}

const config = {
  server: process.env.DB_SERVER || "localhost",
  port: Number(process.env.DB_PORT || 1433),
  database: process.env.DB_NAME || "GameStoreDB",
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: isTruthy(process.env.DB_ENCRYPT, false),
    trustServerCertificate: isTruthy(process.env.DB_TRUST_SERVER_CERTIFICATE, true),
  },
};

let pool;

export async function getPool() {
  if (pool) return pool;
  pool = await sql.connect(config);
  return pool;
}
