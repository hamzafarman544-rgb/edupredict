/**
 * Auth Routes
 * POST /api/auth/register
 * POST /api/auth/login
 * POST /api/auth/forgot-password
 * POST /api/auth/reset-password/:token
 * GET  /api/auth/me   (protected)
 */

const express  = require("express");
const router   = express.Router();
const crypto   = require("crypto");
const jwt      = require("jsonwebtoken");
const User     = require("../models/User");
const { PasswordResetToken } = require("../models/models");
const { protect } = require("../middleware/auth");

// ─── Helper: generate signed JWT ─────────────────────────────────────────────
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });

// ─── POST /api/auth/register ──────────────────────────────────────────────────
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required." });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters." });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }

    const user  = await User.create({ name, email, password, role });
    const token = signToken(user._id);

    res.status(201).json({
      message: "Account created successfully.",
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error("[Auth/Register]", err);
    res.status(500).json({ error: "Registration failed. Please try again." });
  }
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = signToken(user._id);

    res.json({
      message: "Login successful.",
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error("[Auth/Login]", err);
    res.status(500).json({ error: "Login failed. Please try again." });
  }
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get("/me", protect, async (req, res) => {
  res.json({ user: req.user });
});

// ─── POST /api/auth/forgot-password ──────────────────────────────────────────
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required." });

    const user = await User.findOne({ email });

    // Always return 200 to avoid user enumeration
    if (!user) {
      return res.json({ message: "If that email exists, a reset link has been sent." });
    }

    // Delete any existing tokens for this user
    await PasswordResetToken.deleteMany({ userId: user._id });

    // Generate secure random token
    const rawToken  = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

    await PasswordResetToken.create({
      userId:    user._id,
      token:     hashedToken,
      expiresAt: Date.now() + 60 * 60 * 1000   // 1 hour
    });

    const resetURL = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password/${rawToken}`;

    // In production, send an email. Here we simulate via console.
    console.log("\n==========================================");
    console.log("  [EMAIL SIMULATION — Forgot Password]");
    console.log(`  To:      ${user.email}`);
    console.log(`  Subject: EduPredict — Password Reset`);
    console.log(`  Link:    ${resetURL}`);
    console.log("  (Expires in 1 hour)");
    console.log("==========================================\n");

    res.json({ message: "If that email exists, a reset link has been sent.", resetURL });
  } catch (err) {
    console.error("[Auth/ForgotPassword]", err);
    res.status(500).json({ error: "Could not process request. Please try again." });
  }
});

// ─── POST /api/auth/reset-password/:token ────────────────────────────────────
router.post("/reset-password/:token", async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters." });
    }

    // Hash the incoming raw token and look it up
    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

    const tokenDoc = await PasswordResetToken.findOne({
      token:     hashedToken,
      expiresAt: { $gt: Date.now() }
    });

    if (!tokenDoc) {
      return res.status(400).json({ error: "Token is invalid or has expired." });
    }

    const user = await User.findById(tokenDoc.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    user.password = password;
    await user.save();

    // Invalidate token
    await PasswordResetToken.deleteMany({ userId: user._id });

    const token = signToken(user._id);

    res.json({
      message: "Password reset successful. You are now logged in.",
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (err) {
    console.error("[Auth/ResetPassword]", err);
    res.status(500).json({ error: "Password reset failed. Please try again." });
  }
});

module.exports = router;
