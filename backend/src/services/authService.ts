import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { formatAuthUser } from "../db/serializers";
import { env } from "../config/env";
import { badRequest, unauthorized } from "../lib/httpErrors";
import { optionalText, requireEmail, requirePassword } from "../lib/validation";
import { userRepository } from "../repositories/userRepository";

const JWT_SECRET = env.JWT_SECRET;

function signUserToken(user: { id: string; email: string; role: string; salonId?: string | null }) {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role, salonId: user.salonId ?? null },
    JWT_SECRET,
    { expiresIn: "7d" },
  );
}

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

    const token = signUserToken(user);

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

  async changePassword(body: any, user?: any) {
    if (!user?.id) throw unauthorized("Not authenticated");

    const currentPassword = requirePassword(body.currentPassword);
    const newPassword = requirePassword(body.newPassword);
    if (currentPassword === newPassword) {
      throw badRequest("New password must be different from current password");
    }

    const [authUser] = await userRepository.findByEmail(user.email);
    if (!authUser || authUser.id !== user.id) throw unauthorized("User not found");

    const ok = await bcrypt.compare(currentPassword, authUser.passwordHash);
    if (!ok) throw badRequest("Current password is incorrect");

    const passwordHash = await bcrypt.hash(newPassword, 10);
    const [updated] = await userRepository.updatePassword(user.id, {
      passwordHash,
      mustChangePassword: false,
    });

    return {
      user: formatAuthUser({
        ...updated,
        salonName: authUser.salonName,
      }),
    };
  },
};
