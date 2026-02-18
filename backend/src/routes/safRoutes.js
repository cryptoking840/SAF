const express = require("express");
const router = express.Router();
const safController = require("../controllers/safController");

/*
====================================================
SUPPLIER FLOW
====================================================
*/

router.post("/saf/register", safController.registerSAF);

/*
====================================================
INSPECTOR FLOW
====================================================
*/

router.post("/saf/inspect", safController.markInspected);

/*
====================================================
REGISTRY FLOW
====================================================
*/

router.post("/saf/approve", safController.approveSAF);
router.get("/registry/trade-approvals", safController.getPendingTradeApprovals);
router.post("/saf/approve-trade", safController.approveTrade);

/*
====================================================
MARKETPLACE FLOW
====================================================
*/

router.post("/saf/list", safController.listCertificate);
router.post("/saf/bid", safController.placeBid);
router.post("/saf/accept-bid", safController.acceptBid);

router.get("/marketplace/listings", safController.getMarketplaceListings);
router.get("/marketplace/my-bids", safController.getMyBids);
router.get("/marketplace/incoming-bids", safController.getIncomingBids);
router.post("/marketplace/bid/accept", safController.acceptBid);
router.post("/marketplace/bid/accept-counter", safController.acceptCounterBid);
router.post("/marketplace/bid/counter", safController.counterBid);
router.post("/marketplace/bid/deny", safController.denyBid);

/*
====================================================
FETCH (Mongo Lifecycle)
====================================================
*/

router.get("/saf/status", safController.getBatchesByStatus);
router.get("/saf", safController.getAllBatches);

/*
====================================================
FETCH (Blockchain Certificates)
====================================================
*/

router.post("/saf/reject", safController.rejectBatch);

module.exports = router;
