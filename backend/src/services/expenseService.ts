import { formatExpense } from "../db/serializers";
import { badRequest, notFound } from "../lib/httpErrors";
import { optionalDate, optionalText, requireMoney, requireText, requireUuid } from "../lib/validation";
import { expenseRepository } from "../repositories/expenseRepository";

export const expenseService = {
  async addExpense(body: any) {
    const { date, category, amount, notes } = body;

    if (!category || amount == null) throw badRequest("Category and amount are required");

    const [expense] = await expenseRepository.create({
      date: optionalDate(date, "Date") || new Date(),
      category: requireText(category, "Category", { max: 80 }),
      amount: requireMoney(amount, "Amount"),
      notes: optionalText(notes, { max: 1000 }),
    });

    return formatExpense(expense);
  },

  async getExpenses(query: any) {
    const from = optionalDate(query.from, "From date");
    const to = optionalDate(query.to, "To date");
    const rows = await expenseRepository.findByDateRange(from, to);
    return rows.map(formatExpense);
  },

  async deleteExpense(id: string) {
    const [deleted] = await expenseRepository.deleteById(requireUuid(id));
    if (!deleted) throw notFound("Expense not found");

    return { message: "Expense deleted" };
  },
};
