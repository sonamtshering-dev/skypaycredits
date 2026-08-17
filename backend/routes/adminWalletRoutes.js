const express       = require('express')
const router        = express.Router()
const { protect, adminOnly, validateObjectId } = require('../middlewares/authMiddleware')
const ctrl          = require('../controllers/adminWalletController')

// All routes require admin
router.use(protect, adminOnly)

router.get('/',                    ctrl.listUserWallets)
router.get('/audit',               ctrl.getAuditLog)
router.get('/codes',               ctrl.listCodes)
router.post('/codes',              ctrl.createCodes)
router.put('/codes/:id/disable',   validateObjectId, ctrl.disableCode)
router.post('/refund/:orderId',    validateObjectId, ctrl.refundToWallet)
router.get('/:userId',             validateObjectId, ctrl.getUserWallet)
router.post('/:userId/credit',     validateObjectId, ctrl.adminCredit)
router.post('/:userId/debit',      validateObjectId, ctrl.adminDebit)
router.post('/:userId/block',      validateObjectId, ctrl.blockWallet)
router.post('/:userId/unblock',    validateObjectId, ctrl.unblockWallet)

module.exports = router
