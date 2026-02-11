// server/src/middleware/requireAdmin.js
import { getPool } from "../db.js";

export async function requireAdmin(req, res, next) {
  try {
    const userId = req.user?.id ?? req.user?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    // Ưu tiên lấy roleId từ token (nhanh)
    const roleIdFromToken = req.user?.roleId;
    if (Number(roleIdFromToken) === 2) return next();

    // Fallback: kiểm tra DB cho chắc (tránh token thiếu roleId)
    const pool = await getPool();
    const rs = await pool.request().input("id", userId).query(`
      SELECT TOP 1 RoleId
      FROM dbo.Users
      WHERE UserId=@id AND IsActive=1
    `);

    const roleId = rs.recordset?.[0]?.RoleId;
    if (Number(roleId) !== 2) {
      return res.status(403).json({ message: "Admin only" });
    }

    next();
  } catch (e) {
    console.error("requireAdmin error:", e);
    return res.status(500).json({ message: "Server error" });
  }
}

export default requireAdmin;
