const crypto         = require('crypto')
const User           = require('../models/User')
const Order          = require('../models/Order')
const RedeemCode     = require('../models/RedeemCode')
const WalletAuditLog = require('../models/WalletAuditLog')
const WalletTransaction = require('../models/WalletTransaction')
const { creditWallet, debitWallet } = require('../services/walletService')

const isProd = process.env.NODE_ENV === 'production'
function safeErr(err) { return isProd ? 'Internal server error' : err.message }

function escapeRegex(str) {
  return (str || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&').substring(0, 100)
}

function sha256(str) {
  return crypto.createHash('sha256').update(str).digest('hex')
}

function getIp(req) {
  return req.ip || req.socket?.remoteAddress || ''
}

// GET /api/admin/wallet?page=1&q=email
exports.listUserWallets = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page) || 1)
    const limit = 50
    const skip  = (page - 1) * limit
    const q     = req.query.q?.trim() || ''

    const escaped = escapeRegex(q)
    const filter = q
      ? { $or: [
          { email: { $regex: escaped, $options: 'i' } },
          { name:  { $regex: escaped, $options: 'i' } },
        ]}
      : {}

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('name email role walletBalance walletStatus createdAt')
        .sort({ walletBalance: -1 })
        .skip(skip).limit(limit).lean(),
      User.countDocuments(filter),
    ])

    res.json({ users, total, page, pages: Math.ceil(total / limit) })
  } catch (err) {
    res.status(500).json({ message: safeErr(err) })
  }
}

// GET /api/admin/wallet/:userId
exports.getUserWallet = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('name email role walletBalance walletStatus walletBlockedAt walletBlockReason createdAt').lean()
    if (!user) return res.status(404).json({ message: 'User not found' })

    const page  = Math.max(1, parseInt(req.query.page) || 1)
    const limit = 20
    const skip  = (page - 1) * limit
    const [txs, txTotal] = await Promise.all([
      WalletTransaction.find({ userId: req.params.userId })
        .sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      WalletTransaction.countDocuments({ userId: req.params.userId }),
    ])

    res.json({ user, transactions: txs, total: txTotal, page, pages: Math.ceil(txTotal / limit) })
  } catch (err) {
    res.status(500).json({ message: safeErr(err) })
  }
}

// POST /api/admin/wallet/:userId/credit  { amount, reason }
exports.adminCredit = async (req, res) => {
  try {
    const amountPaise = parseInt(req.body.amount)
    const reason      = (req.body.reason || '').trim().slice(0, 200)
    if (!amountPaise || amountPaise <= 0) return res.status(400).json({ message: 'amount required (paise)' })
    if (!reason) return res.status(400).json({ message: 'reason required' })

    const result = await creditWallet(
      req.params.userId, amountPaise, 'credit',
      null, `Admin credit: ${reason}`,
      req.user._id, getIp(req)
    )
    if (!result.ok) return res.status(400).json({ message: result.error })
    res.json({ success: true, ...result })
  } catch (err) {
    res.status(500).json({ message: safeErr(err) })
  }
}

// POST /api/admin/wallet/:userId/debit  { amount, reason }
exports.adminDebit = async (req, res) => {
  try {
    const amountPaise = parseInt(req.body.amount)
    const reason      = (req.body.reason || '').trim().slice(0, 200)
    if (!amountPaise || amountPaise <= 0) return res.status(400).json({ message: 'amount required (paise)' })
    if (!reason) return res.status(400).json({ message: 'reason required' })

    const result = await debitWallet(
      req.params.userId, amountPaise, 'debit',
      null, `Admin debit: ${reason}`,
      req.user._id, getIp(req)
    )
    if (!result.ok) return res.status(400).json({ message: result.error })
    res.json({ success: true, ...result })
  } catch (err) {
    res.status(500).json({ message: safeErr(err) })
  }
}

// POST /api/admin/wallet/:userId/block  { reason }
exports.blockWallet = async (req, res) => {
  try {
    const reason = (req.body.reason || '').trim().slice(0, 200)
    if (!reason) return res.status(400).json({ message: 'reason required' })

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { walletStatus: 'blocked', walletBlockedAt: new Date(), walletBlockedBy: req.user._id, walletBlockReason: reason },
      { new: true }
    ).select('walletBalance walletStatus').lean()
    if (!user) return res.status(404).json({ message: 'User not found' })

    await WalletAuditLog.create({
      actorId: req.user._id, actorRole: req.user.role, action: 'block_wallet',
      targetUserId: req.params.userId, reason, ipAddress: getIp(req),
    })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ message: safeErr(err) })
  }
}

