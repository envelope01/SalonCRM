const { asyncHandler } = require("../src/lib/asyncHandler.ts");
const { clientService } = require("../src/services/clientService.ts");

exports.createClient = asyncHandler(async (req, res) => {
  const client = await clientService.createClient(req.body, req.user);
  res.status(201).json(client);
});

exports.getClients = asyncHandler(async (req, res) => {
  const clients = await clientService.getClients(req.user);
  res.json(clients);
});

exports.getClientById = asyncHandler(async (req, res) => {
  const client = await clientService.getClientById(req.params.id, req.user);
  res.json(client);
});

exports.searchClients = asyncHandler(async (req, res) => {
  const clients = await clientService.searchClients(req.query.q, req.user);
  res.json(clients);
});

exports.updateClient = asyncHandler(async (req, res) => {
  const client = await clientService.updateClient(req.params.id, req.body, req.user);
  res.json(client);
});

exports.deleteClient = asyncHandler(async (req, res) => {
  const result = await clientService.deactivateClient(req.params.id, req.user);
  res.json(result);
});
