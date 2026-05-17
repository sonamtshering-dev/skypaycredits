// routes/fintopupRoutes.js
const express = require("express")
const router  = express.Router()
const mongoose = require("mongoose")
const { mapStatus } = require("../services/fintopupService")

// POST /api/fintopup/callback
// FinTopup POSTs here when an order status changes
router.post("/callback", async (req, res) => {
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