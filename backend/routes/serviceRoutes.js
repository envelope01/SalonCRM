const express = require("express");
const router = express.Router();
const serviceController = require("../controllers/serviceController");

// POST /api/services        → add service
router.post("/", serviceController.addService);

// GET /api/services         → get all active services
router.get("/", serviceController.getServices);

// PUT /api/services/:id     → update service
router.put("/:id", serviceController.updateService);

router.put("/toggle/:id", serviceController.toggleServiceStatus);


module.exports = router;
