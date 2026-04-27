import { getPool } from "../db.js";

export async function ensureUsersProfileSchema() {
  const pool = await getPool();

  await pool.request().query(`
    IF COL_LENGTH('dbo.Users', 'AvatarUrl') IS NULL
    BEGIN
      ALTER TABLE dbo.Users
      ADD AvatarUrl NVARCHAR(500) NULL;
    END

    IF COL_LENGTH('dbo.Users', 'PreferredLanguage') IS NULL
    BEGIN
      ALTER TABLE dbo.Users
      ADD PreferredLanguage NVARCHAR(10) NOT NULL
        CONSTRAINT DF_Users_PreferredLanguage DEFAULT(N'en');
    END
  `);
}
