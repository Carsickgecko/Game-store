import express from "express";
import {
  registerDeveloperAccess,
} from "../services/developerApi.js";

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const payload = req.body || {};

    if (!payload.name || !payload.email) {
      return res.status(400).json({
        message: "Name and email are required.",
      });
    }

    const result = await registerDeveloperAccess(payload);

    return res.status(201).json({
      ok: true,
      message: "Developer access created successfully.",
      developer: result.developer,
      key: {
        apiKey: result.key.apiKey,
        keyName: result.key.keyName,
        rateLimitPerHour: result.key.rateLimitPerHour,
        issuedAt: result.key.createdAt,
      },
      docs: {
        html: "/api/v1/docs",
        openApi: "/api/v1/openapi.json",
      },
    });
  } catch (error) {
    console.error("DEVELOPER REGISTER ERROR:", error);

    if (String(error.message) === "NAME_EMAIL_REQUIRED") {
      return res.status(400).json({
        message: "Name and email are required.",
      });
    }

    return res
      .status(500)
      .json({ message: "Failed to create developer access.", detail: error.message });
  }
});

export default router;
