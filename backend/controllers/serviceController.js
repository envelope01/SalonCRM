const { asyncHandler } = require("../src/lib/asyncHandler.ts");
const { serviceService } = require("../src/services/serviceService.ts");

exports.addService = asyncHandler(async (req, res) => {
  const service = await serviceService.addService(req.body);
  res.status(201).json(service);
});

exports.getServices = asyncHandler(async (_req, res) => {
  const services = await serviceService.getServices();
  res.json(services);
});

exports.updateService = asyncHandler(async (req, res) => {
  const service = await serviceService.updateService(req.params.id, req.body);
  res.json(service);
});

exports.deleteService = asyncHandler(async (req, res) => {
  const result = await serviceService.deleteService(req.params.id);
  res.json(result);
});

exports.toggleServiceStatus = asyncHandler(async (req, res) => {
  const result = await serviceService.toggleServiceStatus(req.params.id);
  res.json(result);
});
