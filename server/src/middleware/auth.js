// server/src/middleware/auth.js
import jwt from "jsonwebtoken";
import { getTokenFromRequest } from "../utils/authCookie.js";

export function authMiddleware(req, res, next) {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      return res.status(401).json({ message: "Missing token" });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Support: { id } (our current), { userId }, { sub }
    const userId = payload.id ?? payload.userId ?? payload.sub;
    if (!userId) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    // Normalize user object for later middlewares/routes
    req.user = {
      id: Number(userId),
      username: payload.username ?? null,
      roleId: payload.roleId ?? null,
    };

    return next();
  } catch (e) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

export default authMiddleware;
