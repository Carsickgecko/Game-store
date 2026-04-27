// server/src/index.js
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/auth.js";
import gamesRoutes from "./routes/games.js";
import libraryRoutes from "./routes/library.js";
import adminGamesRoutes from "./routes/admin.games.js";
import adminUsersRoutes from "./routes/admin.users.js";
import uploadsRoutes from "./routes/uploads.js";
import homeRoutes from "./routes/home.js";
import wishlistRoutes from "./routes/wishlist.js";
import cartRoutes from "./routes/cart.js";
import usersRoutes from "./routes/users.js";
import achievementsRoutes from "./routes/achievements.js";
import ordersRoutes from "./routes/orders.js";
import aiRoutes from "./routes/ai.js";
import reviewsRoutes from "./routes/reviews.js";
import developersRoutes from "./routes/developers.js";
import publicApiRoutes from "./routes/publicApi.js";
import apiDocsRoutes from "./routes/apiDocs.js";
const app = express();

app.use(
  cors((req, cb) => {
    const origin = req.header("Origin");
    const isPublicRoute =
      req.path.startsWith("/api/v1/public") ||
      req.path.startsWith("/api/v1/developers") ||
      req.path === "/api/v1/docs" ||
      req.path === "/api/v1/openapi.json";

    if (!origin) {
      return cb(null, {
        origin: true,
        credentials: !isPublicRoute,
      });
    }

    if (isPublicRoute) {
      return cb(null, {
        origin: true,
        credentials: false,
      });
    }

    const okLocal = /^http:\/\/localhost:\d+$/.test(origin);
    const okAzureStatic = /^https:\/\/.*\.azurestaticapps\.net$/.test(origin);
    const okAzureWeb = /^https:\/\/.*\.azurewebsites\.net$/.test(origin);
    const okAzureStorageStatic = /^https:\/\/.*\.web\.core\.windows\.net$/.test(origin);

    if (okLocal || okAzureStatic || okAzureWeb || okAzureStorageStatic) {
      return cb(null, {
        origin: true,
        credentials: true,
      });
    }

    return cb(new Error("CORS blocked: " + origin));
  }),
);

// ---------- Body parsing ----------
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// ---------- Static: serve uploads ----------
// Để ảnh dạng "/uploads/xxx.jpg" load được trên frontend
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// ---------- Routes ----------
app.get("/api/v1/health", (req, res) => res.json({ ok: true }));

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/games", gamesRoutes);
app.use("/api/v1/library", libraryRoutes);

app.use("/api/v1/admin", adminGamesRoutes);
app.use("/api/v1/admin", adminUsersRoutes);

app.use("/api/v1/uploads", uploadsRoutes);
app.use("/api/v1/home", homeRoutes);
app.use("/api/v1/wishlist", wishlistRoutes);
app.use("/api/v1/cart", cartRoutes);
app.use("/api/v1/users", usersRoutes);
app.use("/api/v1/achievements", achievementsRoutes);
app.use("/api/v1/orders", ordersRoutes);
app.use("/api/v1/ai", aiRoutes);
app.use("/api/v1/reviews", reviewsRoutes);
app.use("/api/v1/developers", developersRoutes);
app.use("/api/v1/public", publicApiRoutes);
app.use("/api/v1", apiDocsRoutes);
app.use(
  "/images",
  express.static(path.join(__dirname, "..", "public", "images")),
);

// ---------- 404 ----------
app.use((req, res) => {
  res.status(404).json({ message: "Not found", path: req.originalUrl });
});

// ---------- Error handler ----------
app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);
  res.status(500).json({ message: "Server error", detail: err.message });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
