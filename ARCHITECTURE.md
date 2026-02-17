# SAF Marketplace - Architecture & Best Practices Guide

## Current Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   FRONTEND (React + Vite)               │
│  - Roles: Supplier, Inspector, Airline, Registry       │
│  - Pages for each role dashboard                        │
│  - API calls via safApi.js                              │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP/REST (Port 5000)
┌────────────────────▼────────────────────────────────────┐
│                  BACKEND (Node.js/Express)              │
│  - Controllers: Business logic for each role            │
│  - Models: MongoDB schemas (SAF, Bid)                   │
│  - Routes: API endpoints                                │
│  - Config: Blockchain & Database connections           │
└────────────────────┬────────────────────────────────────┘
                     │ ethers.js
┌────────────────────┼────────────────────────────────────┐
│                    │                                    │
│  ┌─────────────────▼──────────────┐  ┌──────────────┐  │
│  │   Smart Contract (Solidity)    │  │  MongoDB     │  │
│  │   - SAFMarketplace.sol         │  │  - Batches   │  │
│  │   - Role management            │  │  - Bids      │  │
│  │   - Marketplace logic          │  │  - Metadata  │  │
│  └───────────────────────────────┘  └──────────────┘  │
│                                                         │
│  Blockchain (Hardhat/Ethereum)                        │
└─────────────────────────────────────────────────────────┘
```

---

## State Management Design Issues

### Current Problem: Dual State (MongoDB + Blockchain)

The system currently maintains state in **TWO places**:

1. **MongoDB:** Tracks batch metadata, bid statuses, timestamps
2. **Blockchain:** Tracks certificate ownership, quantities, approvals

**Synchronization Issues:**
- If blockchain transaction succeeds but MongoDB save fails → data inconsistency
- If MongoDB update happens before blockchain confirmation → premature state changes
- No rollback mechanism if either fails midway

### Recommended Pattern: Event Sourcing

```javascript
// Instead of:
// 1. Update blockchain
// 2. Update MongoDB
// 3. Hope both succeed

// Do:
// 1. Listen for blockchain events
// 2. MongoDB records are derived from events
// 3. Single source of truth

// Example:
contract.on("TradeApproved", async (bidId, newChildId, event) => {
  // Create MongoDB record FROM blockchain event
  await Bid.updateOne(
    { bidId },
    { blockchainTxHash: event.transactionHash }
  );
});
```

---

## Authentication & Authorization Strategy

### Current State: None ❌
### Recommended: JWT + Wallet Signature

**Step 1: User Logs In with Wallet**
```javascript
// Frontend
const message = `Login to SAF: ${Date.now()}`;
const signature = await signer.signMessage(message);
// Send to backend: { walletAddress, signature, message }
```

**Step 2: Backend Verifies Signature**
```javascript
// Backend
const recoveredAddress = ethers.verifyMessage(message, signature);
if (recoveredAddress !== walletAddress) {
  return res.status(401).json({ error: "Invalid signature" });
}

// Create JWT token
const token = jwt.sign(
  { walletAddress: recoveredAddress, role: getUserRole(recoveredAddress) },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);
```

**Step 3: Frontend Sends JWT in All Requests**
```javascript
// Frontend API wrapper
const request = async (path, options = {}) => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`, // ✅ Add this
      ...options.headers,
    },
    ...options,
  });
  // ... rest
};
```

**Step 4: Backend Validates JWT on Protected Routes**
```javascript
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// Usage:
app.post("/api/saf/approve", authMiddleware, safController.approveSAF);
```

---

## Role-Based Access Control (RBAC)

### Current: No validation
### Recommended: Role middleware

```javascript
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `This action requires one of: ${roles.join(', ')}` 
      });
    }
    
    next();
  };
};

// Usage:
app.post("/api/saf/register", 
  authMiddleware,
  requireRole('SUPPLIER'),
  safController.registerSAF
);

app.post("/api/saf/approve",
  authMiddleware,
  requireRole('REGISTRY'),
  safController.approveSAF
);

app.post("/api/saf/bid",
  authMiddleware,
  requireRole('AIRLINE'),
  safController.placeBid
);
```

---

## Data Flow Improvements

### 1. SAF Registration Flow (Improved)

