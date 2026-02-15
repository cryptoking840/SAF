require("dotenv").config();

const express = require("express");
const cors = require("cors");              // ✅ ADD THIS
const connectDB = require("./config/db");
const safRoutes = require("./routes/safRoutes");

const app = express();

connectDB(); // ✅ this will now work


app.use(cors());

app.use(express.json());
app.use("/api", safRoutes);

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
