import express from "express";
import { getPool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

/**
 * POST /api/v1/orders
 * body: { paymentMethod, items: [{ gameId, qty }] }
 */
router.post("/", requireAuth, async (req, res) => {
  try {
    const { paymentMethod, items } = req.body;
    if (!paymentMethod || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Invalid payload" });
    }

    const userId = req.user.userId;
    const pool = await getPool();

    // 1) Lấy giá game từ DB để tránh client fake price
    const gameIds = items.map((x) => Number(x.gameId)).filter(Boolean);
    const idsCsv = gameIds.join(",");
    if (!idsCsv) return res.status(400).json({ message: "Invalid gameIds" });

    const gamesRes = await pool.request().query(`
      SELECT GameId, Price
      FROM dbo.Games
      WHERE GameId IN (${idsCsv})
    `);

    const priceMap = new Map(
      gamesRes.recordset.map((r) => [r.GameId, Number(r.Price)]),
    );

    let total = 0;
    const normalized = items.map((x) => {
      const gid = Number(x.gameId);
      const qty = Math.max(1, Number(x.qty || 1));
      const price = priceMap.get(gid);
      if (!price) throw new Error("GAME_NOT_FOUND");
      total += price * qty;
      return { gid, qty, price };
    });

    // 2) Transaction
    const tx = pool.transaction();
    await tx.begin();

    try {
      // Insert order
      const orderRes = await tx
        .request()
        .input("UserId", userId)
        .input("Total", total)
        .input("PaymentMethod", paymentMethod).query(`
          INSERT INTO dbo.Orders (UserId, Total, PaymentMethod)
          OUTPUT INSERTED.OrderId
          VALUES (@UserId, @Total, @PaymentMethod)
        `);

      const orderId = orderRes.recordset[0].OrderId;

      // Insert items + upsert library
      for (const it of normalized) {
        await tx
          .request()
          .input("OrderId", orderId)
          .input("GameId", it.gid)
          .input("Price", it.price)
          .input("Qty", it.qty).query(`
            INSERT INTO dbo.OrderItems (OrderId, GameId, Price, Qty)
            VALUES (@OrderId, @GameId, @Price, @Qty)
          `);

        // add to library (if already exists, ignore)
        await tx.request().input("UserId", userId).input("GameId", it.gid)
          .query(`
            IF NOT EXISTS (
              SELECT 1 FROM dbo.UserLibrary WHERE UserId=@UserId AND GameId=@GameId
            )
            INSERT INTO dbo.UserLibrary (UserId, GameId) VALUES (@UserId, @GameId)
          `);
      }

      await tx.commit();

      return res.status(201).json({
        ok: true,
        orderId,
        total,
      });
    } catch (e) {
      await tx.rollback();
      throw e;
    }
  } catch (err) {
    if (String(err?.message) === "GAME_NOT_FOUND") {
      return res.status(400).json({ message: "Some games do not exist" });
    }
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

export default router;
