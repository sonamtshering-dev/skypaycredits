// routes/couponRoutes.js
const express  = require("express")
const router   = express.Router()
const Coupon   = require("../models/Coupon")
const Order    = require("../models/Order")
const { protect, adminOnly } = require("../middlewares/authMiddleware")

const isProd = process.env.NODE_ENV === "production"
const safeError = err => isProd ? "Server error" : err.message

// ── POST /api/coupons/validate — user validates a coupon ──
router.post("/validate", protect, async (req, res) => {
  try {
    const { code, price, gameId } = req.body
    if (!code || !price) return res.status(400).json({ message: "Code and price required" })

    const coupon = await Coupon.findOne({ code: code.toUpperCase().trim(), active: true })
    if (!coupon) return res.status(404).json({ message: "Invalid or expired coupon code" })

    // Check expiry
    if (coupon.expiresAt && new Date() > coupon.expiresAt)
      return res.status(400).json({ message: "This coupon has expired" })

    // Check usage limit
    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit)
      return res.status(400).json({ message: "This coupon has reached its usage limit" })

    // Check min order
    if (price < coupon.minOrder)
      return res.status(400).json({ message: `Minimum order amount is ₹${coupon.minOrder}` })

    // Check game restriction
    if (coupon.gameIds?.length > 0 && gameId) {
      const allowed = coupon.gameIds.map(id => id.toString())
      if (!allowed.includes(gameId)) {
        return res.status(400).json({ message: "This coupon is not valid for this game" })
      }
    }

    // Check per-user limit
    if (coupon.perUser > 0) {
      const userUsage = await Order.countDocuments({
        userId: req.user._id,
        couponCode: coupon.code,
        paymentStatus: { $ne: 'refunded' },
      })
      if (userUsage >= coupon.perUser)
        return res.status(400).json({ message: "You have already used this coupon" })
    }

    const discount = coupon.calculateDiscount(price)
    const finalPrice = Math.max(0, price - discount)

    res.json({
      valid:      true,
      code:       coupon.code,
      type:       coupon.type,
      value:      coupon.value,
      discount,
      finalPrice,
      message:    coupon.type === "flat"
        ? `₹${discount} off applied!`
        : `${coupon.value}% off — ₹${discount} saved!`
    })
  } catch (err) {
    res.status(500).json({ message: safeError(err) })
  }
})

// ── Admin routes ──────────────────────────────────

// GET /api/coupons — list all coupons
router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 })
    res.json(coupons)
  } catch (err) {
    res.status(500).json({ message: safeError(err) })
  }
})

// POST /api/coupons — create coupon
router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const { code, type, value, minOrder, maxDiscount, usageLimit, perUser, active, expiresAt, gameIds } = req.body
    if (!code || !type || !value) return res.status(400).json({ message: "Code, type and value required" })
    if (!["flat","percent"].includes(type)) return res.status(400).json({ message: "Type must be flat or percent" })
    if (type === "percent" && (value <= 0 || value > 100)) return res.status(400).json({ message: "Percent must be 1-100" })

    const coupon = await Coupon.create({
      code: code.toUpperCase().trim(),
      type, value,
      minOrder:    minOrder    || 0,
      maxDiscount: maxDiscount || 0,
      usageLimit:  usageLimit  || 0,
      perUser:     perUser     || 1,
      active:      active !== false,
      expiresAt:   expiresAt   || null,
      gameIds:     gameIds     || [],
    })
    res.status(201).json(coupon)
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: "Coupon code already exists" })
    res.status(400).json({ message: safeError(err) })
  }
})

// PUT /api/coupons/:id — update coupon
router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    const { code, type, value, minOrder, maxDiscount, usageLimit, perUser, active, expiresAt, gameIds } = req.body
    const update = {}
    if (code        !== undefined) update.code        = code.toUpperCase().trim()
    if (type        !== undefined) update.type        = type
    if (value       !== undefined) update.value       = value
    if (minOrder    !== undefined) update.minOrder    = minOrder
    if (maxDiscount !== undefined) update.maxDiscount = maxDiscount
    if (usageLimit  !== undefined) update.usageLimit  = usageLimit
    if (perUser     !== undefined) update.perUser     = perUser
    if (active      !== undefined) update.active      = active
    if (expiresAt   !== undefined) update.expiresAt   = expiresAt
    if (gameIds     !== undefined) update.gameIds     = gameIds
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, update, { new: true })
    if (!coupon) return res.status(404).json({ message: "Coupon not found" })
    res.json(coupon)
  } catch (err) {
    res.status(400).json({ message: safeError(err) })
  }
})

// DELETE /api/coupons/:id — delete coupon
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id)
    res.json({ message: "Coupon deleted" })
  } catch (err) {
    res.status(500).json({ message: safeError(err) })
  }
})

module.exports = router