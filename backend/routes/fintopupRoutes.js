// routes/fintopupRoutes.js
const express  = require("express")
const router   = express.Router()
const mongoose = require("mongoose")
const crypto   = require("crypto")
const { mapStatus } = require("../services/fintopupService")

const FINTOPUP_CALLBACK_SECRET = process.env.FINTOPUP_CALLBACK_SECRET
const ALLOWED_IPS = (process.env.FINTOPUP_ALLOWED_IPS || "").split(",").map(s => s.trim()).filter(Boolean)

function verifyFintopupCallback(req, res, next) {
  // IP allowlist (optional — set FINTOPUP_ALLOWED_IPS as comma-separated list)
  if (ALLOWED_IPS.length > 0) {
    const ip = req.ip || req.socket?.remoteAddress || ""
    if (!ALLOWED_IPS.includes(ip)) {
      console.warn("[FINTOPUP] Callback rejected — IP not in allowlist:", ip)
      return res.status(403).json({ received: false, message: "Forbidden" })
    }
  }
  // Shared-secret check — required in production (VULN-02/14)
  if (!FINTOPUP_CALLBACK_SECRET) {
    if (process.env.NODE_ENV === 'production') {
      console.error("[FINTOPUP] FINTOPUP_CALLBACK_SECRET not set — refusing all callbacks in production")
      return res.status(500).json({ received: false, message: "Callback not configured" })
    }
  } else {
    const sig = req.headers["x-fintopup-secret"] || ""
    const secretBuf = Buffer.from(FINTOPUP_CALLBACK_SECRET)
    const sigBuf    = Buffer.from(sig)
    if (!sig || sigBuf.length !== secretBuf.length || !crypto.timingSafeEqual(secretBuf, sigBuf)) {
      console.warn("[FINTOPUP] Callback rejected — invalid secret")
      return res.status(401).json({ received: false, message: "Invalid secret" })
    }
  }
  next()
}

// POST /api/fintopup/callback
// FinTopup POSTs here when an order status changes
router.post("/callback", verifyFintopupCallback, async (req, res) => {
  try {
    const { success, message, response, error } = req.body
    console.log("[FINTOPUP] Callback received:", JSON.stringify(req.body))

    if (!success) {
      console.warn("[FINTOPUP] Callback error:", error?.message || message)
      return res.json({ received: true })
    }

    const { txnId, status } = response || {}
    if (!txnId || !status) return res.json({ received: true })

    const Order = mongoose.model("Order")
    const Game  = mongoose.model("Game")
    const Pack  = mongoose.model("Pack")

    const internalStatus = mapStatus(status)
    console.log("[FINTOPUP] txnId:", txnId, "status:", status, "→", internalStatus)

    if (internalStatus === "Completed") {
      await Order.findOneAndUpdate(
        { providerOrderId: txnId, status: { $ne: "Completed" } },
        { status: "Completed" }
      )
    } else if (internalStatus === "Failed") {
      await Order.findOneAndUpdate(
        { providerOrderId: txnId, status: { $nin: ["Completed", "Failed"] } },
        { status: "Failed" }
      )
    }

    res.json({ received: true })
  } catch (err) {
    console.error("[FINTOPUP] Callback error:", err.message)
    res.status(500).json({ received: false })
  }
})

module.exports = router