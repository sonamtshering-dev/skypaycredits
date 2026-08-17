const express    = require('express')
const rateLimit  = require('express-rate-limit')
const router     = express.Router()
const { protect } = require('../middlewares/authMiddleware')
const ctrl        = require('../controllers/walletController')

const redeemLimiter = rateLimit({
  windowMs: 60_000, max: 5,
  standardHeaders: true, legacyHeaders: false,
  message: { message: 'Too many redeem attempts, please wait' },
})

router.get('/balance',      protect, ctrl.getBalance)
router.get('/transactions', protect, ctrl.getTransactions)
router.post('/topup',       protect, ctrl.createTopup)
router.post('/redeem',      protect, redeemLimiter, ctrl.redeemCode)

module.exports = router
