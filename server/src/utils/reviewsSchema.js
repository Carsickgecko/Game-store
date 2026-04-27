import { getPool } from "../db.js";

export async function ensureReviewsSchema(existingPool) {
  const pool = existingPool || (await getPool());

  await pool.request().query(`
    IF OBJECT_ID(N'dbo.GameReviews', N'U') IS NULL
    BEGIN
      CREATE TABLE dbo.GameReviews (
        ReviewId INT IDENTITY(1,1) PRIMARY KEY,
        GameId INT NOT NULL,
        UserId INT NULL,
        ReviewerName NVARCHAR(120) NOT NULL,
        Rating INT NOT NULL,
        Comment NVARCHAR(2000) NOT NULL,
        CreatedAt DATETIME2 NOT NULL
          CONSTRAINT DF_GameReviews_CreatedAt DEFAULT(SYSUTCDATETIME())
      );
    END;

    IF COL_LENGTH('dbo.GameReviews', 'UserId') IS NULL
      ALTER TABLE dbo.GameReviews ADD UserId INT NULL;

    IF COL_LENGTH('dbo.GameReviews', 'ReviewerName') IS NULL
      ALTER TABLE dbo.GameReviews ADD ReviewerName NVARCHAR(120) NOT NULL
        CONSTRAINT DF_GameReviews_ReviewerName_Alter DEFAULT(N'Guest');

    IF COL_LENGTH('dbo.GameReviews', 'Rating') IS NULL
      ALTER TABLE dbo.GameReviews ADD Rating INT NOT NULL
        CONSTRAINT DF_GameReviews_Rating_Alter DEFAULT(5);

    IF COL_LENGTH('dbo.GameReviews', 'Comment') IS NULL
      ALTER TABLE dbo.GameReviews ADD Comment NVARCHAR(2000) NOT NULL
        CONSTRAINT DF_GameReviews_Comment_Alter DEFAULT(N'');

    IF COL_LENGTH('dbo.GameReviews', 'CreatedAt') IS NULL
      ALTER TABLE dbo.GameReviews ADD CreatedAt DATETIME2 NOT NULL
        CONSTRAINT DF_GameReviews_CreatedAt_Alter DEFAULT(SYSUTCDATETIME());

    IF NOT EXISTS (
      SELECT 1
      FROM sys.indexes
      WHERE name = N'IX_GameReviews_GameId_CreatedAt'
        AND object_id = OBJECT_ID(N'dbo.GameReviews')
    )
    BEGIN
      CREATE INDEX IX_GameReviews_GameId_CreatedAt
      ON dbo.GameReviews(GameId, CreatedAt DESC, ReviewId DESC);
    END;
  `);
}
