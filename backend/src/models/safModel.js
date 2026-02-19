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
    producer: {
      type: String,
      required: true,
      trim: true,
    },
    blendingRatio: {
      type: Number,
      required: true,
    },
    productionLocationCity: {
      type: String,
      required: true,
      trim: true,
    },
    productionLocationState: {
      type: String,
      required: true,
      trim: true,
    },
    productionLocationCountry: {
      type: String,
      required: true,
      trim: true,
    },
    productionLocationPincode: {
      type: String,
      required: true,
      trim: true,
    },
    soNumber: {
      type: String,
      required: true,
      trim: true,
    },
    buyer: {
      type: String,
      required: true,
      trim: true,
    },
    deliveryCountry: {
      type: String,
      required: true,
      trim: true,
    },
    deliveryState: {
      type: String,
      required: true,
      trim: true,
    },
    deliveryCity: {
      type: String,
      required: true,
      trim: true,
    },
    deliveryZipcode: {
      type: String,
      required: true,
      trim: true,
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
  },
  { timestamps: true }
);

module.exports = mongoose.model("SAF", safSchema);
