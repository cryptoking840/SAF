const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.post("/auth/register", authController.registerOrganization);
router.post("/auth/login", authController.loginOrganization);
router.get("/registry/participants", authController.getParticipantRegistrations);
router.post("/registry/participants/:id/approve", authController.approveParticipantRegistration);
router.post("/registry/participants/:id/reject", authController.rejectParticipantRegistration);

module.exports = router;
