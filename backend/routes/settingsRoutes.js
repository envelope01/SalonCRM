const express = require("express");
const router = express.Router();
const settingsController = require("../controllers/settingsController");
const { authMiddleware, requireRoles } = require("../middleware/authMiddleware");

router.get("/", authMiddleware, settingsController.getSettings);
router.put("/", authMiddleware, requireRoles("owner", "admin", "dev"), settingsController.updateSettings);

module.exports = router;
