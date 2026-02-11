// client/src/api/home.js
import api from "./http.js";

export async function fetchHomeSlider() {
  const res = await api.get("/home/slider");
  return res.data?.data ?? [];
}

export async function fetchHomeHighlight() {
  const res = await api.get("/home/highlight");
  return res.data?.data ?? null;
}

export async function fetchTopDeals(limit = 6) {
  const res = await api.get(`/home/top-deals?limit=${limit}`);
  return res.data?.data ?? [];
}
