// client/src/api/http.js
import axios from "axios";

const TOKEN_KEY = "accessToken"; // khớp với client/src/store/auth.js

// Dùng env nếu có, fallback localhost
const BASE_URL =
  import.meta.env?.VITE_API_URL || "http://localhost:5001/api/v1";

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Gắn token nếu có
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export { api };
export default api;
