import { api } from "./http";

export async function apiRegister(payload) {
  // payload: { username, email, password, fullName }
  const res = await api.post("/auth/register", payload);
  return res.data; // { user } hoặc { message }
}

export async function apiLogin(payload) {
  // payload: { email, password }
  const res = await api.post("/auth/login", payload);
  return res.data; // { token, user }
}
