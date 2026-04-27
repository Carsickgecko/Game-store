import crypto from "crypto";
import { getPool } from "../db.js";

const DEFAULT_RATE_LIMIT_PER_HOUR = Math.max(
  60,
  Number(process.env.PUBLIC_API_RATE_LIMIT_PER_HOUR || 200),
);

const rateLimitStore = new Map();

function toText(value) {
  return String(value || "").trim();
}

function toOptionalText(value) {
  const normalized = toText(value);
  return normalized || null;
}

export function normalizeDeveloperEmail(value) {
  return toText(value).toLowerCase();
}

export function createApiKeyValue() {
  return `ngs_${crypto.randomBytes(24).toString("hex")}`;
}

export function hashApiKey(apiKey) {
  return crypto
    .createHash("sha256")
    .update(String(apiKey || ""), "utf8")
    .digest("hex");
}

export function getApiKeyPrefix(apiKey) {
  return String(apiKey || "").slice(0, 12);
}

export function getRateLimitPerHour(value) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return DEFAULT_RATE_LIMIT_PER_HOUR;
  }

  return Math.max(60, Math.min(5000, Math.floor(numeric)));
}

export function consumeRateLimit(apiKeyHash, rateLimitPerHour) {
  const now = Date.now();
  const windowStart = Math.floor(now / 3_600_000) * 3_600_000;
  const limit = getRateLimitPerHour(rateLimitPerHour);
  const existing =
    rateLimitStore.get(apiKeyHash) || { windowStart, count: 0 };

  if (existing.windowStart !== windowStart) {
    existing.windowStart = windowStart;
    existing.count = 0;
  }

  const nextCount = existing.count + 1;
  const allowed = nextCount <= limit;

  if (allowed) {
    existing.count = nextCount;
    rateLimitStore.set(apiKeyHash, existing);
  }

  return {
    allowed,
    limit,
    remaining: Math.max(0, limit - (allowed ? existing.count : existing.count)),
    resetAt: new Date(windowStart + 3_600_000).toISOString(),
  };
}

