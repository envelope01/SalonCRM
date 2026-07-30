const jwt = require("jsonwebtoken");
const { eq } = require("drizzle-orm");
const { db } = require("../src/db/index.ts");
const { users } = require("../src/db/schema.ts");
const { formatAuthUser } = require("../src/db/serializers.ts");
const { env } = require("../src/config/env.ts");
const JWT_SECRET = env.JWT_SECRET;

exports.authMiddleware = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith("Bearer ")) return res.status(401).json({ message: "Missing auth token" });

    const token = auth.split(" ")[1];
    const payload = jwt.verify(token, JWT_SECRET);
    if (!payload || !payload.userId) return res.status(401).json({ message: "Invalid token" });

    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);

    if (!user) return res.status(401).json({ message: "User not found" });

    req.user = formatAuthUser(user);
    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    return res.status(401).json({ message: "Unauthorized" });
  }
};
