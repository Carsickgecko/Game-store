import axios from "axios";
import { getAccessToken } from "../store/auth.js";

function normalizeBaseURL(url) {
  const normalized = (url || "").trim().replace(/\/+$/, "");
  return normalized.replace(/\/api\/v1$/i, "");
}

const apiRoot =
  normalizeBaseURL(import.meta.env.VITE_API_URL) || "http://localhost:5001";

export const api = axios.create({
  baseURL: `${apiRoot}/api/v1`,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
