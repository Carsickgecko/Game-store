// client/src/store/auth.js

const TOKEN_KEY = "accessToken";
const USER_KEY = "user";

function emitAuthChanged() {
  window.dispatchEvent(new Event("auth:changed"));
  // để Header / Wishlist / Cart refresh đúng theo user mới
  window.dispatchEvent(new Event("store:changed"));
}

/**
 * Lưu token + user sau khi login
 */
export function setAuth(token, user) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  emitAuthChanged();
}

/**
 * Alias để tương thích code cũ bạn đang dùng
 */
export const saveAuth = setAuth;

/**
 * Lấy user hiện tại (hoặc null)
 */
export function getUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Kiểm tra đã login hay chưa (dựa vào token)
 */
export function isAuthenticated() {
  return Boolean(localStorage.getItem(TOKEN_KEY));
}

// Alias tương thích code cũ (nếu file nào dùng isLoggedIn)
export const isLoggedIn = isAuthenticated;

/**
 * Lấy access token (cho axios interceptor)
 */
export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY);
}

// Alias tương thích code cũ (nếu file nào đang import getToken)
export const getToken = getAccessToken;

/**
 * Logout
 */
export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  emitAuthChanged();
}

/**
 * Update profile (DEMO: update local user)
 * - Không phá UI hiện tại của AccountSettings
 */
export function updateProfile({ name, email }) {
  const u = getUser();
  if (!u) return { ok: false };

  const next = { ...u, name, email };
  localStorage.setItem(USER_KEY, JSON.stringify(next));
  emitAuthChanged();
  return { ok: true, user: next };
}

/**
 * Change password (DEMO local)
 * - Backend bạn có thể làm sau
 */
export function changePassword({ currentPassword, newPassword }) {
  // demo: chỉ validate tối thiểu
  if (!currentPassword || !newPassword) {
    return { ok: false, message: "Missing password fields." };
  }
  return { ok: true };
}

/**
 * Kiểm tra có phải admin không
 * (RoleId = 2 là admin theo backend của bạn)
 */
export function isAdmin() {
  const u = getUser();
  return !!u && Number(u.roleId) === 2;
}

/**
 * Lấy roleId (nếu cần dùng UI)
 */
export function getRoleId() {
  const u = getUser();
  return u ? Number(u.roleId) : null;
}
