const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  name: { type: String, default: "Salon Owner" },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["owner", "staff", "dev"],default: "staff" },
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
