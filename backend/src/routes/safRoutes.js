const express = require("express");
const router = express.Router();
const safController = require("../controllers/safController");

console.log("SAF CONTROLLER FUNCTIONS:", Object.keys(safController));

/*
====================================================
SUPPLIER FLOW
====================================================
*/

// Submit batch (Mongo only)
router.post("/saf/register", safController.registerSAF);

/*
====================================================
INSPECTOR FLOW
====================================================
*/

// Mark as inspected (Mongo only)
router.post("/saf/inspect", safController.markInspected);

/*
====================================================
REGISTRY FLOW
====================================================
*/

// Approve & register on blockchain
router.post("/saf/approve", safController.approveSAF);

/*
====================================================
MARKETPLACE FLOW
====================================================
*/

router.post("/saf/list", safController.listCertificate);
router.post("/saf/bid", safController.placeBid);
router.post("/saf/accept-bid", safController.acceptBid);
router.post("/saf/approve-trade", safController.approveTrade);

/*
====================================================
FETCH (Mongo Lifecycle)
====================================================
*/

// Get batches by status
router.get("/saf/status", safController.getBatchesByStatus);

// Get all batches (Mongo)
router.get("/saf", safController.getAllBatches);

/*
====================================================
FETCH (Blockchain Certificates)
====================================================
*/

router.get("/saf", safController.getAllBatches);
router.get("/saf/status", safController.getBatchesByStatus);
router.post("/saf/reject", safController.rejectBatch);

module.exports = router;
