import test from "node:test";
import assert from "node:assert/strict";
import { isPrivateOriginAllowed } from "../src/utils/cors.js";

test("CORS accepts the configured GitHub Pages origin including an app path/hash", () => {
  assert.equal(
    isPrivateOriginAllowed("https://carsickgecko.github.io", {
      APP_URL: "https://carsickgecko.github.io/Game-store/#",
    }),
    true,
  );
});

test("CORS rejects unrelated origins and no longer trusts all Azure apps", () => {
  const env = { APP_URL: "https://carsickgecko.github.io/Game-store/#" };
  for (const origin of [
    "https://someone-else.github.io",
    "https://carsickgecko.github.io.evil.example",
    "https://unrelated.azurewebsites.net",
  ]) {
    assert.equal(isPrivateOriginAllowed(origin, env), false);
  }
});

test("CORS retains local development and supports explicitly configured extra origins", () => {
  assert.equal(isPrivateOriginAllowed("http://localhost:5173", {}), true);
  assert.equal(
    isPrivateOriginAllowed("https://preview.example", {
      CORS_ORIGINS: "invalid, https://preview.example/path",
    }),
    true,
  );
});
