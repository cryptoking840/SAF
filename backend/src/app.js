require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { ethers } = require("ethers");
const connectDB = require("./config/db");
const safRoutes = require("./routes/safRoutes");
const authRoutes = require("./routes/authRoutes");
const { ensureBootstrapRegistryAdmin } = require("./bootstrap/ensureBootstrapRegistryAdmin");

let rateLimit;
let limiter;
let authLimiter;
const isDevelopment = process.env.NODE_ENV !== "production";

try {
  rateLimit = require("express-rate-limit");
  if (isDevelopment) {
    limiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 10000,
      message: "Too many requests from this IP, please try again later.",
      standardHeaders: true,
      legacyHeaders: false,
    });
    authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 1000,
      message: "Too many requests, please try again later.",
      standardHeaders: true,
      legacyHeaders: false,
    });
  } else {
    limiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      message: "Too many requests from this IP, please try again later.",
      standardHeaders: true,
      legacyHeaders: false,
    });
    authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 10,
      message: "Too many requests, please try again later.",
      standardHeaders: true,
      legacyHeaders: false,
    });
  }
} catch (_err) {
  console.warn("express-rate-limit not installed; running without request throttling.");
  limiter = (_req, _res, next) => next();
  authLimiter = (_req, _res, next) => next();
}

const app = express();

app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || [
      "http://localhost:5173",
      "http://localhost:3000",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: [
      "Content-Type",
      "x-wallet-address",
      "x-signature",
      "Authorization",
    ],
  })
);

app.use(express.json());
app.use("/api/", limiter);

const walletAuthMiddleware = (req, res, next) => {
  const walletAddress = req.headers["x-wallet-address"];

  if (!walletAddress || walletAddress.trim() === "") {
    return res.status(401).json({
      error: "Wallet address required in x-wallet-address header",
      code: "MISSING_WALLET",
    });
  }

  if (!ethers.isAddress(walletAddress)) {
    return res.status(400).json({
      error: "Invalid wallet address format",
      code: "INVALID_WALLET",
    });
  }

  req.user = { walletAddress: walletAddress.toLowerCase() };
  return next();
};

const errorSanitizer = (err, _req, res, _next) => {
  console.error("Unhandled Error:", err);
  const dev = process.env.NODE_ENV === "development";
  res.status(err.status || 500).json({
    error: dev ? err.message : "An error occurred. Please try again.",
    code: err.code || "INTERNAL_ERROR",
    ...(dev && { details: err.stack }),
  });
};

app.get("/", (_req, res) => {
  res.json({ status: "SAF Backend API Running", timestamp: new Date().toISOString() });
});

app.use("/api", safRoutes);
app.use("/api", authRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: "Route not found", code: "NOT_FOUND" });
});

app.use(errorSanitizer);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    await ensureBootstrapRegistryAdmin();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(
        `CORS enabled for: ${process.env.ALLOWED_ORIGINS || "localhost:5173, localhost:3000"}`
      );
    });
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
};

startServer();
