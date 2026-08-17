// routes/fazercardsRoutes.js
const express    = require("express")
const router     = express.Router()
const { protect, adminOnly } = require("../middlewares/authMiddleware")
const fazercards = require("../services/fazercardsService")

// GET /api/fazercards/balance
router.get("/balance", protect, adminOnly, async (req, res) => {
  try {
    const data = await fazercards.getBalance()
    if (data.ok === false) return res.status(400).json({ success: false, message: data.error })
    res.json({ success: true, balance: data.balance, currency: data.currency || "USD" })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// GET /api/fazercards/categories
router.get("/categories", protect, adminOnly, async (req, res) => {
  try {
    const data = await fazercards.getCategories()
    res.json(data)
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message })
  }
})

// GET /api/fazercards/offers?category_id=xxx
router.get("/offers", protect, adminOnly, async (req, res) => {
  try {
    const { category_id } = req.query
    if (!category_id) return res.status(400).json({ ok: false, message: "category_id required" })
    const data = await fazercards.getOffers(category_id)
    res.json(data)
  } catch (err) {
    res.status(500).json({ ok: false, message: err.message })
  }
})

module.exports = router
