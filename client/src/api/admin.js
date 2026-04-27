import { api } from "../services/api.js";

// upload ảnh
export async function uploadGameImage(file) {
  const form = new FormData();
  form.append("file", file); // ✅ field backend (multer) thường là "file"

  // ✅ đúng route: /api/v1/uploads  (KHÔNG có /image)
  const res = await api.post("/api/v1/uploads", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data.url; // "/uploads/xxx.jpg"
}

// list games (admin)
export async function adminFetchGames() {
  const res = await api.get("/api/v1/admin/games");
  return res.data.data || [];
}

export async function adminCreateGame(payload) {
  const res = await api.post("/api/v1/admin/games", payload);
  return res.data;
}

export async function adminUpdateGame(id, payload) {
  const res = await api.put(`/api/v1/admin/games/${id}`, payload);
  return res.data;
}

export async function adminDeleteGame(id) {
  const res = await api.delete(`/api/v1/admin/games/${id}`);
  return res.data;
}

export async function adminPermanentDeleteGame(id) {
  const res = await api.delete(`/api/v1/admin/games/${id}/permanent`);
  return res.data;
}

export async function adminFetchUsers() {
  const res = await api.get("/api/v1/admin/users");
  return res.data?.data || [];
}

export async function adminDisableUser(userId) {
  const res = await api.patch(`/api/v1/admin/users/${userId}/disable`);
  return res.data?.user;
}

export async function adminEnableUser(userId) {
  const res = await api.patch(`/api/v1/admin/users/${userId}/enable`);
  return res.data?.user;
}
