import { badRequest } from "../lib/httpErrors";
import { optionalDate } from "../lib/validation";
import { reportRepository } from "../repositories/reportRepository";
import { requireSalonId } from "./tenantContext";

function dateLabel(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export const reportService = {
  async getSummary(query: any, user?: any) {
    const { from, to } = query;
    const parsedFrom = optionalDate(from, "From date");
    const parsedTo = optionalDate(to, "To date");
    const startDate = parsedFrom || new Date(0);
    const endDate = parsedTo || new Date();

    if (parsedTo) {
      endDate.setHours(23, 59, 59, 999);
    }

    if (startDate > endDate) {
      throw badRequest("From date cannot be after to date");
    }

    const rows = await reportRepository.getSummaryRows(requireSalonId(user), startDate, endDate);
    const totalEarnings = Number(rows.earningsTotals?.totalEarnings || 0);
    const totalVisits = Number(rows.earningsTotals?.totalVisits || 0);
    const totalExpenses = Number(rows.expenseTotals?.totalExpenses || 0);

    const earningsMap: Record<string, number> = {};
    rows.earningsByDay.forEach((row: any) => {
      earningsMap[row._id] = Number(row.earnings);
    });

    const expensesMap: Record<string, number> = {};
    rows.expensesByDay.forEach((row: any) => {
      expensesMap[row._id] = Number(row.expenses);
    });

    let dayLabels: string[] = [];
    if (parsedFrom) {
      const cursor = new Date(startDate);
      const last = new Date(endDate);

      while (cursor <= last) {
        dayLabels.push(dateLabel(cursor));
        cursor.setDate(cursor.getDate() + 1);
      }
    } else {
      dayLabels = Array.from(new Set([
        ...Object.keys(earningsMap),
        ...Object.keys(expensesMap),
      ])).sort();
    }

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
      from: parsedFrom ? dateLabel(parsedFrom) : null,
      to: parsedTo ? dateLabel(parsedTo) : null,
      totalEarnings,
      totalExpenses,
      netProfit: totalEarnings - totalExpenses,
      totalVisits,
      byDay,
      expensesByCategory: categories,
    };
  },
};
