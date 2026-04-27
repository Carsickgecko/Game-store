import api from "./http.js";

function normalizeList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

export async function fetchMyLibrary() {
  const res = await api.get("/library/me");
  return normalizeList(res.data);
}

export async function addToLibrary(gameIds) {
  const normalizedIds = [
    ...new Set(
      (Array.isArray(gameIds) ? gameIds : [])
        .map((id) => Number(id))
        .filter((id) => Number.isFinite(id)),
    ),
  ];

  const res = await api.post("/library/add", { gameIds: normalizedIds });
  return res.data;
}
