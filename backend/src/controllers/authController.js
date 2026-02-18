const bcrypt = require("bcryptjs");
const Organization = require("../models/organizationModel");

const blockedDomains = [
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "rediffmail.com",
  "protonmail.com",
];

const isNonEmpty = (value) => typeof value === "string" && value.trim().length > 0;
const isAlphanumeric = (value) => /^[a-zA-Z0-9-_/]+$/.test(value);
const isIsoCountry = (value) => /^[A-Z]{2}$/.test(value);
const isNumeric = (value) => /^[0-9]+$/.test(value);

exports.registerOrganization = async (req, res) => {
  try {
    const {
      organizationName,
      organizationType,
      businessRegistrationNumber,
      country,
      officialEmail,
      password,
      confirmPassword,
      contactPersonName,
      phone,
      address,
    } = req.body;

    if (!isNonEmpty(organizationName)) {
      return res.status(400).json({ error: "Organization Name is required" });
    }

    if (!["supplier", "airline", "inspector", "registry", "trader"].includes(organizationType)) {
      return res.status(400).json({ error: "Invalid Organization Type" });
    }

    if (!isNonEmpty(businessRegistrationNumber) || !isAlphanumeric(businessRegistrationNumber)) {
      return res.status(400).json({ error: "Business Registration Number must be alphanumeric" });
    }

    const normalizedCountry = String(country || "").trim().toUpperCase();
    if (!isIsoCountry(normalizedCountry)) {
      return res.status(400).json({ error: "Country must be a valid ISO country code (e.g. US)" });
    }

    const normalizedEmail = String(officialEmail || "").trim().toLowerCase();
    const emailParts = normalizedEmail.split("@");
    if (emailParts.length !== 2 || !emailParts[0] || !emailParts[1]) {
      return res.status(400).json({ error: "Official Email must be valid" });
    }

    const emailDomain = emailParts[1];
    if (blockedDomains.includes(emailDomain)) {
      return res.status(400).json({ error: "Public email domains are not allowed. Use official corporate email." });
    }

    if (!isNonEmpty(password) || password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Confirm Password must match Password" });
    }

    if (!isNonEmpty(contactPersonName)) {
      return res.status(400).json({ error: "Contact Person Name is required" });
    }

    if (!isNonEmpty(phone) || !isNumeric(String(phone))) {
      return res.status(400).json({ error: "Phone must be numeric" });
    }

    if (!isNonEmpty(address)) {
      return res.status(400).json({ error: "Address is required" });
    }

    const existing = await Organization.findOne({ officialEmail: normalizedEmail }).lean();
    if (existing) {
      return res.status(409).json({ error: "Organization with this email already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    let status = "PENDING";
    let role = null;

    if (organizationType === "registry") {
      const existingRegistryCount = await Organization.countDocuments({ organizationType: "registry" });
      if (existingRegistryCount === 0) {
        status = "APPROVED";
        role = "registry";
      }
    }

    const created = await Organization.create({
      organizationName: organizationName.trim(),
      organizationType,
      businessRegistrationNumber: businessRegistrationNumber.trim(),
      country: normalizedCountry,
      officialEmail: normalizedEmail,
      passwordHash,
      contactPersonName: contactPersonName.trim(),
      phone: String(phone).trim(),
      address: address.trim(),
      status,
      role,
    });

    return res.status(201).json({
      message:
        status === "APPROVED"
          ? "Registry bootstrap account approved. You can login now."
          : "Registration submitted. Awaiting Registry approval.",
      data: {
        id: created._id,
        officialEmail: created.officialEmail,
        status: created.status,
      },
    });
  } catch (err) {
    console.error("REGISTER ORGANIZATION ERROR:", err);
    return res.status(500).json({ error: "Failed to register organization" });
  }
};

exports.loginOrganization = async (req, res) => {
  try {
    const { officialEmail, password } = req.body;

    const normalizedEmail = String(officialEmail || "").trim().toLowerCase();
    if (!normalizedEmail || !password) {
      return res.status(400).json({ error: "officialEmail and password are required" });
    }

    const org = await Organization.findOne({ officialEmail: normalizedEmail });
    if (!org) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const matches = await bcrypt.compare(password, org.passwordHash);
    if (!matches) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (org.status === "REJECTED") {
      return res.status(403).json({
        error: "Registration was rejected by Registry Admin. Login is blocked.",
        status: org.status,
      });
    }

    if (org.status !== "APPROVED") {
      return res.status(403).json({
        error: "Registration submitted. Awaiting Registry approval.",
        status: org.status,
      });
    }

    return res.json({
      message: "Login successful",
      data: {
        id: org._id,
        organizationName: org.organizationName,
        organizationType: org.organizationType,
        officialEmail: org.officialEmail,
        status: org.status,
      },
    });
  } catch (err) {
    console.error("LOGIN ORGANIZATION ERROR:", err);
    return res.status(500).json({ error: "Login failed" });
  }
};

exports.getParticipantRegistrations = async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};

    if (status && ["PENDING", "APPROVED", "REJECTED"].includes(status)) {
      query.status = status;
    }

    const participants = await Organization.find(query)
      .sort({ createdAt: -1 })
      .select(
        "_id organizationName organizationType officialEmail status role createdAt"
      )
      .lean();

    return res.json({ success: true, data: participants });
  } catch (err) {
    console.error("GET PARTICIPANT REGISTRATIONS ERROR:", err);
    return res.status(500).json({ error: "Failed to fetch participant registrations" });
  }
};

exports.approveParticipantRegistration = async (req, res) => {
  try {
    const { id } = req.params;

    const participant = await Organization.findById(id);
    if (!participant) {
      return res.status(404).json({ error: "Participant not found" });
    }

    if (participant.status === "REJECTED") {
      return res.status(400).json({ error: "Rejected participants cannot be approved" });
    }

    participant.status = "APPROVED";
    participant.role = participant.organizationType;
    await participant.save();

    return res.json({
      message: "Participant approved",
      data: {
        id: participant._id,
        organizationName: participant.organizationName,
        status: participant.status,
        role: participant.role,
      },
    });
  } catch (err) {
    console.error("APPROVE PARTICIPANT ERROR:", err);
    return res.status(500).json({ error: "Failed to approve participant" });
  }
};

exports.rejectParticipantRegistration = async (req, res) => {
  try {
    const { id } = req.params;

    const participant = await Organization.findById(id);
    if (!participant) {
      return res.status(404).json({ error: "Participant not found" });
    }

    participant.status = "REJECTED";
    participant.role = null;
    await participant.save();

    return res.json({
      message: "Participant rejected",
      data: {
        id: participant._id,
        organizationName: participant.organizationName,
        status: participant.status,
      },
    });
  } catch (err) {
    console.error("REJECT PARTICIPANT ERROR:", err);
    return res.status(500).json({ error: "Failed to reject participant" });
  }
};
