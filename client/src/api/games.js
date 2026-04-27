import { api } from "./http.js";

export async function fetchGames() {
  const res = await api.get("/games");
  return res.data?.data ?? [];
}

export async function fetchGameById(id) {
  const res = await api.get(`/games/${id}`);
  return res.data?.data ?? null;
}
