import { api } from "./http";

export async function fetchMyLibrary() {
  const res = await api.get("/library/me");
  return res.data?.data ?? [];
}

// gameIds: array id hoặc 1 id
export async function addToLibrary(gameIds) {
  const payload = { gameIds: Array.isArray(gameIds) ? gameIds : [gameIds] };
  const res = await api.post("/library/add", payload);
  return res.data;
}
