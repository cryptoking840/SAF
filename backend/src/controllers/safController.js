const { contract, provider } = require("../config/blockchain");
const SAF = require("../models/safModel");
const { ethers } = require("ethers");

/*
====================================================
HELPER: Get Role-Based Wallet
====================================================
*/
const getWallet = (role) => {
  switch (role) {
    case "REGISTRY":
      return new ethers.Wallet(process.env.PRIVATE_KEY_REGISTRY, provider);
    case "SUPPLIER":
      return new ethers.Wallet(process.env.PRIVATE_KEY_SUPPLIER, provider);
    case "AIRLINE":
      return new ethers.Wallet(process.env.PRIVATE_KEY_AIRLINE, provider);
    default:
      throw new Error("Invalid role");
  }
};

/*
====================================================
SUPPLIER: Submit SAF (Mongo Only)
====================================================
*/
exports.registerSAF = async (req, res) => {
  try {
    const {
      productionBatchId,
      productionDate,
      quantity,
      feedstockType,
      carbonIntensity,
      productionPathway
    } = req.body;

    if (!quantity || !productionBatchId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const safDoc = await SAF.create({
      productionBatchId,
      productionDate,
      quantity,
      feedstockType,
      carbonIntensity,
      productionPathway,
      supplierWallet: process.env.SUPPLIER_ADDRESS,
      status: "SUBMITTED"
    });

    res.json({
      message: "Batch submitted for Inspector review",
      mongoId: safDoc._id
    });

  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

/*
====================================================
INSPECTOR: Mark as Inspected
====================================================
*/
exports.markInspected = async (req, res) => {
  try {
    const { id } = req.body;

    const batch = await SAF.findById(id);

    if (!batch) {
      return res.status(404).json({ error: "Batch not found" });
    }

    if (batch.status !== "SUBMITTED") {
      return res.status(400).json({ error: "Batch not in submitted state" });
    }

    batch.status = "INSPECTED";
    await batch.save();

    res.json({
      message: "Batch marked as inspected",
      batch
    });

  } catch (err) {
    console.error("INSPECT ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

/*
====================================================
INSPECTOR: Reject Batch
====================================================
*/
exports.rejectBatch = async (req, res) => {
  try {
    const { id } = req.body;

    const batch = await SAF.findById(id);

    if (!batch) {
      return res.status(404).json({ error: "Batch not found" });
    }

    batch.status = "REJECTED";
    await batch.save();

    res.json({
      message: "Batch rejected successfully",
      batch
    });

  } catch (err) {
    console.error("REJECT ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

/*
====================================================
REGISTRY: Approve & Register on Blockchain
====================================================
*/
exports.approveSAF = async (req, res) => {
  try {
    const { id } = req.body;

    const batch = await SAF.findById(id);

    if (!batch) {
      return res.status(404).json({ error: "Batch not found" });
    }

    if (batch.status !== "INSPECTED") {
      return res.status(400).json({ error: "Batch not inspected yet" });
    }

    if (!batch.supplierWallet) {
      return res.status(400).json({ error: "Supplier wallet missing" });
    }

    const wallet = getWallet("REGISTRY");
    const registryContract = contract.connect(wallet);

    // 🔥 Correct contract signature
    const tx = await registryContract.registerSAF(
      batch.quantity,
      batch.supplierWallet
    );

    await tx.wait();

    // 🔥 Read counter safely
    const certIdBigInt = await registryContract.certificateCounter();
    const certId = Number(certIdBigInt); // Convert BigInt → Number

    batch.status = "APPROVED";
    batch.certificateId = certId;
    batch.txHash = tx.hash;

    await batch.save();

    res.json({
      message: "Approved and registered on blockchain",
      certificateId: certId,
      txHash: tx.hash
    });

  } catch (err) {
    console.error("REGISTRY APPROVAL ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

/*
====================================================
LIST CERTIFICATE (Supplier Only)
====================================================
*/
exports.listCertificate = async (req, res) => {
  try {
    const { certId } = req.body;

    const wallet = getWallet("SUPPLIER");
    const supplierContract = contract.connect(wallet);

    const tx = await supplierContract.listCertificate(certId);
    await tx.wait();

    res.json({ message: "Listed Successfully", txHash: tx.hash });

  } catch (err) {
    console.error("LIST ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

/*
====================================================
PLACE BID (Airline Only)
====================================================
*/
exports.placeBid = async (req, res) => {
  try {
    const { certId, quantity, price } = req.body;

    const wallet = getWallet("AIRLINE");
    const airlineContract = contract.connect(wallet);

    const tx = await airlineContract.placeBid(certId, quantity, price);
    await tx.wait();

    res.json({ message: "Bid Placed", txHash: tx.hash });

  } catch (err) {
    console.error("BID ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

/*
====================================================
ACCEPT BID (Supplier Only)
====================================================
*/
exports.acceptBid = async (req, res) => {
  try {
    const { bidId } = req.body;

    const wallet = getWallet("SUPPLIER");
    const supplierContract = contract.connect(wallet);

    const tx = await supplierContract.acceptBid(bidId);
    await tx.wait();

    res.json({ message: "Bid Accepted", txHash: tx.hash });

  } catch (err) {
    console.error("ACCEPT BID ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

/*
====================================================
APPROVE TRADE (Registry Only)
====================================================
*/
exports.approveTrade = async (req, res) => {
  try {
    const { bidId } = req.body;

    const wallet = getWallet("REGISTRY");
    const registryContract = contract.connect(wallet);

    const tx = await registryContract.approveTrade(bidId);
    await tx.wait();

    res.json({ message: "Trade Approved", txHash: tx.hash });

  } catch (err) {
    console.error("APPROVE TRADE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

/*
====================================================
FETCH BY STATUS
====================================================
*/
exports.getBatchesByStatus = async (req, res) => {
  try {
    const { status } = req.query;
    const batches = await SAF.find({ status });
    res.json(batches);
  } catch (err) {
    console.error("FETCH STATUS ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

/*
====================================================
GET ALL BATCHES
====================================================
*/
exports.getAllBatches = async (req, res) => {
  try {
    const batches = await SAF.find();
    res.json(batches);
  } catch (error) {
    console.error("FETCH ALL ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};
