const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");

// Summary earnings: /api/reports/summary?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get("/summary", reportController.getSummary);

module.exports = router;
