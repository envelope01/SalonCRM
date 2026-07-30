const { asyncHandler } = require("../src/lib/asyncHandler.ts");
const { reportService } = require("../src/services/reportService.ts");

exports.getSummary = asyncHandler(async (req, res) => {
  const summary = await reportService.getSummary(req.query);
  res.json(summary);
});
