import { asc, eq } from "drizzle-orm";
import { db } from "../db";
import { services } from "../db/schema";

export const serviceRepository = {
  create(values: { name: string; category: string; price: number }) {
    return db.insert(services).values(values).returning();
  },

  findAll() {
    return db.select().from(services).orderBy(asc(services.name));
  },

  findById(id: string) {
    return db.select().from(services).where(eq(services.id, id)).limit(1);
  },

  findByName(name: string) {
    return db.select().from(services).where(eq(services.name, name)).limit(1);
  },

  updateById(id: string, updates: Record<string, unknown>) {
    return db
      .update(services)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(services.id, id))
      .returning();
  },

  deleteById(id: string) {
    return db.delete(services).where(eq(services.id, id)).returning();
  },
};
