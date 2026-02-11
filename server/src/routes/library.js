// server/src/routes/library.js
import express from "express";
import { getPool } from "../db.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

// GET /api/v1/library/me
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const pool = await getPool();

    const result = await pool.request().input("userId", userId).query(`
      SELECT
        g.GameId AS id,
        g.Name AS name,
        g.Price AS price,
        g.OldPrice AS oldPrice,
        g.Rating AS rating,
        g.Genre AS genre,
        g.Platform AS platform,
        g.ImageUrl AS image,
        g.Description AS longDescription
      FROM dbo.UserLibrary ul
      INNER JOIN dbo.Games g ON g.GameId = ul.GameId
      WHERE ul.UserId = @userId AND g.IsActive = 1
      ORDER BY ul.AddedAt DESC
    `);

    res.json({ data: result.recordset });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", detail: err.message });
  }
});

// POST /api/v1/library/add
router.post("/add", authMiddleware, async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const gameIdsRaw = req.body?.gameIds;

    const gameIds = Array.isArray(gameIdsRaw)
      ? gameIdsRaw.map((x) => Number(x)).filter((x) => Number.isFinite(x))
      : [];

    if (gameIds.length === 0) {
      return res
        .status(400)
        .json({ message: "gameIds must be a non-empty array" });
    }

    const pool = await getPool();

    // Insert kiểu "upsert" (tránh trùng)
    // Nếu table có UNIQUE(UserId, GameId) càng tốt, không có vẫn chạy nhờ IF NOT EXISTS.
    for (const gid of gameIds) {
      await pool.request().input("userId", userId).input("gameId", gid).query(`
        IF NOT EXISTS (
          SELECT 1 FROM dbo.UserLibrary WHERE UserId=@userId AND GameId=@gameId
        )
        BEGIN
          INSERT INTO dbo.UserLibrary(UserId, GameId, AddedAt)
          VALUES (@userId, @gameId, SYSUTCDATETIME())
        END
      `);
    }

    res.json({ ok: true, added: gameIds.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", detail: err.message });
  }
});

export default router;
