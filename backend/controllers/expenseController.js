const { and, desc, eq, gte, lte } = require("drizzle-orm");
const { db } = require("../src/db/index.ts");
const { expenses } = require("../src/db/schema.ts");
const { formatExpense } = require("../src/db/serializers.ts");

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

    const [expense] = await db.insert(expenses).values({
      date: date ? new Date(date) : new Date(),
      category: category.trim(),
      amount: Number(amount),
      notes: notes || "",
    }).returning();

    res.status(201).json(formatExpense(expense));
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

    const filters = [];

    if (from || to) {
      if (from) filters.push(gte(expenses.date, new Date(from)));
      if (to) {
        // include full day of "to" date
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        filters.push(lte(expenses.date, toDate));
      }
    }

    const rows = filters.length > 0
      ? await db
        .select()
        .from(expenses)
        .where(and(...filters))
        .orderBy(desc(expenses.date))
      : await db
        .select()
        .from(expenses)
        .orderBy(desc(expenses.date));
    res.json(rows.map(formatExpense));
  } catch (error) {
    console.error("Error fetching expenses:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// DELETE /api/expenses/:id  (optional but useful)
exports.deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const [deleted] = await db
      .delete(expenses)
      .where(eq(expenses.id, id))
      .returning();

    if (!deleted) {
      return res.status(404).json({ message: "Expense not found" });
    }

    res.json({ message: "Expense deleted" });
  } catch (error) {
    console.error("Error deleting expense:", error);
    res.status(500).json({ message: "Server error" });
  }
};
