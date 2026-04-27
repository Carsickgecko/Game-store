import {
  consumeRateLimit,
  getApiKeyAccess,
  touchApiKeyUsage,
} from "../services/developerApi.js";

function getApiKeyFromRequest(req) {
  const directHeader = String(req.header("x-api-key") || "").trim();
  if (directHeader) {
    return directHeader;
  }

  const authorization = String(req.header("authorization") || "").trim();
  if (!authorization) {
    return "";
  }

  if (/^ApiKey\s+/i.test(authorization)) {
    return authorization.replace(/^ApiKey\s+/i, "").trim();
  }

  return "";
}

export async function apiKeyAuth(req, res, next) {
  try {
    const apiKey = getApiKeyFromRequest(req);

    if (!apiKey) {
      return res.status(401).json({
        message: "Missing API key. Send it in the x-api-key header.",
      });
    }

    const access = await getApiKeyAccess(apiKey);

    if (!access || !access.isActive || access.developerStatus !== "active") {
      return res.status(401).json({ message: "Invalid or inactive API key." });
    }

    const usage = consumeRateLimit(access.apiKeyHash, access.rateLimitPerHour);

    res.setHeader("X-RateLimit-Limit", usage.limit);
    res.setHeader("X-RateLimit-Remaining", usage.remaining);
    res.setHeader("X-RateLimit-Reset", usage.resetAt);

    if (!usage.allowed) {
      return res.status(429).json({
        message: "Usage limit exceeded for this API key.",
        meta: {
          limit: usage.limit,
          remaining: usage.remaining,
          resetAt: usage.resetAt,
        },
      });
    }

    req.developer = {
      apiKeyId: Number(access.apiKeyId),
      keyName: access.keyName,
      developerId: Number(access.developerId),
      developerName: access.developerName,
      developerEmail: access.developerEmail,
      rateLimitPerHour: usage.limit,
    };

    await touchApiKeyUsage(access.apiKeyId);
    return next();
  } catch (error) {
    console.error("API KEY AUTH ERROR:", error);
    return res.status(500).json({ message: "Server error", detail: error.message });
  }
}

export default apiKeyAuth;
