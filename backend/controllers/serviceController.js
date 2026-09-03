const { asyncHandler } = require("../src/lib/asyncHandler.ts");
const { serviceService } = require("../src/services/serviceService.ts");

exports.addService = asyncHandler(async (req, res) => {
  const service = await serviceService.addService(req.body, req.user);
  res.status(201).json(service);
});

exports.getServices = asyncHandler(async (req, res) => {
  const services = await serviceService.getServices(req.user);
  res.json(services);
});

exports.updateService = asyncHandler(async (req, res) => {
  const service = await serviceService.updateService(req.params.id, req.body, req.user);
  res.json(service);
});

exports.deleteService = asyncHandler(async (req, res) => {
  const result = await serviceService.deleteService(req.params.id, req.user);
  res.json(result);
});

exports.toggleServiceStatus = asyncHandler(async (req, res) => {
  const result = await serviceService.toggleServiceStatus(req.params.id, req.user);
  res.json(result);
});
