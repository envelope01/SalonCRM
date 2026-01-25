// backend/controllers/reportController.js
const Visit = require("../models/Visit");
const Expense = require("../models/Expense");

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

    // --- Totals & counts ---
    const earningsAgg = await Visit.aggregate([
      { $match: { visitDate: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: null, totalEarnings: { $sum: "$totalAmount" }, totalVisits: { $sum: 1 } } }
    ]);
    const totalEarnings = (earningsAgg[0] && earningsAgg[0].totalEarnings) || 0;
    const totalVisits = (earningsAgg[0] && earningsAgg[0].totalVisits) || 0;

    const expensesAgg = await Expense.aggregate([
      { $match: { date: { $gte: startDate, $lte: endDate } } },
      { $group: { _id: null, totalExpenses: { $sum: "$amount" } } }
    ]);
    const totalExpenses = (expensesAgg[0] && expensesAgg[0].totalExpenses) || 0;

    // --- Earnings by day ---
    const earningsByDay = await Visit.aggregate([
      { $match: { visitDate: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$visitDate" } },
          earnings: { $sum: "$totalAmount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // --- Expenses by day ---
    const expensesByDay = await Expense.aggregate([
      { $match: { date: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          expenses: { $sum: "$amount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // --- Expenses by category ---
    const expensesByCategory = await Expense.aggregate([
      { $match: { date: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: "$category",
          total: { $sum: "$amount" },
        },
      },
      { $sort: { total: -1 } },
    ]);

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