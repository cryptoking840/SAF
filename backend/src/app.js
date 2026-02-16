require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const safRoutes = require("./routes/safRoutes");

const app = express();

// Connect MongoDB
connectDB();

// Middlewares
app.use(cors());
app.use(express.json());

// ✅ Root health check route
app.get("/", (req, res) => {
  res.send("✅ SAF Backend API Running");
});

// API Routes
app.use("/api", safRoutes);

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
