import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { getPool } from "../db.js";

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
        OUTPUT INSERTED.UserId, INSERTED.Username, INSERTED.Email, INSERTED.FullName, INSERTED.RoleId
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

    const found = await pool.request().input("email", email).query(`
        SELECT TOP 1 
          UserId, Username, Email, PasswordHash, RoleId, IsActive
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

    res.json({
      token,
      user: {
        id: row.UserId,
        username: row.Username,
        email: row.Email,
        roleId: row.RoleId,
      },
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ message: "Server error", detail: err.message });
  }
});

export default router;
