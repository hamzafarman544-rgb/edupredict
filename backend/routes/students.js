/**
 * Student Routes — CRUD
 * GET    /api/students
 * POST   /api/students
 * GET    /api/students/:id
 * PUT    /api/students/:id
 * DELETE /api/students/:id
 */

const express = require("express");
const router  = express.Router();
const { protect } = require("../middleware/auth");
const { Student } = require("../models/models");

router.use(protect);

// Create student
router.post("/", async (req, res) => {
  try {
    const { name, studentId, email, course, semester } = req.body;
    if (!name || !studentId) return res.status(400).json({ error: "Name and studentId are required." });

    const existing = await Student.findOne({ studentId });
    if (existing) return res.status(409).json({ error: "Student ID already exists." });

    const student = await Student.create({ name, studentId, email, course, semester, createdBy: req.user._id });
    res.status(201).json({ message: "Student created.", student });
  } catch (err) {
    res.status(500).json({ error: "Failed to create student." });
  }
});

// List students
router.get("/", async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const filter = { createdBy: req.user._id };
    if (search) {
      filter.$or = [
        { name:      { $regex: search, $options: "i" } },
        { studentId: { $regex: search, $options: "i" } }
      ];
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [students, total] = await Promise.all([
      Student.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Student.countDocuments(filter)
    ]);
    res.json({ students, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch students." });
  }
});

// Get single student
router.get("/:id", async (req, res) => {
  try {
    const student = await Student.findOne({ _id: req.params.id, createdBy: req.user._id });
    if (!student) return res.status(404).json({ error: "Student not found." });
    res.json({ student });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch student." });
  }
});

// Update student
router.put("/:id", async (req, res) => {
  try {
    const student = await Student.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!student) return res.status(404).json({ error: "Student not found." });
    res.json({ message: "Student updated.", student });
  } catch (err) {
    res.status(500).json({ error: "Failed to update student." });
  }
});

// Delete student
router.delete("/:id", async (req, res) => {
  try {
    const student = await Student.findOneAndDelete({ _id: req.params.id, createdBy: req.user._id });
    if (!student) return res.status(404).json({ error: "Student not found." });
    res.json({ message: "Student deleted." });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete student." });
  }
});

module.exports = router;
