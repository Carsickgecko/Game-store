// client/src/services/api.js
import axios from "axios";
import { getAccessToken, logout } from "../store/auth.js";

function normalizeBaseURL(url) {
  const u = (url || "").trim().replace(/\/+$/, "");
  // nếu ai đó lỡ set .../api/v1 thì cắt bỏ
  return u.replace(/\/api\/v1$/i, "");
}

export const api = axios.create({
  baseURL:
    normalizeBaseURL(import.meta.env.VITE_API_URL) || "http://localhost:5001",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) logout();
    return Promise.reject(err);
  },
);
