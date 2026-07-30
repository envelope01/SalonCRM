const { asyncHandler } = require("../src/lib/asyncHandler.ts");
const { visitService } = require("../src/services/visitService.ts");

exports.createVisit = asyncHandler(async (req, res) => {
  const visit = await visitService.createVisit(req.body);
  res.status(201).json(visit);
});

exports.getClientVisits = asyncHandler(async (req, res) => {
  const visits = await visitService.getClientVisits(req.params.clientId);
  res.json(visits);
});

exports.deleteVisit = asyncHandler(async (req, res) => {
  const result = await visitService.deleteVisit(req.params.visitId);
  res.json(result);
});
