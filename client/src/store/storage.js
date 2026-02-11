// client/src/store/storage.js
import { getUser } from "./auth.js";

function emitStoreChange() {
  window.dispatchEvent(new CustomEvent("store:changed"));
}

// tạo suffix theo user để tách data theo tài khoản
function getUserKeySuffix() {
  const u = getUser();
  // ưu tiên id, nếu không có thì dùng email/username
  const raw = u?.id ?? u?.userId ?? u?.email ?? u?.username;
  return raw ? String(raw) : "guest";
}

// keys theo user
function cartKey() {
  return `cart_items:${getUserKeySuffix()}`;
}
function wishlistKey() {
  return `wishlist_items:${getUserKeySuffix()}`;
}

export function getCartItems() {
  try {
    return JSON.parse(localStorage.getItem(cartKey())) || [];
  } catch {
    return [];
  }
}

export function setCartItems(items) {
  localStorage.setItem(cartKey(), JSON.stringify(items || []));
  emitStoreChange();
}

export function clearCart() {
  localStorage.removeItem(cartKey());
  emitStoreChange();
}

export function getWishlistItems() {
  try {
    return JSON.parse(localStorage.getItem(wishlistKey())) || [];
  } catch {
    return [];
  }
}

export function setWishlistItems(items) {
  localStorage.setItem(wishlistKey(), JSON.stringify(items || []));
  emitStoreChange();
}

export function clearWishlist() {
  localStorage.removeItem(wishlistKey());
  emitStoreChange();
}

/**
 * (Tuỳ chọn) Xoá dữ liệu kiểu cũ (không theo user) để tránh UI đọc nhầm file cũ ở nơi khác
 * Gọi 1 lần khi app start nếu muốn.
 */
export function cleanupLegacyStoreKeys() {
  localStorage.removeItem("cart_items");
  localStorage.removeItem("wishlist_items");
}
