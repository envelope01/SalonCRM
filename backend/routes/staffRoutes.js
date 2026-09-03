const express = require("express");
const router = express.Router();
const staffController = require("../controllers/staffController");
const { authMiddleware, requireRoles } = require("../middleware/authMiddleware");

router.use(authMiddleware, requireRoles("owner", "admin", "dev"));

router.get("/", staffController.listStaff);
router.post("/", staffController.createStaff);

module.exports = router;
