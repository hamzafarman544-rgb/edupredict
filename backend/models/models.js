/**
 * Student Model
 */
const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    name:       { type: String, required: true, trim: true },
    studentId:  { type: String, required: true, unique: true, trim: true },
    email:      { type: String, lowercase: true, trim: true },
    course:     { type: String, trim: true },
    semester:   { type: String, trim: true },
    createdBy:  { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

/**
 * Prediction Model
 */
const predictionSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // Input features sent to ML service
    features: {
      attendance:       { type: Number, required: true, min: 0, max: 100 },
      grade_avg:        { type: Number, required: true, min: 0, max: 100 },
      assignments:      { type: Number, required: true, min: 0, max: 100 },
      engagement:       { type: Number, required: true, min: 0, max: 100 },
      prev_gpa:         { type: Number, required: true, min: 0, max: 4 },
      study_hours:      { type: Number, required: true, min: 0, max: 12 },
      participation:    { type: Number, required: true, min: 0, max: 10 },
      missed_deadlines: { type: Number, required: true, min: 0, max: 7 }
    },

    // ML Service response
    result: {
      prediction:   { type: String, enum: ["High", "Average", "At Risk"] },
      risk_level:   { type: String, enum: ["low", "medium", "high"] },
      confidence:   { type: Number },
      probabilities: { type: Map, of: Number },
      feature_importance: { type: Map, of: Number }
    },

    notes: { type: String, trim: true, maxlength: 500 }
  },
  { timestamps: true }
);

/**
 * Password Reset Token Model
 */
const tokenSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  token:     { type: String, required: true },
  expiresAt: { type: Date, required: true, default: () => Date.now() + 60 * 60 * 1000 } // 1 hour
});

// Auto-delete expired tokens
tokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = {
  Student:            mongoose.model("Student", studentSchema),
  Prediction:         mongoose.model("Prediction", predictionSchema),
  PasswordResetToken: mongoose.model("PasswordResetToken", tokenSchema)
};
