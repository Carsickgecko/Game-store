import express from "express";
import { getPool } from "../db.js";
import {
  ensureOrdersSchema,
  finalizePaidOrder,
  findOrderById,
  findOrderByProviderSessionId,
  markOrderStatus,
} from "./orders.js";
import { getStripe, getStripeWebhookSecret } from "../services/stripe.js";

const router = express.Router();

function toSafeId(value, maxLength = 255) {
  return String(value || "").trim().slice(0, maxLength);
}

function toPositiveInt(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function getStripeOrderReference(object) {
  const metadata = object?.metadata || {};
  const objectType = toSafeId(object?.object, 60);
  const objectId = toSafeId(object?.id);
  const metadataSessionId = toSafeId(metadata.checkoutSessionId);
  const paymentIntentId =
    objectType === "payment_intent"
      ? objectId
      : toSafeId(object?.payment_intent) || toSafeId(metadata.paymentIntentId);

  return {
    orderId: toPositiveInt(metadata.orderId),
    userId: toPositiveInt(metadata.userId),
    providerSessionId:
      (objectType === "checkout.session" ? objectId : "") ||
      toSafeId(object?.checkout_session) ||
      metadataSessionId,
    paymentIntentId,
  };
}

function getWebhookStatusUpdate(eventType) {
  if (eventType === "checkout.session.expired") {
    return "payment_expired";
  }

  if (
    eventType === "checkout.session.async_payment_failed" ||
    eventType === "payment_intent.payment_failed"
  ) {
    return "payment_error";
  }

  return null;
}

async function resolveWebhookOrder(pool, reference) {
  if (reference.providerSessionId) {
    const orderBySession = await findOrderByProviderSessionId(
      pool,
      reference.providerSessionId,
    );

    if (orderBySession) {
      return orderBySession;
    }
  }

  if (reference.orderId) {
    return findOrderById(pool, reference.orderId);
  }

  return null;
}

async function handleSuccessfulPayment(pool, eventObject) {
  const reference = getStripeOrderReference(eventObject);
  const order = await resolveWebhookOrder(pool, reference);

  if (!order) {
    console.warn("STRIPE WEBHOOK: order not found for successful payment", {
      orderId: reference.orderId,
      providerSessionId: reference.providerSessionId,
    });
    return;
  }

  if (String(order.status || "").toLowerCase() === "completed") {
    console.log("STRIPE WEBHOOK: order already completed", {
      orderId: Number(order.orderId),
      sessionId: reference.providerSessionId,
    });
    return;
  }

  await finalizePaidOrder(pool, Number(order.orderId), Number(order.userId), {
    id: reference.providerSessionId || order.providerSessionId || null,
    payment_intent: reference.paymentIntentId || null,
  });

  console.log("STRIPE WEBHOOK: order completed", {
    orderId: Number(order.orderId),
    sessionId: reference.providerSessionId,
  });
}

async function handleFailedOrExpiredPayment(pool, eventType, eventObject) {
  const status = getWebhookStatusUpdate(eventType);
  if (!status) {
    return;
  }

  const reference = getStripeOrderReference(eventObject);
  const order = await resolveWebhookOrder(pool, reference);

  if (!order) {
    console.warn("STRIPE WEBHOOK: order not found for failure event", {
      eventType,
      orderId: reference.orderId,
      providerSessionId: reference.providerSessionId,
    });
    return;
  }

  await markOrderStatus(pool, Number(order.orderId), status);

  console.log("STRIPE WEBHOOK: order status updated", {
    eventType,
    orderId: Number(order.orderId),
    status,
  });
}

router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      const stripe = getStripe();
      const webhookSecret = getStripeWebhookSecret();
      const signature = req.headers["stripe-signature"];

      if (!webhookSecret) {
        console.error("STRIPE WEBHOOK: missing STRIPE_WEBHOOK_SECRET");
        return res
          .status(503)
          .json({ message: "Stripe webhook is not configured on the server." });
      }

      if (!signature) {
        return res.status(400).json({ message: "Missing Stripe signature." });
      }

      const event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        webhookSecret,
      );

      const pool = await getPool();
      await ensureOrdersSchema(pool);

      const eventType = String(event.type || "");
      const eventObject = event.data?.object || {};

      console.log("STRIPE WEBHOOK: received event", {
        id: event.id,
        type: eventType,
      });

      if (
        eventType === "checkout.session.completed" ||
        eventType === "checkout.session.async_payment_succeeded"
      ) {
        if (String(eventObject.payment_status || "").toLowerCase() === "paid") {
          await handleSuccessfulPayment(pool, eventObject);
        } else {
          console.log("STRIPE WEBHOOK: payment not marked as paid yet", {
            eventType,
            sessionId: eventObject.id || null,
            paymentStatus: eventObject.payment_status || null,
          });
        }
      } else {
        await handleFailedOrExpiredPayment(pool, eventType, eventObject);
      }

      return res.json({ received: true });
    } catch (error) {
      if (String(error?.message) === "STRIPE_NOT_CONFIGURED") {
        return res
          .status(503)
          .json({ message: "Stripe is not configured on the server." });
      }

      console.error("STRIPE WEBHOOK ERROR:", error);
      return res.status(400).json({
        message: "Stripe webhook handling failed.",
        detail: error.message,
      });
    }
  },
);

export const stripeWebhookTestUtils = {
  getStripeOrderReference,
  getWebhookStatusUpdate,
};

export default router;
