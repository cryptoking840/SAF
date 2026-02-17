const { contract, provider } = require("../config/blockchain");
const SAF = require("../models/safModel");
const Bid = require("../models/bidModel");
const { ethers } = require("ethers");

const DEFAULT_BID_EXPIRY_HOURS = Number(process.env.DEFAULT_BID_EXPIRY_HOURS || 72);

const statusLabel = {
  0: "REGISTERED",
  1: "INSPECTED",
  2: "CERTIFIED",
  3: "LISTED",
  4: "BID_PLACED",
  5: "BID_ACCEPTED",
  6: "TRANSFERRED",
  7: "RETIRED",
};

const resolveSupplierWallet = (req) => {
  return (
    req.user?.walletAddress ||
    req.headers["x-wallet-address"] ||
    req.headers["x-supplier-wallet"] ||
    process.env.SUPPLIER_ADDRESS ||
    ""
  );
};

const getAirlineName = (wallet) => {
  try {
    const directory = JSON.parse(process.env.AIRLINE_DIRECTORY || "{}");
    if (wallet && directory[wallet.toLowerCase()]) {
      return directory[wallet.toLowerCase()];
    }
  } catch (_err) {
    // ignore malformed AIRLINE_DIRECTORY and fallback to shortened wallet
  }

  if (!wallet) {
    return "Unknown Airline";
  }

  return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
};

const normalizeBidState = (bidDoc, blockchainBid) => {
  const now = new Date();
  const baseStatus = blockchainBid.accepted ? "Accepted" : bidDoc.status || "Pending";

  if (
    baseStatus !== "Accepted" &&
    baseStatus !== "Denied" &&
    bidDoc.expiryAt &&
    bidDoc.expiryAt <= now
  ) {
    return "Expired";
  }

  return baseStatus;
};

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


