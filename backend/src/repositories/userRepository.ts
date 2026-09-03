import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "../db";
import { salons, users } from "../db/schema";

export const userRepository = {
  findByEmail(email: string) {
    return db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        passwordHash: users.passwordHash,
        mustChangePassword: users.mustChangePassword,
        role: users.role,
        salonId: users.salonId,
        salonName: salons.name,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        version: users.version,
      })
      .from(users)
      .leftJoin(salons, eq(users.salonId, salons.id))
      .where(eq(users.email, email))
      .limit(1);
  },

  findAuthUserById(id: string) {
    return db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        salonId: users.salonId,
        salonName: salons.name,
        mustChangePassword: users.mustChangePassword,
      })
      .from(users)
      .leftJoin(salons, eq(users.salonId, salons.id))
      .where(eq(users.id, id))
      .limit(1);
  },

  create(values: {
    email: string;
    name: string;
    passwordHash: string;
    mustChangePassword?: boolean;
    role: "owner" | "staff" | "admin" | "dev";
    salonId?: string | null;
  }) {
    return db.insert(users).values(values).returning();
  },

  updatePassword(id: string, values: { passwordHash: string; mustChangePassword?: boolean }) {
    return db
      .update(users)
      .set({
        passwordHash: values.passwordHash,
        mustChangePassword: values.mustChangePassword ?? false,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
  },

  findSalonOwner(salonId: string) {
    return db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        salonId: users.salonId,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(and(eq(users.salonId, salonId), eq(users.role, "owner")))
      .orderBy(asc(users.createdAt))
      .limit(1);
  },

  findPlatformUsers() {
    return db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        salonId: users.salonId,
        createdAt: users.createdAt,
        mustChangePassword: users.mustChangePassword,
      })
      .from(users)
      .where(inArray(users.role, ["admin", "dev"]))
      .orderBy(asc(users.name));
  },

  findTenantStaff(salonId: string) {
    return db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        salonId: users.salonId,
        createdAt: users.createdAt,
        mustChangePassword: users.mustChangePassword,
      })
      .from(users)
      .where(and(eq(users.salonId, salonId), inArray(users.role, ["owner", "staff"])))
      .orderBy(asc(users.role), asc(users.name));
  },
};
