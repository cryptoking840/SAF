const { contract, provider } = require("../config/blockchain");
const SAF = require("../models/safModel");
const Bid = require("../models/bidModel");
const { ethers } = require("ethers");

const DEFAULT_BID_EXPIRY_HOURS = Number(process.env.DEFAULT_BID_EXPIRY_HOURS || 72);

// ===== Error Sanitization Helper =====
const sanitizeError = (err) => {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    message: isProduction
      ? "Operation failed. Please try again."
      : (err.reason || err.shortMessage || err.message),
    reason: isProduction ? undefined : (err.reason || err.shortMessage),
  };
};

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

const resolveAirlineWallet = (req) => {
  let walletFromPrivateKey = "";

  try {
    if (process.env.PRIVATE_KEY_AIRLINE) {
      walletFromPrivateKey = new ethers.Wallet(process.env.PRIVATE_KEY_AIRLINE).address;
    }
  } catch (_err) {
    walletFromPrivateKey = "";
  }

  return (
    req.user?.walletAddress ||
    req.headers["x-wallet-address"] ||
    req.headers["x-airline-wallet"] ||
    process.env.AIRLINE_ADDRESS ||
    walletFromPrivateKey ||
    ""
  );
};

const formatWallet = (wallet) => {
  if (!wallet) {
    return "Unknown";
  }

  return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
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


const getSupplierSignerForCertificate = async (certificateId, req) => {
  const cert = await contract.certificates(certificateId);
  const ownerFromChain = String(cert.owner || cert[4] || "").toLowerCase();

  const batch = await SAF.findOne({ certificateId }).select("supplierWallet").lean();
  const ownerFromDb = String(batch?.supplierWallet || "").toLowerCase();
  const ownerFromRequest = String(resolveSupplierWallet(req) || "").toLowerCase();

  const owner =
    ownerFromChain && ownerFromChain !== ethers.ZeroAddress
      ? ownerFromChain
      : ownerFromDb || ownerFromRequest;

  let privateKeyDirectory = {};
  try {
    privateKeyDirectory = JSON.parse(process.env.SUPPLIER_PRIVATE_KEYS || "{}");
  } catch (_err) {
    privateKeyDirectory = {};
  }

  const normalizedPrivateKeyDirectory = Object.entries(privateKeyDirectory).reduce(
    (acc, [walletAddress, privateKey]) => {
      acc[String(walletAddress).toLowerCase()] = privateKey;
      return acc;
    },
    {}
  );

  const ownerPrivateKey = owner ? normalizedPrivateKeyDirectory[owner] : null;

  if (ownerPrivateKey) {
    return new ethers.Wallet(ownerPrivateKey, provider);
  }

  if (!owner) {
    return getWallet("SUPPLIER");
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

    const supplierWallet = process.env.SUPPLIER_ADDRESS;
    if (!supplierWallet || !ethers.isAddress(supplierWallet)) {
      return res.status(500).json({ error: "Invalid supplier wallet configuration" });
    }

    const safDoc = await SAF.create({
      productionBatchId,
      productionDate,
      quantity,
      feedstockType,
      carbonIntensity,
      productionPathway,
      supplierWallet: supplierWallet.toLowerCase(),
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
    const sanitized = sanitizeError(err);
    res.status(500).json({ error: sanitized.message });
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
      return res.status(400).json({ error: "certId must be a positive number", receivedCertId: certId ?? null });
    }

    const supplierSigner = await getSupplierSignerForCertificate(certificateId, req);
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
    const { certId, certificateId: certificateIdInput, quantity, price } = req.body;

    // Add comprehensive logging for debugging
    console.log("=== Place Bid Request ===");
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    console.log("Extracted values:", { certId, certificateIdInput, quantity, price });

    // Use certId first, then fall back to certificateIdInput
    const rawCertificateId = certId ?? certificateIdInput;
    
    // Validate certId exists
    if (rawCertificateId === null || rawCertificateId === undefined || rawCertificateId === "") {
      return res.status(400).json({ 
        error: "Certificate ID is required. Please select a listing and try again.", 
        code: "MISSING_CERT_ID",
        receivedBody: req.body
      });
    }

    const certificateId = Number(rawCertificateId);
    const bidQuantity = Number(quantity);
    const bidPrice = Number(price);

    console.log("Parsed numeric values:", { certificateId, bidQuantity, bidPrice });

    if (!Number.isFinite(certificateId) || certificateId <= 0) {
      return res.status(400).json({ 
        error: `Invalid certificate ID: ${rawCertificateId}. Must be a positive number.`, 
        receivedCertId: rawCertificateId ?? null,
        code: "INVALID_CERT_ID"
      });
    }

    if (!Number.isFinite(bidQuantity) || bidQuantity <= 0) {
      return res.status(400).json({ 
        error: "Quantity must be a positive number greater than 0.",
        code: "INVALID_QUANTITY",
        received: bidQuantity
      });
    }

    if (!Number.isFinite(bidPrice) || bidPrice <= 0) {
      return res.status(400).json({ 
        error: "Price must be a positive number greater than 0.",
        code: "INVALID_PRICE",
        received: bidPrice
      });
    }

    const wallet = getWallet("AIRLINE");
    const airlineContract = contract.connect(wallet);

    console.log(`Placing bid for certificate ${certificateId}: qty=${bidQuantity}, price=${bidPrice}`);

    const tx = await airlineContract.placeBid(
      BigInt(certificateId),
      BigInt(bidQuantity),
      BigInt(bidPrice)
    );
    await tx.wait();

    const bidId = Number(await airlineContract.bidCounter());

    const cert = await airlineContract.certificates(certificateId);

    await Bid.findOneAndUpdate(
      { bidId },
      {
        bidId,
        certificateId,
        supplierWallet: cert.owner,
        airlineWallet: wallet.address,
        status: "Pending",
        expiryAt: new Date(Date.now() + DEFAULT_BID_EXPIRY_HOURS * 60 * 60 * 1000),
      },
      { upsert: true, new: true }
    );

    console.log(`✅ Bid placed successfully: bidId=${bidId}, certId=${certificateId}`);

    res.json({ message: "Bid Placed", txHash: tx.hash, bidId });

  } catch (err) {
    console.error("❌ BID ERROR:", err);
    const sanitized = sanitizeError(err);
    res.status(500).json({ error: sanitized.message });
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
    const sanitized = sanitizeError(err);
    res.status(500).json({ error: sanitized.message });
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
    const sanitized = sanitizeError(err);
    res.status(500).json({ error: sanitized.message });
  }
};

/*
====================================================
ACCEPT COUNTER BID (Airline Only)
====================================================
*/
exports.acceptCounterBid = async (req, res) => {
  try {
    const { bidId } = req.body;

    if (!bidId) {
      return res.status(400).json({ error: "bidId is required" });
    }

    const bidDoc = await Bid.findOne({ bidId: Number(bidId) });

    if (!bidDoc) {
      return res.status(404).json({ error: "Bid not found" });
    }

    if (bidDoc.status !== "Countered") {
      return res.status(400).json({ error: "Bid must be in 'Countered' status to accept counter offer" });
    }

    if (bidDoc.expiryAt && bidDoc.expiryAt <= new Date()) {
      return res.status(400).json({ error: "Counter offer has expired" });
    }

    const blockchainBid = await contract.bids(bidId);
    if (Number(blockchainBid.id) === 0) {
      return res.status(404).json({ error: "Bid not found on-chain" });
    }

    const certificateId = Number(bidDoc.certificateId || blockchainBid.certificateId);
    if (!certificateId) {
      return res.status(400).json({ error: "Cannot resolve certificate for this bid" });
    }

    let txHash = null;
    if (!blockchainBid.accepted) {
      // On-chain acceptBid is supplier-only; use the supplier signer for this certificate.
      const supplierSigner = await getSupplierSignerForCertificate(certificateId, req);
      const supplierContract = contract.connect(supplierSigner);
      const tx = await supplierContract.acceptBid(bidId);
      await tx.wait();
      txHash = tx.hash;
    }

    // Update bid document to reflect acceptance
    const updated = await Bid.findOneAndUpdate(
      { bidId: Number(bidId) },
      {
        status: "Accepted",
        // Keep the counterPrice as the final agreed price
      },
      { new: true }
    );

    console.log(`✅ Counter offer accepted: bidId=${bidId}`);

    res.json({
      message: "Counter Offer Accepted",
      data: {
        bidId: updated.bidId,
        status: updated.status,
        finalPrice: updated.counterPrice,
        txHash,
      },
    });
  } catch (err) {
    console.error("ACCEPT COUNTER BID ERROR:", err);
    const sanitized = sanitizeError(err);
    res.status(500).json({ error: sanitized.message });
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
    const sanitized = sanitizeError(err);
    res.status(500).json({ error: sanitized.message });
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

      // Get existing bid or create new
      let bidDoc = await Bid.findOne({ bidId });
      
      if (!bidDoc) {
        // New bid - create with initial status
        bidDoc = await Bid.create({
          bidId,
          certificateId: certId,
          supplierWallet,
          airlineWallet: blockchainBid.airline,
          status: blockchainBid.accepted ? "Accepted" : "Pending",
          expiryAt: new Date(Date.now() + DEFAULT_BID_EXPIRY_HOURS * 60 * 60 * 1000),
        });
      } else {
        // Existing bid - only update if Accepted on blockchain, preserve Countered/Denied
        const updateData = {
          certificateId: certId,
          supplierWallet,
          airlineWallet: blockchainBid.airline,
          expiryAt: new Date(Date.now() + DEFAULT_BID_EXPIRY_HOURS * 60 * 60 * 1000),
        };
        
        // Only update status if accepted on blockchain
        if (blockchainBid.accepted) {
          updateData.status = "Accepted";
        }
        
        bidDoc = await Bid.findOneAndUpdate({ bidId }, updateData, { new: true });
      }

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
        approvedByRegistry: bidDoc.approvedByRegistry || blockchainBid.approvedByRegistry || false,
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
FETCH ACTIVE MARKETPLACE LISTINGS (Airline View)
====================================================
*/
exports.getMarketplaceListings = async (_req, res) => {
  try {
    const totalCertificates = Number(await contract.certificateCounter());
    const listings = [];

    for (let certId = 1; certId <= totalCertificates; certId += 1) {
      const cert = await contract.certificates(certId);

      if (!cert.isListed || Number(cert.remainingQuantity) <= 0) {
        continue;
      }

      const batch = await SAF.findOne({ certificateId: certId }).lean();

      listings.push({
        certId: certId,  // Changed from certificateId to certId for consistency
        certificateId: certId,  // Keep both for backward compatibility
        supplierWallet: cert.owner,
        supplierName: formatWallet(cert.owner),
        volume: Number(cert.remainingQuantity),  // Changed from availableQuantity to volume
        availableQuantity: Number(cert.remainingQuantity),
        originalQuantity: Number(cert.originalQuantity),
        productionBatchId: batch?.productionBatchId || `#${certId}`,
        feedstockType: batch?.feedstockType || "N/A",
        price: Number(batch?.referencePricePerMT) || 0,  // Add price if available
        carbonIntensity: Number(batch?.carbonIntensity) || 0,
        blockchainState: statusLabel[Number(cert.status)] || "UNKNOWN",
      });
    }

    res.json({ success: true, data: listings });
  } catch (err) {
    console.error("FETCH MARKETPLACE LISTINGS ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

/*
====================================================
FETCH BIDS FOR AIRLINE (My Bids)
====================================================
*/
exports.getMyBids = async (req, res) => {
  try {
    const airlineWallet = resolveAirlineWallet(req);

    if (!airlineWallet) {
      return res.status(400).json({ error: "Airline wallet not found" });
    }

    const totalBids = Number(await contract.bidCounter());
    const rows = [];

    for (let bidId = 1; bidId <= totalBids; bidId += 1) {
      const blockchainBid = await contract.bids(bidId);

      if (Number(blockchainBid.id) === 0) {
        continue;
      }

      if (String(blockchainBid.airline).toLowerCase() !== airlineWallet.toLowerCase()) {
        continue;
      }

      const certId = Number(blockchainBid.certificateId);
      const cert = await contract.certificates(certId);

      // Get existing bid or create new
      let bidDoc = await Bid.findOne({ bidId });
      
      if (!bidDoc) {
        // New bid - create with initial status
        bidDoc = await Bid.create({
          bidId,
          certificateId: certId,
          supplierWallet: cert.owner,
          airlineWallet: blockchainBid.airline,
          status: blockchainBid.accepted ? "Accepted" : "Pending",
          expiryAt: new Date(Date.now() + DEFAULT_BID_EXPIRY_HOURS * 60 * 60 * 1000),
        });
      } else {
        // Existing bid - only update if Accepted on blockchain, preserve Countered/Denied
        const updateData = {
          certificateId: certId,
          supplierWallet: cert.owner,
          airlineWallet: blockchainBid.airline,
          expiryAt: new Date(Date.now() + DEFAULT_BID_EXPIRY_HOURS * 60 * 60 * 1000),
        };
        
        // Only update status if accepted on blockchain
        if (blockchainBid.accepted) {
          updateData.status = "Accepted";
        }
        
        bidDoc = await Bid.findOneAndUpdate({ bidId }, updateData, { new: true });
      }

      const status = normalizeBidState(bidDoc, blockchainBid);

      if (status !== bidDoc.status) {
        bidDoc.status = status;
        await bidDoc.save();
      }

      rows.push({
        bidId,
        certificateId: certId,
        supplierWallet: cert.owner,
        supplierName: formatWallet(cert.owner),
        quantity: Number(blockchainBid.quantity),
        originalPricePerMT: Number(blockchainBid.price),
        bidPricePerMT: bidDoc.counterPrice || Number(blockchainBid.price),
        status,
        approvedByRegistry: bidDoc.approvedByRegistry || blockchainBid.approvedByRegistry || false,
        submittedAt: bidDoc.createdAt,
        expiryAt: bidDoc.expiryAt,
      });
    }

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error("FETCH MY BIDS ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};

/*
====================================================
FETCH PENDING TRADES FOR REGISTRY APPROVAL
====================================================
*/
exports.getPendingTradeApprovals = async (_req, res) => {
  try {
    const totalBids = Number(await contract.bidCounter());
    const trades = [];

    for (let bidId = 1; bidId <= totalBids; bidId += 1) {
      const blockchainBid = await contract.bids(bidId);

      if (Number(blockchainBid.id) === 0) {
        continue;
      }

      // Only include bids that are accepted by supplier but not approved by registry
      if (!blockchainBid.accepted || blockchainBid.approvedByRegistry) {
        continue;
      }

      const certId = Number(blockchainBid.certificateId);
      const cert = await contract.certificates(certId);

      const batch = await SAF.findOne({ certificateId: certId }).lean();
      const bidDoc = await Bid.findOne({ bidId }).lean();

      trades.push({
        bidId,
        certificateId: certId,
        quantity: Number(blockchainBid.quantity),
        pricePerMT: Number(blockchainBid.price),
        totalValue: Number(blockchainBid.quantity) * Number(blockchainBid.price),
        sellerWallet: cert.owner,
        sellerName: formatWallet(cert.owner),
        buyerWallet: blockchainBid.airline,
        buyerName: getAirlineName(blockchainBid.airline),
        batchId: batch?.productionBatchId || `#${certId}`,
        feedstockType: batch?.feedstockType || "N/A",
        carbonIntensity: batch?.carbonIntensity || 0,
        impact: Math.round(Number(blockchainBid.quantity) * 0.84), // Rough CO2e reduction calculation
        blockchainState: statusLabel[Number(cert.status)] || "UNKNOWN",
        submittedAt: bidDoc?.createdAt || new Date(),
      });
    }

    res.json({ success: true, data: trades });
  } catch (err) {
    console.error("FETCH PENDING TRADES ERROR:", err);
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

    if (!bidId) {
      return res.status(400).json({ error: "bidId is required" });
    }

    console.log(`\n=== APPROVING TRADE ===`);
    console.log(`Bid ID: ${bidId}`);

    const blockchainBid = await contract.bids(bidId);

    if (Number(blockchainBid.id) === 0) {
      return res.status(400).json({ error: "Bid not found" });
    }

    if (!blockchainBid.accepted) {
      return res.status(400).json({ error: "Bid must be accepted by supplier before registry approval" });
    }

    if (blockchainBid.approvedByRegistry) {
      return res.status(400).json({ error: "Bid has already been approved by registry" });
    }

    const certId = Number(blockchainBid.certificateId);
    const cert = await contract.certificates(certId);
    const oldOwner = cert.owner;
    const newOwner = blockchainBid.airline;
    const quantity = Number(blockchainBid.quantity);

    console.log(`Certificate: ${certId}`);
    console.log(`Supplier (From): ${oldOwner}`);
    console.log(`Airline (To): ${newOwner}`);
    console.log(`Quantity: ${quantity} MT`);

    const wallet = getWallet("REGISTRY");
    const registryContract = contract.connect(wallet);

    const tx = await registryContract.approveTrade(bidId);
    const receipt = await tx.wait();

    console.log(`✅ Trade approved on-chain`);
    console.log(`Transaction Hash: ${tx.hash}`);
    console.log(`Gas Used: ${receipt.gasUsed.toString()}`);
    console.log(`Block: ${receipt.blockNumber}`);

    // Update bid document in MongoDB
    await Bid.findOneAndUpdate(
      { bidId: Number(bidId) },
      {
        status: "Accepted",
        approvedByRegistry: true,
      },
      { new: true }
    );

    console.log(`✅ Trade recorded in MongoDB`);

    res.json({
      message: "Trade Approved",
      data: {
        bidId: Number(bidId),
        certificateId: certId,
        supplier: oldOwner,
        airline: newOwner,
        quantity,
        txHash: tx.hash,
      },
    });
  } catch (err) {
    console.error("❌ APPROVE TRADE ERROR:", err);
    const sanitized = sanitizeError(err);
    res.status(500).json({ error: sanitized.message });
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
