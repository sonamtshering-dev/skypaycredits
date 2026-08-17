const express       = require('express')
const router        = express.Router()
const { protect, adminOnly } = require('../middlewares/authMiddleware')
const ctrl          = require('../controllers/adminWalletController')

// All routes require admin
router.use(protect, adminOnly)

router.get('/',                    ctrl.listUserWallets)
router.get('/audit',               ctrl.getAuditLog)
router.get('/codes',               ctrl.listCodes)
router.post('/codes',              ctrl.createCodes)
router.put('/codes/:id/disable',   ctrl.disableCode)
router.post('/refund/:orderId',    ctrl.refundToWallet)
router.get('/:userId',             ctrl.getUserWallet)
router.post('/:userId/credit',     ctrl.adminCredit)
router.post('/:userId/debit',      ctrl.adminDebit)
router.post('/:userId/block',      ctrl.blockWallet)
router.post('/:userId/unblock',    ctrl.unblockWallet)

module.exports = router
