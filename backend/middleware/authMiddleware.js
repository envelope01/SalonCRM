const { authService } = require("../src/services/authService.ts");
const { logger } = require("../src/lib/logger.ts");

exports.authMiddleware = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Missing auth token" });
    }

    const token = auth.split(" ")[1];
    req.user = await authService.getUserFromToken(token);
    next();
  } catch (err) {
    logger.warn("auth_rejected", {
      requestId: req.requestId,
      path: req.originalUrl || req.url,
      error: err,
    });
    return res.status(401).json({ message: "Unauthorized" });
  }
};

exports.requireRoles = (...allowedRoles) => {
  const allowed = new Set(allowedRoles);

  return (req, res, next) => {
    const role = req.user?.role;

    if (!role || !allowed.has(role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    next();
  };
};
