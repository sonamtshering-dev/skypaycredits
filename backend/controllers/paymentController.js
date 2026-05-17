// controllers/paymentController.js — NovaPay gateway
const axios  = require("axios")
const crypto = require("crypto")
const Order  = require("../models/Order")
const Game   = require("../models/Game")
const Pack   = require("../models/Pack")
const securityLog         = require('../services/securityLogger')
const { processRecharge } = require("../services/rechargeService")

const NOVAPAY_API_KEY        = process.env.NOVAPAY_API_KEY
const NOVAPAY_API_SECRET     = process.env.NOVAPAY_API_SECRET
const NOVAPAY_WEBHOOK_SECRET = process.env.NOVAPAY_WEBHOOK_SECRET || ""
const NOVAPAY_BASE           = "https://nova-pay.in/api/v1"
const FRONTEND               = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "")
const BACKEND                = (process.env.BACKEND_URL  || "http://localhost:5001").replace(/\/$/, "")
const isProd                 = process.env.NODE_ENV === "production"

// ── HMAC sign helper ──────────────────────────────
function signRequest(secret, timestamp, rawBody) {
  const message = `${timestamp}.${rawBody}`
  return crypto.createHmac("sha256", secret).update(message).digest("hex")
}

function novaHeaders(rawBody) {
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const signature = signRequest(NOVAPAY_API_SECRET, timestamp, rawBody)
  return {
    "Content-Type":  "application/json",
    "X-API-Key":     NOVAPAY_API_KEY,
    "X-Timestamp":   timestamp,
    "X-Signature":   signature,
  }
}

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

// ── POST /api/payment/create ──────────────────────
exports.createPayment = async (req, res) => {
  try {
    const { orderId } = req.body
    if (!orderId) return res.status(400).json({ message: "orderId required" })
    if (!NOVAPAY_API_KEY || !NOVAPAY_API_SECRET)
      return res.status(500).json({ message: "Payment gateway not configured" })

    const order = await Order.findById(orderId)
    if (!order)   return res.status(404).json({ message: "Order not found" })
    if (order.userId.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Forbidden" })
    if (order.paymentStatus === "paid")
      return res.status(400).json({ message: "Order already paid" })

    // NovaPay amount is in paise (₹1 = 100)
    const amountPaise = Math.round(order.price * 100)
    const novaOrderId = `ORD-${orderId}`

    const bodyObj = {
      order_id:           novaOrderId,
      amount:             amountPaise,
      currency:           "INR",
      customer_reference: req.user.name?.substring(0, 128) || "Customer",
      redirect_url:       `${FRONTEND}/payment/success?order_id=${orderId}`,
    }
    const rawBody = JSON.stringify(bodyObj)

    const { data } = await axios.post(
      `${NOVAPAY_BASE}/payments/create`,
      rawBody,
      { headers: novaHeaders(rawBody), timeout: 30000 }
    )

    if (!data.success) return res.status(400).json({ message: data.error || "Payment creation failed" })

    const paymentId = data.data.payment_id
    await Order.findByIdAndUpdate(orderId, { paymentId, paymentMethod: "novapay" })
    securityLog.paymentCreated(req.user._id, orderId, order.price)

    res.json({
      success:     true,
      payment_url: data.data.pay_url,
      payment_id:  paymentId,
      qr_code:     data.data.qr_code_base64,
      upi_intent:  data.data.upi_intent_link,
    })
  } catch (err) {
    console.error("[NOVAPAY] Create error:", err.message)
    res.status(500).json({ message: isProd ? "Payment service error" : err.message })
  }
}

// ── GET /api/payment/status/:paymentId ───────────
exports.getPaymentStatus = async (req, res) => {
  try {
    const existingOrder = await Order.findOne({ paymentId: req.params.paymentId })
    if (!existingOrder) return res.status(404).json({ message: "Order not found" })
    if (existingOrder.userId.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Forbidden" })

    // NovaPay public status endpoint — no auth needed
    const { data } = await axios.get(
      `${NOVAPAY_BASE}/public/payment/${req.params.paymentId}`,
      { timeout: 15000 }
    )

    if (data.success && data.data.status === "paid") {
      await triggerRechargeIfNeeded(req.params.paymentId)
    }

    res.json({ success: true, status: data.data?.status?.toUpperCase() || "PENDING", amount: data.data?.amount })
  } catch (err) {
    res.status(500).json({ message: isProd ? "Payment service error" : err.message })
  }
}

// ── POST /api/payment/webhook — NovaPay calls this ─
exports.handleWebhook = async (req, res) => {
  try {
    const rawBody = Buffer.isBuffer(req.body)
      ? req.body.toString("utf8")
      : JSON.stringify(req.body)
    const parsed = Buffer.isBuffer(req.body) ? JSON.parse(rawBody) : req.body

    // Verify X-NovaPay-Signature
    const signature = req.headers["x-novapay-signature"] || ""
    if (NOVAPAY_WEBHOOK_SECRET && signature) {
      const expected = crypto
        .createHmac("sha256", NOVAPAY_WEBHOOK_SECRET)
        .update(rawBody)
        .digest("hex")
      if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) {
        console.warn("[WEBHOOK] NovaPay signature mismatch")
        return res.status(401).json({ message: "Invalid signature" })
      }
    }

    const { event, payment_id, order_id, status } = parsed
    console.log("[WEBHOOK] NovaPay received:", { event, payment_id, order_id, status })

    if (event === "payment.success" && status === "paid" && payment_id) {
      await triggerRechargeIfNeeded(payment_id)
    }

    res.json({ received: true })
  } catch (err) {
    console.error("[WEBHOOK] Error:", err.message)
    res.status(400).json({ message: "Webhook processing failed" })
  }
}

// ── GET /api/payment/order/:orderId/status ────────
exports.getPaymentStatusByOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
    if (!order) return res.status(404).json({ message: "Order not found" })
    if (order.userId.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Forbidden" })
    if (!order.paymentId) return res.json({ status: "PENDING" })

    const { data } = await axios.get(
      `${NOVAPAY_BASE}/public/payment/${order.paymentId}`,
      { timeout: 15000 }
    )

    if (data.success && data.data.status === "paid") {
      await triggerRechargeIfNeeded(order.paymentId)
    }

    res.json({ status: data.data?.status?.toUpperCase() || "PENDING", amount: data.data?.amount })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}