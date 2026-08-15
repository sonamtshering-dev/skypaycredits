// controllers/paymentController.js — NovaPay gateway
const axios  = require("axios")
const crypto = require("crypto")
const Order  = require("../models/Order")
const Game   = require("../models/Game")
const Pack   = require("../models/Pack")
const securityLog         = require('../services/securityLogger')
const { processRecharge } = require("../services/rechargeService")
const { sendOrderConfirmationEmail } = require("../services/emailService")
const Settings = require("../models/Settings")
const User     = require("../models/User")
const SITE_URL = process.env.SITE_URL || 'https://nitrogenstore.in'

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
    const game = await Game.findById(order.gameId)
    // Manual-fulfillment categories — admin handles delivery; just mark Processing
    const MANUAL_CATS = ['other','premium','gifting','ott','smm','voucher']
    if (game && MANUAL_CATS.includes(game.category)) {
      order.status = "Processing"
      await order.save()
      // Notify customer that manual order is received and being processed
      try {
        const [settings, user] = await Promise.all([
          Settings.findOne(),
          User.findById(order.userId).select('email'),
        ])
        if (user?.email) {
          const emailOrder = { ...order.toObject(), status: "Processing", gameIcon: '', playerInfo: order.playerData || {} }
          await sendOrderConfirmationEmail(user.email, emailOrder, settings?.siteName || 'Nitrogen Store', settings?.logo ? `${SITE_URL}${settings.logo}` : '', settings?.currencySymbol || '₹')
        }
      } catch (emailErr) {
        console.error('[EMAIL] Manual order notification failed:', emailErr.message)
      }
    } else {
      // Prefer the snapshot saved at order time; fall back to live pack for old orders
      const pack = order.packSnapshot?.skuCodes?.length > 0
        ? order.packSnapshot
        : await Pack.findById(order.packId)

      // If no provider is configured (or set to "manual"), skip auto-recharge
      const region = game?.regions?.find(r => r.slug === order.playerData?.regionSlug && r.active)
                  || game?.regions?.find(r => r.active)
      const effectiveProvider = region?.provider || pack?.provider || game?.provider || ''
      const isManualProvider  = !effectiveProvider || effectiveProvider === 'manual'

      if (game && isManualProvider) {
        order.status = "Processing"
        await order.save()
        try {
          const [settings, user] = await Promise.all([
            Settings.findOne(),
            User.findById(order.userId).select('email'),
          ])
          if (user?.email) {
            const emailOrder = { ...order.toObject(), status: "Processing", gameIcon: '', playerInfo: order.playerData || {} }
            await sendOrderConfirmationEmail(user.email, emailOrder, settings?.siteName || 'Nitrogen Store', settings?.logo ? `${SITE_URL}${settings.logo}` : '', settings?.currencySymbol || '₹')
          }
        } catch (emailErr) {
          console.error('[EMAIL] Manual-provider order notification failed:', emailErr.message)
        }
      } else if (game && pack) {
        order.status = "Processing"
        await order.save()
        processRecharge(order, pack, game)
          .then(async (result) => {
            const update = {
              status: "Completed",
              providerOrderId: result.providerOrderId || "",
            }
            if (result.playerName)              update.playerName = result.playerName
            if (result.transactions?.length > 0) update.providerTransactions = result.transactions
            await Order.findByIdAndUpdate(order._id, update)
            console.log("[RECHARGE] Completed:", order._id, result.providerOrderId)
            // Send billing email after auto-completion
            try {
              const [settings, user, gameDoc] = await Promise.all([
                Settings.findOne(),
                User.findById(order.userId).select('email'),
                Game.findById(order.gameId).select('icon'),
              ])
              if (user?.email) {
                const completedOrder = { ...order.toObject(), ...update, gameIcon: gameDoc?.icon ? `${SITE_URL}${gameDoc.icon}` : '', playerInfo: order.playerData || {} }
                await sendOrderConfirmationEmail(user.email, completedOrder, settings?.siteName || 'Nitrogen Store', settings?.logo ? `${SITE_URL}${settings.logo}` : '', settings?.currencySymbol || '₹')
              }
            } catch (emailErr) {
              console.error('[EMAIL] Auto-complete billing failed:', emailErr.message)
            }
          })
          .catch(async (e) => {
            console.error("[RECHARGE] Failed:", e.message)
            await Order.findByIdAndUpdate(order._id, { status: "Failed" })
          })
      } else {
        console.error("[RECHARGE] Cannot process — game or pack not found for order:", order._id)
        await Order.findByIdAndUpdate(order._id, { status: "Failed" })
      }
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
      payment_url: `https://nova-pay.in/pay/${data.data.payment_id}`,
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

    // Verify X-NovaPay-Signature — required in production
    const signature = req.headers["x-novapay-signature"] || ""
    if (isProd && !NOVAPAY_WEBHOOK_SECRET) {
      console.error("[WEBHOOK] NOVAPAY_WEBHOOK_SECRET not set — refusing all webhooks in production")
      return res.status(500).json({ message: "Webhook not configured" })
    }
    if (NOVAPAY_WEBHOOK_SECRET) {
      if (!signature) {
        console.warn("[WEBHOOK] NovaPay signature header missing")
        return res.status(401).json({ message: "Missing signature" })
      }
      const expected = crypto
        .createHmac("sha256", NOVAPAY_WEBHOOK_SECRET)
        .update(rawBody)
        .digest("hex")
      if (expected.length !== signature.length ||
          !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) {
        console.warn("[WEBHOOK] NovaPay signature mismatch")
        return res.status(401).json({ message: "Invalid signature" })
      }
    }

    // Optional 5-minute replay window (VULN-22)
    const tsHeader = req.headers["x-novapay-timestamp"]
    if (tsHeader) {
      const tsSec  = parseInt(tsHeader, 10)
      const nowSec = Math.floor(Date.now() / 1000)
      if (isNaN(tsSec) || Math.abs(nowSec - tsSec) > 300) {
        console.warn("[WEBHOOK] NovaPay timestamp rejected:", tsHeader)
        return res.status(401).json({ message: "Request expired" })
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