import express from "express";
import { developerApiTestUtils } from "../services/developerApi.js";

const router = express.Router();

function getBaseUrl(req) {
  return process.env.PUBLIC_API_BASE_URL || `${req.protocol}://${req.get("host")}`;
}

function buildOpenApiDocument(baseUrl) {
  const limit = developerApiTestUtils.DEFAULT_RATE_LIMIT_PER_HOUR || 200;

  return {
    openapi: "3.0.3",
    info: {
      title: "NeonPlay Public API",
      version: "1.0.0",
      description:
        "Public developer API for the Game Store. Register for an API key first, then send it in the x-api-key header.",
    },
    servers: [{ url: baseUrl }],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "x-api-key",
        },
      },
      schemas: {
        DeveloperRegistrationRequest: {
          type: "object",
          required: ["name", "email"],
          properties: {
            name: { type: "string", example: "Jane Developer" },
            email: { type: "string", example: "jane@example.com" },
            organization: { type: "string", example: "Indie Studio" },
            website: { type: "string", example: "https://example.com" },
            useCase: {
              type: "string",
              example: "I want to sync the store catalog into my companion app.",
            },
            keyName: { type: "string", example: "Production key" },
          },
        },
      },
    },
    paths: {
      "/api/v1/developers/register": {
        post: {
          summary: "Register as an external developer and receive an API key",
          tags: ["Developers"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/DeveloperRegistrationRequest",
                },
              },
            },
          },
          responses: {
            201: {
              description: "API key issued successfully",
            },
          },
        },
      },
      "/api/v1/public/games": {
        get: {
          summary: "List active games",
          tags: ["Public Games"],
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            { in: "query", name: "page", schema: { type: "integer" } },
            { in: "query", name: "limit", schema: { type: "integer" } },
            { in: "query", name: "search", schema: { type: "string" } },
            { in: "query", name: "genre", schema: { type: "string" } },
            { in: "query", name: "platform", schema: { type: "string" } },
          ],
          responses: {
            200: { description: "Games returned successfully" },
          },
        },
      },
      "/api/v1/public/games/{id}": {
        get: {
          summary: "Get a single game",
          tags: ["Public Games"],
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: { type: "integer" },
            },
          ],
          responses: {
            200: { description: "Game returned successfully" },
            404: { description: "Game not found" },
          },
        },
      },
      "/api/v1/public/games/{id}/similar": {
        get: {
          summary: "Get similar games using the kNN / minimal-distance method",
          tags: ["Public Games", "AI"],
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            {
              in: "path",
              name: "id",
              required: true,
              schema: { type: "integer" },
            },
            {
              in: "query",
              name: "k",
              required: false,
              schema: { type: "integer", default: 5 },
            },
          ],
          responses: {
            200: { description: "Similar games returned successfully" },
            404: { description: "Game not found" },
          },
        },
      },
      "/api/v1/public/health": {
        get: {
          summary: "Health check for the public API",
          tags: ["Public API"],
          responses: {
            200: { description: "Public API is healthy" },
          },
        },
      },
    },
    "x-usage-limits": {
      rateLimitPerHour: limit,
      notes:
        "This student-project implementation uses a simple in-memory rate limiter per API key.",
    },
  };
}

router.get("/openapi.json", (req, res) => {
  return res.json(buildOpenApiDocument(getBaseUrl(req)));
});

router.get("/docs", (req, res) => {
  const baseUrl = getBaseUrl(req);
  const limit = developerApiTestUtils.DEFAULT_RATE_LIMIT_PER_HOUR || 200;
  const openApiUrl = `${baseUrl}/api/v1/openapi.json`;
  const registerUrl = `${baseUrl}/api/v1/developers/register`;

  res.type("html").send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>NeonPlay Public API Docs</title>
    <style>
      body { font-family: Arial, sans-serif; background:#111827; color:#f9fafb; margin:0; padding:0; }
      .wrap { max-width: 960px; margin: 0 auto; padding: 40px 20px 80px; }
      .card { background:#1f2937; border:1px solid rgba(255,255,255,.08); border-radius:20px; padding:24px; margin-top:20px; }
      h1,h2,h3 { margin:0 0 12px; }
      p, li { color:#d1d5db; line-height:1.6; }
      code, pre { background:#0b1220; color:#e5e7eb; border-radius:12px; }
      code { padding:2px 6px; }
      pre { padding:16px; overflow:auto; border:1px solid rgba(255,255,255,.08); }
      a { color:#67e8f9; }
      table { width:100%; border-collapse: collapse; margin-top:16px; }
      th, td { border-bottom:1px solid rgba(255,255,255,.08); padding:12px; text-align:left; vertical-align:top; }
      th { color:#f9fafb; }
      .pill { display:inline-block; padding:6px 10px; border-radius:999px; background:#7c3aed22; color:#d8b4fe; font-size:12px; font-weight:700; letter-spacing:.06em; text-transform:uppercase; }
    </style>
  </head>
  <body>
    <main class="wrap">
      <span class="pill">Public API</span>
      <h1>NeonPlay Developer API</h1>
      <p>This public API is designed for external developers and companion apps. Register once to receive an API key, then include it in the <code>x-api-key</code> header for every public request.</p>

      <section class="card">
        <h2>Authentication</h2>
        <p>Auth method: <strong>API key</strong></p>
        <p>Header: <code>x-api-key: YOUR_API_KEY</code></p>
        <p>Usage limit: <strong>${limit} requests/hour</strong> per key</p>
        <p>OpenAPI JSON: <a href="${openApiUrl}">${openApiUrl}</a></p>
      </section>

      <section class="card">
        <h2>Register for Access</h2>
        <p>Use the registration endpoint to request a developer key.</p>
        <pre>POST ${registerUrl}
Content-Type: application/json

{
  "name": "Jane Developer",
  "email": "jane@example.com",
  "organization": "Indie Studio",
  "website": "https://example.com",
  "useCase": "Sync the public catalog into my launcher",
  "keyName": "Production key"
}</pre>
      </section>

      <section class="card">
        <h2>Available Endpoints</h2>
        <table>
          <thead>
            <tr>
              <th>Method</th>
              <th>Endpoint</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>POST</td>
              <td><code>/api/v1/developers/register</code></td>
              <td>Register as an external developer and receive an API key.</td>
            </tr>
            <tr>
              <td>GET</td>
              <td><code>/api/v1/public/games</code></td>
              <td>List active games. Supports <code>page</code>, <code>limit</code>, <code>search</code>, <code>genre</code>, <code>platform</code>.</td>
            </tr>
            <tr>
              <td>GET</td>
              <td><code>/api/v1/public/games/:id</code></td>
              <td>Get one game by id.</td>
            </tr>
            <tr>
              <td>GET</td>
              <td><code>/api/v1/public/games/:id/similar</code></td>
              <td>Get similar games using the kNN / minimal-distance method.</td>
            </tr>
            <tr>
              <td>GET</td>
              <td><code>/api/v1/public/health</code></td>
              <td>Health check endpoint for uptime and monitoring.</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="card">
        <h2>Example Request</h2>
        <pre>curl -H "x-api-key: YOUR_API_KEY" "${baseUrl}/api/v1/public/games?genre=Action&limit=10"</pre>
      </section>
    </main>
  </body>
</html>`);
});

export default router;
