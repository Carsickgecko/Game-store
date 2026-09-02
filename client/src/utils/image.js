function normalizeBaseURL(url) {
  const normalized = (url || "").trim().replace(/\/+$/, "");
  return normalized.replace(/\/api\/v1$/i, "");
}

const API_URL =
  normalizeBaseURL(import.meta?.env?.VITE_API_URL) || "http://localhost:5001";

export function publicAssetUrl(path, base = import.meta?.env?.BASE_URL || "/") {
  return base.replace(/\/?$/, "/") + path.replace(/^\/+/, "");
}

export function toImageUrl(img) {
  const fallback = publicAssetUrl("/images/hero-bg.jpg");
  if (!img || typeof img !== "string") return fallback;

  if (img.startsWith("http://") || img.startsWith("https://")) return img;
  if (img.startsWith("/uploads/")) return API_URL + img;
  if (img.startsWith("uploads/")) return `${API_URL}/${img}`;
  if (img.startsWith("/images/")) return publicAssetUrl(img);
  if (img.startsWith(publicAssetUrl("/images/"))) return img;

  return fallback;
}
