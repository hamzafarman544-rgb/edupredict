/**
 * AI Student Performance Prediction System
 * Node.js + Express Backend — Entry Point
 */

require("dotenv").config();
const express    = require("express");
const cors       = require("cors");
const mongoose   = require("mongoose");
const helmet     = require("helmet");
const morgan     = require("morgan");
const rateLimit  = require("express-rate-limit");

const authRoutes       = require("./routes/auth");
const studentRoutes    = require("./routes/students");
const predictionRoutes = require("./routes/predictions");

const app  = express();
const PORT = process.env.PORT || 4000;

// ─── Security & Middleware ────────────────────────────────────────────────
app.use(helmet());

// ✅ Clean CORS setup (allow all safely with credentials)
app.use(cors({
  origin: true,
  credentials: true
}));

// ✅ Handle preflight requests early (fixes 502 issue)
app.options("*", cors());

// ✅ Explicit OPTIONS handler (bulletproof)
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());
app.use(morgan("dev"));

// ─── Rate Limiting (skip OPTIONS) ─────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests."
});

app.use("/api", (req, res, next) => {
  if (req.method === "OPTIONS") return next();
  return limiter(req, res, next);
});

// ─── Database Connection ──────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/edupredict")
  .then(() => console.log("[DB] MongoDB connected"))
  .catch((err) => {
    console.error("[DB] Connection failed:", err);
    process.exit(1);
  });


  app.get("/", (req, res) => {
  res.send("Backend is LIVE");
});

// ─── Routes ───────────────────────────────────────────────────────────────
app.use("/api/auth",        authRoutes);
app.use("/api/students",    studentRoutes);
app.use("/api/predictions", predictionRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date() });
});

// ─── 404 Handler ──────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ─── Global Error Handler ─────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error("[Error]", err.stack);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error"
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────
app.listen(PORT, "0.0.0.0", () => {
  console.log(`[Server] Running on port ${PORT}`);
});

module.exports = app;