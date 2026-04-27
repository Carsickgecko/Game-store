import test from "node:test";
import assert from "node:assert/strict";
import {
  clearAuthCookie,
  getAuthCookieOptions,
  getCookieName,
  getTokenFromRequest,
  setAuthCookie,
} from "../src/utils/authCookie.js";

test("getTokenFromRequest prefers bearer token", () => {
  const req = {
    headers: {
      authorization: "Bearer bearer-token",
      cookie: `${getCookieName()}=cookie-token`,
    },
  };

  assert.equal(getTokenFromRequest(req), "bearer-token");
});

test("getTokenFromRequest reads auth cookie when bearer token is missing", () => {
  const req = {
    headers: {
      cookie: `foo=bar; ${getCookieName()}=cookie-token; another=value`,
    },
  };

  assert.equal(getTokenFromRequest(req), "cookie-token");
});

test("setAuthCookie and clearAuthCookie use the shared cookie name", () => {
  const calls = [];
  const res = {
    cookie(name, value, options) {
      calls.push({ type: "cookie", name, value, options });
    },
    clearCookie(name, options) {
      calls.push({ type: "clear", name, options });
    },
  };

  setAuthCookie(res, "jwt-token");
  clearAuthCookie(res);

  assert.equal(calls[0].name, getCookieName());
  assert.equal(calls[0].value, "jwt-token");
  assert.equal(calls[0].options.httpOnly, true);
  assert.equal(calls[1].name, getCookieName());
  assert.equal(calls[1].options.path, "/");
});

test("getAuthCookieOptions switches to secure none cookies for https deployments", () => {
  const previousAppUrl = process.env.APP_URL;
  const previousCookieSecure = process.env.COOKIE_SECURE;
  const previousSameSite = process.env.COOKIE_SAME_SITE;

  process.env.APP_URL = "https://neonplay.azurestaticapps.net";
  delete process.env.COOKIE_SECURE;
  delete process.env.COOKIE_SAME_SITE;

  const options = getAuthCookieOptions();

  assert.equal(options.secure, true);
  assert.equal(options.sameSite, "none");

  if (previousAppUrl === undefined) delete process.env.APP_URL;
  else process.env.APP_URL = previousAppUrl;

  if (previousCookieSecure === undefined) delete process.env.COOKIE_SECURE;
  else process.env.COOKIE_SECURE = previousCookieSecure;

  if (previousSameSite === undefined) delete process.env.COOKIE_SAME_SITE;
  else process.env.COOKIE_SAME_SITE = previousSameSite;
});
