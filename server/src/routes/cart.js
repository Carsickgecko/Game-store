import express from "express";
import { getPool } from "../db.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  try {
    const pool = await getPool();
    const userId = req.user.id;

    const rs = await pool.request().input("userId", userId).query(`
      SELECT
        g.GameId AS id,
        g.Name AS name,
        g.Price AS price,
        g.OldPrice AS oldPrice,
        g.ImageUrl AS image,
        g.Genre AS genre,
        g.Platform AS platform,
        g.Rating AS rating,
        c.Quantity AS qty
      FROM dbo.Cart c
      JOIN dbo.Games g ON g.GameId = c.GameId
      WHERE c.UserId = @userId
      ORDER BY c.CreatedAt DESC, c.CartId DESC
    `);

    return res.json({ data: rs.recordset || [] });
  } catch (err) {
    console.error("CART GET ERROR:", err);
    return res
      .status(500)
      .json({ message: "Server error", detail: err.message });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { gameId, qty } = req.body || {};
    if (!gameId) return res.status(400).json({ message: "Missing gameId" });

    const addQty = Math.max(1, Number(qty || 1));
    const pool = await getPool();
    const userId = req.user.id;
    const gid = Number(gameId);

    const ex = await pool
      .request()
      .input("userId", userId)
      .input("gameId", gid)
      .query(`
        SELECT TOP 1 Quantity
        FROM dbo.Cart
        WHERE UserId=@userId AND GameId=@gameId
      `);

    if (ex.recordset.length > 0) {
      await pool
        .request()
        .input("userId", userId)
        .input("gameId", gid)
        .input("addQty", addQty)
        .query(`
          UPDATE dbo.Cart
          SET Quantity = Quantity + @addQty
          WHERE UserId=@userId AND GameId=@gameId
        `);

      return res.json({ ok: true, action: "increased", addQty });
    }

    await pool
      .request()
      .input("userId", userId)
      .input("gameId", gid)
      .input("qty", addQty)
      .query(`
        INSERT INTO dbo.Cart (UserId, GameId, Quantity, CreatedAt)
        VALUES (@userId, @gameId, @qty, GETDATE())
      `);

    return res.json({ ok: true, action: "added", qty: addQty });
  } catch (err) {
    console.error("CART POST ERROR:", err);
    return res
      .status(500)
      .json({ message: "Server error", detail: err.message });
  }
});

router.patch("/:gameId", authMiddleware, async (req, res) => {
  try {
    const pool = await getPool();
    const userId = req.user.id;
    const gid = Number(req.params.gameId);
    const qty = Number(req.body?.qty);

    if (!Number.isFinite(qty)) {
      return res.status(400).json({ message: "Missing/invalid qty" });
    }

    if (qty <= 0) {
      await pool
        .request()
        .input("userId", userId)
        .input("gameId", gid)
        .query(`
          DELETE dbo.Cart
          WHERE UserId=@userId AND GameId=@gameId
        `);

      return res.json({ ok: true, action: "removed" });
    }

    await pool
      .request()
      .input("userId", userId)
      .input("gameId", gid)
      .input("qty", qty)
      .query(`
        UPDATE dbo.Cart
        SET Quantity=@qty
        WHERE UserId=@userId AND GameId=@gameId
      `);

    return res.json({ ok: true, action: "updated", qty });
  } catch (err) {
    console.error("CART PATCH ERROR:", err);
    return res
      .status(500)
      .json({ message: "Server error", detail: err.message });
  }
});

router.delete("/:gameId", authMiddleware, async (req, res) => {
  try {
    const pool = await getPool();
    const userId = req.user.id;
    const gid = Number(req.params.gameId);

    await pool
      .request()
      .input("userId", userId)
      .input("gameId", gid)
      .query(`
        DELETE dbo.Cart
        WHERE UserId=@userId AND GameId=@gameId
      `);

    return res.json({ ok: true });
  } catch (err) {
    console.error("CART DELETE ITEM ERROR:", err);
    return res
      .status(500)
      .json({ message: "Server error", detail: err.message });
  }
});

router.delete("/", authMiddleware, async (req, res) => {
  try {
    const pool = await getPool();
    const userId = req.user.id;

    await pool.request().input("userId", userId).query(`
      DELETE dbo.Cart
      WHERE UserId=@userId
    `);

    return res.json({ ok: true, action: "cleared" });
  } catch (err) {
    console.error("CART CLEAR ERROR:", err);
    return res
      .status(500)
      .json({ message: "Server error", detail: err.message });
  }
});

export default router;
