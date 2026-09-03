import { forbidden } from "../lib/httpErrors";

type AuthUser = {
  role?: string;
  salonId?: string | null;
};

export function requireSalonId(user: AuthUser | undefined | null) {
  if (!user?.salonId) {
    throw forbidden("No salon is assigned to this user");
  }

  return user.salonId;
}

export function isAdminDashboardUser(user: AuthUser | undefined | null) {
  return user?.role === "admin" || user?.role === "dev";
}
