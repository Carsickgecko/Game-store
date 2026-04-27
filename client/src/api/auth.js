// client/src/api/auth.js
import api from "./http.js";
import { setAuth } from "../store/auth.js";

export async function login(email, password) {
  const res = await api.post("/auth/login", { email, password });
  // res.data = { token, user }
  setAuth(res.data.token, res.data.user);
  return res.data;
}

export async function register(payload) {
  // payload: { username, email, password, fullName }
  const res = await api.post("/auth/register", payload);
  return res.data;
}
