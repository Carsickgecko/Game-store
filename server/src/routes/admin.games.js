import express from "express";
import { getPool } from "../db.js";
import authMiddleware from "../middleware/auth.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = express.Router();

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

    const pool = await getPool();
    await pool.request().input("id", id).query(`
        UPDATE dbo.Games
        SET IsActive = 0
        WHERE GameId = @id
      `);

    res.json({ ok: true });
  } catch (err) {
    console.error("ADMIN DELETE GAME ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
