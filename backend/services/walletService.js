const crypto = require('crypto')
const User               = require('../models/User')
const WalletTransaction  = require('../models/WalletTransaction')
const RedeemCode         = require('../models/RedeemCode')
const WalletAuditLog     = require('../models/WalletAuditLog')
const { MAX_BALANCE, MAX_BALANCE_RESELLER } = require('../config/wallet')

function sha256(str) {
  return crypto.createHash('sha256').update(str).digest('hex')
}

async function _recordTx(userId, type, amount, balanceBefore, balanceAfter, referenceId, description, performedBy, ipAddress) {
  await WalletTransaction.create({
    userId, type, amount, balanceBefore, balanceAfter,
    referenceId: referenceId?.toString(),
    description, performedBy, ipAddress,
  })
}

async function _audit(actorId, actorRole, action, targetUserId, opts = {}) {
  await WalletAuditLog.create({
    actorId, actorRole, action, targetUserId,
    referenceId: opts.referenceId?.toString(),
    amount:        opts.amount || 0,
    reason:        opts.reason || '',
    balanceBefore: opts.balanceBefore,
    balanceAfter:  opts.balanceAfter,
    ipAddress:     opts.ipAddress,
    meta:          opts.meta,
  })
}

// Credit wallet — only credits if user exists, wallet active, and cap not exceeded
// Returns { ok, balanceBefore, balanceAfter, error }
async function creditWallet(userId, amountPaise, type, referenceId, description, performedBy, ipAddress) {
  if (!amountPaise || amountPaise <= 0) return { ok: false, error: 'Amount must be positive' }

  // Fetch role first so we can determine the correct cap
  const userDoc = await User.findById(userId).select('walletBalance walletStatus role').lean()
  if (!userDoc) return { ok: false, error: 'User not found or wallet is blocked' }
  if (userDoc.walletStatus === 'blocked') return { ok: false, error: 'User not found or wallet is blocked' }

  const cap = ['reseller', 'admin'].includes(userDoc.role) ? MAX_BALANCE_RESELLER : MAX_BALANCE

  // Atomic: only increment if balance stays within cap — no rollback needed
  const user = await User.findOneAndUpdate(
    {
      _id: userId,
      walletStatus: { $ne: 'blocked' },
      walletBalance: { $lte: cap - amountPaise },
    },
    { $inc: { walletBalance: amountPaise } },
    { new: false }
  )
  if (!user) return { ok: false, error: `Wallet balance would exceed maximum limit of ₹${cap / 100}` }

  const balanceBefore = user.walletBalance
  const balanceAfter  = user.walletBalance + amountPaise

  await _recordTx(userId, type, amountPaise, balanceBefore, balanceAfter, referenceId, description, performedBy, ipAddress)

  // Audit log for admin-initiated credits
  if (performedBy) {
    const actor = await User.findById(performedBy).select('role').lean()
    await _audit(performedBy, actor?.role || 'admin', 'credit_wallet', userId, {
      referenceId, amount: amountPaise, balanceBefore, balanceAfter, ipAddress,
    })
  }

  return { ok: true, balanceBefore, balanceAfter }
}

// Debit wallet — atomic, fails if insufficient balance or wallet blocked
// Returns { ok, balanceBefore, balanceAfter, error }
async function debitWallet(userId, amountPaise, type, referenceId, description, performedBy, ipAddress) {
  if (!amountPaise || amountPaise <= 0) return { ok: false, error: 'Amount must be positive' }

  const user = await User.findOneAndUpdate(
    { _id: userId, walletBalance: { $gte: amountPaise }, walletStatus: { $ne: 'blocked' } },
    { $inc: { walletBalance: -amountPaise } },
    { new: false }
  )
  if (!user) {
    const check = await User.findById(userId).select('walletBalance walletStatus').lean()
    if (!check) return { ok: false, error: 'User not found' }
    if (check.walletStatus === 'blocked') return { ok: false, error: 'Wallet is blocked' }
    return { ok: false, error: 'Insufficient wallet balance' }
  }

  const balanceBefore = user.walletBalance
  const balanceAfter  = user.walletBalance - amountPaise

  await _recordTx(userId, type, amountPaise, balanceBefore, balanceAfter, referenceId, description, performedBy, ipAddress)

  if (performedBy) {
    const actor = await User.findById(performedBy).select('role').lean()
    await _audit(performedBy, actor?.role || 'admin', 'debit_wallet', userId, {
      referenceId, amount: amountPaise, balanceBefore, balanceAfter, ipAddress,
    })
  }

  return { ok: true, balanceBefore, balanceAfter }
}

// Redeem a code — resellers only
// Returns { ok, value, error }
async function redeemCode(userId, plainCode, userRole, ipAddress) {
  if (!plainCode || typeof plainCode !== 'string') return { ok: false, error: 'Invalid code' }
  const codeHash = sha256(plainCode.trim().toUpperCase())

  // Atomically claim the code
  const code = await RedeemCode.findOneAndUpdate(
    { codeHash, status: 'active', $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }] },
    { status: 'used', redeemedBy: userId, redeemedAt: new Date() },
    { new: true }
  )
  if (!code) return { ok: false, error: 'Invalid, expired, or already used code' }

  // Credit wallet
  const result = await creditWallet(
    userId, code.value, 'redeem', code._id.toString(),
    `Redeem code`, null, ipAddress
  )
  if (!result.ok) {
    // Rollback code claim
    await RedeemCode.findByIdAndUpdate(code._id, { status: 'active', redeemedBy: null, redeemedAt: null })
    return { ok: false, error: result.error }
  }

  await _audit(userId, userRole, 'redeem_code', userId, {
    referenceId: code._id.toString(), amount: code.value,
    balanceBefore: result.balanceBefore, balanceAfter: result.balanceAfter, ipAddress,
  })

  return { ok: true, value: code.value }
}

// Get balance + status for a user
async function getBalance(userId) {
  const user = await User.findById(userId).select('walletBalance walletStatus').lean()
  if (!user) return null
  return { balance: user.walletBalance, status: user.walletStatus }
}

// Paginated transaction history
async function getTransactions(userId, page = 1, limit = 20) {
  const skip = (page - 1) * limit
  const [items, total] = await Promise.all([
    WalletTransaction.find({ userId })
      .sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    WalletTransaction.countDocuments({ userId }),
  ])
  return { items, total, page, pages: Math.ceil(total / limit) }
}

module.exports = { creditWallet, debitWallet, redeemCode, getBalance, getTransactions }
