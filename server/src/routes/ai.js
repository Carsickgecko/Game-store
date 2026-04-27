import express from "express";
import authMiddleware from "../middleware/auth.js";
import {
  getRecommendationsForUser,
  getSimilarGames,
} from "../services/recommendation.js";

const router = express.Router();

function parseK(rawValue, fallback = 5) {
  const numeric = Number(rawValue);

  if (!Number.isFinite(numeric)) {
    return fallback;
  }

  return Math.max(1, Math.min(12, Math.floor(numeric)));
}

router.get("/recommend/similar/:gameId", async (req, res) => {
  try {
    const gameId = Number(req.params.gameId);

    if (!Number.isFinite(gameId)) {
      return res.status(400).json({ message: "Invalid gameId" });
    }

    const data = await getSimilarGames(gameId, {
      k: parseK(req.query.k, 5),
    });

    if (!data) {
      return res.status(404).json({ message: "Game not found" });
    }

    return res.json({
      data,
      meta: {
        method: "knn-euclidean",
        k: parseK(req.query.k, 5),
      },
    });
  } catch (error) {
    console.error("AI SIMILAR ERROR:", error);
    return res
      .status(500)
      .json({ message: "Server error", detail: error.message });
  }
});

router.get("/recommend/me", authMiddleware, async (req, res) => {
  try {
    const data = await getRecommendationsForUser(req.user.id, {
      k: parseK(req.query.k, 6),
    });

    return res.json({
      data,
      meta: {
        method: "knn-euclidean",
        k: parseK(req.query.k, 6),
      },
    });
  } catch (error) {
    console.error("AI USER RECOMMEND ERROR:", error);
    return res
      .status(500)
      .json({ message: "Server error", detail: error.message });
  }
});

export default router;
