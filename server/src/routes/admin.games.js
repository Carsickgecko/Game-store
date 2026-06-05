import express from "express";
import { getPool } from "../db.js";
import authMiddleware from "../middleware/auth.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { importGamesFromRawg } from "../services/gameImport.js";

const router = express.Router();

router.get("/stats", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const pool = await getPool();

    const summary = await pool.request().query(`
      SELECT
        (SELECT COUNT(*) FROM dbo.Games) AS storeGames,
        (SELECT COUNT(*) FROM dbo.Games WHERE IsActive = 1) AS activeGames,
        (SELECT COUNT(*) FROM dbo.Users) AS users,
        (SELECT COUNT(*) FROM dbo.Users WHERE IsActive = 1) AS activeUsers,
        (SELECT COUNT(*) FROM dbo.Orders WHERE Status = N'completed') AS completedOrders,
        (SELECT COALESCE(SUM(Total), 0) FROM dbo.Orders WHERE Status = N'completed') AS totalRevenue,
        (
          SELECT COALESCE(SUM(oi.Qty), 0)
          FROM dbo.OrderItems oi
          INNER JOIN dbo.Orders o ON o.OrderId = oi.OrderId
          WHERE o.Status = N'completed'
        ) AS gamesSold,
        (
          SELECT COALESCE(AVG(CAST(Total AS DECIMAL(18, 2))), 0)
          FROM dbo.Orders
          WHERE Status = N'completed'
        ) AS averageOrderValue,
        (
          SELECT COUNT(*)
          FROM dbo.Orders
          WHERE Status = N'completed'
            AND CAST(CreatedAt AS DATE) = CAST(SYSUTCDATETIME() AS DATE)
        ) AS todayOrders,
        (
          SELECT COALESCE(SUM(Total), 0)
          FROM dbo.Orders
          WHERE Status = N'completed'
            AND CAST(CreatedAt AS DATE) = CAST(SYSUTCDATETIME() AS DATE)
        ) AS todayRevenue,
        (
          SELECT COALESCE(SUM(oi.Qty), 0)
          FROM dbo.OrderItems oi
          INNER JOIN dbo.Orders o ON o.OrderId = oi.OrderId
          WHERE o.Status = N'completed'
            AND CAST(o.CreatedAt AS DATE) = CAST(SYSUTCDATETIME() AS DATE)
        ) AS todayGamesSold
    `);

    const daily = await pool.request().query(`
      WITH days AS (
        SELECT CAST(DATEADD(DAY, -6, CAST(SYSUTCDATETIME() AS DATE)) AS DATE) AS SalesDate
        UNION ALL
        SELECT DATEADD(DAY, 1, SalesDate)
        FROM days
        WHERE SalesDate < CAST(SYSUTCDATETIME() AS DATE)
      ),
      order_totals AS (
        SELECT
          CAST(CreatedAt AS DATE) AS SalesDate,
          COUNT(*) AS orders,
          COALESCE(SUM(Total), 0) AS revenue
        FROM dbo.Orders
        WHERE Status = N'completed'
          AND CreatedAt >= DATEADD(DAY, -6, CAST(SYSUTCDATETIME() AS DATE))
        GROUP BY CAST(CreatedAt AS DATE)
      ),
      item_totals AS (
        SELECT
          CAST(o.CreatedAt AS DATE) AS SalesDate,
          COALESCE(SUM(oi.Qty), 0) AS gamesSold
        FROM dbo.OrderItems oi
        INNER JOIN dbo.Orders o ON o.OrderId = oi.OrderId
        WHERE o.Status = N'completed'
          AND o.CreatedAt >= DATEADD(DAY, -6, CAST(SYSUTCDATETIME() AS DATE))
        GROUP BY CAST(o.CreatedAt AS DATE)
      )
      SELECT
        CONVERT(char(10), d.SalesDate, 23) AS date,
        COALESCE(ot.orders, 0) AS orders,
        COALESCE(ot.revenue, 0) AS revenue,
        COALESCE(it.gamesSold, 0) AS gamesSold
      FROM days d
      LEFT JOIN order_totals ot ON ot.SalesDate = d.SalesDate
      LEFT JOIN item_totals it ON it.SalesDate = d.SalesDate
      ORDER BY d.SalesDate
      OPTION (MAXRECURSION 7)
    `);

    const topGames = await pool.request().query(`
      SELECT TOP 5
        g.GameId AS id,
        g.Name AS name,
        COALESCE(SUM(oi.Qty), 0) AS sold,
        COALESCE(SUM(oi.Price * oi.Qty), 0) AS revenue
      FROM dbo.OrderItems oi
      INNER JOIN dbo.Orders o ON o.OrderId = oi.OrderId
      INNER JOIN dbo.Games g ON g.GameId = oi.GameId
      WHERE o.Status = N'completed'
      GROUP BY g.GameId, g.Name
      ORDER BY sold DESC, revenue DESC, g.Name ASC
    `);

    const row = summary.recordset?.[0] || {};

    return res.json({
      data: {
        summary: {
          storeGames: Number(row.storeGames || 0),
          activeGames: Number(row.activeGames || 0),
          users: Number(row.users || 0),
          activeUsers: Number(row.activeUsers || 0),
          completedOrders: Number(row.completedOrders || 0),
          totalRevenue: Number(row.totalRevenue || 0),
          gamesSold: Number(row.gamesSold || 0),
          averageOrderValue: Number(row.averageOrderValue || 0),
          todayOrders: Number(row.todayOrders || 0),
          todayRevenue: Number(row.todayRevenue || 0),
          todayGamesSold: Number(row.todayGamesSold || 0),
        },
        daily: (daily.recordset || []).map((item) => ({
          date: item.date,
          orders: Number(item.orders || 0),
          revenue: Number(item.revenue || 0),
          gamesSold: Number(item.gamesSold || 0),
        })),
        topGames: (topGames.recordset || []).map((item) => ({
          id: Number(item.id),
          name: item.name,
          sold: Number(item.sold || 0),
          revenue: Number(item.revenue || 0),
        })),
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("ADMIN STATS ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.post("/import-games", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const pageSize = Number(req.query.pageSize || 12);
    const genre = String(req.query.genre || "").trim();

    console.log(
      `[ADMIN IMPORT] Start import. page=${page}, pageSize=${pageSize}, genre=${genre || "all"}`,
    );

    const result = await importGamesFromRawg({
      page,
      pageSize,
      genre,
    });

    console.log(
      `[ADMIN IMPORT] Done. inserted=${result.insertedCount}, updated=${result.updatedCount}`,
    );

    return res.json({
      ok: true,
      message: "Import completed.",
      ...result,
    });
  } catch (err) {
    console.error("ADMIN IMPORT GAMES ERROR:", err);
    return res.status(500).json({
      message: "Failed to import games.",
      detail: err.message,
    });
  }
});

/**
 * GET /api/v1/admin/games
 * Lấy toàn bộ game (cả active + inactive)
 */
router.get("/games", authMiddleware, requireAdmin, async (req, res) => {
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
      ORDER BY GameId DESC
    `);

    res.json({ data: result.recordset });
  } catch (err) {
    console.error("ADMIN FETCH GAMES ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * POST /api/v1/admin/games
 * Thêm game mới
 */
router.post("/games", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const {
      name,
      price,
      oldPrice,
      rating,
      genre,
      platform,
      image,
      longDescription,
      isActive,
    } = req.body;

    const pool = await getPool();
    await pool
      .request()
      .input("name", name)
      .input("price", price)
      .input("oldPrice", oldPrice)
      .input("rating", rating)
      .input("genre", genre)
      .input("platform", platform)
      .input("image", image)
      .input("desc", longDescription)
      .input("isActive", isActive ?? 1).query(`
        INSERT INTO dbo.Games
        (Name, Price, OldPrice, Rating, Genre, Platform, ImageUrl, Description, IsActive)
        VALUES
        (@name, @price, @oldPrice, @rating, @genre, @platform, @image, @desc, @isActive)
      `);

    res.json({ ok: true });
  } catch (err) {
    console.error("ADMIN CREATE GAME ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * PUT /api/v1/admin/games/:id
 */
router.put("/games/:id", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const {
      name,
      price,
      oldPrice,
      rating,
      genre,
      platform,
      image,
      longDescription,
      isActive,
    } = req.body;

    const pool = await getPool();
    await pool
      .request()
      .input("id", id)
      .input("name", name)
      .input("price", price)
      .input("oldPrice", oldPrice)
      .input("rating", rating)
      .input("genre", genre)
      .input("platform", platform)
      .input("image", image)
      .input("desc", longDescription)
      .input("isActive", isActive).query(`
        UPDATE dbo.Games
        SET
          Name = @name,
          Price = @price,
          OldPrice = @oldPrice,
          Rating = @rating,
          Genre = @genre,
          Platform = @platform,
          ImageUrl = @image,
          Description = @desc,
          IsActive = @isActive
        WHERE GameId = @id
      `);

    res.json({ ok: true });
  } catch (err) {
    console.error("ADMIN UPDATE GAME ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * DELETE (soft) /api/v1/admin/games/:id
 */
router.delete("/games/:id", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const pool = await getPool();
    const result = await pool.request().input("id", id).query(`
        UPDATE dbo.Games
        SET IsActive = 0
        WHERE GameId = @id
      `);

    if ((result.rowsAffected?.[0] || 0) === 0) {
      return res.status(404).json({ message: "Game not found" });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("ADMIN DELETE GAME ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * DELETE (hard) /api/v1/admin/games/:id/permanent
 */
router.delete(
  "/games/:id/permanent",
  authMiddleware,
  requireAdmin,
  async (req, res) => {
    let tx;

    try {
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) {
        return res.status(400).json({ message: "Invalid id" });
      }

      const pool = await getPool();
      const exists = await pool.request().input("id", id).query(`
        SELECT TOP 1 GameId AS id, Name AS name
        FROM dbo.Games
        WHERE GameId = @id
      `);

      const game = exists.recordset?.[0];
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }

      const usage = await pool.request().input("id", id).query(`
        SELECT
          (SELECT COUNT(*) FROM dbo.OrderItems WHERE GameId = @id) AS orderCount,
          (SELECT COUNT(*) FROM dbo.UserLibrary WHERE GameId = @id) AS libraryCount,
          (SELECT COUNT(*) FROM dbo.Cart WHERE GameId = @id) AS cartCount,
          (SELECT COUNT(*) FROM dbo.Wishlist WHERE GameId = @id) AS wishlistCount
      `);

      const counts = usage.recordset?.[0] || {};
      const orderCount = Number(counts.orderCount || 0);
      const libraryCount = Number(counts.libraryCount || 0);

      if (orderCount > 0 || libraryCount > 0) {
        return res.status(409).json({
          message:
            "This game already exists in orders or user libraries. Disable it instead of deleting permanently.",
          usage: {
            orders: orderCount,
            libraries: libraryCount,
            cart: Number(counts.cartCount || 0),
            wishlist: Number(counts.wishlistCount || 0),
          },
        });
      }

      tx = pool.transaction();
      await tx.begin();

      await tx.request().input("id", id).query(`
        IF OBJECT_ID(N'dbo.GameScreenshots', N'U') IS NOT NULL
          DELETE FROM dbo.GameScreenshots WHERE GameId = @id;
        DELETE FROM dbo.Cart WHERE GameId = @id;
        DELETE FROM dbo.Wishlist WHERE GameId = @id;
        DELETE FROM dbo.Games WHERE GameId = @id;
      `);

      await tx.commit();

      return res.json({
        ok: true,
        deletedId: id,
        deletedName: game.name,
      });
    } catch (err) {
      if (tx) {
        try {
          await tx.rollback();
        } catch {
          // ignore rollback error
        }
      }

      console.error("ADMIN HARD DELETE GAME ERROR:", err);
      return res.status(500).json({ message: "Server error" });
    }
  },
);

export default router;
