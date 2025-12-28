const Expense = require("../models/Expense");

// POST /api/expenses
// Body: { date (optional), category, amount, notes (optional) }
exports.addExpense = async (req, res) => {
  try {
    const { date, category, amount, notes } = req.body;

    if (!category || amount == null) {
      return res
        .status(400)
        .json({ message: "Category and amount are required" });
    }

    const expense = new Expense({
      date: date ? new Date(date) : new Date(),
      category: category.trim(),
      amount,
      notes: notes || "",
    });

    await expense.save();
    res.status(201).json(expense);
  } catch (error) {
    console.error("Error adding expense:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/expenses
// Optional query: ?from=2025-12-01&to=2025-12-08
exports.getExpenses = async (req, res) => {
  try {
    const { from, to } = req.query;

    const filter = {};

    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) {
        // include full day of "to" date
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        filter.date.$lte = toDate;
      }
    }

    const expenses = await Expense.find(filter).sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    console.error("Error fetching expenses:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// DELETE /api/expenses/:id  (optional but useful)
exports.deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Expense.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.json({ message: "Expense deleted" });
  } catch (error) {
    console.error("Error deleting expense:", error);
    res.status(500).json({ message: "Server error" });
  }
};
