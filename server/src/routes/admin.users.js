// server/src/routes/admin.users.js
import express from "express";
import { getPool } from "../db.js";
import authMiddleware from "../middleware/auth.js";
import { requireAdmin } from "../middleware/requireAdmin.js";

const router = express.Router();

/**
 * GET /api/v1/admin/users
 * List users (không trả PasswordHash)
 */
router.get("/users", authMiddleware, requireAdmin, async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT
        UserId AS id,
        Username AS username,
        Email AS email,
        FullName AS fullName,
        RoleId AS roleId,
        IsActive AS isActive,
        CreatedAt AS createdAt
      FROM dbo.Users
      ORDER BY UserId DESC
    `);

    res.json({ data: result.recordset });
  } catch (err) {
    console.error("ADMIN USERS LIST ERROR:", err);
    res.status(500).json({ message: "Server error", detail: err.message });
  }
});

/**
 * PATCH /api/v1/admin/users/:id/disable
 * Soft delete => IsActive = 0
 */
router.patch(
  "/users/:id/disable",
  authMiddleware,
  requireAdmin,
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isFinite(id))
        return res.status(400).json({ message: "Invalid id" });

      if (Number(req.user.id) === id) {
        return res.status(400).json({ message: "You cannot disable yourself" });
      }

      const pool = await getPool();
      const updated = await pool.request().input("id", id).query(`
      UPDATE dbo.Users
      SET IsActive = 0
      WHERE UserId = @id;

      SELECT
        UserId AS id, Username AS username, Email AS email,
        RoleId AS roleId, IsActive AS isActive
      FROM dbo.Users
      WHERE UserId = @id;
    `);

      const user = updated.recordset?.[0];
      if (!user) return res.status(404).json({ message: "User not found" });

      res.json({ ok: true, user });
    } catch (err) {
      console.error("ADMIN DISABLE USER ERROR:", err);
      res.status(500).json({ message: "Server error", detail: err.message });
    }
  },
);

/**
 * PATCH /api/v1/admin/users/:id/enable
 */
router.patch(
  "/users/:id/enable",
  authMiddleware,
  requireAdmin,
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isFinite(id))
        return res.status(400).json({ message: "Invalid id" });

      const pool = await getPool();
      const updated = await pool.request().input("id", id).query(`
      UPDATE dbo.Users
      SET IsActive = 1
      WHERE UserId = @id;

      SELECT
        UserId AS id, Username AS username, Email AS email,
        RoleId AS roleId, IsActive AS isActive
      FROM dbo.Users
      WHERE UserId = @id;
    `);

      const user = updated.recordset?.[0];
      if (!user) return res.status(404).json({ message: "User not found" });

      res.json({ ok: true, user });
    } catch (err) {
      console.error("ADMIN ENABLE USER ERROR:", err);
      res.status(500).json({ message: "Server error", detail: err.message });
    }
  },
);

export default router;
