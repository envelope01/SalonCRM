const express = require("express");
const router = express.Router();
const expenseController = require("../controllers/expenseController");

// Add expense
router.post("/", expenseController.addExpense);

// Get expenses (optionally by date range)
router.get("/", expenseController.getExpenses);

// Delete expense
router.delete("/:id", expenseController.deleteExpense);

module.exports = router;
