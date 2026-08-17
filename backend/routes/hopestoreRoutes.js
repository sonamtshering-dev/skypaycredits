// routes/hopestoreRoutes.js
const express = require("express")
const router  = express.Router()
const { protect, adminOnly } = require("../middlewares/authMiddleware")
const hopestore = require("../services/hopestoreService")

// GET /api/hopestore/balance
router.get("/balance", protect, adminOnly, async (req, res) => {
  try {
    const data = await hopestore.getBalance()
    const balance = data?.data?.saldo ?? data?.saldo ?? data?.balance ?? 0
    res.json({ success: true, balance, currency: "IDR", raw: data })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

module.exports = router
