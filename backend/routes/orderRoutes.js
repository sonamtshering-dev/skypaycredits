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
const Game    = require("../models/Game")
const Pack    = require("../models/Pack")
const { processRecharge } = require("../services/rechargeService")
const { protect, adminOnly, validateObjectId } = require("../middlewares/authMiddleware")

// GET /api/orders/my — logged-in user's orders
router.get("/my", protect, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id })
      .sort({ createdAt: -1 }).limit(50)
      .populate('gameId', 'name icon slug')
      .populate('packId', 'title price diamonds regionSlug')
      .lean()

    // Remap fields for frontend
    const mapped = orders.map(o => ({
      ...o,
      game:          o.gameId || null,
      pack:          o.packId ? { name: o.packId.title, ...o.packId } : null,
      playerId:      o.playerData?.userId || '',
      region:        o.playerData?.regionSlug || '',
      amount:        o.packId?.price || o.amount,
      currency:      '৳',
      provider:      o.providerTransactions?.[0]?.provider || '',
      providerTxId:  o.providerTransactions?.[0]?.providerOrderId || '',
    }))
    return res.json(mapped)
  } catch (err) {
    res.status(500).json({ message: safeError(err) })
  }
})

// GET /api/orders — admin: all orders with pagination
router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1)
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 30)) // cap at 50
    const skip  = (page - 1) * limit

    const filter = {}
    const VALID_STATUSES  = ["Pending","Processing","Completed","Failed","Refunded"]
    const VALID_PAYMENTS  = ["unpaid","paid","refunded"]
    if (req.query.status  && VALID_STATUSES.includes(req.query.status))   filter.status       = req.query.status
    if (req.query.payment && VALID_PAYMENTS.includes(req.query.payment))   filter.paymentStatus = req.query.payment
    if (req.query.search)  filter.gameName = { $regex: escapeRegex(req.query.search), $options: "i" }

    const [orders, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate("userId","name email"),
      Order.countDocuments(filter),
    ])
    res.json({ orders, total, page, pages: Math.ceil(total / limit) })
  } catch (err) {
    res.status(500).json({ message: safeError(err) })
  }
})

// GET /api/orders/stats — admin dashboard stats
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
    // Map populated fields to match frontend expectations
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
    // Non-admin can only see own orders
    if (req.user.role !== "admin" && !order.userId.equals(req.user._id))
      return res.status(403).json({ message: "Forbidden" })
    res.json(order)
  } catch (err) {
    res.status(500).json({ message: safeError(err) })
  }
})

// POST /api/orders — create order (user places order after payment initiation)
router.post("/", protect, async (req, res) => {
  try {
    // Block banned users from placing orders
    if (req.user.status === "banned") return res.status(403).json({ message: "Account has been banned" })
    // Block unverified users from placing orders
    if (!req.user.isEmailVerified) return res.status(403).json({ message: "Please verify your email before placing an order" })

    const { gameId, packId, playerData, couponCode } = req.body
    if (!gameId || !packId) return res.status(400).json({ message: "gameId and packId are required" })
    if (!mongoose.isValidObjectId(gameId) || !mongoose.isValidObjectId(packId))
      return res.status(400).json({ message: "Invalid game or pack ID" })

    const [game, pack] = await Promise.all([Game.findById(gameId), Pack.findById(packId)])
    if (!game || !pack) return res.status(404).json({ message: "Game or pack not found" })
    if (!game.active) return res.status(400).json({ message: "This game is not available" })
    if (!pack.active) return res.status(400).json({ message: "This pack is not available" })
    // Verify pack actually belongs to this game — prevents pack price manipulation
    if (pack.gameId.toString() !== gameId)
      return res.status(400).json({ message: "Pack does not belong to this game" })

    // Limit unpaid orders per user to prevent abuse
    const unpaidCount = await Order.countDocuments({
      userId: req.user._id,
      paymentStatus: 'unpaid',
      createdAt: { $gte: new Date(Date.now() - 30*60*1000) }
    })
    if (unpaidCount >= 10) return res.status(429).json({
      message: "Too many pending orders. Please complete or wait for existing orders."
    })

    const order = await Order.create({
      userId:    req.user._id,
      gameId,
      packId,
      gameName:  game.name,
      packName:  pack.title,
      price:     pack.price,
      playerData: (() => {
        const pd = playerData || {}
        // Sanitize playerData — only allow safe string fields, no nesting
        const clean = {}
        const allowed = ['userId','zoneId','serverId','regionSlug']
        allowed.forEach(k => {
          if (pd[k] !== undefined) clean[k] = String(pd[k]).slice(0, 100)
        })
        return clean
      })(),
      couponCode: couponCode || "",
    })
    res.status(201).json(order)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// POST /api/orders/:id/recharge — admin: manually trigger recharge
router.post("/:id/recharge", protect, adminOnly, validateObjectId, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
    if (!order) return res.status(404).json({ message: "Order not found" })
    // Z-01 FIX: Only allow recharge if order is paid
    if (order.paymentStatus !== 'paid') return res.status(400).json({ message: "Cannot recharge — order is not paid" })

    const [game, pack] = await Promise.all([Game.findById(order.gameId), Pack.findById(order.packId)])
    if (!game || !pack) return res.status(404).json({ message: "Game or pack not found" })

    order.status = "Processing"
    await order.save()

    const result = await processRecharge(order, pack, game)
    res.json({ success: true, result })
  } catch (err) {
    res.status(500).json({ message: safeError(err) })
  }
})

// PUT /api/orders/:id — admin: update status / note
router.put("/:id", protect, adminOnly, validateObjectId, async (req, res) => {
  try {
    const { status, adminNote, paymentStatus } = req.body
    const update = {}
    if (status)        update.status        = status
    if (adminNote !== undefined) update.adminNote = adminNote
    // If admin marks as Completed, also mark as paid and rechargeTriggered
    if (status === 'Completed') {
      update.paymentStatus     = 'paid'
      update.rechargeTriggered = true
    }
    // Z-02 FIX: Admin can only set refunded, not 'paid' (must come from payment gateway)
    if (paymentStatus === 'refunded') update.paymentStatus = 'refunded'
    const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true })
    if (!order) return res.status(404).json({ message: "Order not found" })
    securityLog.adminAction(req.user._id, `update_order:${JSON.stringify(update)}`, req.params.id)
    res.json(order)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

module.exports = router