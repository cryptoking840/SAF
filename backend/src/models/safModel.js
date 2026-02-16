const mongoose = require("mongoose");

const safSchema = new mongoose.Schema(
  {
    certificateId: {
      type: Number,
    },
    productionBatchId: {
      type: String,
      required: true,
    },
    productionDate: {
      type: Date,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    feedstockType: {
      type: String,
      required: true,
    },
    carbonIntensity: {
      type: Number,
      required: true,
    },
    productionPathway: {
      type: String,
      default: "HEFA-SPK",
    },
    supplierWallet: {
      type: String,
      required: true,
    },
    txHash: {
      type: String,
    },
    status: {
      type: String,
      default: "PENDING_BLOCKCHAIN",
    },
    supplierWallet: {
      type: String,
      required: true
    },

  },
  { timestamps: true }
);

module.exports = mongoose.model("SAF", safSchema);
