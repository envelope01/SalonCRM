const express = require("express");
const router = express.Router();
const {
  createVisit,
  getClientVisits,
  deleteVisit
} = require("../controllers/visitController");
const { authMiddleware } = require("../middleware/authMiddleware");

router.use(authMiddleware);

router.post("/", createVisit);
router.get("/client/:clientId", getClientVisits);
router.delete("/:visitId", deleteVisit);

module.exports = router;
