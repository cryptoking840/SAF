const express = require("express");
const router = express.Router();
const safController = require("../controllers/safController");

console.log("SAF CONTROLLER FUNCTIONS:", Object.keys(safController));

// ===============================
// SAF FLOW
// ===============================
router.post("/register", safController.registerSAF);
router.post("/inspect", safController.inspectSAF);
router.post("/approve", safController.approveSAF);
router.post("/list", safController.listCertificate);

// ===============================
// BIDDING FLOW
// ===============================
router.post("/bid", safController.placeBid);
router.post("/accept-bid", safController.acceptBid);
router.post("/approve-trade", safController.approveTrade);

// ===============================
// FETCH
// ===============================
router.get("/certificates", safController.getAllCertificates);
router.get("/certificates/:id", safController.getCertificate);

module.exports = router;
