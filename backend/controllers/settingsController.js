const { asyncHandler } = require("../src/lib/asyncHandler.ts");
const { settingsService } = require("../src/services/settingsService.ts");

exports.getSettings = asyncHandler(async (req, res) => {
  const settings = await settingsService.getSettings(req.user);
  res.json(settings);
});

exports.updateSettings = asyncHandler(async (req, res) => {
  const settings = await settingsService.updateSettings(req.body, req.user);
  res.json(settings);
});
