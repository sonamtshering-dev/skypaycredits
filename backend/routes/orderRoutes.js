const securityLog = require('../services/securityLogger')
const isProd = process.env.NODE_ENV === 'production'
function safeError(err) {
  return isProd ? 'Internal server error' : (err.message || 'Unknown error')
}
function escapeRegex(str) {
  return (str || "").replace(/[.*+?^${}()|[\]\\]/g, '\\$&').substring(0, 100)
}
// routes/orderRoutes.js
const express   = require("express")
const mongoose  = require("mongoose")
const router    = express.Router()
const Order     = require("../models/Order")
const Game      = require("../models/Game")
const Pack      = require("../models/Pack")
const Coupon    = require("../models/Coupon")
const { processRecharge } = require("../services/rechargeService")
const { protect, adminOnly, validateObjectId } = require("../middlewares/authMiddleware")
const { debitWallet } = require("../services/walletService")
const WalletTransaction = require("../models/WalletTransaction")
const { sendOrderConfirmationEmail } = require("../services/emailService")
const Settings = require("../models/Settings")
const User     = require("../models/User")
const SITE_URL = process.env.SITE_URL || 'https://nitrogenstore.in'

// GET /api/orders/my
router.get("/my", protect, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id })
      .sort({ createdAt: -1 }).limit(50)
      .populate('gameId', 'name icon slug')
      .populate('packId', 'title price diamonds regionSlug')
      .lean()
    const mapped = orders.map(o => ({
      ...o,
      game:         o.gameId || null,
      pack:         o.packId ? { name: o.packId.title, ...o.packId } : null,
      playerId:     o.playerData?.userId || '',
      region:       o.playerData?.regionSlug || '',
      amount:       o.packId?.price || o.amount,
      currency:     'INR',
      provider:     o.providerTransactions?.[0]?.provider || '',
      providerTxId: o.providerTransactions?.[0]?.providerOrderId || '',
    }))
    return res.json(mapped)
  } catch (err) {
    res.status(500).json({ message: safeError(err) })
  }
})

// GET /api/orders — admin
router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1)
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 30))
    const skip  = (page - 1) * limit
    const filter = {}
    const VALID_STATUSES = ["Pending","Processing","Completed","Failed","Refunded"]
    const VALID_PAYMENTS = ["unpaid","paid","refunded"]
    if (req.query.status  && VALID_STATUSES.includes(req.query.status))  filter.status        = req.query.status
    if (req.query.payment && VALID_PAYMENTS.includes(req.query.payment)) filter.paymentStatus  = req.query.payment
    if (req.query.search) {
      const re = { $regex: escapeRegex(req.query.search), $options: "i" }
      const matchingUsers = await User.find({ $or: [{ email: re }, { name: re }] }).select('_id').lean()
      const userIds = matchingUsers.map(u => u._id)
      filter.$or = [
        { gameName: re },
        { packName: re },
        { 'playerData.userId': re },
        { 'playerData.email':  re },
        { 'playerData.phone':  re },
        { $expr: { $regexMatch: { input: { $toString: '$_id' }, regex: escapeRegex(req.query.search.replace(/^#/, '')), options: 'i' } } },
        ...(userIds.length > 0 ? [{ userId: { $in: userIds } }] : []),
      ]
    }
    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate("userId","name email"),
      Order.countDocuments(filter),
    ])
    res.json({ orders, total, page, pages: Math.ceil(total / limit) })
  } catch (err) {
    res.status(500).json({ message: safeError(err) })
  }
})

// GET /api/orders/stats
router.get("/stats", protect, adminOnly, async (req, res) => {
  try {
    const [total, completed, pending, failed, userCount] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: "Completed" }),
      Order.countDocuments({ status: "Pending" }),
      Order.countDocuments({ status: "Failed" }),
      require("../models/User").countDocuments(),
    ])
    const revenueResult = await Order.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: null, total: { $sum: "$price" } } }
    ])
    const revenue = revenueResult[0]?.total || 0
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 }).limit(10)
      .populate("gameId", "name icon").populate("packId", "name")
    const mapped = recentOrders.map(o => ({
      _id: o._id, status: o.status, createdAt: o.createdAt,
      playerId: o.playerData?.userId || o.playerData?.playerId || '—',
      game: o.gameId, pack: o.packId,
    }))
    res.json({ total, completed, pending, failed, revenue, users: userCount, recentOrders: mapped })
  } catch (err) {
    res.status(500).json({ message: safeError(err) })
  }
})

