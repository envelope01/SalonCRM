import { badRequest } from "../lib/httpErrors";
import { optionalDate } from "../lib/validation";
import { reportRepository } from "../repositories/reportRepository";

function dateLabel(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export const reportService = {
  async getSummary(query: any) {
    const { from, to } = query;
    let startDate: Date;
    let endDate: Date;

    if (!from && !to) {
      startDate = new Date(0);
      endDate = new Date();
    } else {
      if (!from || !to) {
        throw badRequest("Both 'from' and 'to' are required when filtering by date.");
      }

      startDate = optionalDate(from, "From date")!;
      endDate = optionalDate(to, "To date")!;
      endDate.setHours(23, 59, 59, 999);
    }

    const rows = await reportRepository.getSummaryRows(startDate, endDate);
    const totalEarnings = Number(rows.earningsTotals?.totalEarnings || 0);
    const totalVisits = Number(rows.earningsTotals?.totalVisits || 0);
    const totalExpenses = Number(rows.expenseTotals?.totalExpenses || 0);

    const dayLabels = [];
    const cursor = new Date(startDate);
    const last = new Date(endDate);

    while (cursor <= last) {
      dayLabels.push(dateLabel(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }

    const earningsMap: Record<string, number> = {};
    rows.earningsByDay.forEach((row: any) => {
      earningsMap[row._id] = Number(row.earnings);
    });

    const expensesMap: Record<string, number> = {};
    rows.expensesByDay.forEach((row: any) => {
      expensesMap[row._id] = Number(row.expenses);
    });

    const byDay = dayLabels.map((label) => ({
      date: label,
      earnings: earningsMap[label] || 0,
      expenses: expensesMap[label] || 0,
    }));

    const categories = rows.expensesByCategory.map((row: any) => ({
      category: row._id || "Uncategorized",
      total: Number(row.total),
    }));

    return {
      from: from || null,
      to: to || null,
      totalEarnings,
      totalExpenses,
      netProfit: totalEarnings - totalExpenses,
      totalVisits,
      byDay,
      expensesByCategory: categories,
    };
  },
};
