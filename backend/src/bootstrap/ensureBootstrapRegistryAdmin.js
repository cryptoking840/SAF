const bcrypt = require("bcryptjs");
const Organization = require("../models/organizationModel");

async function ensureBootstrapRegistryAdmin() {
  const email = String(process.env.BOOTSTRAP_REGISTRY_EMAIL || "").trim().toLowerCase();
  const password = String(process.env.BOOTSTRAP_REGISTRY_PASSWORD || "").trim();
  const name = String(process.env.BOOTSTRAP_REGISTRY_NAME || "").trim();

  if (!email || !password || !name) {
    console.log("Bootstrap registry admin skipped: missing BOOTSTRAP_REGISTRY_EMAIL / PASSWORD / NAME");
    return;
  }

  const defaults = {
    organizationName: name,
    organizationType: "registry",
    businessRegistrationNumber: String(process.env.BOOTSTRAP_REGISTRY_REG_NO || "REGISTRY-BOOTSTRAP-001").trim(),
    country: String(process.env.BOOTSTRAP_REGISTRY_COUNTRY || "US").trim().toUpperCase(),
    officialEmail: email,
    contactPersonName: name,
    phone: String(process.env.BOOTSTRAP_REGISTRY_PHONE || "0000000000").trim(),
    address: String(process.env.BOOTSTRAP_REGISTRY_ADDRESS || "Bootstrap Registry Address").trim(),
    status: "APPROVED",
    role: "registry",
  };

  const existingByEmail = await Organization.findOne({ officialEmail: email });
  if (existingByEmail) {
    existingByEmail.organizationType = "registry";
    existingByEmail.status = "APPROVED";
    existingByEmail.role = "registry";
    existingByEmail.organizationName = existingByEmail.organizationName || defaults.organizationName;
    existingByEmail.businessRegistrationNumber = existingByEmail.businessRegistrationNumber || defaults.businessRegistrationNumber;
    existingByEmail.country = existingByEmail.country || defaults.country;
    existingByEmail.contactPersonName = existingByEmail.contactPersonName || defaults.contactPersonName;
    existingByEmail.phone = existingByEmail.phone || defaults.phone;
    existingByEmail.address = existingByEmail.address || defaults.address;
    existingByEmail.passwordHash = await bcrypt.hash(password, 10);
    await existingByEmail.save();

    console.log(`Bootstrap registry admin ensured (updated): ${email}`);
    return;
  }

  const existingApprovedRegistry = await Organization.findOne({
    role: "registry",
    status: "APPROVED",
  }).lean();

  if (existingApprovedRegistry) {
    console.log(
      `Bootstrap note: another approved registry exists (${existingApprovedRegistry.officialEmail}). Creating configured bootstrap account anyway: ${email}`
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await Organization.create({
    ...defaults,
    passwordHash,
  });

  console.log(`Bootstrap registry admin ensured (created): ${email}`);
}

module.exports = { ensureBootstrapRegistryAdmin };
