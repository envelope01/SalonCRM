// backend/controllers/reportController.js
const { and, desc, gte, lte, sql } = require("drizzle-orm");
const { db } = require("../src/db/index.ts");
const { expenses, visits } = require("../src/db/schema.ts");

exports.getSummary = async (req, res) => {
  try {
    let { from, to } = req.query;

    // If no dates provided, use full range (epoch → now)
    let startDate, endDate;
    if (!from && !to) {
      startDate = new Date(0);
      endDate = new Date();
    } else {
      // when filtering, both from and to are required
      if (!from || !to) {
        return res.status(400).json({ message: "Both 'from' and 'to' are required when filtering by date." });
      }
      startDate = new Date(from);
      endDate = new Date(to);
      endDate.setHours(23, 59, 59, 999); // include full end day
    }

    const visitDateFilter = and(gte(visits.visitDate, startDate), lte(visits.visitDate, endDate));
    const expenseDateFilter = and(gte(expenses.date, startDate), lte(expenses.date, endDate));

    // --- Totals & counts ---
    const [earningsTotals] = await db
      .select({
        totalEarnings: sql`cast(coalesce(sum(${visits.totalAmount}), 0) as double precision)`,
        totalVisits: sql`cast(count(*) as integer)`,
      })
      .from(visits)
      .where(visitDateFilter);

    const totalEarnings = earningsTotals.totalEarnings || 0;
    const totalVisits = earningsTotals.totalVisits || 0;

    const [expenseTotals] = await db
      .select({
        totalExpenses: sql`cast(coalesce(sum(${expenses.amount}), 0) as double precision)`,
      })
      .from(expenses)
      .where(expenseDateFilter);

    const totalExpenses = expenseTotals.totalExpenses || 0;

    // --- Earnings by day ---
    const earningsByDay = await db
      .select({
        _id: sql`to_char(date_trunc('day', ${visits.visitDate}), 'YYYY-MM-DD')`,
        earnings: sql`cast(coalesce(sum(${visits.totalAmount}), 0) as double precision)`,
      })
      .from(visits)
      .where(visitDateFilter)
      .groupBy(sql`date_trunc('day', ${visits.visitDate})`)
      .orderBy(sql`date_trunc('day', ${visits.visitDate})`);

    // --- Expenses by day ---
    const expensesByDay = await db
      .select({
        _id: sql`to_char(date_trunc('day', ${expenses.date}), 'YYYY-MM-DD')`,
        expenses: sql`cast(coalesce(sum(${expenses.amount}), 0) as double precision)`,
      })
      .from(expenses)
      .where(expenseDateFilter)
      .groupBy(sql`date_trunc('day', ${expenses.date})`)
      .orderBy(sql`date_trunc('day', ${expenses.date})`);

    // --- Expenses by category ---
    const expensesByCategory = await db
      .select({
        _id: expenses.category,
        total: sql`cast(coalesce(sum(${expenses.amount}), 0) as double precision)`,
      })
      .from(expenses)
      .where(expenseDateFilter)
      .groupBy(expenses.category)
      .orderBy(desc(sql`cast(coalesce(sum(${expenses.amount}), 0) as double precision)`));

    // Build a contiguous list of dates between startDate and endDate (YYYY-MM-DD)
    const dayLabels = [];
    const cursor = new Date(startDate);
    const last = new Date(endDate);
    while (cursor <= last) {
      const y = cursor.getFullYear();
      const m = String(cursor.getMonth() + 1).padStart(2, "0");
      const d = String(cursor.getDate()).padStart(2, "0");
      dayLabels.push(`${y}-${m}-${d}`);
      cursor.setDate(cursor.getDate() + 1);
    }

    const earningsMap = {};
    earningsByDay.forEach(r => { earningsMap[r._id] = r.earnings; });
    const expensesMap = {};
    expensesByDay.forEach(r => { expensesMap[r._id] = r.expenses; });

    const byDay = dayLabels.map(label => ({
      date: label,
      earnings: earningsMap[label] || 0,
      expenses: expensesMap[label] || 0,
    }));

    // Format categories
    const categories = expensesByCategory.map(r => ({ category: r._id || "Uncategorized", total: r.total }));

    return res.json({
      from: from || null,
      to: to || null,
      totalEarnings,
      totalExpenses,
      netProfit: totalEarnings - totalExpenses,
      totalVisits,
      byDay,
      expensesByCategory: categories,
    });
  } catch (error) {
    console.error("Error generating summary:", error);
    res.status(500).json({ message: "Server error" });
  }
};
