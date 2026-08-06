// models/Settings.js
const mongoose = require("mongoose")

const settingsSchema = new mongoose.Schema(
  {
    siteName:    { type: String, default: "Nitrogen Store" },
    logo:        { type: String, default: "" },
    favicon:     { type: String, default: "" },
    primaryColor:{ type: String, default: "#6366f1" },
    currency:    { type: String, default: "INR" },
    currencySymbol: { type: String, default: "₹" },
    whatsapp:    { type: String, default: "" },
    email:       { type: String, default: "" },
    footerText:  { type: String, default: "" },
    maintenanceMode: { type: Boolean, default: false },
    // Payment gateway toggle
    paymentGateway: { type: String, enum: ["novapay","manual"], default: "novapay" },
  },
  { timestamps: true }
)

module.exports = mongoose.model("Settings", settingsSchema)
