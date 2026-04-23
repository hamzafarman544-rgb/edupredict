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

const connectDB        = require("./config/db");
const authRoutes       = require("./routes/auth");
const studentRoutes    = require("./routes/students");
const predictionRoutes = require("./routes/predictions");

const app  = express();
const PORT = process.env.PORT || 4000;

// ─── Security & Middleware ──────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: true, // reflects request origin
  credentials: true
}));
app.use(express.json());
app.use(morgan("dev"));

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, message: "Too many requests." });
app.use("/api", limiter);

// ─── Database Connection ───────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/edupredict")
  .then(() => console.log("[DB] MongoDB connected"))
  .catch((err) => { console.error("[DB] Connection failed:", err); process.exit(1); });

// ─── Routes ───────────────────────────────────────────────────────────────
app.use("/api/auth",        authRoutes);
app.use("/api/students",    studentRoutes);
app.use("/api/predictions", predictionRoutes);

app.get("/api/health", (_req, res) => res.json({ status: "ok", timestamp: new Date() }));

// ─── 404 & Error Handler ──────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: "Route not found" }));

app.use((err, _req, res, _next) => {
  console.error("[Error]", err.stack);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

app.listen(PORT, () => console.log(`[Server] Running on http://localhost:${PORT}`));
module.exports = app;