// GET /api/orders/:id
router.get("/:id", protect, validateObjectId, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("userId","name email")
    if (!order) return res.status(404).json({ message: "Order not found" })
    if (req.user.role !== "admin" && !order.userId.equals(req.user._id))
      return res.status(403).json({ message: "Forbidden" })
    res.json(order)
  } catch (err) {
    res.status(500).json({ message: safeError(err) })
  }
})

// POST /api/orders — create order with coupon support
router.post("/", protect, async (req, res) => {
  try {
    if (req.user.status === "banned")       return res.status(403).json({ message: "Account has been banned" })
    if (!req.user.isEmailVerified)          return res.status(403).json({ message: "Please verify your email before placing an order" })

    const settings = await require('../models/Settings').findOne()
    if (settings?.purchasesEnabled === false)
      return res.status(503).json({ message: "Purchases are currently disabled. Please check back soon." })

    const { gameId, packId, playerData, couponCode } = req.body
    if (!gameId || !packId)                 return res.status(400).json({ message: "gameId and packId are required" })
    if (!mongoose.isValidObjectId(gameId) || !mongoose.isValidObjectId(packId))
                                            return res.status(400).json({ message: "Invalid game or pack ID" })

    const [game, pack] = await Promise.all([Game.findById(gameId), Pack.findById(packId)])
    if (!game || !pack)                     return res.status(404).json({ message: "Game or pack not found" })
    if (!game.active)                       return res.status(400).json({ message: "This game is not available" })
    if (!pack.active)                       return res.status(400).json({ message: "This pack is not available" })
    if (pack.gameId.toString() !== gameId)  return res.status(400).json({ message: "Pack does not belong to this game" })

    const unpaidCount = await Order.countDocuments({
      userId: req.user._id, paymentStatus: 'unpaid',
      createdAt: { $gte: new Date(Date.now() - 30*60*1000) }
    })
    if (unpaidCount >= 10) return res.status(429).json({ message: "Too many pending orders. Please complete or wait for existing orders." })

    // ── Pick base price (reseller vs regular) ─────
    const isReseller = req.user.role === 'reseller'
    const basePrice  = (isReseller && pack.resellerPrice > 0) ? pack.resellerPrice : pack.price

    // ── Apply coupon ──────────────────────────────
    let finalPrice     = basePrice
    let couponDiscount = 0
    let appliedCode    = ""

    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase().trim(), active: true })
      if (!coupon) return res.status(400).json({ message: "Invalid or expired coupon code" })
      if (coupon.expiresAt && new Date() > coupon.expiresAt)
        return res.status(400).json({ message: "This coupon has expired" })
      if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit)
        return res.status(400).json({ message: "This coupon has reached its usage limit" })
      if (basePrice < coupon.minOrder)
        return res.status(400).json({ message: `Minimum order amount is ₹${coupon.minOrder}` })
      if (coupon.gameIds?.length > 0) {
        const allowed = coupon.gameIds.map(id => id.toString())
        if (!allowed.includes(gameId))
          return res.status(400).json({ message: "This coupon is not valid for this game" })
      }
      const userUsage = await Order.countDocuments({
        userId: req.user._id, couponCode: coupon.code, paymentStatus: { $ne: 'refunded' }
      })
      if (coupon.perUser > 0 && userUsage >= coupon.perUser)
        return res.status(400).json({ message: "You have already used this coupon" })

      couponDiscount = coupon.calculateDiscount(basePrice)
      finalPrice     = Math.max(1, basePrice - couponDiscount)
      appliedCode    = coupon.code

      // Atomic increment — rejects if limit was hit by a concurrent request (VULN-01)
      const updatedCoupon = await Coupon.findOneAndUpdate(
        { _id: coupon._id, $or: [{ usageLimit: { $lte: 0 } }, { usedCount: { $lt: coupon.usageLimit } }] },
        { $inc: { usedCount: 1 } },
        { new: true }
      )
      if (!updatedCoupon) return res.status(400).json({ message: "This coupon has reached its usage limit" })
    }

    // ── Wallet payment path ───────────────────────
    const payWithWallet = req.body.paymentMethod === 'wallet'
    const finalPriceInPaise = Math.round(finalPrice * 100)

    if (payWithWallet) {
      // Check wallet first without debiting (fast rejection path)
      const walletUser = await User.findById(req.user._id).select('walletBalance walletStatus').lean()
      if (!walletUser || walletUser.walletStatus === 'blocked')
        return res.status(400).json({ message: 'Wallet is blocked' })
      if (walletUser.walletBalance < finalPriceInPaise)
        return res.status(400).json({ message: 'Insufficient wallet balance' })
    }

    const playerDataClean = (() => {
      const pd = req.body.playerData || {}
      const clean = {}
      const MANUAL_CATS = ['other','premium','gifting','ott','smm','voucher']
      if (MANUAL_CATS.includes(game.category)) {
        Object.entries(pd).forEach(([k, v]) => {
          if (k !== '__proto__' && k !== 'constructor' && k !== 'prototype')
            clean[k] = String(v ?? '').slice(0, 200)
        })
      } else {
        const allowed = ['userId','zoneId','serverId','regionSlug']
        allowed.forEach(k => { if (pd[k] !== undefined) clean[k] = String(pd[k]).slice(0, 100) })
      }
      return clean
    })()

    const order = await Order.create({
      userId:    req.user._id,
      gameId,
      packId,
      gameName:  game.name,
      packName:  pack.title,
      price:     finalPrice,
      playerData: playerDataClean,
      packSnapshot: {
        title:          pack.title,
        price:          pack.price,
        resellerPrice:  pack.resellerPrice || 0,
        provider:       pack.provider || '',
        providerGameId: pack.providerGameId || '',
        skuCodes:       (pack.skuCodes || []).map(s => ({ skuCode: s.skuCode, quantity: s.quantity || 1 })),
        skuCode:        pack.skuCode || '',
      },
      couponCode:        appliedCode,
      couponDiscount:    couponDiscount,
      ...(payWithWallet ? {
        paymentMethod:    'wallet',
        paymentStatus:    'unpaid', // will be set to paid after atomic debit below
        walletAmountUsed: finalPriceInPaise,
      } : {}),
    })

    if (payWithWallet) {
      // Atomically debit wallet — if this fails, rollback the order
      const debitResult = await debitWallet(
        req.user._id, finalPriceInPaise, 'debit',
        order._id.toString(),
        `Order: ${game.name} — ${pack.title}`,
        null,
        req.ip || ''
      )

      if (!debitResult.ok) {
        // Rollback: delete order; also undo coupon increment if applied
        await Order.findByIdAndDelete(order._id)
        if (appliedCode) {
          await Coupon.findOneAndUpdate({ code: appliedCode }, { $inc: { usedCount: -1 } })
        }
        return res.status(400).json({ message: debitResult.error })
      }

      // Mark order as paid and trigger recharge
      await Order.findByIdAndUpdate(order._id, {
        paymentStatus:    'paid',
        rechargeTriggered: true,
      })

      // Kick off recharge in the background (same pattern as paymentController)
      const MANUAL_CATS = ['other','premium','gifting','ott','smm','voucher']
      if (MANUAL_CATS.includes(game.category)) {
        await Order.findByIdAndUpdate(order._id, { status: 'Processing' })
      } else {
        const packForRecharge = order.packSnapshot?.skuCodes?.length > 0
          ? order.packSnapshot
          : pack
        const region = game.regions?.find(r => r.slug === playerDataClean?.regionSlug && r.active)
                    || game.regions?.find(r => r.active)
        const effectiveProvider = region?.provider || packForRecharge?.provider || game?.provider || ''
        if (!effectiveProvider || effectiveProvider === 'manual') {
          await Order.findByIdAndUpdate(order._id, { status: 'Processing' })
        } else {
          await Order.findByIdAndUpdate(order._id, { status: 'Processing' })
          processRecharge(order, packForRecharge, game)
            .then(async result => {
              const upd = { status: 'Completed', providerOrderId: result.providerOrderId || '' }
              if (result.playerName) upd.playerName = result.playerName
              if (result.transactions?.length > 0) upd.providerTransactions = result.transactions
              await Order.findByIdAndUpdate(order._id, upd)
            })
            .catch(async e => {
              console.error('[WALLET ORDER RECHARGE] Failed:', e.message)
              await Order.findByIdAndUpdate(order._id, { status: 'Failed' })
            })
        }
      }

      return res.status(201).json({ ...order.toObject(), paymentStatus: 'paid', paymentMethod: 'wallet' })
    }

    res.status(201).json(order)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// POST /api/orders/:id/recharge — admin manually trigger
