const mongoose = require("mongoose");

const bidSchema = new mongoose.Schema(
  {
    bidId: { type: Number, required: true, unique: true },
    certificateId: { type: Number, required: true },
    supplierWallet: { type: String, required: true },
    airlineWallet: { type: String, required: true },
    status: {
      type: String,
      enum: ["Pending", "Countered", "Accepted", "Denied", "Expired"],
      default: "Pending",
    },
    counterPrice: { type: Number },
    approvedByRegistry: { type: Boolean, default: false },
    expiryAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Bid", bidSchema);
