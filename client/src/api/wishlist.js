import api from "./http.js";

function normalizeList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

export async function fetchWishlist() {
  const res = await api.get("/wishlist");
  return normalizeList(res.data);
}

export async function addWishlistItem(gameId) {
  const res = await api.post(`/wishlist/${Number(gameId)}`);
  return res.data;
}

export async function removeWishlistItem(gameId) {
  const res = await api.delete(`/wishlist/${Number(gameId)}`);
  return res.data;
}