// POST /api/admin/wallet/:userId/unblock
exports.unblockWallet = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { walletStatus: 'active', $unset: { walletBlockedAt: 1, walletBlockedBy: 1, walletBlockReason: 1 } },
      { new: true }
    ).select('walletBalance walletStatus').lean()
    if (!user) return res.status(404).json({ message: 'User not found' })

    await WalletAuditLog.create({
      actorId: req.user._id, actorRole: req.user.role, action: 'unblock_wallet',
      targetUserId: req.params.userId, ipAddress: getIp(req),
    })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ message: safeErr(err) })
  }
}

// GET /api/admin/wallet/audit?page=1
exports.getAuditLog = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page) || 1)
    const limit = 50
    const skip  = (page - 1) * limit
    const [logs, total] = await Promise.all([
      WalletAuditLog.find()
        .sort({ createdAt: -1 }).skip(skip).limit(limit)
        .populate('actorId', 'name email')
        .populate('targetUserId', 'name email').lean(),
      WalletAuditLog.countDocuments(),
    ])
    res.json({ logs, total, page, pages: Math.ceil(total / limit) })
  } catch (err) {
    res.status(500).json({ message: safeErr(err) })
  }
}

// GET /api/admin/wallet/codes?page=1
exports.listCodes = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page) || 1)
    const limit = 50
    const skip  = (page - 1) * limit
    const filter = req.query.status ? { status: req.query.status } : {}
    const [codes, total] = await Promise.all([
      RedeemCode.find(filter)
        .sort({ createdAt: -1 }).skip(skip).limit(limit)
        .populate('redeemedBy', 'name email')
        .populate('createdBy', 'name').lean(),
      RedeemCode.countDocuments(filter),
    ])
    res.json({ codes, total, page, pages: Math.ceil(total / limit) })
  } catch (err) {
    res.status(500).json({ message: safeErr(err) })
  }
}

// POST /api/admin/wallet/codes  { count, value, expiresAt?, batchNote? }
exports.createCodes = async (req, res) => {
  try {
    const count   = Math.min(100, Math.max(1, parseInt(req.body.count) || 1))
    const value   = parseInt(req.body.value)
    if (!value || value <= 0) return res.status(400).json({ message: 'value required (paise)' })

    const expiresAt = req.body.expiresAt ? new Date(req.body.expiresAt) : null
    const batchNote = (req.body.batchNote || '').slice(0, 200)
    const createdBy = req.user._id

    const codes = []
    const plainCodes = []
    for (let i = 0; i < count; i++) {
      const plain = crypto.randomBytes(8).toString('hex').toUpperCase()
      codes.push({ codeHash: sha256(plain), value, expiresAt, batchNote, createdBy })
      plainCodes.push(plain)
    }
    await RedeemCode.insertMany(codes)

    // Return plaintext codes once — they won't be retrievable again
    res.json({ success: true, codes: plainCodes, count })
  } catch (err) {
    res.status(500).json({ message: safeErr(err) })
  }
}

// PUT /api/admin/wallet/codes/:id/disable
exports.disableCode = async (req, res) => {
  try {
    const code = await RedeemCode.findOneAndUpdate(
      { _id: req.params.id, status: 'active' },
      { status: 'disabled' },
      { new: true }
    )
    if (!code) return res.status(404).json({ message: 'Code not found or already used/disabled' })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ message: safeErr(err) })
  }
}

// POST /api/admin/wallet/refund/:orderId
exports.refundToWallet = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
    if (!order) return res.status(404).json({ message: 'Order not found' })
    if (order.walletRefunded) return res.status(400).json({ message: 'Already refunded to wallet' })
    if (order.status === 'Refunded') return res.status(400).json({ message: 'Order already refunded' })

    const reason     = (req.body.reason || 'Admin refund').trim().slice(0, 200)
    const amountPaise = Math.round(order.price * 100)

    // Atomic idempotency guard
    const updated = await Order.findOneAndUpdate(
      { _id: order._id, walletRefunded: { $ne: true } },
      { walletRefunded: true, status: 'Refunded' },
      { new: true }
    )
    if (!updated) return res.status(400).json({ message: 'Refund already in progress' })

    const result = await creditWallet(
      order.userId, amountPaise, 'refund',
      order._id.toString(), `Refund: ${reason}`,
      req.user._id, getIp(req)
    )

    if (!result.ok) {
      // Rollback order update
      await Order.findByIdAndUpdate(order._id, { walletRefunded: false, status: order.status })
      return res.status(400).json({ message: result.error })
    }

    res.json({ success: true, refunded: amountPaise })
  } catch (err) {
    res.status(500).json({ message: safeErr(err) })
  }
}
