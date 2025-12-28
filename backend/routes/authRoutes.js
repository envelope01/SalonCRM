const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { authMiddleware } = require("../middleware/authMiddleware");

// Public: register (one-time)
router.post("/register", authController.register);

// Public: login
router.post("/login", authController.login);

// Protected: get current user
router.get("/me", authMiddleware, authController.me);

module.exports = router;
