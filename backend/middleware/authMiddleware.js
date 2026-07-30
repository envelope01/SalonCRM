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
