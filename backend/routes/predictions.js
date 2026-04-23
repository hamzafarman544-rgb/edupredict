/**
 * Prediction Routes
 * POST /api/predictions        — run a prediction (calls Flask ML)
 * GET  /api/predictions        — list all predictions for current user
 * GET  /api/predictions/:id    — get single prediction
 * DELETE /api/predictions/:id  — delete a prediction
 *
 * Flow: Frontend → Node.js (this file) → Flask ML → Node.js → MongoDB → Frontend
 */

const express = require("express");
const router  = express.Router();
const axios   = require("axios");
const { protect } = require("../middleware/auth");
const { Prediction } = require("../models/models");
const { Student }    = require("../models/models");

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:5001";

// All prediction routes are protected
router.use(protect);

// ─── POST /api/predictions ────────────────────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const {
      student_id,
      attendance,
      grade_avg,
      assignments,
      engagement,
      prev_gpa,
      study_hours,
      participation,
      missed_deadlines,
      notes
    } = req.body;

    // Validate student exists
    const student = await Student.findById(student_id);
    if (!student) {
      return res.status(404).json({ error: "Student not found." });
    }

    // Validate required features
    const features = { attendance, grade_avg, assignments, engagement,
                       prev_gpa, study_hours, participation, missed_deadlines };
    const missing = Object.entries(features)
      .filter(([, v]) => v === undefined || v === null || v === "")
      .map(([k]) => k);
    if (missing.length > 0) {
      return res.status(400).json({ error: `Missing fields: ${missing.join(", ")}` });
    }

    // ── Call Flask ML microservice ──────────────────────────────────────────
    let mlResult;
    try {
      const mlResponse = await axios.post(`https://hopeful-acceptance-production-42e4.up.railway.app/predict`, features, {
        timeout: 10000,
        headers: { "Content-Type": "application/json" }
      });
      mlResult = mlResponse.data;
    } catch (mlErr) {
      console.error("[ML Service Error]", mlErr.message);
      return res.status(502).json({
        error: "ML service unavailable. Please ensure the Flask service is running."
      });
    }

    // ── Store prediction in MongoDB ─────────────────────────────────────────
    const prediction = await Prediction.create({
      student:   student._id,
      createdBy: req.user._id,
      features,
      result: {
        prediction:          mlResult.prediction,
        risk_level:          mlResult.risk_level,
        confidence:          mlResult.confidence,
        probabilities:       mlResult.probabilities,
        feature_importance:  mlResult.feature_importance
      },
      notes
    });

    await prediction.populate("student", "name studentId course");

    res.status(201).json({
      message:    "Prediction generated successfully.",
      prediction: {
        _id:       prediction._id,
        student:   prediction.student,
        features:  prediction.features,
        result:    prediction.result,
        notes:     prediction.notes,
        createdAt: prediction.createdAt
      }
    });
  } catch (err) {
    console.error("[Predictions/POST]", err);
    res.status(500).json({ error: "Failed to generate prediction." });
  }
});

// ─── GET /api/predictions ─────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 20, prediction } = req.query;
    const filter = { createdBy: req.user._id };
    if (prediction) filter["result.prediction"] = prediction;

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const [predictions, total] = await Promise.all([
      Prediction.find(filter)
        .populate("student", "name studentId course")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Prediction.countDocuments(filter)
    ]);

    res.json({
      predictions,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) }
    });
  } catch (err) {
    console.error("[Predictions/GET]", err);
    res.status(500).json({ error: "Failed to fetch predictions." });
  }
});

// ─── GET /api/predictions/stats ──────────────────────────────────────────────
router.get("/stats", async (req, res) => {
  try {
    const stats = await Prediction.aggregate([
      { $match: { createdBy: req.user._id } },
      { $group: { _id: "$result.prediction", count: { $sum: 1 }, avgConfidence: { $avg: "$result.confidence" } } }
    ]);

    const total = stats.reduce((s, r) => s + r.count, 0);
    res.json({ stats, total });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch stats." });
  }
});

// ─── GET /api/predictions/:id ─────────────────────────────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const prediction = await Prediction.findOne({
      _id: req.params.id, createdBy: req.user._id
    }).populate("student", "name studentId course semester email");

    if (!prediction) return res.status(404).json({ error: "Prediction not found." });
    res.json({ prediction });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch prediction." });
  }
});

// ─── DELETE /api/predictions/:id ─────────────────────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    const prediction = await Prediction.findOneAndDelete({
      _id: req.params.id, createdBy: req.user._id
    });
    if (!prediction) return res.status(404).json({ error: "Prediction not found." });
    res.json({ message: "Prediction deleted." });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete prediction." });
  }
});

module.exports = router;
