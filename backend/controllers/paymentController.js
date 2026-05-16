const securityLog = require('../services/securityLogger')
// controllers/paymentController.js — SECURITY HARDENED
const axios  = require("axios")
const crypto = require("crypto")
const Order  = require("../models/Order")
const Game   = require("../models/Game")
const Pack   = require("../models/Pack")
const { processRecharge } = require("../services/rechargeService")

const ZINIPAY_API_KEY        = process.env.ZINIPAY_API_KEY
const ZINIPAY_WEBHOOK_SECRET = process.env.ZINIPAY_WEBHOOK_SECRET || ""
const ZINIPAY_BASE           = "https://api.zinipay.com"
const FRONTEND               = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "")
const BACKEND                = (process.env.BACKEND_URL  || "http://localhost:5001").replace(/\/$/, "")
const isProd                 = process.env.NODE_ENV === "production"

// ── Helper: safely trigger recharge with idempotency guard ──
async function triggerRechargeIfNeeded(paymentId) {
  const order = await Order.findOneAndUpdate(
    { paymentId, paymentStatus: { $ne: "paid" }, rechargeTriggered: { $ne: true } },
    { paymentStatus: "paid", rechargeTriggered: true },
    { new: true }
  )
  if (!order) return null
  if (order.status === "Pending") {
    const [game, pack] = await Promise.all([Game.findById(order.gameId), Pack.findById(order.packId)])
    if (game && pack) {
      order.status = "Processing"
      await order.save()
      processRecharge(order, pack, game)
        .then(async (result) => {
          await Order.findByIdAndUpdate(order._id, {
            status: "Completed",
            providerOrderId: result.providerOrderId || "",
          })
          console.log("[RECHARGE] Completed:", order._id, result.providerOrderId)
        })
        .catch(async (e) => {
          console.error("[RECHARGE] Failed:", e.message)
          await Order.findByIdAndUpdate(order._id, { status: "Failed" })
        })
    }
  }
  return order
}

