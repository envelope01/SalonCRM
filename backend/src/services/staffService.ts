import bcrypt from "bcryptjs";
import { badRequest } from "../lib/httpErrors";
import { optionalText, requireEmail, requirePassword } from "../lib/validation";
import { userRepository } from "../repositories/userRepository";
import { requireSalonId } from "./tenantContext";

function formatStaffUser(row: any) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    createdAt: row.createdAt,
    status: "active",
  };
}

export const staffService = {
  async listStaff(user?: any) {
    const salonId = requireSalonId(user);
    const rows = await userRepository.findTenantStaff(salonId);
    return rows.map(formatStaffUser);
  },

  async createStaff(body: any, user?: any) {
    const salonId = requireSalonId(user);
    const email = requireEmail(body.email);
    const [existing] = await userRepository.findByEmail(email);
    if (existing) throw badRequest("Staff email is already registered");

    const passwordHash = await bcrypt.hash(requirePassword(body.password || body.temporaryPassword), 10);
    const [created] = await userRepository.create({
      email,
      name: optionalText(body.name || "Staff Member", { max: 120 }) || "Staff Member",
      passwordHash,
      role: "staff",
      salonId,
      mustChangePassword: true,
    });

    return formatStaffUser(created);
  },
};
