import api from "./http.js";

function normalizeList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

export async function fetchMyCart() {
  const res = await api.get("/cart");
  return normalizeList(res.data);
}

export async function addCartItem(gameId, qty = 1) {
  const res = await api.post("/cart", {
    gameId: Number(gameId),
    qty: Number(qty) || 1,
  });
  return res.data;
}

export async function updateCartItemQty(gameId, qty) {
  const res = await api.patch(`/cart/${Number(gameId)}`, {
    qty: Number(qty) || 1,
  });
  return res.data;
}

export async function removeCartItem(gameId) {
  const res = await api.delete(`/cart/${Number(gameId)}`);
  return res.data;
}

export async function clearMyCart() {
  const res = await api.delete("/cart");
  return res.data;
}
