import express from "express";
import { getPool } from "../db.js";
import authMiddleware from "../middleware/auth.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = express.Router();

// GET /api/v1/admin/games
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
  } catch (e) {
    res.status(500).json({ message: "Server error", detail: e.message });
  }
});

// POST /api/v1/admin/games
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
    } = req.body || {};

    if (!name || price == null || !genre || !platform) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const pool = await getPool();
    const inserted = await pool
      .request()
      .input("name", name)
      .input("price", Number(price))
      .input("oldPrice", oldPrice == null ? null : Number(oldPrice))
      .input("rating", rating == null ? null : Number(rating))
      .input("genre", genre)
      .input("platform", platform)
      .input("image", image || null)
      .input("desc", longDescription || null).query(`
        INSERT INTO dbo.Games (Name, Price, OldPrice, Rating, Genre, Platform, ImageUrl, Description, IsActive)
        OUTPUT INSERTED.GameId AS id
        VALUES (@name, @price, @oldPrice, @rating, @genre, @platform, @image, @desc, 1)
      `);

    res.status(201).json({ ok: true, id: inserted.recordset[0]?.id });
  } catch (e) {
    res.status(500).json({ message: "Server error", detail: e.message });
  }
});

// PUT /api/v1/admin/games/:id
router.put("/games/:id", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id))
      return res.status(400).json({ message: "Invalid id" });

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
    } = req.body || {};

    const pool = await getPool();
    await pool
      .request()
      .input("id", id)
      .input("name", name ?? null)
      .input("price", price == null ? null : Number(price))
      .input("oldPrice", oldPrice == null ? null : Number(oldPrice))
      .input("rating", rating == null ? null : Number(rating))
      .input("genre", genre ?? null)
      .input("platform", platform ?? null)
      .input("image", image ?? null)
      .input("desc", longDescription ?? null)
      .input("isActive", isActive == null ? null : Number(isActive) ? 1 : 0)
      .query(`
        UPDATE dbo.Games
        SET
          Name = COALESCE(@name, Name),
          Price = COALESCE(@price, Price),
          OldPrice = COALESCE(@oldPrice, OldPrice),
          Rating = COALESCE(@rating, Rating),
          Genre = COALESCE(@genre, Genre),
          Platform = COALESCE(@platform, Platform),
          ImageUrl = COALESCE(@image, ImageUrl),
          Description = COALESCE(@desc, Description),
          IsActive = COALESCE(@isActive, IsActive)
        WHERE GameId = @id
      `);

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: "Server error", detail: e.message });
  }
});

// DELETE /api/v1/admin/games/:id (soft delete)
router.delete("/games/:id", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id))
      return res.status(400).json({ message: "Invalid id" });

    const pool = await getPool();
    await pool.request().input("id", id).query(`
      UPDATE dbo.Games SET IsActive = 0 WHERE GameId=@id
    `);

    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: "Server error", detail: e.message });
  }
});

export default router;
