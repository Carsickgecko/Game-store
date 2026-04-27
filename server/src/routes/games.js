// server/src/routes/games.js
import express from "express";
import { getPool } from "../db.js";

const router = express.Router();

// GET /api/v1/games
router.get("/", async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT
        GameId AS id,
        Name AS name,
        Price AS price,
        OldPrice AS oldPrice,
        Rating AS rating,
        Genre AS genre,
        Platform AS platform,
        ImageUrl AS image,
        Description AS longDescription,
        IsActive AS isActive
      FROM dbo.Games
      WHERE IsActive = 1
      ORDER BY GameId DESC
    `);

    res.json({ data: result.recordset });
  } catch (err) {
    console.error("GAMES LIST ERROR:", err);
    res.status(500).json({ message: "Server error", detail: err.message });
  }
});

// GET /api/v1/games/:id
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id))
      return res.status(400).json({ message: "Invalid id" });

    const pool = await getPool();
    const result = await pool.request().input("id", id).query(`
      SELECT TOP 1
        GameId AS id,
        Name AS name,
        Price AS price,
        OldPrice AS oldPrice,
        Rating AS rating,
        Genre AS genre,
        Platform AS platform,
        ImageUrl AS image,
        Description AS longDescription,
        IsActive AS isActive
      FROM dbo.Games
      WHERE GameId = @id
    `);

    const game = result.recordset?.[0];
    if (!game) return res.status(404).json({ message: "Game not found" });

    const screenshotsResult = await pool.request().input("id", id).query(`
      IF OBJECT_ID(N'dbo.GameScreenshots', N'U') IS NOT NULL
      BEGIN
        SELECT
          ImageUrl AS imageUrl,
          SortOrder AS sortOrder
        FROM dbo.GameScreenshots
        WHERE GameId = @id
        ORDER BY SortOrder ASC, ScreenshotId ASC
      END
      ELSE
      BEGIN
        SELECT
          CAST(NULL AS NVARCHAR(500)) AS imageUrl,
          CAST(NULL AS INT) AS sortOrder
        WHERE 1 = 0
      END
    `);

    game.screenshots = (screenshotsResult.recordset || [])
      .map((item) => item?.imageUrl)
      .filter(Boolean);

    res.json({ data: game });
  } catch (err) {
    console.error("GAME DETAIL ERROR:", err);
    res.status(500).json({ message: "Server error", detail: err.message });
  }
});

export default router;