export async function ensureDeveloperApiSchema() {
  const pool = await getPool();

  await pool.request().query(`
    IF OBJECT_ID(N'dbo.ApiDevelopers', N'U') IS NULL
    BEGIN
      CREATE TABLE dbo.ApiDevelopers (
        DeveloperId INT IDENTITY(1,1) PRIMARY KEY,
        FullName NVARCHAR(120) NOT NULL,
        Email NVARCHAR(255) NOT NULL,
        Organization NVARCHAR(255) NULL,
        Website NVARCHAR(255) NULL,
        UseCaseDescription NVARCHAR(1000) NULL,
        Status NVARCHAR(20) NOT NULL
          CONSTRAINT DF_ApiDevelopers_Status DEFAULT(N'active'),
        CreatedAt DATETIME2 NOT NULL
          CONSTRAINT DF_ApiDevelopers_CreatedAt DEFAULT(SYSUTCDATETIME())
      );
    END;

    IF COL_LENGTH('dbo.ApiDevelopers', 'Organization') IS NULL
      ALTER TABLE dbo.ApiDevelopers ADD Organization NVARCHAR(255) NULL;
    IF COL_LENGTH('dbo.ApiDevelopers', 'Website') IS NULL
      ALTER TABLE dbo.ApiDevelopers ADD Website NVARCHAR(255) NULL;
    IF COL_LENGTH('dbo.ApiDevelopers', 'UseCaseDescription') IS NULL
      ALTER TABLE dbo.ApiDevelopers ADD UseCaseDescription NVARCHAR(1000) NULL;
    IF COL_LENGTH('dbo.ApiDevelopers', 'Status') IS NULL
      ALTER TABLE dbo.ApiDevelopers ADD Status NVARCHAR(20) NOT NULL
        CONSTRAINT DF_ApiDevelopers_Status_Alter DEFAULT(N'active');
    IF COL_LENGTH('dbo.ApiDevelopers', 'CreatedAt') IS NULL
      ALTER TABLE dbo.ApiDevelopers ADD CreatedAt DATETIME2 NOT NULL
        CONSTRAINT DF_ApiDevelopers_CreatedAt_Alter DEFAULT(SYSUTCDATETIME());

    IF NOT EXISTS (
      SELECT 1
      FROM sys.indexes
      WHERE name = N'UX_ApiDevelopers_Email'
        AND object_id = OBJECT_ID(N'dbo.ApiDevelopers')
    )
    BEGIN
      CREATE UNIQUE INDEX UX_ApiDevelopers_Email
      ON dbo.ApiDevelopers(Email);
    END;

    IF OBJECT_ID(N'dbo.ApiKeys', N'U') IS NULL
    BEGIN
      CREATE TABLE dbo.ApiKeys (
        ApiKeyId INT IDENTITY(1,1) PRIMARY KEY,
        DeveloperId INT NOT NULL,
        KeyName NVARCHAR(120) NOT NULL
          CONSTRAINT DF_ApiKeys_KeyName DEFAULT(N'Default key'),
        ApiKeyPrefix NVARCHAR(20) NOT NULL,
        ApiKeyHash NVARCHAR(64) NOT NULL,
        RateLimitPerHour INT NOT NULL
          CONSTRAINT DF_ApiKeys_RateLimitPerHour DEFAULT(200),
        IsActive BIT NOT NULL
          CONSTRAINT DF_ApiKeys_IsActive DEFAULT(1),
        LastUsedAt DATETIME2 NULL,
        CreatedAt DATETIME2 NOT NULL
          CONSTRAINT DF_ApiKeys_CreatedAt DEFAULT(SYSUTCDATETIME()),
        CONSTRAINT FK_ApiKeys_ApiDevelopers
          FOREIGN KEY (DeveloperId)
          REFERENCES dbo.ApiDevelopers(DeveloperId)
      );
    END;

    IF COL_LENGTH('dbo.ApiKeys', 'KeyName') IS NULL
      ALTER TABLE dbo.ApiKeys ADD KeyName NVARCHAR(120) NOT NULL
        CONSTRAINT DF_ApiKeys_KeyName_Alter DEFAULT(N'Default key');
    IF COL_LENGTH('dbo.ApiKeys', 'ApiKeyPrefix') IS NULL
      ALTER TABLE dbo.ApiKeys ADD ApiKeyPrefix NVARCHAR(20) NOT NULL
        CONSTRAINT DF_ApiKeys_ApiKeyPrefix_Alter DEFAULT(N'');
    IF COL_LENGTH('dbo.ApiKeys', 'ApiKeyHash') IS NULL
      ALTER TABLE dbo.ApiKeys ADD ApiKeyHash NVARCHAR(64) NOT NULL
        CONSTRAINT DF_ApiKeys_ApiKeyHash_Alter DEFAULT(N'');
    IF COL_LENGTH('dbo.ApiKeys', 'RateLimitPerHour') IS NULL
      ALTER TABLE dbo.ApiKeys ADD RateLimitPerHour INT NOT NULL
        CONSTRAINT DF_ApiKeys_RateLimitPerHour_Alter DEFAULT(200);
    IF COL_LENGTH('dbo.ApiKeys', 'IsActive') IS NULL
      ALTER TABLE dbo.ApiKeys ADD IsActive BIT NOT NULL
        CONSTRAINT DF_ApiKeys_IsActive_Alter DEFAULT(1);
    IF COL_LENGTH('dbo.ApiKeys', 'LastUsedAt') IS NULL
      ALTER TABLE dbo.ApiKeys ADD LastUsedAt DATETIME2 NULL;
    IF COL_LENGTH('dbo.ApiKeys', 'CreatedAt') IS NULL
      ALTER TABLE dbo.ApiKeys ADD CreatedAt DATETIME2 NOT NULL
        CONSTRAINT DF_ApiKeys_CreatedAt_Alter DEFAULT(SYSUTCDATETIME());

    IF NOT EXISTS (
      SELECT 1
      FROM sys.indexes
      WHERE name = N'UX_ApiKeys_ApiKeyHash'
        AND object_id = OBJECT_ID(N'dbo.ApiKeys')
    )
    BEGIN
      CREATE UNIQUE INDEX UX_ApiKeys_ApiKeyHash
      ON dbo.ApiKeys(ApiKeyHash);
    END;
  `);
}

