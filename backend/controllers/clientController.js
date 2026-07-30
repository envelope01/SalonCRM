const { asyncHandler } = require("../src/lib/asyncHandler.ts");
const { clientService } = require("../src/services/clientService.ts");

exports.createClient = asyncHandler(async (req, res) => {
  const client = await clientService.createClient(req.body);
  res.status(201).json(client);
});

exports.getClients = asyncHandler(async (_req, res) => {
  const clients = await clientService.getClients();
  res.json(clients);
});

exports.getClientById = asyncHandler(async (req, res) => {
  const client = await clientService.getClientById(req.params.id);
  res.json(client);
});

exports.searchClients = asyncHandler(async (req, res) => {
  const clients = await clientService.searchClients(req.query.q);
  res.json(clients);
});

exports.updateClient = asyncHandler(async (req, res) => {
  const client = await clientService.updateClient(req.params.id, req.body);
  res.json(client);
});

exports.deleteClient = asyncHandler(async (req, res) => {
  const result = await clientService.deactivateClient(req.params.id);
  res.json(result);
});
