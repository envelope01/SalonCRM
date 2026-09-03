const { asyncHandler } = require("../src/lib/asyncHandler.ts");
const { authService } = require("../src/services/authService.ts");

exports.register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  res.status(201).json(result);
});

exports.login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  res.json(result);
});

exports.me = asyncHandler(async (req, res) => {
  if (!req.user) return res.status(401).json({ message: "Not authenticated" });
  res.json({ user: req.user });
});

exports.changePassword = asyncHandler(async (req, res) => {
  const result = await authService.changePassword(req.body, req.user);
  res.json(result);
});
