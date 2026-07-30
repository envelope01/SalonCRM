import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { formatAuthUser } from "../db/serializers";
import { env } from "../config/env";
import { badRequest, unauthorized } from "../lib/httpErrors";
import { optionalText, requireEmail, requirePassword } from "../lib/validation";
import { userRepository } from "../repositories/userRepository";

const JWT_SECRET = env.JWT_SECRET;

export const authService = {
  async register(body: any) {
    const { email, password, name, role } = body;
    if (!email || !password) throw badRequest("Email and password required");

    const normalizedEmail = requireEmail(email);
    const validatedPassword = requirePassword(password);
    const [existing] = await userRepository.findByEmail(normalizedEmail);
    if (existing) throw badRequest("User already exists");

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(validatedPassword, salt);

    await userRepository.create({
      email: normalizedEmail,
      name: optionalText(name || "Salon Owner", { max: 120 }),
      passwordHash: hash,
      role: role || "staff",
    });

    return { message: "User created" };
  },

  async login(body: any) {
    const { email, password } = body;
    if (!email || !password) throw badRequest("Email and password required");

    const [user] = await userRepository.findByEmail(requireEmail(email));
    if (!user) throw badRequest("Invalid email credentials");

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw badRequest("Invalid password credentials");

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    return {
      token,
      user: formatAuthUser(user),
    };
  },

  async getUserFromToken(token: string) {
    const payload = jwt.verify(token, JWT_SECRET) as { userId?: string };
    if (!payload || !payload.userId) throw unauthorized("Invalid token");

    const [user] = await userRepository.findAuthUserById(payload.userId);
    if (!user) throw unauthorized("User not found");

    return formatAuthUser(user);
  },
};
