import { and, asc, eq } from "drizzle-orm";
import { db } from "../db";
import { services } from "../db/schema";

export const serviceRepository = {
  create(values: { name: string; category: string; price: number; salonId: string }) {
    return db.insert(services).values(values).returning();
  },

  findAll(salonId: string) {
    return db.select().from(services).where(eq(services.salonId, salonId)).orderBy(asc(services.name));
  },

  findById(id: string, salonId: string) {
    return db.select().from(services).where(and(eq(services.id, id), eq(services.salonId, salonId))).limit(1);
  },

  findByName(name: string, salonId: string) {
    return db.select().from(services).where(and(eq(services.name, name), eq(services.salonId, salonId))).limit(1);
  },

  updateById(id: string, updates: Record<string, unknown>, salonId: string) {
    return db
      .update(services)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(services.id, id), eq(services.salonId, salonId)))
      .returning();
  },

  deleteById(id: string, salonId: string) {
    return db.delete(services).where(and(eq(services.id, id), eq(services.salonId, salonId))).returning();
  },
};
