const jwt = require("jsonwebtoken");
const User = require("../models/User");
const JWT_SECRET = process.env.JWT_SECRET || "change_this_super_secret";

exports.authMiddleware = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Bearer ")) return res.status(401).json({ message: "Missing auth token" });

    const token = auth.split(" ")[1];
    const payload = jwt.verify(token, JWT_SECRET);
    if (!payload || !payload.userId) return res.status(401).json({ message: "Invalid token" });

    const user = await User.findById(payload.userId).select("-passwordHash");
    if (!user) return res.status(401).json({ message: "User not found" });

    req.user = { id: user._id, email: user.email, name: user.name, role: user.role };
    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    return res.status(401).json({ message: "Unauthorized" });
  }
};
