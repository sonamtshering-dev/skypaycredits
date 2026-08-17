// Wallet constants — all amounts in paise (₹1 = 100 paise)
module.exports = {
  MIN_TOPUP_USER:     2000,   // ₹20
  MIN_TOPUP_RESELLER: 20000,  // ₹200 (lowered so resellers with existing balance can still topup)
  MAX_TOPUP:          200000, // ₹2,000 (hard cap per topup, matches max balance)
  MAX_BALANCE:        200000, // ₹2,000 (no wallet may hold more than this)
}
