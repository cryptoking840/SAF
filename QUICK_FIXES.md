# SAF Marketplace - Quick Fixes for Critical Issues

## Fix #1: Remove Duplicate Variable Declarations

**File:** `backend/src/controllers/safController.js`
**Lines:** 378-384 (DELETE THESE LINES)

```javascript
// REMOVE THIS BLOCK - These are duplicates of lines 362-365
const certificateId = Number(certId);
const bidQuantity = Number(quantity);
const bidPrice = Number(price);
```

**Before:**
```javascript
exports.placeBid = async (req, res) => {
  try {
    const { certId, certificateId: certificateIdInput, quantity, price } = req.body;

    const rawCertificateId = certId ?? certificateIdInput;
    const certificateId = Number(rawCertificateId);        // LINE 362
    const bidQuantity = Number(quantity);                  // LINE 363
    const bidPrice = Number(price);                        // LINE 364

    if (!Number.isFinite(certificateId) || certificateId <= 0) {
      return res.status(400).json({ error: "certId must be a positive number", receivedCertId: rawCertificateId ?? null });
    }

    if (!Number.isFinite(bidQuantity) || bidQuantity <= 0) {
      return res.status(400).json({ error: "quantity must be a positive number" });
    }

    if (!Number.isFinite(bidPrice) || bidPrice <= 0) {
      return res.status(400).json({ error: "price must be a positive number" });
    }

    const certificateId = Number(certId);                  // LINE 378 - REMOVE
    const bidQuantity = Number(quantity);                  // LINE 379 - REMOVE
    const bidPrice = Number(price);                        // LINE 380 - REMOVE

    // ... rest of function
```

**After:**
Remove lines 378-384 entirely. Keep only the first declarations at lines 362-365.

---

## Fix #2: Remove Duplicate Return Statement

**File:** `backend/src/controllers/safController.js`
**Lines:** Around 333-335

**Before:**
```javascript
if (!Number.isFinite(certificateId) || certificateId <= 0) {
  return res.status(400).json({ error: "certId must be a positive number", receivedCertId: certId ?? null });
  return res.status(400).json({ error: "certId must be a positive number", receivedCertId: rawCertificateId ?? null }); // ❌ REMOVE THIS LINE
}
```

**After:**
```javascript
if (!Number.isFinite(certificateId) || certificateId <= 0) {
  return res.status(400).json({ error: "certId must be a positive number", receivedCertId: certId ?? null });
}
```

---

## Fix #3: Add Basic Authentication Middleware

**File:** `backend/src/app.js`

**Add this new middleware:**
```javascript
// TEMPORARY: Basic wallet signature verification (replace with proper JWT in production)
const walletAuthMiddleware = (req, res, next) => {
  const walletAddress = req.headers["x-wallet-address"];
  const signature = req.headers["x-signature"];
  
  // TODO: Implement proper signature verification using ethers.verifyMessage()
  // For MVP: Just require wallet address to be present
  
  if (!walletAddress || walletAddress === '' || !ethers.isAddress(walletAddress)) {
    return res.status(401).json({ error: "Valid wallet address required in x-wallet-address header" });
  }
  
  req.user = { walletAddress: walletAddress.toLowerCase() };
  next();
};
```

**Then protect sensitive endpoints (add to routes that modify state):**
```javascript
// Apply to POST/PUT/DELETE operations
app.post("/api/saf/register", walletAuthMiddleware, safController.registerSAF);
app.post("/api/saf/list", walletAuthMiddleware, safController.listCertificate);
app.post("/api/saf/bid", walletAuthMiddleware, safController.placeBid);
// ... etc
```

---

## Fix #4: Add Wallet Address Validation

**File:** `backend/src/controllers/safController.js`

**In `registerSAF` function, add after line 150:**
```javascript
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

    // ✅ ADD THIS VALIDATION
    const supplierWallet = process.env.SUPPLIER_ADDRESS;
    if (!supplierWallet || !ethers.isAddress(supplierWallet)) {
      return res.status(500).json({ error: "Invalid supplier wallet configuration" });
    }
    // END ADD

    const safDoc = await SAF.create({
      productionBatchId,
      productionDate,
      quantity,
      feedstockType,
      carbonIntensity,
      productionPathway,
      supplierWallet: supplierWallet.toLowerCase(),  // ✅ Normalize address
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
```

---

