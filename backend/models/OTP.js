// models/OTP.js
const mongoose = require("mongoose")

const otpSchema = new mongoose.Schema({
  email:     { type: String },
  phone:     { type: String },
  otp:       { type: String, required: true },
  purpose:   { type: String, enum: ['verify', 'reset', 'phone'], default: 'verify' },
  createdAt: { type: Date, default: Date.now, expires: 300 }, // auto-delete after 5 min
})

module.exports = mongoose.model("OTP", otpSchema)