// client/src/api/authHttp.js
import { api } from "../services/api.js";

// ✅ sửa endpoints theo backend của bạn
// nếu backend bạn đang là /api/v1/auth/login thì giữ như dưới

export async function apiRegister(payload) {
  const res = await api.post("/api/v1/auth/register", payload);
  return res.data;
}

export async function apiLogin(payload) {
  const res = await api.post("/api/v1/auth/login", payload);
  return res.data;
}

export async function apiMe() {
  const res = await api.get("/api/v1/library/me");
  return res.data;
}

export async function apiUpdateProfile(payload) {
  const res = await api.put("/api/v1/users/me", payload);
  return res.data;
}

export async function apiChangePassword(payload) {
  const res = await api.put("/api/v1/users/change-password", payload);
  return res.data;
}
