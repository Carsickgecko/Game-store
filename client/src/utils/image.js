const API_URL = "http://localhost:5001";

export function toImageUrl(img) {
  if (!img) return "/images/hero-bg.jpg";

  // full url
  if (img.startsWith("http://") || img.startsWith("https://")) return img;

  // "/uploads/xxx.jpg"
  if (img.startsWith("/uploads/")) return API_URL + img;

  // "uploads/xxx.jpg"  <-- DB bạn đang lưu kiểu này
  if (img.startsWith("uploads/")) return API_URL + "/" + img;

  // "/images/hero-bg.jpg"
  if (img.startsWith("/images/")) return img;

  return "/images/hero-bg.jpg";
}
