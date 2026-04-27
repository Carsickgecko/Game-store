import express from "express";
import { getPool } from "../db.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

function getGameIdFromRequest(req) {
  const rawGameId = req.params.gameId ?? req.body?.gameId;
  const gameId = Number(rawGameId);
  return Number.isFinite(gameId) ? gameId : null;
}

router.get("/", authMiddleware, async (req, res) => {
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
        g.ImageUrl AS image
      FROM dbo.Wishlist w
      JOIN dbo.Games g ON g.GameId = w.GameId
      WHERE w.UserId = @userId
      ORDER BY w.CreatedAt DESC
    `);

    res.json({ data: result.recordset });
  } catch (err) {
    console.error("WISHLIST GET ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

async function addWishlistItem(req, res) {
  try {
    const userId = Number(req.user.id);
    const gameId = getGameIdFromRequest(req);

    if (!gameId) {
      return res.status(400).json({ message: "Missing gameId" });
    }

    const pool = await getPool();

    await pool
      .request()
      .input("userId", userId)
      .input("gameId", gameId)
      .query(`
        INSERT INTO dbo.Wishlist(UserId, GameId)
        VALUES (@userId, @gameId)
      `);

    res.json({ ok: true });
  } catch (err) {
    if (err.number === 2627) {
      return res.json({ ok: true });
    }

    console.error("WISHLIST ADD ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
}

router.post("/", authMiddleware, addWishlistItem);
router.post("/:gameId", authMiddleware, addWishlistItem);

router.delete("/:gameId", authMiddleware, async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const gameId = Number(req.params.gameId);

    const pool = await getPool();

    await pool
      .request()
      .input("userId", userId)
      .input("gameId", gameId)
      .query(`
        DELETE FROM dbo.Wishlist
        WHERE UserId = @userId AND GameId = @gameId
      `);

    res.json({ ok: true });
  } catch (err) {
    console.error("WISHLIST DELETE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
