  const express = require("express");
  const router = express.Router();
  const {
    createClient,
    getClients,
    getClientById,
    searchClients,
    updateClient,
    deleteClient
  } = require("../controllers/clientController");

  // CREATE
  router.post("/", createClient);

  // READ
  router.get("/", getClients);
  router.get("/search", searchClients);
  router.get("/:id", getClientById);

  // UPDATE
  router.put("/:id", updateClient);

  // DELETE
  router.delete("/:id", deleteClient);

  module.exports = router;
