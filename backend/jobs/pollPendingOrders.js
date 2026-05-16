const mongoose = require("mongoose")
const axios = require("axios")

const ZINIPAY_BASE = process.env.ZINIPAY_BASE_URL || "https://api.zinipay.com"
const ZINIPAY_API_KEY = process.env.ZINIPAY_API_KEY

async function pollPendingOrders() {
  try {
    const Order = mongoose.model("Order")
    const Game  = mongoose.model("Game")
    const Pack  = mongoose.model("Pack")

    const now = Date.now()
    const cutoff    = new Date(now - 2 * 60 * 1000)
    const twoHrsAgo = new Date(now - 2 * 60 * 60 * 1000)

    const orders = await Order.find({
      paymentStatus:     "unpaid",
      rechargeTriggered: { $ne: true },
      status:            "Pending",
      paymentId:         { $exists: true, $ne: null },
      createdAt:         { $lt: cutoff, $gt: twoHrsAgo }
    }).limit(20)

    if (orders.length === 0) return
    console.log("[POLL] Checking " + orders.length + " pending orders...")

    for (const order of orders) {
      try {
        const { data } = await axios.post(ZINIPAY_BASE + "/v1/payment/verify", {
          invoice_id: order.paymentId
        }, {
          headers: { "Content-Type": "application/json", "zini-api-key": ZINIPAY_API_KEY },
          timeout: 10000
        })

        console.log("[POLL] Order " + order._id + " | ZiniPay: " + data.status)

        if (data.status === "COMPLETED") {
          const updated = await Order.findOneAndUpdate(
            { _id: order._id, paymentStatus: { $ne: "paid" }, rechargeTriggered: { $ne: true } },
            { paymentStatus: "paid", rechargeTriggered: true, status: "Processing" },
            { new: true }
          )

          const game = await Game.findById(order.gameId)
          const pack = await Pack.findById(order.packId)

          if (game && pack) {
            const { processRecharge } = require("../services/rechargeService")
            processRecharge(updated, pack, game)
              .then(async function(result) {
                await Order.findByIdAndUpdate(order._id, {
                  status: "Completed",
                  providerOrderId: result.providerOrderId || ""
                })
                console.log("[POLL] Recharge complete: " + order._id + " | " + result.providerOrderId)
              })
              .catch(async function(e) {
                await Order.findByIdAndUpdate(order._id, { status: "Failed" })
                console.error("[POLL] Recharge failed: " + order._id + " | " + e.message)
              })
          }
        } else if (data.status === "FAILED" || data.status === "EXPIRED") {
          await Order.findByIdAndUpdate(order._id, { status: "Failed" })
          console.log("[POLL] Order " + order._id + " marked Failed")
        }
      } catch(e) {
        console.error("[POLL] Error: " + e.message)
      }
    }
  } catch(e) {
    console.error("[POLL] Fatal: " + e.message)
  }
}

module.exports = pollPendingOrders
