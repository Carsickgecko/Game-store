import fs from "node:fs";
import crypto from "node:crypto";
import dotenv from "dotenv";
import Stripe from "stripe";

const envFile = new URL("../.env", import.meta.url);
const source = fs.readFileSync(envFile, "utf8");
const env = dotenv.parse(source);
const secretKey = String(env.STRIPE_SECRET_KEY || "").trim();

async function configure() {
  if (!secretKey) return { status: "not_configured", restartRequired: false };
  if (!/^(sk|rk)_test_/.test(secretKey)) throw new Error("This setup script only accepts Stripe test or sandbox keys.");
  const argumentIndex = process.argv.indexOf("--api-url");
  const state = argumentIndex < 0
    ? JSON.parse(fs.readFileSync(new URL("../../artifacts/public-host/hosting-state.json", import.meta.url), "utf8").replace(/^\uFEFF/, ""))
    : null;
  const baseUrl = new URL(argumentIndex < 0 ? state.apiUrl : process.argv[argumentIndex + 1]);
  if (baseUrl.protocol !== "https:" || baseUrl.username || baseUrl.password) throw new Error("The webhook requires a public HTTPS backend URL.");
  const url = new URL("/api/v1/stripe/webhook", baseUrl).href;
  const stripe = new Stripe(secretKey, { maxNetworkRetries: 2 });
  const events = ["checkout.session.completed", "checkout.session.async_payment_succeeded", "checkout.session.async_payment_failed", "checkout.session.expired", "payment_intent.payment_failed"];
  let endpoint;
  let restartRequired = false;
  if (env.STRIPE_WEBHOOK_ID) {
    if (!env.STRIPE_WEBHOOK_SECRET) throw new Error("The saved webhook signing secret is missing. Restore it before updating this endpoint.");
    endpoint = await stripe.webhookEndpoints.retrieve(env.STRIPE_WEBHOOK_ID);
    if (endpoint.livemode || endpoint.metadata?.neonplay_managed !== "true") throw new Error("This script only updates its own NeonPlay sandbox webhook.");
    if (endpoint.url !== url || endpoint.status !== "enabled" || events.some(event => !endpoint.enabled_events.includes(event))) {
      endpoint = await stripe.webhookEndpoints.update(endpoint.id, {url, enabled_events: events, disabled: false});
    }
  } else {
    endpoint = await stripe.webhookEndpoints.create({
      url, enabled_events: events, description: "NeonPlay checkout (test)",
      metadata: {neonplay_managed: "true", project: "Game-store"},
    }, {idempotencyKey: crypto.createHash("sha256").update(`neonplay:${secretKey}:${url}`).digest("hex")});
    if (!endpoint.secret || endpoint.livemode) throw new Error("Stripe did not return a sandbox signing secret.");
    let updated = source;
    for (const [key, value] of Object.entries({STRIPE_WEBHOOK_ID:endpoint.id, STRIPE_WEBHOOK_SECRET:endpoint.secret, STRIPE_CURRENCY:env.STRIPE_CURRENCY || "usd"})) {
      const pattern = new RegExp(`^${key}=[^\\r\\n]*`, "m");
      updated = pattern.test(updated) ? updated.replace(pattern, () => `${key}=${value}`) : `${updated.trimEnd()}\n${key}=${value}\n`;
    }
    if (fs.readFileSync(envFile, "utf8") !== source) throw new Error("The local .env changed during setup. Retry before saving.");
    fs.writeFileSync(envFile, updated);
    restartRequired = true;
  }
  return {status:"configured", mode:"test", webhookId:endpoint.id, webhookUrl:url, restartRequired};
}
try { console.log(JSON.stringify(await configure())); }
catch (error) {
  // Stripe authentication errors can quote a key; never print their raw message.
  console.error(error.type ? `Stripe setup failed: ${error.type}, HTTP ${error.statusCode || "unknown"}. Check the local test key and its permissions.` : error.message);
  process.exitCode = 1;
}
