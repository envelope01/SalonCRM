import { and, desc, gte, lte, sql } from "drizzle-orm";
import { db } from "../db";
import { expenses, visits } from "../db/schema";

export const reportRepository = {
  async getSummaryRows(startDate: Date, endDate: Date) {
    const visitDateFilter = and(gte(visits.visitDate, startDate), lte(visits.visitDate, endDate));
    const expenseDateFilter = and(gte(expenses.date, startDate), lte(expenses.date, endDate));

    const [earningsTotals] = await db
      .select({
        totalEarnings: sql`cast(coalesce(sum(${visits.totalAmount}), 0) as double precision)`,
        totalVisits: sql`cast(count(*) as integer)`,
      })
      .from(visits)
      .where(visitDateFilter);

    const [expenseTotals] = await db
      .select({
        totalExpenses: sql`cast(coalesce(sum(${expenses.amount}), 0) as double precision)`,
      })
      .from(expenses)
      .where(expenseDateFilter);

    const earningsByDay = await db
      .select({
        _id: sql`to_char(date_trunc('day', ${visits.visitDate}), 'YYYY-MM-DD')`,
        earnings: sql`cast(coalesce(sum(${visits.totalAmount}), 0) as double precision)`,
      })
      .from(visits)
      .where(visitDateFilter)
      .groupBy(sql`date_trunc('day', ${visits.visitDate})`)
      .orderBy(sql`date_trunc('day', ${visits.visitDate})`);

    const expensesByDay = await db
      .select({
        _id: sql`to_char(date_trunc('day', ${expenses.date}), 'YYYY-MM-DD')`,
        expenses: sql`cast(coalesce(sum(${expenses.amount}), 0) as double precision)`,
      })
      .from(expenses)
      .where(expenseDateFilter)
      .groupBy(sql`date_trunc('day', ${expenses.date})`)
      .orderBy(sql`date_trunc('day', ${expenses.date})`);

    const expensesByCategory = await db
      .select({
        _id: expenses.category,
        total: sql`cast(coalesce(sum(${expenses.amount}), 0) as double precision)`,
      })
      .from(expenses)
      .where(expenseDateFilter)
      .groupBy(expenses.category)
      .orderBy(desc(sql`cast(coalesce(sum(${expenses.amount}), 0) as double precision)`));

    return {
      earningsTotals,
      expenseTotals,
      earningsByDay,
      expensesByDay,
      expensesByCategory,
    };
  },
};
