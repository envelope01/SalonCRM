import { formatExpense } from "../db/serializers";
import { badRequest, notFound } from "../lib/httpErrors";
import { optionalDate, optionalText, requireMoney, requireText, requireUuid } from "../lib/validation";
import { expenseRepository } from "../repositories/expenseRepository";
import { requireSalonId } from "./tenantContext";

export const expenseService = {
  async addExpense(body: any, user?: any) {
    const salonId = requireSalonId(user);
    const { date, category, amount, notes } = body;

    if (!category || amount == null) throw badRequest("Category and amount are required");

    const [expense] = await expenseRepository.create({
      date: optionalDate(date, "Date") || new Date(),
      category: requireText(category, "Category", { max: 80 }),
      amount: requireMoney(amount, "Amount"),
      notes: optionalText(notes, { max: 1000 }),
      salonId,
    });

    return formatExpense(expense);
  },

  async getExpenses(query: any, user?: any) {
    const from = optionalDate(query.from, "From date");
    const to = optionalDate(query.to, "To date");
    const rows = await expenseRepository.findByDateRange(requireSalonId(user), from, to);
    return rows.map(formatExpense);
  },

  async deleteExpense(id: string, user?: any) {
    const [deleted] = await expenseRepository.deleteById(requireUuid(id), requireSalonId(user));
    if (!deleted) throw notFound("Expense not found");

    return { message: "Expense deleted" };
  },
};