## Fix #5: Add CORS Security Headers

**File:** `backend/src/app.js`

**Replace:**
```javascript
app.use(cors());
```

**With:**
```javascript
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'x-wallet-address', 'x-signature']
}));
```

**Add to `.env` file:**
```
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

---

## Fix #6: Add Rate Limiting

**File:** `backend/src/app.js`

**Step 1: Install package**
```bash
npm install express-rate-limit
```

**Step 2: Add to app.js (after cors middleware):**
```javascript
const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per windowMs
  message: "Too many requests from this IP, please try again later."
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // Stricter for auth operations
  message: "Too many authentication attempts, please try again later."
});

// Apply rate limiting
app.use("/api/", limiter);

// Stricter limits for bid and approval endpoints
app.post("/api/saf/*", authLimiter);
```

---

## Fix #7: Sanitize Error Messages

**File:** `backend/src/controllers/safController.js`

**Replace all catch blocks with:**
```javascript
catch (err) {
  console.error("OPERATION_ERROR:", err);
  
  const isDevelopment = process.env.NODE_ENV === 'development';
  const errorMessage = isDevelopment ? err.message : 'Operation failed. Please try again.';
  
  res.status(500).json({ error: errorMessage });
}
```

**Example for approveSAF:**
```javascript
} catch (err) {
  console.error("REGISTRY APPROVAL ERROR:", err);
  
  const isDevelopment = process.env.NODE_ENV === 'development';
  const errorMessage = isDevelopment ? err.message : 'Approval failed. Please try again.';
  
  res.status(500).json({ error: errorMessage });
}
```

---

## Fix #8: Add .env.example

**Create file:** `backend/.env.example`

```bash
# Blockchain Configuration
RPC_URL=http://127.0.0.1:8545
CONTRACT_ADDRESS=0x...

# Private Keys (KEEP SECRET!)
PRIVATE_KEY_REGISTRY=0x...
PRIVATE_KEY_SUPPLIER=0x...
PRIVATE_KEY_AIRLINE=0x...

# Wallet Addresses
SUPPLIER_ADDRESS=0x...
AIRLINE_ADDRESS=0x...

# Database
MONGO_URI=mongodb://localhost:27017/saf

# Server
PORT=5000
NODE_ENV=development

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Optional
SUPPLIER_PRIVATE_KEYS={}
AIRLINE_DIRECTORY={}
DEFAULT_BID_EXPIRY_HOURS=72
```

**Create file:** `frontend/.env.example`

```bash
VITE_API_URL=http://localhost:5000/api
```

---

## Fix #9: Update Frontend API Base URL

**File:** `frontend/src/api/safApi.js`

**Replace:**
```javascript
const BASE_URL = "http://localhost:5000/api";
```

**With:**
```javascript
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
```

---

## Fix #10: Update Package.json with NODE_ENV

**File:** `backend/package.json`

**Replace scripts section:**
```json
"scripts": {
  "start": "NODE_ENV=production node src/app.js",
  "dev": "NODE_ENV=development nodemon src/app.js",
  "test": "echo \"Error: no test specified\" && exit 1"
}
```

---

## Implementation Checklist

- [ ] Fix #1: Remove duplicate variable declarations (2 min)
- [ ] Fix #2: Remove duplicate return statement (1 min)
- [ ] Fix #3: Add authentication middleware (5 min)
- [ ] Fix #4: Add wallet validation (3 min)
- [ ] Fix #5: Add CORS security (3 min)
- [ ] Fix #6: Add rate limiting (5 min)
- [ ] Fix #7: Sanitize error messages (10 min)
- [ ] Fix #8: Create .env.example files (3 min)
- [ ] Fix #9: Update frontend API URL (2 min)
- [ ] Fix #10: Update package.json (2 min)

**Total time to fix critical issues: ~35 minutes**

---

## Testing After Fixes

```bash
# 1. Install dependencies for rate limiting
npm install express-rate-limit

# 2. Test backend with proper headers
curl -X GET http://localhost:5000/ \
  -H "x-wallet-address: 0x742d35Cc6634C0532925a3b844Bc9e7595f42bE"

# 3. Test rate limiting (should block after 10 requests)
for i in {1..15}; do curl http://localhost:5000/api/saf/register -X POST; done

# 4. Test error sanitization (check logs vs response)
# Response should be generic in production, detailed in development
```

