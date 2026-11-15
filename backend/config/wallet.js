// Wallet constants — all amounts in paise (₹1 = 100 paise)
module.exports = {
  MIN_TOPUP_USER:        2000,     // ₹20
  MIN_TOPUP_RESELLER:    20000,    // ₹200
  MAX_TOPUP:             10000000,  // ₹1,00,000 hard cap per topup transaction
  MAX_BALANCE:           10000000,  // ₹1,00,000 max for regular users
  MAX_BALANCE_RESELLER:  10000000,  // ₹1,00,000 max for resellers
}
