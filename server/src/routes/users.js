import express from "express";
import bcrypt from "bcryptjs";
import { getPool } from "../db.js";
import authMiddleware from "../middleware/auth.js";
import { ensureUsersProfileSchema } from "../utils/usersSchema.js";

const router = express.Router();

function isStrongPassword(value) {
  const password = String(value || "");
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /\d/.test(password)
  );
}

router.put("/me", authMiddleware, async (req, res) => {
  try {
    const userId = Number(req.user?.id);
    const email = String(req.body?.email || "").trim();
    const fullName = String(req.body?.fullName || req.body?.name || "").trim();
    const avatarUrl = String(req.body?.avatarUrl || "").trim() || null;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!email || !fullName) {
      return res.status(400).json({ message: "Name and email are required." });
    }

    const pool = await getPool();
    await ensureUsersProfileSchema();

    const exists = await pool
      .request()
      .input("userId", userId)
      .input("email", email)
      .query(`
        SELECT TOP 1 UserId
        FROM dbo.Users
        WHERE Email = @email AND UserId <> @userId
      `);

    if (exists.recordset.length > 0) {
      return res.status(409).json({ message: "Email is already in use." });
    }

    const updated = await pool
      .request()
      .input("userId", userId)
      .input("email", email)
      .input("fullName", fullName)
      .input("avatarUrl", avatarUrl).query(`
        UPDATE dbo.Users
        SET Email = @email,
            FullName = @fullName,
            AvatarUrl = @avatarUrl
        WHERE UserId = @userId;

        SELECT
          UserId AS id,
          Username AS username,
          Email AS email,
          FullName AS fullName,
          AvatarUrl AS avatarUrl,
          PreferredLanguage AS preferredLanguage,
          RoleId AS roleId,
          IsActive AS isActive
        FROM dbo.Users
        WHERE UserId = @userId;
      `);

    const user = updated.recordset?.[0];
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.json({ ok: true, user });
  } catch (err) {
    console.error("UPDATE PROFILE ERROR:", err);
    return res.status(500).json({ message: "Server error", detail: err.message });
  }
});

router.put("/language", authMiddleware, async (req, res) => {
  try {
    const userId = Number(req.user?.id);
    const language = String(req.body?.language || "").trim().toLowerCase();

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!["en", "vi"].includes(language)) {
      return res.status(400).json({ message: "Invalid language." });
    }

    const pool = await getPool();
    await ensureUsersProfileSchema();

    const result = await pool
      .request()
      .input("userId", userId)
      .input("language", language)
      .query(`
        UPDATE dbo.Users
        SET PreferredLanguage = @language
        WHERE UserId = @userId;

        SELECT
          UserId AS id,
          Username AS username,
          Email AS email,
          FullName AS fullName,
          AvatarUrl AS avatarUrl,
          PreferredLanguage AS preferredLanguage,
          RoleId AS roleId,
          IsActive AS isActive
        FROM dbo.Users
        WHERE UserId = @userId;
      `);

    const user = result.recordset?.[0];

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.json({ ok: true, user });
  } catch (err) {
    console.error("UPDATE LANGUAGE ERROR:", err);
    return res.status(500).json({ message: "Server error", detail: err.message });
  }
});

router.put("/change-password", authMiddleware, async (req, res) => {
  try {
    const userId = Number(req.user?.id);
    const currentPassword = String(req.body?.currentPassword || "");
    const newPassword = String(req.body?.newPassword || "");

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Missing password fields." });
    }

    if (currentPassword === newPassword) {
      return res
        .status(400)
        .json({ message: "New password must be different from the current password." });
    }

    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({
        message:
          "New password must be at least 8 characters long and include 1 uppercase letter and 1 number.",
      });
    }

    const pool = await getPool();
    await ensureUsersProfileSchema();
    const found = await pool.request().input("userId", userId).query(`
      SELECT TOP 1 UserId, PasswordHash
      FROM dbo.Users
      WHERE UserId = @userId AND IsActive = 1
    `);

    const user = found.recordset?.[0];
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const ok = await bcrypt.compare(currentPassword, user.PasswordHash);
    if (!ok) {
      return res.status(400).json({ message: "Current password is incorrect." });
    }

    const nextHash = await bcrypt.hash(newPassword, 10);
    await pool
      .request()
      .input("userId", userId)
      .input("passwordHash", nextHash).query(`
        UPDATE dbo.Users
        SET PasswordHash = @passwordHash
        WHERE UserId = @userId
      `);

    return res.json({
      ok: true,
      message: "Password changed successfully.",
    });
  } catch (err) {
    console.error("CHANGE PASSWORD ERROR:", err);
    return res.status(500).json({ message: "Server error", detail: err.message });
  }
});

export default router;
