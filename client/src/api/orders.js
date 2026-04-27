import api from "./http.js";

function normalizeOrders(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

export async function createOrder({
  paymentMethod,
  items,
  serviceFee = 0,
  paymentFee = 0,
  email,
  name,
  country,
  city,
  address,
  zip,
}) {
  const res = await api.post("/orders", {
    paymentMethod,
    items,
    serviceFee,
    paymentFee,
    email,
    name,
    country,
    city,
    address,
    zip,
  });
  return res.data;
}

export async function createCheckoutSession({
  items,
  serviceFee = 0,
  paymentFee = 0,
  email,
  name,
  country,
  city,
  address,
  zip,
}) {
  const res = await api.post("/orders/checkout-session", {
    items,
    serviceFee,
    paymentFee,
    email,
    name,
    country,
    city,
    address,
    zip,
  });

  return res.data;
}

export async function confirmCheckoutSession(sessionId) {
  const res = await api.get(
    `/orders/checkout-session/${encodeURIComponent(sessionId)}/confirm`,
  );
  return res.data;
}

export async function fetchMyOrders() {
  const res = await api.get("/orders/my");
  return normalizeOrders(res.data);
}
