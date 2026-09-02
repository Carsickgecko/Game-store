import test from "node:test";
import assert from "node:assert/strict";
import {
  getCheckoutBaseUrl,
  getStripeCurrency,
  getStripeCancelUrl,
  getStripeSuccessUrl,
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

test("Stripe redirect URLs use the configured frontend URL", () => {
  const previous = process.env.APP_URL;
  process.env.APP_URL = "https://neonplay.example.com/";

  assert.equal(
    getStripeSuccessUrl(99),
    "https://neonplay.example.com/thank-you?session_id={CHECKOUT_SESSION_ID}&order_id=99",
  );
  assert.equal(
    getStripeCancelUrl(99),
    "https://neonplay.example.com/checkout?canceled=1&order_id=99",
  );

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


test("Stripe redirects preserve the GitHub Pages hash route and its query parameters", () => {
  const previous = process.env.APP_URL;
  process.env.APP_URL = "https://carsickgecko.github.io/Game-store/#";
  try {
    const cancel = new URL(getStripeCancelUrl(99));
    assert.equal(cancel.pathname, "/Game-store/");
    assert.equal(cancel.search, "");
    assert.equal(cancel.hash, "#/checkout?canceled=1&order_id=99");
    assert.equal(getStripeCancelUrl(), "https://carsickgecko.github.io/Game-store/#/checkout?canceled=1");
    assert.equal(getStripeSuccessUrl(99), "https://carsickgecko.github.io/Game-store/#/thank-you?session_id={CHECKOUT_SESSION_ID}&order_id=99");
  } finally {
    if (previous === undefined) delete process.env.APP_URL;
    else process.env.APP_URL = previous;
  }
});
