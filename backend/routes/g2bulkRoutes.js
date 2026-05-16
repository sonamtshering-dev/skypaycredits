// routes/g2bulkRoutes.js
const express   = require("express")
const router    = express.Router()
const g2bulk    = require("../services/g2bulkService")
const { protect, adminOnly } = require("../middlewares/authMiddleware")

// ── Admin: Get balance ────────────────────────────
router.get("/balance", protect, adminOnly, async (req, res) => {
  try {
    const data = await g2bulk.getBalance()
    res.json({ success: true, data })
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

// ── Admin: Get all games ──────────────────────────
router.get("/games", protect, adminOnly, async (req, res) => {
  try {
    const games = await g2bulk.getGames()
    res.json({ success: true, games: games.map(g => g.code || g) })
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

// ── Admin: Get catalogue for a game ──────────────
router.get("/catalogue/:code", protect, adminOnly, async (req, res) => {
  try {
    const items = await g2bulk.getCatalogue(req.params.code)
    res.json({ success: true, game: req.params.code, catalogues: items })
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

// ── Admin: Get fields for a game ──────────────────
router.get("/fields/:code", protect, adminOnly, async (req, res) => {
  try {
    const info = await g2bulk.getFields(req.params.code)
    res.json({ success: true, info })
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

// ── Admin: Get servers for a game ─────────────────
router.get("/servers/:code", protect, adminOnly, async (req, res) => {
  try {
    const servers = await g2bulk.getServers(req.params.code)
    res.json({ success: true, servers })
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

// ── Admin: Get all products (vouchers) ────────────
router.get("/products", protect, adminOnly, async (req, res) => {
  try {
    const products = await g2bulk.getProducts()
    res.json({ success: true, products })
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

// ── Public: Verify player ─────────────────────────
router.post("/verify", protect, async (req, res) => {
  try {
    const { gameCode, userId, serverId } = req.body
    if (!gameCode || !userId) {
      return res.status(400).json({ message: "gameCode and userId required" })
    }
    // Clean invisible unicode characters
    const cleanUserId  = userId.replace(/[^\x20-\x7E]/g, "").trim()
    const cleanServer  = (serverId || "").replace(/[^\x20-\x7E]/g, "").trim()

    const result = await g2bulk.checkPlayerId(gameCode, cleanUserId, cleanServer)
    res.json({ success: true, result })
  } catch (e) {
    res.status(400).json({ success: false, message: e.message })
  }
})

// ── G2Bulk order callback ─────────────────────────
const callback = async (req, res) => {
  try {
    const { order_id, game_code, status, player_id, denom_id, message } = req.body
    console.log(`[G2BULK] Callback: order=${order_id} game=${game_code} status=${status}`)

    if (status === "COMPLETED") {
      const Order = require("../models/Order")
      const order = await Order.findOne({
        $or: [
          { providerOrderId: String(order_id) },
          { "transactions.providerOrderId": String(order_id) }
        ]
      })
      if (order) {
        await Order.findByIdAndUpdate(order._id, {
          status: "Completed",
          providerOrderId: String(order_id)
        })
        console.log(`[G2BULK] ✅ Order ${order._id} marked Completed`)
      } else {
        console.warn(`[G2BULK] Order not found for provider order_id: ${order_id}`)
      }
    } else if (status === "FAILED") {
      const Order = require("../models/Order")
      const order = await Order.findOne({ providerOrderId: String(order_id) })
      if (order) {
        await Order.findByIdAndUpdate(order._id, { status: "Failed" })
        console.log(`[G2BULK] ❌ Order ${order._id} marked Failed`)
      }
    }

    res.json({ ok: true })
  } catch (e) {
    console.error("[G2BULK] Callback error:", e.message)
    res.status(500).json({ ok: false })
  }
}

module.exports = router
module.exports.callback = callback
