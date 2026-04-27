import api from "./http.js";

function normalizeReviewPayload(payload) {
  return {
    items: Array.isArray(payload?.items) ? payload.items : [],
    summary: payload?.summary || { count: 0, average: null },
  };
}

export async function fetchGameReviews(gameId) {
  const res = await api.get(`/reviews/game/${Number(gameId)}`);
  return normalizeReviewPayload(res.data?.data);
}

export async function createGameReview(gameId, payload) {
  const res = await api.post(`/reviews/game/${Number(gameId)}`, payload);
  return normalizeReviewPayload(res.data?.data);
}
