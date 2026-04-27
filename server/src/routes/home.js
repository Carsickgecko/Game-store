import express from "express";
import { getPool } from "../db.js";
import { ensureOrdersSchema } from "./orders.js";

const router = express.Router();

function toNumber(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function clampInt(value, fallback, min, max) {
  const numeric = parseInt(value, 10);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, numeric));
}

function getDiscountAmount(game) {
  return Math.max(0, toNumber(game?.oldPrice) - toNumber(game?.price));
}

function getDiscountPercent(game) {
  const price = toNumber(game?.price);
  const oldPrice = toNumber(game?.oldPrice);

  if (oldPrice <= 0 || oldPrice <= price) {
    return 0;
  }

  return Math.round(((oldPrice - price) / oldPrice) * 100);
}

function sortDiscountedGames(games) {
  return [...(Array.isArray(games) ? games : [])]
    .filter((game) => getDiscountPercent(game) > 0)
    .sort((left, right) => {
      const percentDiff = getDiscountPercent(right) - getDiscountPercent(left);
      if (percentDiff !== 0) {
        return percentDiff;
      }

      const amountDiff = getDiscountAmount(right) - getDiscountAmount(left);
      if (amountDiff !== 0) {
        return amountDiff;
      }

      const ratingDiff = toNumber(right?.rating) - toNumber(left?.rating);
      if (ratingDiff !== 0) {
        return ratingDiff;
      }

      return toNumber(right?.id) - toNumber(left?.id);
    });
}

function getUtcDayOffset() {
  const now = new Date();
  const startOfYear = Date.UTC(now.getUTCFullYear(), 0, 1);
  const today = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );

  return Math.floor((today - startOfYear) / 86400000);
}

function rotateDaily(items) {
  if (!Array.isArray(items) || items.length <= 1) {
    return Array.isArray(items) ? items : [];
  }

  const offset = getUtcDayOffset() % items.length;
  return items.slice(offset).concat(items.slice(0, offset));
}

export const homeRouteTestUtils = {
  toNumber,
  clampInt,
  getDiscountAmount,
  getDiscountPercent,
  sortDiscountedGames,
  getUtcDayOffset,
  rotateDaily,
};

async function fetchActiveGames(pool) {
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
    WHERE ISNULL(IsActive, 1) = 1
  `);

  return result.recordset || [];
}

router.get("/top-deals", async (req, res) => {
  try {
    const limit = clampInt(req.query.limit, 6, 1, 20);
    const pool = await getPool();
    const games = await fetchActiveGames(pool);
    const deals = sortDiscountedGames(games).slice(0, limit);

    return res.json({ data: deals });
  } catch (err) {
    console.error("HOME TOP DEALS ERROR:", err);
    return res.status(500).json({ message: "Server error", detail: err.message });
  }
});

router.get("/highlight", async (req, res) => {
  try {
    const pool = await getPool();
    const games = await fetchActiveGames(pool);
    const highlight = sortDiscountedGames(games)[0] || null;

    return res.json({ data: highlight });
  } catch (err) {
    console.error("HOME HIGHLIGHT ERROR:", err);
    return res.status(500).json({ message: "Server error", detail: err.message });
  }
});

router.get("/slider", async (req, res) => {
  try {
    const limit = clampInt(req.query.limit, 6, 1, 10);
    const pool = await getPool();
    const games = await fetchActiveGames(pool);

    const discountedCandidates = rotateDaily(
      sortDiscountedGames(games).slice(0, Math.max(limit * 3, limit)),
    );

    const discountedIds = new Set(discountedCandidates.map((game) => Number(game.id)));
    const fallbackGames = [...games]
      .filter((game) => !discountedIds.has(Number(game.id)))
      .sort((left, right) => {
        const ratingDiff = toNumber(right?.rating) - toNumber(left?.rating);
        if (ratingDiff !== 0) {
          return ratingDiff;
        }

        return toNumber(right?.id) - toNumber(left?.id);
      });

    const slides = [...discountedCandidates, ...fallbackGames].slice(0, limit);

    return res.json({ data: slides });
  } catch (err) {
    console.error("HOME SLIDER ERROR:", err);
    return res.status(500).json({ message: "Server error", detail: err.message });
  }
});

router.get("/bestsellers", async (req, res) => {
  try {
    const limit = clampInt(req.query.limit, 6, 1, 20);
    const pool = await getPool();
    await ensureOrdersSchema(pool);

    const result = await pool.request().query(`
      SELECT TOP (${limit})
        g.GameId AS id,
        g.Name AS name,
        g.Price AS price,
        g.OldPrice AS oldPrice,
        g.Rating AS rating,
        g.Genre AS genre,
        g.Platform AS platform,
        g.ImageUrl AS image,
        g.Description AS longDescription,
        SUM(ISNULL(oi.Qty, 0)) AS soldCount
      FROM dbo.Games g
      INNER JOIN dbo.OrderItems oi ON oi.GameId = g.GameId
      INNER JOIN dbo.Orders o ON o.OrderId = oi.OrderId
      WHERE ISNULL(g.IsActive, 1) = 1
      GROUP BY
        g.GameId,
        g.Name,
        g.Price,
        g.OldPrice,
        g.Rating,
        g.Genre,
        g.Platform,
        g.ImageUrl,
        g.Description
      ORDER BY
        SUM(ISNULL(oi.Qty, 0)) DESC,
        ISNULL(g.Rating, 0) DESC,
        g.GameId DESC
    `);

    const bestsellers = result.recordset || [];
    if (bestsellers.length > 0) {
      return res.json({ data: bestsellers });
    }

    const fallback = (await fetchActiveGames(pool))
      .sort((left, right) => {
        const ratingDiff = toNumber(right?.rating) - toNumber(left?.rating);
        if (ratingDiff !== 0) {
          return ratingDiff;
        }

        return toNumber(right?.id) - toNumber(left?.id);
      })
      .slice(0, limit);

    return res.json({ data: fallback });
  } catch (err) {
    console.error("HOME BESTSELLERS ERROR:", err);
    return res.status(500).json({ message: "Server error", detail: err.message });
  }
});

export default router;
