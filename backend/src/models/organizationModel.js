const mongoose = require("mongoose");

const organizationSchema = new mongoose.Schema(
  {
    organizationName: { type: String, required: true, trim: true },
    organizationType: {
      type: String,
      required: true,
      enum: ["supplier", "airline", "inspector", "registry", "trader"],
    },
    businessRegistrationNumber: { type: String, required: true, trim: true },
    country: { type: String, required: true, uppercase: true, trim: true },
    officialEmail: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    contactPersonName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    status: {
      type: String,
      required: true,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
    role: {
      type: String,
      enum: ["supplier", "airline", "inspector", "registry", "trader"],
      default: null,
    },
  },
  { timestamps: true }
);

organizationSchema.index({ officialEmail: 1 }, { unique: true });

module.exports = mongoose.model("Organization", organizationSchema);
