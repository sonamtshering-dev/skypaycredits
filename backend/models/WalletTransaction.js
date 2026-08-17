const mongoose = require('mongoose')

const walletTransactionSchema = new mongoose.Schema({
  userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type:         { type: String, enum: ['topup','credit','debit','redeem','refund'], required: true },
  amount:       { type: Number, required: true }, // paise, always positive
  balanceBefore:{ type: Number, required: true },
  balanceAfter: { type: Number, required: true },
  referenceId:  { type: String },               // orderId, paymentId, redeemCodeId, etc.
  description:  { type: String, default: '' },
  performedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // null = system/self
  ipAddress:    { type: String },
}, { timestamps: true })

// Immutable — never allow updates
walletTransactionSchema.pre('save', function(next) {
  if (!this.isNew) return next(new Error('WalletTransaction is immutable'))
  next()
})

module.exports = mongoose.model('WalletTransaction', walletTransactionSchema)
