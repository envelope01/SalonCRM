import { and, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "../db";
import { expenses } from "../db/schema";

export const expenseRepository = {
  create(values: { date: Date; category: string; amount: number; notes: string; salonId: string }) {
    return db.insert(expenses).values(values).returning();
  },

  findByDateRange(salonId: string, from?: Date, to?: Date) {
    const filters = [eq(expenses.salonId, salonId)];

    if (from) filters.push(gte(expenses.date, from));
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      filters.push(lte(expenses.date, toDate));
    }

    return db.select().from(expenses).where(and(...filters)).orderBy(desc(expenses.date));
  },

  deleteById(id: string, salonId: string) {
    return db.delete(expenses).where(and(eq(expenses.id, id), eq(expenses.salonId, salonId))).returning();
  },
};
