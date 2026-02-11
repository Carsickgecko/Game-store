// server/src/routes/home.js
import express from "express";
import { getPool } from "../db.js";

const router = express.Router();

// Helper: tránh null/undefined làm crash
function safeNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

// Helper: limit an toàn
function clampInt(value, fallback, min, max) {
  const n = parseInt(value, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

/**
 * GET /api/v1/home/top-deals?limit=6
 * Trả danh sách game có discount tốt (oldPrice > price) và đang Active
 */
router.get("/top-deals", async (req, res) => {
  try {
    const limit = clampInt(req.query.limit, 6, 1, 20);
    const pool = await getPool();

    // ✅ SỬA: ImageUrl + Description (đúng schema DB của bạn)
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
    `);

    const rows = result.recordset || [];

    // Chỉ tính deal nếu có oldPrice và oldPrice > price
    const deals = rows
      .filter((g) => safeNum(g.oldPrice, 0) > safeNum(g.price, 0))
      .sort((a, b) => {
        const da = safeNum(a.oldPrice, 0) - safeNum(a.price, 0);
        const db = safeNum(b.oldPrice, 0) - safeNum(b.price, 0);
        return db - da;
      })
      .slice(0, limit);

    res.json({ data: deals });
  } catch (err) {
    console.error("HOME TOP DEALS ERROR:", err);
    res.status(500).json({ message: "Server error", detail: err.message });
  }
});

/**
 * GET /api/v1/home/highlight
 * Trả 1 game làm highlight (ưu tiên deal tốt nhất, nếu không có thì lấy game mới nhất)
 */
router.get("/highlight", async (req, res) => {
  try {
    const pool = await getPool();

    // ✅ SỬA: ImageUrl + Description
    const result = await pool.request().query(`
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
      WHERE IsActive = 1
      ORDER BY
        CASE WHEN OldPrice IS NOT NULL AND OldPrice > Price THEN (OldPrice - Price) ELSE 0 END DESC,
        GameId DESC
    `);

    const highlight = result.recordset?.[0] || null;
    res.json({ data: highlight });
  } catch (err) {
    console.error("HOME HIGHLIGHT ERROR:", err);
    res.status(500).json({ message: "Server error", detail: err.message });
  }
});

/**
 * GET /api/v1/home/slider
 * Trả slides cho HeroSlider:
 * - slide 1: promo cố định
 * - slide 2: highlight (nếu có)
 */
router.get("/slider", async (req, res) => {
  try {
    const pool = await getPool();

    // ✅ SỬA: ImageUrl
    const r = await pool.request().query(`
      SELECT TOP 1
        GameId AS id,
        Name AS name,
        Price AS price,
        OldPrice AS oldPrice,
        ImageUrl AS image
      FROM dbo.Games
      WHERE IsActive = 1
      ORDER BY
        CASE WHEN OldPrice IS NOT NULL AND OldPrice > Price THEN (OldPrice - Price) ELSE 0 END DESC,
        GameId DESC
    `);

    const h = r.recordset?.[0] || null;

    const slides = [
      {
        title: "Top deals this week",
        subtitle: "Find discounts and instant delivery.",
        image: "/images/hero-bg.jpg",
        badge: "Hot",
        to: "/catalog",
        secondaryTo: "/catalog",
        sectionTitle: "New Releases",
      },
    ];

    if (h) {
      slides.push({
        title: h.name,
        subtitle: "Best discount right now.",
        image: h.image || "/images/hero-bg.jpg",
        badge: "-%",
        to: `/product/${h.id}`,
        secondaryTo: "/catalog",
        sectionTitle: "New Releases",
      });
    }

    res.json({ data: slides });
  } catch (err) {
    console.error("HOME SLIDER ERROR:", err);
    res.status(500).json({ message: "Server error", detail: err.message });
  }
});

export default router;
