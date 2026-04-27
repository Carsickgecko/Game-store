import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getPool } from "../db.js";
import authMiddleware from "../middleware/auth.js";
import { clearAuthCookie, setAuthCookie } from "../utils/authCookie.js";
import { ensureUsersProfileSchema } from "../utils/usersSchema.js";

const router = express.Router();

//
// REGISTER
//
router.post("/register", async (req, res) => {
  try {
    const { username, email, password, fullName } = req.body || {};

    if (!username || !email || !password) {
      return res.status(400).json({
        message: "Missing required fields (username, email, password)",
      });
    }

    const pool = await getPool();
    await ensureUsersProfileSchema();

    // Check existing user
    const existing = await pool
      .request()
      .input("username", username)
      .input("email", email).query(`
        SELECT TOP 1 UserId
        FROM dbo.Users
        WHERE Username=@username OR Email=@email
      `);

    if (existing.recordset.length > 0) {
      return res
        .status(409)
        .json({ message: "Username or Email already exists" });
    }

    const hash = await bcrypt.hash(password, 10);

    // Default role = 1 (user)
    const inserted = await pool
      .request()
      .input("username", username)
      .input("email", email)
      .input("hash", hash)
      .input("fullName", fullName || null).query(`
        INSERT INTO dbo.Users 
        (Username, Email, PasswordHash, FullName, RoleId, IsActive)
        OUTPUT INSERTED.UserId, INSERTED.Username, INSERTED.Email, INSERTED.FullName, INSERTED.RoleId, INSERTED.AvatarUrl, INSERTED.PreferredLanguage
        VALUES (@username, @email, @hash, @fullName, 1, 1)
      `);

    const user = inserted.recordset[0];

    res.status(201).json({
      user: {
        id: user.UserId,
        username: user.Username,
        email: user.Email,
        fullName: user.FullName,
        roleId: user.RoleId,
        avatarUrl: user.AvatarUrl || null,
        preferredLanguage: user.PreferredLanguage || "en",
      },
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ message: "Server error", detail: err.message });
  }
});

//
// LOGIN
//
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Missing required fields (email, password)" });
    }

    const pool = await getPool();
    await ensureUsersProfileSchema();

    const found = await pool.request().input("email", email).query(`
        SELECT TOP 1 
          UserId, Username, Email, FullName, PasswordHash, RoleId, IsActive, AvatarUrl, PreferredLanguage
        FROM dbo.Users
        WHERE Email=@email
      `);

    const row = found.recordset[0];

    if (!row || row.IsActive !== true) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, row.PasswordHash);
    if (!ok) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 🔥 IMPORTANT: put roleId inside token
    const token = jwt.sign(
      {
        id: row.UserId,
        username: row.Username,
        roleId: row.RoleId,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    setAuthCookie(res, token);

    res.json({
      token,
      user: {
        id: row.UserId,
        username: row.Username,
        email: row.Email,
        fullName: row.FullName,
        roleId: row.RoleId,
        avatarUrl: row.AvatarUrl || null,
        preferredLanguage: row.PreferredLanguage || "en",
      },
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ message: "Server error", detail: err.message });
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const userId = Number(req.user?.id);

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const pool = await getPool();
    await ensureUsersProfileSchema();

    const result = await pool.request().input("userId", userId).query(`
      SELECT TOP 1
        UserId AS id,
        Username AS username,
        Email AS email,
        FullName AS fullName,
        RoleId AS roleId,
        IsActive AS isActive,
        AvatarUrl AS avatarUrl,
        PreferredLanguage AS preferredLanguage
      FROM dbo.Users
      WHERE UserId = @userId AND IsActive = 1
    `);

    const user = result.recordset?.[0];
    if (!user) {
      clearAuthCookie(res);
      return res.status(401).json({ message: "Unauthorized" });
    }

    return res.json({ user });
  } catch (err) {
    console.error("AUTH ME ERROR:", err);
    return res.status(500).json({ message: "Server error", detail: err.message });
  }
});

router.post("/logout", (req, res) => {
  clearAuthCookie(res);
  return res.json({ ok: true });
});

export default router;
