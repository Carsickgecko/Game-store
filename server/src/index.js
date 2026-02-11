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

const app = express();

// ---------- Body parsing ----------
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// ---------- CORS ----------
// Cho phép mọi port localhost để tránh Vite đổi port (5173/5174/5175...)
// Nếu bạn muốn chặt hơn thì giữ whitelist, nhưng thường dev thì dùng regex này cho nhanh.
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);

      const okLocal = /^http:\/\/localhost:\d+$/.test(origin);
      const okAzureStatic = /^https:\/\/.*\.azurestaticapps\.net$/.test(origin);
      const okAzureWeb = /^https:\/\/.*\.azurewebsites\.net$/.test(origin);

      if (okLocal || okAzureStatic || okAzureWeb) return cb(null, true);
      return cb(new Error("CORS blocked: " + origin));
    },
    credentials: true,
  }),
);

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
