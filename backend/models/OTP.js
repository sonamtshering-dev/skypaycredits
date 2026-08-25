// models/OTP.js
const mongoose = require("mongoose")

const otpSchema = new mongoose.Schema({
  email:     { type: String },
  phone:     { type: String },
  otp:            { type: String, required: true },
  failedAttempts: { type: Number, default: 0 },
  purpose:        { type: String, enum: ['verify', 'reset', 'phone', 'pre-email', 'pre-phone', 'admin-login'], default: 'verify' },
  createdAt: { type: Date, default: Date.now, expires: 300 }, // auto-delete after 5 min
})

module.exports = mongoose.model("OTP", otpSchema)