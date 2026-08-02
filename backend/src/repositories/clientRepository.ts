import { asc, and, eq, ilike, inArray, ne, or, sql } from "drizzle-orm";
import { db } from "../db";
import { clients, visits } from "../db/schema";

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

  findVisitSummariesForClientIds(ids: string[]) {
    if (ids.length === 0) return [];

    return db
      .select({
        clientId: visits.clientId,
        lastVisit: sql<Date | null>`max(${visits.visitDate})`,
        totalSpent: sql<number>`cast(coalesce(sum(${visits.totalAmount}), 0) as double precision)`,
      })
      .from(visits)
      .where(and(inArray(visits.clientId, ids), eq(visits.isDeleted, false)))
      .groupBy(visits.clientId);
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