```
┌──────────────┐
│ Supplier     │
└──────┬───────┘
       │ 1. Submit batch (Node.js/Express)
       │    {batchId, quantity, feedstockType, etc}
       ▼
┌──────────────────────────────────────┐
│ MongoDB: SAF Collection              │
│ status: "PENDING_INSPECTION"         │
│ createdBy: supplier_wallet           │
└──────────────────────────────────────┘
       │ 2. Inspector reviews metadata
       ▼
┌──────────────────────────────────────┐
│ MongoDB: SAF Collection              │
│ status: "INSPECTED"                  │
│ inspectedBy: inspector_wallet        │
│ inspectionDate: timestamp            │
└──────────────────────────────────────┘
       │ 3. Registry approves + registers on blockchain
       ▼
   ┌────────────────────────────────┐
   │ BLOCKCHAIN CALL                │
   │ registerSAF(quantity, supplier) │
   │ event: SAFRegistered           │
   └────────────────────────────────┘
       │ 4. Listen for blockchain event
       ▼
┌──────────────────────────────────────┐
│ MongoDB: SAF Collection              │
│ status: "CERTIFIED"                  │
│ certificateId: 1234                  │
│ txHash: 0x...                        │
└──────────────────────────────────────┘
```

### 2. Bidding Flow (Improved)

```
Airline                  Backend         Blockchain       MongoDB
  │                        │                │              │
  │─ placeBid ────────────>│                │              │
  │  {certId, qty, price}  │                │              │
  │                        │─ Validate ────>│              │
  │                        │  cert exists   │              │
  │                        │  qty available │              │
  │                        │<─ OK ──────────│              │
  │                        │                │              │
  │                        │─ Contract ────>│              │
  │                        │  placeBid()    │              │
  │                        │<─ bidId ───────│              │
  │                        │                │              │
  │                        │─ Save to DB ─────────────────>│
  │                        │  {bidId,status:Pending}      │
  │<─ Success ────────────│<─ OK ──────────────────────│
  │  {bidId}              │
  │
  │                       [3-day later]
  │
Supplier                Back-end        Blockchain       MySQL
  │                        │                │              │
  │─ acceptBid ───────────>│                │              │
  │  {bidId}               │                │              │
  │                        │─ Check ───────>│              │
  │                        │  bid accepted? │              │
  │                        │<─ false ───────│              │
  │                        │                │              │
  │                        │─ Contract ────>│              │
  │                        │  acceptBid()   │              │
  │                        │<─ success ─────│              │
  │                        │                │              │
  │                        │─ Update DB ───────────────────>│
  │                        │  status:Accepted               │
  │<─ Success ────────────│<─ OK ──────────────────────│
```

---

## Performance Optimization Roadmap

### Phase 1: Current Issues (Fix Now) 🔴
- [ ] Remove duplicate code
- [ ] Add proper indexing to MongoDB
  ```javascript
  safSchema.index({ certificateId: 1 });
  safSchema.index({ supplierWallet: 1 });
  bidSchema.index({ bidId: 1 });
  bidSchema.index({ airlineWallet: 1 });
  ```

### Phase 2: Query Optimization (Next Sprint) 🟠
- [ ] Replace loops with batch queries
  ```javascript
  // ❌ BAD: N queries
  for (let bidId = 1; bidId <= totalBids; bidId++) {
    const bid = await contract.bids(bidId);
  }
  
  // ✅ GOOD: Use events/indexing
  const recentBids = await Bid.find({
    supplierWallet: address,
    createdAt: { $gte: lastFetch }
  }).limit(50);
  ```

### Phase 3: Caching (Later Sprint) 🟡
- [ ] Implement Redis for:
  - Marketplace listings
  - User's active bids
  - Frequently accessed certificates
  ```javascript
  const redis = require('redis');
  const client = redis.createClient();
  
  // Cache marketplace listings (5 min TTL)
  const key = `marketplace:listings`;
  const cached = await client.get(key);
  if (cached) return JSON.parse(cached);
  
  const listings = await getMarketplaceListings();
  await client.setex(key, 300, JSON.stringify(listings));
  ```

### Phase 4: Pagination 🟠
- [ ] Add pagination to list endpoints
  ```javascript
  exports.getMarketplaceListings = async (req, res) => {
    const page = req.query.page || 1;
    const limit = req.query.limit || 20;
    const skip = (page - 1) * limit;
    
    const listings = await contract.certificates
      .slice(skip, skip + limit);
      
    const total = await contract.certificateCounter();
    
    res.json({
      data: listings,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        perPage: limit
      }
    });
  };
  ```

---

## Testing Strategy

