import bcrypt from "bcryptjs";
import { formatAuthUser, formatSalon } from "../db/serializers";
import { badRequest, forbidden } from "../lib/httpErrors";
import { optionalText, requireEmail, requirePassword, requireText, requireUuid } from "../lib/validation";
import { salonRepository } from "../repositories/salonRepository";
import { userRepository } from "../repositories/userRepository";
import { isAdminDashboardUser } from "./tenantContext";

const platformRoles = new Set(["admin", "dev"]);

function requireAdminDashboardAccess(user?: any) {
  if (!isAdminDashboardUser(user)) {
    throw forbidden("Platform admin access is required");
  }
}

function buildSummary(salons: ReturnType<typeof formatSalon>[]) {
  return salons.reduce(
    (summary, salon) => ({
      totalSalons: summary.totalSalons + 1,
      activeSalons: summary.activeSalons + (salon.isActive ? 1 : 0),
      inactiveSalons: summary.inactiveSalons + (salon.isActive ? 0 : 1),
    }),
    {
      totalSalons: 0,
      activeSalons: 0,
      inactiveSalons: 0,
    },
  );
}

function formatPlatformUser(row: any) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    createdAt: row.createdAt,
    status: "active",
  };
}

export const adminService = {
  async getDashboard(user?: any) {
    requireAdminDashboardAccess(user);

    const rows = await salonRepository.listWithStats();
    const salons = rows.map(formatSalon);
    const platformUsers = (await userRepository.findPlatformUsers()).map(formatPlatformUser);

    return {
      summary: buildSummary(salons),
      salons,
      platformUsers,
    };
  },

  async registerSalon(body: any, user?: any) {
    requireAdminDashboardAccess(user);

    const salonName = requireText(body.name, "Salon name", { max: 160 });
    const isActive = body.isActive !== undefined ? Boolean(body.isActive) : true;
    const ownerEmail = requireEmail(body.ownerEmail);
    const ownerName = optionalText(body.ownerName || "Salon Owner", { max: 120 }) || "Salon Owner";
    const ownerPassword = requirePassword(body.ownerPassword);

    const [existingUser] = await userRepository.findByEmail(ownerEmail);
    if (existingUser) {
      throw badRequest("Owner email is already registered");
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(ownerPassword, salt);
    const result = await salonRepository.createWithOwner({
      name: salonName,
      plan: "basic",
      isActive,
      owner: {
        email: ownerEmail,
        name: ownerName,
        passwordHash,
        mustChangePassword: true,
        role: "owner",
      },
    });

    return {
      salon: formatSalon(result.salon),
      owner: formatAuthUser(result.owner),
    };
  },

  async updateSalonStatus(id: string, body: any, user?: any) {
    requireAdminDashboardAccess(user);

    const [salon] = await salonRepository.updateStatus(requireUuid(id), Boolean(body.isActive));
    if (!salon) throw badRequest("Salon not found");

    return formatSalon(salon);
  },

  async deleteSalon(id: string, body: any, user?: any) {
    requireAdminDashboardAccess(user);

    const salonId = requireUuid(id);
    const [salon] = await salonRepository.findById(salonId);
    if (!salon) throw badRequest("Salon not found");

    const expectedConfirmation = `DELETE ${salon.name}`;
    if (String(body?.confirmation || "").trim() !== expectedConfirmation) {
      throw badRequest(`Type "${expectedConfirmation}" to delete this salon`);
    }

    const counts = await salonRepository.deleteAllData(salonId);

    return {
      deletedSalon: {
        id: salon.id,
        name: salon.name,
      },
      counts,
    };
  },

  async createPlatformUser(body: any, user?: any) {
    requireAdminDashboardAccess(user);

    const role = String(body.role || "").trim().toLowerCase();
    if (!platformRoles.has(role)) {
      throw badRequest("Platform user role must be admin or dev");
    }
    const email = requireEmail(body.email);
    const [existingUser] = await userRepository.findByEmail(email);
    if (existingUser) {
      throw badRequest("User email is already registered");
    }

    const passwordHash = await bcrypt.hash(requirePassword(body.temporaryPassword || body.password), 10);

    const [created] = await userRepository.create({
      email,
      name: optionalText(body.name || "Platform User", { max: 120 }) || "Platform User",
      passwordHash,
      role: role as "admin" | "dev",
      salonId: null,
      mustChangePassword: true,
    });

    return formatPlatformUser(created);
  },

  async resetSalonOwnerPassword(id: string, body: any, user?: any) {
    requireAdminDashboardAccess(user);

    const salonId = requireUuid(id);
    const [salon] = await salonRepository.findById(salonId);
    if (!salon) throw badRequest("Salon not found");

    const [owner] = await userRepository.findSalonOwner(salonId);
    if (!owner) throw badRequest("Salon owner not found");

    const passwordHash = await bcrypt.hash(requirePassword(body.temporaryPassword || body.password), 10);
    const [updated] = await userRepository.updatePassword(owner.id, {
      passwordHash,
      mustChangePassword: true,
    });

    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      mustChangePassword: updated.mustChangePassword,
    };
  },

};
