import Stripe from "stripe";

let stripeClient = null;

function normalizeUrl(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

export function getCheckoutBaseUrl() {
  return (
    normalizeUrl(process.env.APP_URL) ||
    normalizeUrl(process.env.FRONTEND_URL) ||
    normalizeUrl(process.env.CLIENT_URL) ||
    "http://localhost:5173"
  );
}

export function getStripeCurrency() {
  return String(process.env.STRIPE_CURRENCY || "usd")
    .trim()
    .toLowerCase();
}

export function getStripeWebhookSecret() {
  return String(process.env.STRIPE_WEBHOOK_SECRET || "").trim();
}

export function toStripeAmount(value) {
  return Math.max(0, Math.round(Number(value || 0) * 100));
}

export function getStripe() {
  const secretKey = String(process.env.STRIPE_SECRET_KEY || "").trim();

  if (!secretKey) {
    throw new Error("STRIPE_NOT_CONFIGURED");
  }

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey);
  }

  return stripeClient;
}
