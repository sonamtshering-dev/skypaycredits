// models/Coupon.js
const mongoose = require("mongoose")

const couponSchema = new mongoose.Schema({
  code:         { type: String, required: true, unique: true, uppercase: true, trim: true },
  type:         { type: String, enum: ["flat", "percent"], required: true },
  value:        { type: Number, required: true },       // flat = ₹ amount, percent = %
  minOrder:     { type: Number, default: 0 },           // minimum order amount
  maxDiscount:  { type: Number, default: 0 },           // max discount cap for percent (0 = no cap)
  usageLimit:   { type: Number, default: 0 },           // 0 = unlimited
  usedCount:    { type: Number, default: 0 },
  perUser:      { type: Number, default: 1 },           // max uses per user
  active:       { type: Boolean, default: true },
  expiresAt:    { type: Date, default: null },
  gameIds:      [{ type: mongoose.Schema.Types.ObjectId, ref: "Game" }], // empty = all games
}, { timestamps: true })

// Calculate discount for a given price
couponSchema.methods.calculateDiscount = function(price) {
  if (this.type === "flat") return Math.min(this.value, price)
  const discount = Math.floor(price * this.value / 100)
  return this.maxDiscount > 0 ? Math.min(discount, this.maxDiscount) : discount
}

module.exports = mongoose.model("Coupon", couponSchema)