const getSupplierSignerForCertificate = async (certificateId) => {
  const cert = await contract.certificates(certificateId);
  const owner = String(cert.owner || "").toLowerCase();

  if (!owner || owner === ethers.ZeroAddress) {
    throw new Error("Certificate owner not found");
  }

  let privateKeyDirectory = {};
  try {
    privateKeyDirectory = JSON.parse(process.env.SUPPLIER_PRIVATE_KEYS || "{}");
  } catch (_err) {
    privateKeyDirectory = {};
  }

  const ownerPrivateKey = privateKeyDirectory[owner];

  if (ownerPrivateKey) {
    return new ethers.Wallet(ownerPrivateKey, provider);
  }

  return provider.getSigner(owner);
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

    const tx = await registryContract.registerSAF(
      batch.quantity,
      batch.supplierWallet
    );

    await tx.wait();

    const certIdBigInt = await registryContract.certificateCounter();
    const certId = Number(certIdBigInt);

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

    if (certId === null || certId === undefined) {
      return res.status(400).json({ error: "certId is required" });
    }

    const certificateId = Number(certId);
    if (!Number.isFinite(certificateId) || certificateId <= 0) {
      return res.status(400).json({ error: "certId must be a positive number" });
    }

    const supplierSigner = await getSupplierSignerForCertificate(certificateId);
    const supplierContract = contract.connect(supplierSigner);

    const tx = await supplierContract.listCertificate(certificateId);
    await tx.wait();

    await SAF.findOneAndUpdate(
      { certificateId },
      { status: "LISTED" },
      { new: true }
    );

    res.json({ message: "Listed Successfully", txHash: tx.hash, certificateId });

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

    const bidId = Number(await airlineContract.bidCounter());

    const cert = await airlineContract.certificates(certId);

    await Bid.findOneAndUpdate(
      { bidId },
      {
        bidId,
        certificateId: Number(certId),
        supplierWallet: cert.owner,
        airlineWallet: wallet.address,
        status: "Pending",
        expiryAt: new Date(Date.now() + DEFAULT_BID_EXPIRY_HOURS * 60 * 60 * 1000),
      },
      { upsert: true, new: true }
    );

    res.json({ message: "Bid Placed", txHash: tx.hash, bidId });

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

    const bidDoc = await Bid.findOne({ bidId: Number(bidId) });

    if (bidDoc?.status === "Accepted") {
      return res.status(400).json({ error: "Bid already accepted" });
    }

    if (bidDoc?.status === "Denied") {
      return res.status(400).json({ error: "Denied bid cannot be accepted" });
    }

    if (bidDoc?.expiryAt && bidDoc.expiryAt <= new Date()) {
      return res.status(400).json({ error: "Expired bid cannot be accepted" });
    }

    const tx = await supplierContract.acceptBid(bidId);
    await tx.wait();

    await Bid.findOneAndUpdate(
      { bidId: Number(bidId) },
      { status: "Accepted" },
      { upsert: true }
    );

    res.json({ message: "Bid Accepted", txHash: tx.hash });

  } catch (err) {
    console.error("ACCEPT BID ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

/*
====================================================
COUNTER BID (Supplier Only)
====================================================
*/
exports.counterBid = async (req, res) => {
  try {
    const { bidId, newPrice } = req.body;

    if (!bidId || !newPrice || Number(newPrice) <= 0) {
      return res.status(400).json({ error: "bidId and valid newPrice are required" });
    }

    const bidDoc = await Bid.findOne({ bidId: Number(bidId) });

    if (bidDoc?.status === "Accepted") {
      return res.status(400).json({ error: "Accepted bid cannot be countered" });
    }

    if (bidDoc?.status === "Denied") {
      return res.status(400).json({ error: "Denied bid cannot be countered" });
    }

    if (bidDoc?.expiryAt && bidDoc.expiryAt <= new Date()) {
      return res.status(400).json({ error: "Expired bid cannot be countered" });
    }

    const updated = await Bid.findOneAndUpdate(
      { bidId: Number(bidId) },
      {
        status: "Countered",
        counterPrice: Number(newPrice),
      },
      { upsert: true, new: true }
    );

    res.json({
      message: "Bid Countered",
      data: {
        bidId: updated.bidId,
        newPrice: updated.counterPrice,
        status: updated.status,
      },
    });
  } catch (err) {
    console.error("COUNTER BID ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

/*
====================================================
DENY BID (Supplier Only)
====================================================
*/
exports.denyBid = async (req, res) => {
  try {
    const { bidId } = req.body;

    if (!bidId) {
      return res.status(400).json({ error: "bidId is required" });
    }

    const bidDoc = await Bid.findOne({ bidId: Number(bidId) });

    if (bidDoc?.status === "Accepted") {
      return res.status(400).json({ error: "Accepted bid cannot be denied" });
    }

    const updated = await Bid.findOneAndUpdate(
      { bidId: Number(bidId) },
      { status: "Denied" },
      { upsert: true, new: true }
    );

    res.json({
      message: "Bid Denied",
      data: { bidId: updated.bidId, status: updated.status },
    });
  } catch (err) {
    console.error("DENY BID ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

/*
====================================================
FETCH INCOMING BIDS FOR SUPPLIER
====================================================
*/
exports.getIncomingBids = async (req, res) => {
  try {
    const supplierWallet = resolveSupplierWallet(req);

    if (!supplierWallet) {
      return res.status(400).json({ error: "Supplier wallet not found" });
    }

    const totalBids = Number(await contract.bidCounter());
    const rows = [];

    for (let bidId = 1; bidId <= totalBids; bidId += 1) {
      const blockchainBid = await contract.bids(bidId);
      if (Number(blockchainBid.id) === 0) {
        continue;
      }

      const cert = await contract.certificates(blockchainBid.certificateId);
      if (cert.owner.toLowerCase() !== supplierWallet.toLowerCase()) {
        continue;
      }

      const certId = Number(blockchainBid.certificateId);
      const pricePerMT = Number(blockchainBid.price);
      const volume = Number(blockchainBid.quantity);

      const batch = await SAF.findOne({ certificateId: certId }).lean();

      const bidDoc = await Bid.findOneAndUpdate(
        { bidId },
        {
          bidId,
          certificateId: certId,
          supplierWallet,
          airlineWallet: blockchainBid.airline,
          status: blockchainBid.accepted ? "Accepted" : "Pending",
          expiryAt: new Date(Date.now() + DEFAULT_BID_EXPIRY_HOURS * 60 * 60 * 1000),
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      );

      const status = normalizeBidState(bidDoc, blockchainBid);

      if (status !== bidDoc.status) {
        bidDoc.status = status;
        await bidDoc.save();
      }

      rows.push({
        bidId,
        airlineName: getAirlineName(blockchainBid.airline),
        airlineWallet: blockchainBid.airline,
        batchId: batch?.productionBatchId || `#${certId}`,
        certificateId: certId,
        bidPricePerMT: bidDoc.counterPrice || pricePerMT,
        originalPricePerMT: pricePerMT,
        volume,
        totalValue: (bidDoc.counterPrice || pricePerMT) * volume,
        status,
        bidExpiryDate: bidDoc.expiryAt,
        createdTimestamp: bidDoc.createdAt,
        blockchainState: statusLabel[Number(cert.status)] || "UNKNOWN",
      });
    }

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("FETCH INCOMING BIDS ERROR:", err);
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
