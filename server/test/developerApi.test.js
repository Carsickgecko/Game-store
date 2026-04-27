import test from "node:test";
import assert from "node:assert/strict";
import { developerApiTestUtils } from "../src/services/developerApi.js";

test("normalizeDeveloperEmail trims and lowercases email", () => {
  assert.equal(
    developerApiTestUtils.normalizeDeveloperEmail("  DEV@Example.COM "),
    "dev@example.com",
  );
});

test("createApiKeyValue returns prefixed random key", () => {
  const apiKey = developerApiTestUtils.createApiKeyValue();

  assert.ok(apiKey.startsWith("ngs_"));
  assert.ok(apiKey.length > 20);
});

test("hashApiKey and getApiKeyPrefix are deterministic", () => {
  const apiKey = "ngs_example_key";

  assert.equal(
    developerApiTestUtils.hashApiKey(apiKey),
    developerApiTestUtils.hashApiKey(apiKey),
  );
  assert.equal(developerApiTestUtils.getApiKeyPrefix(apiKey), "ngs_example_");
});

test("consumeRateLimit blocks requests after the configured limit", () => {
  const apiKeyHash = "hash-for-tests";

  const first = developerApiTestUtils.consumeRateLimit(apiKeyHash, 60);
  const second = developerApiTestUtils.consumeRateLimit(apiKeyHash, 60);

  assert.equal(first.allowed, true);
  assert.equal(second.allowed, true);

  for (let count = 0; count < 58; count += 1) {
    developerApiTestUtils.consumeRateLimit(apiKeyHash, 60);
  }

  const blocked = developerApiTestUtils.consumeRateLimit(apiKeyHash, 60);
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.limit, 60);
});
