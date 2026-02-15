const { contract, provider } = require("../config/blockchain");
const SAF = require("../models/safModel");
const { ethers } = require("ethers");

/*
====================================================
REGISTER SAF (Hybrid: Mongo + Blockchain)
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
      productionPathway,
      supplierWallet,
      privateKey,
    } = req.body;

    if (!quantity || !privateKey || !productionBatchId) {
      return res.status(400).json({
        error: "Missing required fields",
      });
    }

    // Connect wallet
    const wallet = new ethers.Wallet(privateKey, provider);
    const userContract = contract.connect(wallet);

    // Call blockchain
    const tx = await userContract.registerSAF(quantity);
    const receipt = await tx.wait();

    // Get new certificate ID
    const certId = await contract.certificateCounter();

    // Save full metadata in MongoDB
    const safDoc = await SAF.create({
      certificateId: Number(certId),
      productionBatchId,
      productionDate,
      quantity,
      feedstockType,
      carbonIntensity,
      productionPathway,
      supplierWallet,
      txHash: tx.hash,
      status: "REGISTERED",
    });

    res.json({
      message: "SAF Registered Successfully",
      certificateId: certId.toString(),
      txHash: tx.hash,
      mongoId: safDoc._id,
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

/*
====================================================
GET ALL CERTIFICATES (Merged On-chain + Mongo)
====================================================
*/
exports.getAllCertificates = async (req, res) => {
  try {
    const count = await contract.certificateCounter();
    const certificates = [];

    for (let i = 1; i <= Number(count); i++) {
      const cert = await contract.certificates(i);

      certificates.push({
        id: cert.id.toString(),
        parentId: cert.parentId.toString(),
        originalQuantity: cert.originalQuantity.toString(),
        remainingQuantity: cert.remainingQuantity.toString(),
        owner: cert.owner,
        isListed: cert.isListed,
        status: cert.status.toString()
      });
    }

    res.json(certificates);

  } catch (error) {
    console.error("GET ALL ERROR:", error);
    res.status(500).json({ error: "Failed to fetch certificates" });
  }
};


/*
====================================================
GET SINGLE CERTIFICATE
====================================================
*/
exports.getCertificate = async (req, res) => {
  try {
    const cert = await contract.certificates(req.params.id);

    res.json({
      id: cert.id.toString(),
      parentId: cert.parentId.toString(),
      originalQuantity: cert.originalQuantity.toString(),
      remainingQuantity: cert.remainingQuantity.toString(),
      owner: cert.owner,
      isListed: cert.isListed,
      status: cert.status.toString()
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


/*
====================================================
INSPECT SAF
====================================================
*/
exports.inspectSAF = async (req, res) => {
  try {
    const { certId, privateKey } = req.body;

    const wallet = new ethers.Wallet(privateKey, provider);
    const userContract = contract.connect(wallet);

    const tx = await userContract.inspectSAF(certId);
    await tx.wait();

    res.json({ message: "SAF Inspected", txHash: tx.hash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/*
====================================================
APPROVE SAF (Registry Only)
====================================================
*/
exports.approveSAF = async (req, res) => {
  try {
    const { certId } = req.body;

    const tx = await contract.approveSAF(certId);
    await tx.wait();

    res.json({ message: "SAF Approved", txHash: tx.hash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/*
====================================================
LIST CERTIFICATE
====================================================
*/
exports.listCertificate = async (req, res) => {
  try {
    const { certId, privateKey } = req.body;

    const wallet = new ethers.Wallet(privateKey, provider);
    const userContract = contract.connect(wallet);

    const tx = await userContract.listCertificate(certId);
    await tx.wait();

    res.json({ message: "Listed Successfully", txHash: tx.hash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/*
====================================================
PLACE BID
====================================================
*/
exports.placeBid = async (req, res) => {
  try {
    const { certId, quantity, price, privateKey } = req.body;

    const wallet = new ethers.Wallet(privateKey, provider);
    const userContract = contract.connect(wallet);

    const tx = await userContract.placeBid(certId, quantity, price);
    await tx.wait();

    res.json({ message: "Bid Placed", txHash: tx.hash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/*
====================================================
ACCEPT BID
====================================================
*/
exports.acceptBid = async (req, res) => {
  try {
    const { bidId, privateKey } = req.body;

    const wallet = new ethers.Wallet(privateKey, provider);
    const userContract = contract.connect(wallet);

    const tx = await userContract.acceptBid(bidId);
    await tx.wait();

    res.json({ message: "Bid Accepted", txHash: tx.hash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/*
====================================================
APPROVE TRADE (Registry)
====================================================
*/
exports.approveTrade = async (req, res) => {
  try {
    const { bidId } = req.body;

    const tx = await contract.approveTrade(bidId);
    await tx.wait();

    res.json({ message: "Trade Approved", txHash: tx.hash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
