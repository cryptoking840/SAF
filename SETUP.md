# Installation & Setup Guide

## New Dependencies to Install

### Backend
The code review has added one new security dependency. Install it with:

```bash
cd backend
npm install express-rate-limit
```

Or if you're using npm 7+, from the root:
```bash
npm install --save express-rate-limit --prefix backend
```

## Environment Variables Setup

### 1. Backend Configuration
Copy the example file and update with your values:

```bash
cp backend/.env.example backend/.env
```

Then edit `backend/.env` and add:
- `RPC_URL`: Your Ethereum RPC endpoint (e.g., http://127.0.0.1:8545)
- `CONTRACT_ADDRESS`: Your deployed SAFMarketplace contract address
- `PRIVATE_KEY_REGISTRY`: Registry wallet private key
- `PRIVATE_KEY_SUPPLIER`: Supplier wallet private key (test only)
- `PRIVATE_KEY_AIRLINE`: Airline wallet private key (test only)
- `SUPPLIER_ADDRESS`: Supplier wallet public address
- `AIRLINE_ADDRESS`: Airline wallet public address
- `MONGO_URI`: MongoDB connection string (default: mongodb://localhost:27017/saf)
- `PORT`: API port (default: 5000)
- `NODE_ENV`: development or production (default: development)
- `ALLOWED_ORIGINS`: Comma-separated list of allowed origins (default: localhost)

### 2. Frontend Configuration
Copy the example file:

```bash
cp frontend/.env.example frontend/.env
```

Then edit `frontend/.env`:
- `VITE_API_URL`: Backend API URL (default: http://localhost:5000/api)
- `VITE_ENV`: Application environment (development or production)

## Running the Application

### Development Mode (with hot reload)

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm run dev
```

### Production Mode

**Backend:**
```bash
npm start
```

**Frontend:**
```bash
npm run build
npm run preview
```

## Changes Made

### Critical Fixes (Code Issues)
✅ Fixed duplicate variable declarations in `placeBid()` function
✅ Fixed unreachable duplicate return statement in `listCertificate()`
✅ Added wallet address validation in `registerSAF()`

### Security Enhancements
✅ Added CORS configuration with whitelist
✅ Added rate limiting middleware (100 req/15min, 10 req/15min for state changes)
✅ Added error message sanitization (production vs development)
✅ Added authentication middleware skeleton (ready for JWT implementation)
✅ Added 404 handler
✅ Added global error handler

### Configuration Improvements
✅ Created `.env.example` files for both backend and frontend
✅ Added NODE_ENV to npm scripts
✅ Updated frontend API URL to use environment variables
✅ Added express-rate-limit dependency

### Files Modified
- `backend/src/app.js` - Added CORS, rate limiting, error handling
- `backend/src/controllers/safController.js` - Fixed duplicates, added validation, sanitized errors
- `backend/package.json` - Updated scripts with NODE_ENV, added express-rate-limit
- `backend/.env.example` - Created with all required variables
- `frontend/src/api/safApi.js` - Updated to use environment variables
- `frontend/.env.example` - Created with API configuration

## Testing the Fixes

### 1. Test Backend Startup
```bash
cd backend
npm run dev
```

Expected output:
```
🚀 Server running on port 5000
📍 Environment: development
🔒 CORS enabled for: localhost:5173, localhost:3000
✅ MongoDB Connected (if DB is running)
```

### 2. Test CORS Configuration
```bash
curl -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  http://localhost:5000/api/saf/register
```

### 3. Test Rate Limiting
Making 11 rapid requests should trigger the rate limit:
```bash
for i in {1..11}; do curl http://localhost:5000/api/saf/register; echo "\n"; done
```

Response should include rate limit exceeded after the 10th request.

### 4. Test Error Sanitization
- **Development**: Detailed error messages shown
- **Production**: Generic error messages (set `NODE_ENV=production`)

## Next Steps (From Code Review)

### Priority 1 (Security Critical)
- [ ] Implement JWT authentication for wallet verification
- [ ] Add request signature verification
- [ ] Test blockchain error scenarios
- [ ] Add database transaction rollback on failed blockchain operations

### Priority 2 (High Impact)
- [ ] Add comprehensive test coverage
- [ ] Implement MongoDB indexes for better query performance
- [ ] Add API request logging
- [ ] Setup monitoring and alerting

### Priority 3 (Improvements)
- [ ] Replace wallet fallback with required authentication
- [ ] Implement caching for marketplace listings
- [ ] Add pagination to list endpoints
- [ ] Optimize blockchain queries with event indexing

For detailed information, see:
- `CODE_REVIEW.md` - Complete analysis of all 26 issues
- `QUICK_FIXES.md` - Before/after code examples
- `ARCHITECTURE.md` - System design and best practices

