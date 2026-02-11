import { api } from "./http";

export async function fetchGames() {
  const res = await api.get("/games");
  // backend trả { data: [...] }
  return res.data?.data ?? [];
}

export async function fetchGameById(id) {
  const res = await api.get(`/games/${id}`);
  // backend trả { data: {...} }
  return res.data?.data ?? null;
}
