const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { authMiddleware, requireRoles } = require("../middleware/authMiddleware");

router.use(authMiddleware, requireRoles("admin", "dev"));

router.get("/dashboard", adminController.getDashboard);
router.post("/salons", adminController.registerSalon);
router.put("/salons/:id/status", adminController.updateSalonStatus);
router.put("/salons/:id/owner-password", adminController.resetSalonOwnerPassword);
router.delete("/salons/:id", adminController.deleteSalon);
router.post("/platform-users", adminController.createPlatformUser);

module.exports = router;
