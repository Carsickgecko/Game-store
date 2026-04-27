import express from "express";
import { getPool } from "../db.js";
import apiKeyAuth from "../middleware/apiKeyAuth.js";
import { getSimilarGames } from "../services/recommendation.js";

const router = express.Router();

function clampInt(value, fallback, min, max) {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return fallback;
  }

  return Math.max(min, Math.min(max, Math.floor(numeric)));
}

function buildPublicFilters(query) {
  const search = String(query?.search || "").trim();
  const genre = String(query?.genre || "").trim();
  const platform = String(query?.platform || "").trim();

  return {
    search,
    genre,
    platform,
    page: clampInt(query?.page, 1, 1, 500),
    limit: clampInt(query?.limit, 20, 1, 50),
  };
}

function buildWhereClause(filters) {
  const conditions = ["IsActive = 1"];

  if (filters.search) {
    conditions.push("Name LIKE @search");
  }

  if (filters.genre) {
    conditions.push("Genre LIKE @genre");
  }

  if (filters.platform) {
    conditions.push("Platform LIKE @platform");
  }

  return `WHERE ${conditions.join(" AND ")}`;
}

function applyListInputs(request, filters) {
  request.input("offset", (filters.page - 1) * filters.limit);
  request.input("limit", filters.limit);

  if (filters.search) {
    request.input("search", `%${filters.search}%`);
  }

  if (filters.genre) {
    request.input("genre", `%${filters.genre}%`);
  }

  if (filters.platform) {
    request.input("platform", `%${filters.platform}%`);
  }
}

router.get("/games", apiKeyAuth, async (req, res) => {
  try {
    const filters = buildPublicFilters(req.query);
    const whereClause = buildWhereClause(filters);
    const pool = await getPool();

    const countRequest = pool.request();
    applyListInputs(countRequest, filters);

    const countResult = await countRequest.query(`
      SELECT COUNT(*) AS total
      FROM dbo.Games
      ${whereClause}
    `);

    const listRequest = pool.request();
    applyListInputs(listRequest, filters);

    const result = await listRequest.query(`
      SELECT
        GameId AS id,
        Name AS name,
        Genre AS genre,
        Platform AS platform,
        Price AS price,
        OldPrice AS oldPrice,
        Rating AS rating,
        ImageUrl AS imageUrl
      FROM dbo.Games
      ${whereClause}
      ORDER BY GameId DESC
      OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
    `);

    return res.json({
      data: result.recordset,
      meta: {
        page: filters.page,
        limit: filters.limit,
        total: Number(countResult.recordset?.[0]?.total || 0),
        auth: "api-key",
      },
    });
  } catch (error) {
    console.error("PUBLIC API LIST GAMES ERROR:", error);
    return res
      .status(500)
      .json({ message: "Server error", detail: error.message });
  }
});

router.get("/games/:id", apiKeyAuth, async (req, res) => {
  try {
    const gameId = Number(req.params.id);

    if (!Number.isFinite(gameId)) {
      return res.status(400).json({ message: "Invalid game id." });
    }

    const pool = await getPool();
    const result = await pool.request().input("gameId", gameId).query(`
      SELECT TOP 1
        GameId AS id,
        Name AS name,
        Genre AS genre,
        Platform AS platform,
        Price AS price,
        OldPrice AS oldPrice,
        Rating AS rating,
        ImageUrl AS imageUrl,
        Description AS description
      FROM dbo.Games
      WHERE GameId = @gameId
        AND IsActive = 1
    `);

    const game = result.recordset?.[0];

    if (!game) {
      return res.status(404).json({ message: "Game not found." });
    }

    return res.json({ data: game });
  } catch (error) {
    console.error("PUBLIC API GAME DETAIL ERROR:", error);
    return res
      .status(500)
      .json({ message: "Server error", detail: error.message });
  }
});

router.get("/games/:id/similar", apiKeyAuth, async (req, res) => {
  try {
    const gameId = Number(req.params.id);

    if (!Number.isFinite(gameId)) {
      return res.status(400).json({ message: "Invalid game id." });
    }

    const k = clampInt(req.query.k, 5, 1, 12);
    const data = await getSimilarGames(gameId, { k });

    if (!data) {
      return res.status(404).json({ message: "Game not found." });
    }

    return res.json({
      data,
      meta: {
        method: "knn-euclidean",
        k,
        auth: "api-key",
      },
    });
  } catch (error) {
    console.error("PUBLIC API SIMILAR GAMES ERROR:", error);
    return res
      .status(500)
      .json({ message: "Server error", detail: error.message });
  }
});

router.get("/health", (req, res) => {
  return res.json({
    ok: true,
    service: "public-api",
  });
});

export default router;
