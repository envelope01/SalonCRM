const { asyncHandler } = require("../src/lib/asyncHandler.ts");
const { staffService } = require("../src/services/staffService.ts");

exports.listStaff = asyncHandler(async (req, res) => {
  const staff = await staffService.listStaff(req.user);
  res.json(staff);
});

exports.createStaff = asyncHandler(async (req, res) => {
  const staff = await staffService.createStaff(req.body, req.user);
  res.status(201).json(staff);
});