export async function registerDeveloperAccess(payload) {
  await ensureDeveloperApiSchema();

  const name = toText(payload?.name);
  const email = normalizeDeveloperEmail(payload?.email);
  const organization = toOptionalText(payload?.organization);
  const website = toOptionalText(payload?.website);
  const useCase = toOptionalText(payload?.useCase);
  const keyName = toText(payload?.keyName) || "Default key";
  const rateLimitPerHour = getRateLimitPerHour(payload?.rateLimitPerHour);

  if (!name || !email) {
    throw new Error("NAME_EMAIL_REQUIRED");
  }

  const pool = await getPool();

  let developer = (
    await pool.request().input("email", email).query(`
      SELECT TOP 1
        DeveloperId AS developerId,
        FullName AS name,
        Email AS email,
        Organization AS organization,
        Website AS website,
        UseCaseDescription AS useCase,
        Status AS status,
        CreatedAt AS createdAt
      FROM dbo.ApiDevelopers
      WHERE Email = @email
    `)
  ).recordset?.[0];

  if (!developer) {
    developer = (
      await pool
        .request()
        .input("name", name)
        .input("email", email)
        .input("organization", organization)
        .input("website", website)
        .input("useCase", useCase).query(`
          INSERT INTO dbo.ApiDevelopers (
            FullName,
            Email,
            Organization,
            Website,
            UseCaseDescription,
            Status,
            CreatedAt
          )
          OUTPUT
            INSERTED.DeveloperId AS developerId,
            INSERTED.FullName AS name,
            INSERTED.Email AS email,
            INSERTED.Organization AS organization,
            INSERTED.Website AS website,
            INSERTED.UseCaseDescription AS useCase,
            INSERTED.Status AS status,
            INSERTED.CreatedAt AS createdAt
          VALUES (
            @name,
            @email,
            @organization,
            @website,
            @useCase,
            N'active',
            SYSUTCDATETIME()
          )
        `)
    ).recordset?.[0];
  } else {
    developer = (
      await pool
        .request()
        .input("developerId", developer.developerId)
        .input("name", name)
        .input("organization", organization)
        .input("website", website)
        .input("useCase", useCase).query(`
          UPDATE dbo.ApiDevelopers
          SET
            FullName = @name,
            Organization = @organization,
            Website = @website,
            UseCaseDescription = @useCase,
            Status = N'active'
          OUTPUT
            INSERTED.DeveloperId AS developerId,
            INSERTED.FullName AS name,
            INSERTED.Email AS email,
            INSERTED.Organization AS organization,
            INSERTED.Website AS website,
            INSERTED.UseCaseDescription AS useCase,
            INSERTED.Status AS status,
            INSERTED.CreatedAt AS createdAt
          WHERE DeveloperId = @developerId
        `)
    ).recordset?.[0];
  }

  let apiKey = "";
  let apiKeyHash = "";
  let apiKeyPrefix = "";

  for (let attempt = 0; attempt < 5; attempt += 1) {
    apiKey = createApiKeyValue();
    apiKeyHash = hashApiKey(apiKey);
    apiKeyPrefix = getApiKeyPrefix(apiKey);

    const existing = await pool
      .request()
      .input("hash", apiKeyHash)
      .query(`SELECT TOP 1 ApiKeyId FROM dbo.ApiKeys WHERE ApiKeyHash = @hash`);

    if ((existing.recordset || []).length === 0) {
      break;
    }
  }

  if (!apiKey) {
    throw new Error("API_KEY_GENERATION_FAILED");
  }

  const key = (
    await pool
      .request()
      .input("developerId", developer.developerId)
      .input("keyName", keyName)
      .input("apiKeyPrefix", apiKeyPrefix)
      .input("apiKeyHash", apiKeyHash)
      .input("rateLimitPerHour", rateLimitPerHour).query(`
        INSERT INTO dbo.ApiKeys (
          DeveloperId,
          KeyName,
          ApiKeyPrefix,
          ApiKeyHash,
          RateLimitPerHour,
          IsActive,
          CreatedAt
        )
        OUTPUT
          INSERTED.ApiKeyId AS apiKeyId,
          INSERTED.KeyName AS keyName,
          INSERTED.ApiKeyPrefix AS apiKeyPrefix,
          INSERTED.RateLimitPerHour AS rateLimitPerHour,
          INSERTED.CreatedAt AS createdAt
        VALUES (
          @developerId,
          @keyName,
          @apiKeyPrefix,
          @apiKeyHash,
          @rateLimitPerHour,
          1,
          SYSUTCDATETIME()
        )
      `)
  ).recordset?.[0];

  console.log(
    `[PUBLIC API] Issued API key for ${developer.email} (developerId=${developer.developerId}, keyId=${key.apiKeyId})`,
  );

  return {
    developer,
    key: {
      ...key,
      apiKey,
    },
  };
}

export async function getApiKeyAccess(apiKey) {
  await ensureDeveloperApiSchema();

  const normalized = toText(apiKey);
  if (!normalized) {
    return null;
  }

  const pool = await getPool();
  const apiKeyHash = hashApiKey(normalized);

  const result = await pool.request().input("hash", apiKeyHash).query(`
    SELECT TOP 1
      k.ApiKeyId AS apiKeyId,
      k.KeyName AS keyName,
      k.ApiKeyPrefix AS apiKeyPrefix,
      k.ApiKeyHash AS apiKeyHash,
      k.RateLimitPerHour AS rateLimitPerHour,
      k.IsActive AS isActive,
      d.DeveloperId AS developerId,
      d.FullName AS developerName,
      d.Email AS developerEmail,
      d.Status AS developerStatus
    FROM dbo.ApiKeys k
    INNER JOIN dbo.ApiDevelopers d
      ON d.DeveloperId = k.DeveloperId
    WHERE k.ApiKeyHash = @hash
  `);

  const record = result.recordset?.[0] || null;
  if (!record) {
    return null;
  }

  return {
    ...record,
    rateLimitPerHour: getRateLimitPerHour(record.rateLimitPerHour),
    isActive: Boolean(record.isActive),
    apiKeyHash,
  };
}

export async function touchApiKeyUsage(apiKeyId) {
  const pool = await getPool();

  await pool.request().input("apiKeyId", apiKeyId).query(`
    UPDATE dbo.ApiKeys
    SET LastUsedAt = SYSUTCDATETIME()
    WHERE ApiKeyId = @apiKeyId
  `);
}

export const developerApiTestUtils = {
  DEFAULT_RATE_LIMIT_PER_HOUR,
  normalizeDeveloperEmail,
  createApiKeyValue,
  hashApiKey,
  getApiKeyPrefix,
  getRateLimitPerHour,
  consumeRateLimit,
};
