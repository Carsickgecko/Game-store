import test from "node:test";
import assert from "node:assert/strict";
import { stripeWebhookTestUtils } from "../src/routes/stripeWebhook.js";

test("getStripeOrderReference extracts ids from checkout session objects", () => {
  const result = stripeWebhookTestUtils.getStripeOrderReference({
    object: "checkout.session",
    id: "cs_test_123",
    payment_intent: "pi_test_123",
    metadata: {
      orderId: "42",
      userId: "7",
    },
  });

  assert.deepEqual(result, {
    orderId: 42,
    userId: 7,
    providerSessionId: "cs_test_123",
    paymentIntentId: "pi_test_123",
  });
});

test("getStripeOrderReference falls back to metadata for failed payment intent events", () => {
  const result = stripeWebhookTestUtils.getStripeOrderReference({
    object: "payment_intent",
    id: "pi_test_failed",
    metadata: {
      orderId: "15",
      userId: "3",
      checkoutSessionId: "cs_test_fallback",
    },
  });

  assert.deepEqual(result, {
    orderId: 15,
    userId: 3,
    providerSessionId: "cs_test_fallback",
    paymentIntentId: "pi_test_failed",
  });
});

test("getWebhookStatusUpdate maps failure and expiry events to order statuses", () => {
  assert.equal(
    stripeWebhookTestUtils.getWebhookStatusUpdate("checkout.session.expired"),
    "payment_expired",
  );
  assert.equal(
    stripeWebhookTestUtils.getWebhookStatusUpdate(
      "checkout.session.async_payment_failed",
    ),
    "payment_error",
  );
  assert.equal(
    stripeWebhookTestUtils.getWebhookStatusUpdate("payment_intent.payment_failed"),
    "payment_error",
  );
  assert.equal(
    stripeWebhookTestUtils.getWebhookStatusUpdate("checkout.session.completed"),
    null,
  );
});