router.post("/:id/recharge", protect, adminOnly, validateObjectId, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
    if (!order) return res.status(404).json({ message: "Order not found" })
    if (order.paymentStatus !== 'paid') return res.status(400).json({ message: "Cannot recharge — order is not paid" })
    const game = await Game.findById(order.gameId)
    const pack = order.packSnapshot?.skuCodes?.length > 0
      ? order.packSnapshot
      : await Pack.findById(order.packId)
    if (!game || !pack) return res.status(404).json({ message: "Game or pack not found" })
    order.status = "Processing"
    await order.save()
    const result = await processRecharge(order, pack, game)
    if (result.transactions?.length > 0) {
      await Order.findByIdAndUpdate(order._id, { providerTransactions: result.transactions })
    }
    res.json({ success: true, result })
  } catch (err) {
    res.status(500).json({ message: safeError(err) })
  }
})

// PUT /api/orders/:id — admin update
router.put("/:id", protect, adminOnly, validateObjectId, async (req, res) => {
  try {
    const { status, adminNote, paymentStatus } = req.body
    const VALID_ORDER_STATUSES = ['Pending', 'Processing', 'Completed', 'Failed', 'Refunded']
    const update = {}
    if (status) {
      if (!VALID_ORDER_STATUSES.includes(status))
        return res.status(400).json({ message: "Invalid status value" })
      update.status = status
    }
    if (adminNote !== undefined) update.adminNote = String(adminNote).slice(0, 2000)
    if (status === 'Completed') {
      update.paymentStatus     = 'paid'
      update.rechargeTriggered = true
    }
    if (paymentStatus === 'refunded') update.paymentStatus = 'refunded'
    const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true })
    if (!order) return res.status(404).json({ message: "Order not found" })
    securityLog.adminAction(req.user._id, `update_order:${JSON.stringify(update)}`, req.params.id)

    // Send billing email on completion
    if (status === 'Completed') {
      try {
        const [settings, user, game] = await Promise.all([
          Settings.findOne(),
          User.findById(order.userId).select('email'),
          Game.findById(order.gameId).select('icon'),
        ])
        if (user?.email) {
          const logoUrl     = settings?.logo   ? `${SITE_URL}${settings.logo}`  : ''
          const gameIconUrl = game?.icon        ? `${SITE_URL}${game.icon}`      : ''
          const emailOrder  = {
            ...order.toObject(),
            gameIcon:   gameIconUrl,
            playerInfo: order.playerData || {},
          }
          await sendOrderConfirmationEmail(
            user.email, emailOrder,
            settings?.siteName || 'Nitrogen Store',
            logoUrl,
            settings?.currencySymbol || '₹'
          )
        }
      } catch (emailErr) {
        console.error('[EMAIL] Order confirmation failed:', emailErr.message)
      }
    }

    res.json(order)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

module.exports = router