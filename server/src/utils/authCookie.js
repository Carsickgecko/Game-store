const COOKIE_NAME = "neonplay_token";

function isTruthy(value) {
  return ["1", "true", "yes", "on"].includes(String(value || "").trim().toLowerCase());
}

function shouldUseSecureCookies() {
  if (String(process.env.COOKIE_SECURE || "").trim()) {
    return isTruthy(process.env.COOKIE_SECURE);
  }

  const appUrl = String(
    process.env.APP_URL || process.env.FRONTEND_URL || process.env.CLIENT_URL || "",
  )
    .trim()
    .toLowerCase();

  return appUrl.startsWith("https://");
}

function getSameSiteValue(secure) {
  const configured = String(process.env.COOKIE_SAME_SITE || "").trim().toLowerCase();

  if (configured === "strict" || configured === "lax" || configured === "none") {
    return configured;
  }

  return secure ? "none" : "lax";
}

export function getAuthCookieOptions() {
  const secure = shouldUseSecureCookies();
  const sameSite = getSameSiteValue(secure);
  const domain = String(process.env.COOKIE_DOMAIN || "").trim();

  return {
    httpOnly: true,
    sameSite,
    secure,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
    ...(domain ? { domain } : {}),
  };
}

function parseCookieHeader(header) {
  return String(header || "")
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((acc, part) => {
      const index = part.indexOf("=");
      if (index <= 0) return acc;

      const key = part.slice(0, index).trim();
      const value = part.slice(index + 1).trim();
      acc[key] = decodeURIComponent(value);
      return acc;
    }, {});
}

export function getCookieName() {
  return COOKIE_NAME;
}

export function getTokenFromRequest(req) {
  const header = req.headers.authorization || "";
  const bearerToken = header.startsWith("Bearer ")
    ? header.slice(7).trim()
    : "";

  if (bearerToken) {
    return bearerToken;
  }

  const cookies = parseCookieHeader(req.headers.cookie || "");
  return cookies[COOKIE_NAME] || "";
}

export function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, getAuthCookieOptions());
}

export function clearAuthCookie(res) {
  const { maxAge, ...options } = getAuthCookieOptions();
  res.clearCookie(COOKIE_NAME, options);
}
