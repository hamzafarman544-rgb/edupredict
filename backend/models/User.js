/**
 * User Model — MongoDB/Mongoose
 * Handles authentication data, hashed passwords, and role management.
 */

const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String, required: [true, "Name is required"], trim: true, minlength: 2, maxlength: 60
    },
    email: {
      type: String, required: [true, "Email is required"],
      unique: true, lowercase: true, trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"]
    },
    password: {
      type: String, required: [true, "Password is required"], minlength: 6, select: false
    },
    role: {
      type: String, enum: ["instructor", "admin"], default: "instructor"
    },
    isVerified: { type: Boolean, default: true },
    lastLogin:  { type: Date }
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare plaintext to hashed password
userSchema.methods.comparePassword = async function (plain) {
  return bcrypt.compare(plain, this.password);
};

// Remove password from serialized JSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
