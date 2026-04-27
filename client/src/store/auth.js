import { clearCart, clearWishlist, cleanupLegacyStoreKeys } from "./storage.js";

let accessToken = null;
let currentUser = null;

function emitAuthChanged() {
  window.dispatchEvent(new Event("auth:changed"));
  window.dispatchEvent(new Event("store:changed"));
}

function getApiRoot() {
  return (import.meta.env.VITE_API_URL || "http://localhost:5001")
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/api\/v1$/i, "");
}

export function setAuth(token, user) {
  accessToken = token || null;
  currentUser = user || null;
  cleanupLegacyStoreKeys();
  emitAuthChanged();
}

export const saveAuth = setAuth;

export function getUser() {
  return currentUser;
}

export function isAuthenticated() {
  return Boolean(currentUser);
}

export const isLoggedIn = isAuthenticated;

export function getAccessToken() {
  return accessToken;
}

export const getToken = getAccessToken;

export async function bootstrapAuth() {
  cleanupLegacyStoreKeys();

  try {
    const response = await fetch(`${getApiRoot()}/api/v1/auth/me`, {
      credentials: "include",
    });

    if (!response.ok) {
      accessToken = null;
      currentUser = null;
      emitAuthChanged();
      return null;
    }

    const data = await response.json();
    accessToken = null;
    currentUser = data?.user || null;
    emitAuthChanged();
    return currentUser;
  } catch {
    accessToken = null;
    currentUser = null;
    emitAuthChanged();
    return null;
  }
}

export async function logout() {
  accessToken = null;
  currentUser = null;
  clearCart();
  clearWishlist();
  cleanupLegacyStoreKeys();
  emitAuthChanged();

  try {
    const { apiLogout } = await import("../api/authHttp.js");
    await apiLogout();
  } catch {
    // Ignore logout network failures after local state is cleared.
  }
}

export async function updateProfile({ name, fullName, email, avatarUrl }) {
  const { apiUpdateProfile } = await import("../api/authHttp.js");
  const data = await apiUpdateProfile({
    name,
    fullName: fullName || name,
    email,
    avatarUrl,
  });

  const nextUser = {
    ...(currentUser || {}),
    ...(data?.user || {}),
    name: data?.user?.fullName || data?.user?.name || fullName || name,
    avatarUrl:
      data?.user?.avatarUrl ??
      avatarUrl ??
      currentUser?.avatarUrl ??
      null,
  };

  currentUser = nextUser;
  emitAuthChanged();

  return { ok: true, user: nextUser };
}

export async function changePassword({ currentPassword, newPassword }) {
  const { apiChangePassword } = await import("../api/authHttp.js");
  const data = await apiChangePassword({ currentPassword, newPassword });
  return { ok: true, ...(data || {}) };
}

export async function updatePreferredLanguage(language) {
  const { apiUpdateLanguage } = await import("../api/authHttp.js");
  const data = await apiUpdateLanguage(language);

  currentUser = {
    ...(currentUser || {}),
    ...(data?.user || {}),
    preferredLanguage: data?.user?.preferredLanguage || language,
  };

  emitAuthChanged();
  return currentUser;
}

export function isAdmin() {
  const u = getUser();
  return !!u && Number(u.roleId) === 2;
}

export function getRoleId() {
  const u = getUser();
  return u ? Number(u.roleId) : null;
}
