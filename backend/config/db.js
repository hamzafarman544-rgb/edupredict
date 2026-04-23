/**
 * MongoDB Connection Module
 * Centralises Mongoose connection logic with retry and graceful shutdown.
 */

const mongoose = require("mongoose");

const connectDB = async () => {
  const uri = process.env.MONGO_URI || "mongodb://localhost:27017/edupredict";

  const options = {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS:          45000
  };

  try {
    const conn = await mongoose.connect(uri, options);
    console.log(`[DB] MongoDB connected → ${conn.connection.host}`);
    console.log(`[DB] Database: ${conn.connection.name}`);
  } catch (err) {
    console.error("[DB] Connection failed:", err.message);
    process.exit(1);
  }

  mongoose.connection.on("error", (err) => {
    console.error("[DB] Runtime error:", err.message);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("[DB] Disconnected from MongoDB");
  });

  // Graceful shutdown on SIGINT (Ctrl+C)
  process.on("SIGINT", async () => {
    await mongoose.connection.close();
    console.log("[DB] Connection closed (SIGINT)");
    process.exit(0);
  });
};

module.exports = connectDB;
