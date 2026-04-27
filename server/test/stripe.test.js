import test from "node:test";
import assert from "node:assert/strict";
import {
  getCheckoutBaseUrl,
  getStripeCurrency,
  getStripeWebhookSecret,
  toStripeAmount,
} from "../src/services/stripe.js";

test("toStripeAmount converts decimal amount to cents", () => {
  assert.equal(toStripeAmount(10), 1000);
  assert.equal(toStripeAmount(10.25), 1025);
  assert.equal(toStripeAmount(0), 0);
});

test("getStripeCurrency falls back to usd", () => {
  const previous = process.env.STRIPE_CURRENCY;
  delete process.env.STRIPE_CURRENCY;

  assert.equal(getStripeCurrency(), "usd");

  if (previous !== undefined) {
    process.env.STRIPE_CURRENCY = previous;
  }
});

test("getCheckoutBaseUrl prefers APP_URL and trims trailing slash", () => {
  const previous = process.env.APP_URL;
  process.env.APP_URL = "https://example.com/";

  assert.equal(getCheckoutBaseUrl(), "https://example.com");

  if (previous === undefined) {
    delete process.env.APP_URL;
  } else {
    process.env.APP_URL = previous;
  }
});

test("getStripeWebhookSecret trims the configured webhook secret", () => {
  const previous = process.env.STRIPE_WEBHOOK_SECRET;
  process.env.STRIPE_WEBHOOK_SECRET = "  whsec_test_secret  ";

  assert.equal(getStripeWebhookSecret(), "whsec_test_secret");

  if (previous === undefined) {
    delete process.env.STRIPE_WEBHOOK_SECRET;
  } else {
    process.env.STRIPE_WEBHOOK_SECRET = previous;
  }
});
