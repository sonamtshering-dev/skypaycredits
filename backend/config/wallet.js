// Wallet constants — all amounts in paise (₹1 = 100 paise)
module.exports = {
  MIN_TOPUP_USER:        2000,     // ₹20
  MIN_TOPUP_RESELLER:    20000,    // ₹200
  MAX_TOPUP:             200000,    // ₹2,000 per topup transaction (users do multiple to accumulate)
  MAX_BALANCE:           10000000,  // ₹1,00,000 max balance — no practical ceiling for normal use
  MAX_BALANCE_RESELLER:  10000000,  // ₹1,00,000 max for resellers
}
