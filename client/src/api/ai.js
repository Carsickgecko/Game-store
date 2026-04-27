import api from "./http.js";

export async function fetchSimilarGames(gameId, k = 5) {
  const res = await api.get(`/ai/recommend/similar/${gameId}?k=${k}`);
  return res.data?.data ?? [];
}

export async function fetchMyRecommendations(k = 6) {
  const res = await api.get(`/ai/recommend/me?k=${k}`);
  return res.data?.data ?? [];
}
