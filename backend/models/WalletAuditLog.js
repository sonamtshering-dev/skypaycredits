const mongoose = require('mongoose')

const walletAuditLogSchema = new mongoose.Schema({
  actorId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  actorRole:     { type: String, required: true },
  action:        { type: String, required: true }, // credit_wallet, debit_wallet, block_wallet, etc.
  targetUserId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  referenceId:   { type: String },
  amount:        { type: Number, default: 0 },     // paise
  reason:        { type: String, default: '' },
  balanceBefore: { type: Number },
  balanceAfter:  { type: Number },
  ipAddress:     { type: String },
  meta:          { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true })

module.exports = mongoose.model('WalletAuditLog', walletAuditLogSchema)
