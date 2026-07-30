import { and, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "../db";
import { expenses } from "../db/schema";

export const expenseRepository = {
  create(values: { date: Date; category: string; amount: number; notes: string }) {
    return db.insert(expenses).values(values).returning();
  },

  findByDateRange(from?: Date, to?: Date) {
    const filters = [];

    if (from) filters.push(gte(expenses.date, from));
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      filters.push(lte(expenses.date, toDate));
    }

    return filters.length > 0
      ? db.select().from(expenses).where(and(...filters)).orderBy(desc(expenses.date))
      : db.select().from(expenses).orderBy(desc(expenses.date));
  },

  deleteById(id: string) {
    return db.delete(expenses).where(eq(expenses.id, id)).returning();
  },
};
