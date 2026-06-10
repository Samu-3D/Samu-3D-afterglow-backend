const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, default: "AFTERGLOW User" },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
    companyName: { type: String, default: "MOPAS Ltd" },
    role: { type: String, default: "owner" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);