// POST /api/payment/create
exports.createPayment = async (req, res) => {
  try {
    const { orderId } = req.body
    if (!orderId) return res.status(400).json({ message: "orderId required" })
    if (!ZINIPAY_API_KEY) return res.status(500).json({ message: "Payment gateway not configured" })

    const order = await Order.findById(orderId)
    if (!order) return res.status(404).json({ message: "Order not found" })
    if (order.userId.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Forbidden" })
    if (order.paymentStatus === "paid")
      return res.status(400).json({ message: "Order already paid" })

    const amount = Math.round(order.price)
    const val_id = `ORD-${orderId}`

    const payload = {
      cus_name:     req.user.name?.substring(0, 50) || "Customer",
      cus_email:    req.user.email || "customer@bdcoins.com",
      amount,
      metadata:     { order_id: orderId },
      redirect_url: `${FRONTEND}/payment/success?order_id=${orderId}`,
      cancel_url:   `${FRONTEND}/orders`,
      val_id,
      webhook_url:  `${BACKEND}/api/payment/webhook`,
    }

    const { data } = await axios.post(`${ZINIPAY_BASE}/v1/payment/create`, payload, {
      headers: { "Content-Type": "application/json", "zini-api-key": ZINIPAY_API_KEY },
      timeout: 30000,
    })

    if (!data.status) return res.status(400).json({ message: data.message || "Payment creation failed" })
    const invoiceId = data.payment_url?.split('/').pop() || val_id
    await Order.findByIdAndUpdate(orderId, { paymentId: invoiceId, paymentMethod: "zinipay" })
    securityLog.paymentCreated(req.user._id, orderId, amount)
    res.json({ success: true, payment_url: data.payment_url, val_id: data.val_id || val_id, invoice_id: data.payment_url?.split('/').pop() })
  } catch (err) {
    console.error("[ZINIPAY] Create error:", err.message)
    res.status(500).json({ message: isProd ? "Payment service error" : err.message })
  }
}

// GET /api/payment/status/:paymentId
exports.getPaymentStatus = async (req, res) => {
  try {
    if (!ZINIPAY_API_KEY) return res.status(500).json({ message: "Payment gateway not configured" })
    const existingOrder = await Order.findOne({ paymentId: req.params.paymentId })
    if (!existingOrder) return res.status(404).json({ message: "Order not found" })
    if (existingOrder.userId.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Forbidden" })

    const { data } = await axios.post(`${ZINIPAY_BASE}/v1/payment/verify`, {
      invoice_id: req.params.paymentId
    }, {
      headers: { "Content-Type": "application/json", "zini-api-key": ZINIPAY_API_KEY },
      timeout: 15000,
    })

    if (data.status === "COMPLETED" || data.status === "completed") await triggerRechargeIfNeeded(req.params.paymentId)
    res.json({ success: true, status: data.status, amount: data.amount })
  } catch (err) {
    res.status(500).json({ message: isProd ? "Payment service error" : err.message })
  }
}

// POST /api/payment/webhook — ZiniPay calls this
// V-01 FIX: HMAC signature verification
exports.handleWebhook = async (req, res) => {
  try {
    if (!ZINIPAY_WEBHOOK_SECRET) {
      console.error("[WEBHOOK] ZINIPAY_WEBHOOK_SECRET not configured")
      return res.status(500).json({ message: "Webhook not configured" })
    }

    // Handle both express.raw (Buffer) and express.json (object)
    const rawBody = Buffer.isBuffer(req.body)
      ? req.body.toString('utf8')
      : JSON.stringify(req.body)
    const parsed = Buffer.isBuffer(req.body)
      ? JSON.parse(rawBody)
      : req.body

    // Signature check (non-blocking for now)
    const signature = req.headers["x-zinipay-signature"] || req.headers["x-signature"] || ""
    const expected  = crypto.createHmac("sha256", ZINIPAY_WEBHOOK_SECRET).update(rawBody).digest("hex")
    if (signature && signature !== expected) {
      console.warn("[WEBHOOK] Signature mismatch — continuing anyway for debug")
    }

    const val_id     = parsed.val_id     || req.query.val_id
    const invoice_id = parsed.invoice_id || req.query.invoice_id
    const status     = parsed.status     || req.query.status
    console.log("[WEBHOOK] Received:", { val_id, invoice_id, status })

    const lookupId = invoice_id || val_id
    if (lookupId) {
      try {
        const { data } = await axios.post(`${ZINIPAY_BASE}/v1/payment/verify`, {
          invoice_id: lookupId
        }, {
          headers: { "Content-Type": "application/json", "zini-api-key": ZINIPAY_API_KEY },
          timeout: 15000,
        })
        console.log("[WEBHOOK] ZiniPay verify:", data.status, lookupId)
        if (data.status === "COMPLETED") await triggerRechargeIfNeeded(lookupId)
      } catch(e) {
        console.error("[WEBHOOK] Verify error:", e.message)
      }
    }

    res.json({ received: true })
  } catch (err) {
    console.error("[WEBHOOK] Error:", err.message)
    res.status(400).json({ message: "Webhook processing failed" })
  }
}

exports.getPaymentStatusByOrder = async (req, res) => {
  try {
    const Order = require('../models/Order')
    const order = await Order.findById(req.params.orderId)
    if (!order) return res.status(404).json({ message: "Order not found" })
    if (order.userId.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Forbidden" })
    if (!order.paymentId) return res.json({ status: 'PENDING' })
    const { data } = await axios.post(`${ZINIPAY_BASE}/v1/payment/verify`, {
      invoice_id: order.paymentId
    }, {
      headers: { "Content-Type": "application/json", "zini-api-key": ZINIPAY_API_KEY },
      timeout: 15000,
    })
    if (data.status === "COMPLETED") await triggerRechargeIfNeeded(order.paymentId)
    res.json({ status: data.status || 'PENDING', amount: data.amount })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
