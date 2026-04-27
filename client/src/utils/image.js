function normalizeBaseURL(url) {
  const normalized = (url || "").trim().replace(/\/+$/, "");
  return normalized.replace(/\/api\/v1$/i, "");
}

const API_URL =
  normalizeBaseURL(import.meta?.env?.VITE_API_URL) || "http://localhost:5001";

export function toImageUrl(img) {
  if (!img) return "/images/hero-bg.jpg";

  if (img.startsWith("http://") || img.startsWith("https://")) return img;
  if (img.startsWith("/uploads/")) return API_URL + img;
  if (img.startsWith("uploads/")) return `${API_URL}/${img}`;
  if (img.startsWith("/images/")) return img;

  return "/images/hero-bg.jpg";
}
