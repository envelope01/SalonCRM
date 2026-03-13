const express = require("express");
const router = express.Router();
const serviceController = require("../controllers/serviceController");

// Add service
router.post("/", serviceController.addService);

// Get services
router.get("/", serviceController.getServices);

// Update service
router.put("/:id", serviceController.updateService);

// Toggle active/inactive
router.put("/toggle/:id", serviceController.toggleServiceStatus);

// Delete service permanently
router.delete("/:id", serviceController.deleteService);

module.exports = router;