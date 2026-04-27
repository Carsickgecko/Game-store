import { api } from "../services/api.js";

export async function uploadImageFile(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await api.post("/api/v1/uploads", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data?.url || null;
}
