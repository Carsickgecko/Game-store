import { api } from "./http";

export async function createOrder({ paymentMethod, items }) {
  const res = await api.post("/orders", { paymentMethod, items });
  return res.data; // { ok, orderId, total }
}
