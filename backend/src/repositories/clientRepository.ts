import { asc, and, eq, ilike, ne, or } from "drizzle-orm";
import { db } from "../db";
import { clients } from "../db/schema";

export const clientRepository = {
  create(values: { name: string; phone: string | null; notes: string }) {
    return db.insert(clients).values(values).returning();
  },

  findActive() {
    return db
      .select()
      .from(clients)
      .where(eq(clients.isActive, true))
      .orderBy(asc(clients.name));
  },

  findById(id: string) {
    return db
      .select()
      .from(clients)
      .where(eq(clients.id, id))
      .limit(1);
  },

  findActiveByPhone(phone: string) {
    return db
      .select()
      .from(clients)
      .where(and(eq(clients.phone, phone), eq(clients.isActive, true)))
      .limit(1);
  },

  findActiveByPhoneExceptId(phone: string, id: string) {
    return db
      .select()
      .from(clients)
      .where(and(
        eq(clients.phone, phone),
        eq(clients.isActive, true),
        ne(clients.id, id),
      ))
      .limit(1);
  },

  searchActive(query: string) {
    const term = `%${query}%`;

    return db
      .select()
      .from(clients)
      .where(and(
        eq(clients.isActive, true),
        or(ilike(clients.name, term), ilike(clients.phone, term)),
      ))
      .limit(10);
  },

  updateById(id: string, updates: Record<string, unknown>) {
    return db
      .update(clients)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(clients.id, id))
      .returning();
  },

  deactivateById(id: string) {
    return db
      .update(clients)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(clients.id, id))
      .returning();
  },
};
