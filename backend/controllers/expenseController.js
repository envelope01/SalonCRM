const { asyncHandler } = require("../src/lib/asyncHandler.ts");
const { expenseService } = require("../src/services/expenseService.ts");

exports.addExpense = asyncHandler(async (req, res) => {
  const expense = await expenseService.addExpense(req.body);
  res.status(201).json(expense);
});

exports.getExpenses = asyncHandler(async (req, res) => {
  const expenses = await expenseService.getExpenses(req.query);
  res.json(expenses);
});

exports.deleteExpense = asyncHandler(async (req, res) => {
  const result = await expenseService.deleteExpense(req.params.id);
  res.json(result);
});
