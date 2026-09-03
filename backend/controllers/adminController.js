const { asyncHandler } = require("../src/lib/asyncHandler.ts");
const { adminService } = require("../src/services/adminService.ts");

exports.getDashboard = asyncHandler(async (req, res) => {
  const dashboard = await adminService.getDashboard(req.user);
  res.json(dashboard);
});

exports.registerSalon = asyncHandler(async (req, res) => {
  const result = await adminService.registerSalon(req.body, req.user);
  res.status(201).json(result);
});

exports.updateSalonStatus = asyncHandler(async (req, res) => {
  const salon = await adminService.updateSalonStatus(req.params.id, req.body, req.user);
  res.json(salon);
});

exports.resetSalonOwnerPassword = asyncHandler(async (req, res) => {
  const owner = await adminService.resetSalonOwnerPassword(req.params.id, req.body, req.user);
  res.json(owner);
});

exports.deleteSalon = asyncHandler(async (req, res) => {
  const result = await adminService.deleteSalon(req.params.id, req.body, req.user);
  res.json(result);
});

exports.createPlatformUser = asyncHandler(async (req, res) => {
  const user = await adminService.createPlatformUser(req.body, req.user);
  res.status(201).json(user);
});

