import { api } from "../services/api.js";

export async function fetchMyAchievements() {
  const res = await api.get("/api/v1/achievements/me");
  return res.data;
}
