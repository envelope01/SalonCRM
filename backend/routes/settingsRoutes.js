const express = require("express");
const router = express.Router();
const settingsController = require("../controllers/settingsController");
const { authMiddleware, requireRoles } = require("../middleware/authMiddleware");

router.use(authMiddleware, requireRoles("owner", "admin", "dev"));

router.get("/", settingsController.getSettings);
router.put("/", settingsController.updateSettings);

module.exports = router;