### Unit Tests (Mocha/Chai)
```javascript
describe('placeBid', () => {
  it('should validate certificate ID is positive', async () => {
    const res = await placeBid({ certId: -1, quantity: 100, price: 500 });
    expect(res.status).to.equal(400);
  });
  
  it('should prevent bids on non-listed certificates', async () => {
    // Create unlisted cert
    // Attempt bid
    // Expect failure
  });
});
```

### Integration Tests
```javascript
describe('Full bid flow', () => {
  it('completes supplier -> airline -> registry flow', async () => {
    // 1. Supplier registers SAF
    // 2. Inspector approves
    // 3. Registry certifies
    // 4. Airline bids
    // 5. Supplier accepts
    // 6. Registry approves trade
    // Verify final state
  });
});
```

### Contract Tests (Hardhat)
```javascript
describe('SAFMarketplace', () => {
  it('creates child certificate with correct ownership', async () => {
    // Current test only checks happy path
    // Add: unauthorized access attempts
    // Add: double-acceptance scenarios
    // Add: expired bid handling
  });
});
```

---

## Environment Configuration Best Practices

### Structure
```
project/
├── .env.example              (Template - commit this)
├── .env.development          (Local dev - .gitignore)
├── .env.staging              (Staging env - secrets mgmt)
├── .env.production           (Prod - never local)
├── .env.test                 (Test env)
└── config/
    └── environment.js        (Validation & defaults)
```

### Config Validation
```javascript
// config/environment.js
const requiredVars = [
  'RPC_URL',
  'CONTRACT_ADDRESS',
  'PRIVATE_KEY_REGISTRY',
  'MONGO_URI'
];

requiredVars.forEach(key => {
  if (!process.env[key]) {
    throw new Error(`Missing required env variable: ${key}`);
  }
});

module.exports = {
  rpcUrl: process.env.RPC_URL,
  contractAddress: process.env.CONTRACT_ADDRESS,
  mongoUri: process.env.MONGO_URI,
  isDevelopment: process.env.NODE_ENV === 'development',
  // ... etc
};
```

---

## Error Handling Strategy

### Classification
```javascript
// 1. Validation Errors (400)
//    - Invalid input format
//    - Missing required fields

// 2. Authentication Errors (401)
//    - Invalid token
//    - No token provided

// 3. Authorization Errors (403)
//    - User lacks required role
//    - Insufficient permissions

// 4. Not Found Errors (404)
//    - Certificate doesn't exist
//    - Bid not found

// 5. Conflict Errors (409)
//    - Bid already accepted
//    - Certificate already listed

// 6. State Errors (422)
//    - Cannot accept expired bid
//    - Cannot list unlisted certificate

// 7. Server Errors (500)
//    - Blockchain RPC failure
//    - Database connection error
```

### Standard Response Format
```javascript
{
  "success": false,
  "error": "Human-readable message",
  "code": "ERROR_CODE",
  "details": {
    // Optional additional context
  },
  "timestamp": "2026-02-18T10:30:00Z"
}
```

---

## Security Checklist for Production

- [ ] All private keys in environment variables (never hardcoded)
- [ ] JWT secret stored securely (use AWS Secrets Manager or HashiCorp Vault)
- [ ] HTTPS enforced (not HTTP)
- [ ] CORS restricted to known domains
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] SQL/NoSQL injection prevention (use parameterized queries)
- [ ] XSS prevention (sanitize output)
- [ ] CSRF tokens for state-changing operations
- [ ] Wallet signature verification
- [ ] Contract audit completed
- [ ] Testnet deployment + user testing
- [ ] Monitoring & alerting configured
- [ ] Incident response plan documented

---

## Monitoring & Logging

### Suggested Stack
```javascript
// Use Winston for structured logging
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Log all blockchain transactions
logger.info('Bid accepted', {
  bidId: 123,
  txHash: '0x...',
  supplier: '0x...',
  timestamp: new Date()
});

// Setup Sentry for error tracking
const Sentry = require("@sentry/node");
Sentry.init({ dsn: process.env.SENTRY_DSN });
```

---

## Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Code review completed
- [ ] Staging environment validated
- [ ] Database backups configured
- [ ] Rollback plan documented
- [ ] Monitoring alerts configured

### Deployment Steps
1. Deploy smart contract (if updated)
2. Deploy backend (zero-downtime if possible)
3. Run database migrations
4. Deploy frontend
5. Smoke tests on production
6. Monitor metrics for 24 hours

### Post-Deployment
- [ ] Verify all endpoints working
- [ ] Check database consistency
- [ ] Monitor error rates
- [ ] Collect user feedback

