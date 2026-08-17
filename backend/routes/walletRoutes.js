const express    = require('express')
const router     = express.Router()
const { protect } = require('../middlewares/authMiddleware')
const ctrl        = require('../controllers/walletController')

router.get('/balance',      protect, ctrl.getBalance)
router.get('/transactions', protect, ctrl.getTransactions)
router.post('/topup',       protect, ctrl.createTopup)
router.post('/redeem',      protect, ctrl.redeemCode)

module.exports = router
