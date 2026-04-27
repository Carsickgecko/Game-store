import express from "express";
import jwt from "jsonwebtoken";
import { getPool } from "../db.js";
import { getTokenFromRequest } from "../utils/authCookie.js";
import { ensureReviewsSchema } from "../utils/reviewsSchema.js";

const router = express.Router();

function getOptionalUserId(req) {
  try {
    const token = getTokenFromRequest(req);

    if (!token || !process.env.JWT_SECRET) {
      return null;
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const rawUserId = payload?.id ?? payload?.userId ?? payload?.sub;
    const userId = Number(rawUserId);

    return Number.isFinite(userId) ? userId : null;
  } catch {
    return null;
  }
}

function normalizeReviewRow(row) {
  return {
    id: Number(row?.id),
    gameId: Number(row?.gameId),
    userId: row?.userId ? Number(row.userId) : null,
    name: row?.name || "Guest",
    rating: Number(row?.rating || 0),
    comment: row?.comment || "",
    avatarUrl: row?.avatarUrl || null,
    createdAt: row?.createdAt || null,
  };
}

function buildSummary(items) {
  const count = items.length;
  const average = count
    ? Math.round(
        (items.reduce((sum, item) => sum + Number(item.rating || 0), 0) / count) *
          10,
      ) / 10
    : null;

  return { count, average };
}

export const reviewRouteTestUtils = {
  getOptionalUserId,
  normalizeReviewRow,
  buildSummary,
};

async function fetchReviewsPayload(pool, gameId) {
  await ensureReviewsSchema(pool);

  const result = await pool.request().input("gameId", gameId).query(`
    SELECT
      gr.ReviewId AS id,
      gr.GameId AS gameId,
      gr.UserId AS userId,
      gr.ReviewerName AS name,
      gr.Rating AS rating,
      gr.Comment AS comment,
      gr.CreatedAt AS createdAt,
      CASE
        WHEN COL_LENGTH('dbo.Users', 'AvatarUrl') IS NOT NULL THEN u.AvatarUrl
        ELSE NULL
      END AS avatarUrl
    FROM dbo.GameReviews gr
    LEFT JOIN dbo.Users u ON u.UserId = gr.UserId
    WHERE gr.GameId = @gameId
    ORDER BY gr.CreatedAt DESC, gr.ReviewId DESC
  `);

  const items = (result.recordset || []).map(normalizeReviewRow);

  return {
    items,
    summary: buildSummary(items),
  };
}

router.get("/game/:gameId", async (req, res) => {
  try {
    const gameId = Number(req.params.gameId);

    if (!Number.isFinite(gameId)) {
      return res.status(400).json({ message: "Invalid game id." });
    }

    const pool = await getPool();
    const data = await fetchReviewsPayload(pool, gameId);

    return res.json({ data });
  } catch (error) {
    console.error("REVIEWS GET ERROR:", error);
    return res.status(500).json({ message: "Server error", detail: error.message });
  }
});

router.post("/game/:gameId", async (req, res) => {
  try {
    const gameId = Number(req.params.gameId);
    const name = String(req.body?.name || "").trim();
    const comment = String(req.body?.comment || "").trim();
    const rating = Number(req.body?.rating);

    if (!Number.isFinite(gameId)) {
      return res.status(400).json({ message: "Invalid game id." });
    }

    if (!name) {
      return res.status(400).json({ message: "Reviewer name is required." });
    }

    if (!comment) {
      return res.status(400).json({ message: "Review content is required." });
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5." });
    }

    const pool = await getPool();
    await ensureReviewsSchema(pool);

    const gameResult = await pool.request().input("gameId", gameId).query(`
      SELECT TOP 1 GameId
      FROM dbo.Games
      WHERE GameId = @gameId AND IsActive = 1
    `);

    if (!gameResult.recordset?.[0]) {
      return res.status(404).json({ message: "Game not found." });
    }

    const userId = getOptionalUserId(req);

    await pool
      .request()
      .input("gameId", gameId)
      .input("userId", userId)
      .input("name", name.slice(0, 120))
      .input("rating", rating)
      .input("comment", comment.slice(0, 2000))
      .query(`
        INSERT INTO dbo.GameReviews (
          GameId,
          UserId,
          ReviewerName,
          Rating,
          Comment
        )
        VALUES (
          @gameId,
          @userId,
          @name,
          @rating,
          @comment
        )
      `);

    console.log(
      `REVIEW CREATED: gameId=${gameId} userId=${userId ?? "guest"} rating=${rating}`,
    );

    const data = await fetchReviewsPayload(pool, gameId);

    return res.status(201).json({ ok: true, data });
  } catch (error) {
    console.error("REVIEWS POST ERROR:", error);
    return res.status(500).json({ message: "Server error", detail: error.message });
  }
});

export default router;
