const mongoose = require('mongoose')

const redeemCodeSchema = new mongoose.Schema({
  codeHash:   { type: String, required: true, unique: true }, // SHA-256 of plaintext
  value:      { type: Number, required: true, min: 1 },       // paise
  status:     { type: String, enum: ['active','used','disabled'], default: 'active', index: true },
  expiresAt:  { type: Date },
  redeemedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  redeemedAt: { type: Date },
  createdBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  batchNote:  { type: String, default: '' },
}, { timestamps: true })

module.exports = mongoose.model('RedeemCode', redeemCodeSchema)
