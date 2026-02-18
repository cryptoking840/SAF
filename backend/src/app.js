require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const safRoutes = require("./routes/safRoutes");
const authRoutes = require("./routes/authRoutes");
const { ethers } = require("ethers");

// ===== Optional Rate Limiting =====
let rateLimit, limiter, authLimiter;
const isDevelopment = process.env.NODE_ENV !== 'production';

try {
  rateLimit = require("express-rate-limit");
  
  if (isDevelopment) {
    // Relaxed limits for development
    limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 10000, // Very high limit for development
      message: "Too many requests from this IP, please try again later.",
      standardHeaders: true,
      legacyHeaders: false
    });

    authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 1000, // High limit for development
      message: "Too many requests, please try again later.",
      standardHeaders: true,
      legacyHeaders: false
    });
  } else {
    // Strict limits for production
    limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // 100 requests per windowMs
      message: "Too many requests from this IP, please try again later.",
      standardHeaders: true,
      legacyHeaders: false
    });

    authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 10, // Stricter limits for state-changing operations
      message: "Too many requests, please try again later.",
      standardHeaders: true,
      legacyHeaders: false
    });
  }
} catch (err) {
  // Rate limiting module not installed - use pass-through middleware
  console.warn("⚠️  express-rate-limit not installed. Install with: npm install express-rate-limit");
  limiter = (req, res, next) => next();
  authLimiter = (req, res, next) => next();
}

const app = express();

// Connect MongoDB
connectDB();

// ===== CORS Configuration =====
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'x-wallet-address', 'x-signature', 'Authorization']
}));

// Middlewares
app.use(express.json());

// Apply rate limiting (or pass-through if not installed)
app.use("/api/", limiter);

// ===== Authentication & Authorization Middleware (MVP) =====
const walletAuthMiddleware = (req, res, next) => {
  const walletAddress = req.headers["x-wallet-address"];
  
  if (!walletAddress || walletAddress.trim() === '') {
    return res.status(401).json({ 
      error: "Wallet address required in x-wallet-address header",
      code: "MISSING_WALLET"
    });
  }

  if (!ethers.isAddress(walletAddress)) {
    return res.status(400).json({ 
      error: "Invalid wallet address format",
      code: "INVALID_WALLET"
    });
  }

  req.user = { walletAddress: walletAddress.toLowerCase() };
  next();
};

// ===== Error Sanitization Middleware =====
const errorSanitizer = (err, req, res, next) => {
  console.error("Unhandled Error:", err);
  
  const isDevelopment = process.env.NODE_ENV === 'development';
  const errorMessage = isDevelopment ? err.message : 'An error occurred. Please try again.';
  
  res.status(err.status || 500).json({
    error: errorMessage,
    code: err.code || 'INTERNAL_ERROR',
    ...(isDevelopment && { details: err.stack })
  });
};

// ✅ Root health check route
app.get("/", (req, res) => {
  res.json({ status: "✅ SAF Backend API Running", timestamp: new Date().toISOString() });
});

// API Routes (with auth middleware on state-changing operations)
app.use("/api", safRoutes);
app.use("/api", authRoutes);

// ===== 404 Handler =====
app.use((req, res) => {
  res.status(404).json({ 
    error: "Route not found",
    code: "NOT_FOUND"
  });
});

// ===== Global Error Handler =====
app.use(errorSanitizer);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔒 CORS enabled for: ${process.env.ALLOWED_ORIGINS || 'localhost:5173, localhost:3000'}`);
});
