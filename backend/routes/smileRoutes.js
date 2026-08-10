// routes/smileRoutes.js
const express = require("express")
const router  = express.Router()
const { protect, adminOnly } = require("../middlewares/authMiddleware")
const axios  = require("axios")
const { buildSmileRequestParams } = require("../services/smileSignatureUtil")
const { getBalance } = require("../services/smileService")

// BASE = https://www.smile.one  (no trailing slash, no /ph — this account uses root /smilecoin/api)
const BASE = (process.env.SMILE_BASE_URL || 'https://www.smile.one').replace(/\/$/, '')
const ALLOWED_SMILE_HOSTS = ['www.smile.one', 'smile.one']
function validateSmileUrl(url) {
  try {
    const parsed = new URL(url)
    if (!ALLOWED_SMILE_HOSTS.includes(parsed.hostname)) throw new Error('Invalid host')
    return parsed.origin
  } catch { throw new Error('Invalid Smile URL') }
}
const API  = `${BASE}/smilecoin/api`

async function smilePost(endpoint, params) {
  const res = await axios.post(`${API}/${endpoint}`, new URLSearchParams(params), {
    timeout: 30000,
    headers: { "Content-Type": "application/x-www-form-urlencoded" }
  })
  if (typeof res.data === 'string' && res.data.includes('<!DOCTYPE')) {
    throw new Error('Smile API returned unexpected response. Check provider URL configuration.')
  }
  return res.data
}

// GET /api/smile/products?game=mobilelegends&url=https://www.smile.one/br
// Returns all SKUs and prices for a game — optional url param overrides base URL
router.get("/products", protect, adminOnly, async (req, res) => {
  try {
    const game    = req.query.game || 'mobilelegends'
    const baseUrl = req.query.url ? validateSmileUrl(req.query.url) : BASE
    const params  = buildSmileRequestParams({ product: game })
    const res2    = await axios.post(`${baseUrl}/smilecoin/api/productlist`, new URLSearchParams(params), {
      timeout: 30000,
      headers: { "Content-Type": "application/x-www-form-urlencoded" }
    })
    if (typeof res2.data === 'string' && res2.data.includes('<!DOCTYPE'))
      return res.status(400).json({ message: 'Invalid Smile API URL configuration' })
    res.json({ success: true, game, url: baseUrl, data: res2.data })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/smile/games
// Returns list of available game product names
router.get("/games", protect, adminOnly, async (req, res) => {
  try {
    const params = buildSmileRequestParams({ product: 'mobilelegends' })
    const data = await smilePost('product', params)
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/smile/points
// Check your Smile account balance
router.get("/points", protect, adminOnly, async (req, res) => {
  try {
    const params = buildSmileRequestParams({ product: 'mobilelegends' })
    const data = await smilePost('querypoints', params)
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/smile/balance
// Returns SmilePoints balance from the account
router.get("/balance", protect, adminOnly, async (req, res) => {
  try {
    const result = await getBalance(process.env.SMILE_BASE_URL)
    res.json({ success: true, balance: result.balance, raw: result.raw })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// POST /api/smile/verify
// Test player verification
// Body: { game: "mobilelegends", productId: "212", userId: "263883033", zoneId: "9388", url: "https://www.smile.one/ph" }
router.post("/verify", protect, adminOnly, async (req, res) => {
  try {
    const { game, productId, userId, zoneId, url } = req.body
    if (!game || !productId || !userId)
      return res.status(400).json({ message: "game, productId and userId required" })

    const baseUrl = url ? validateSmileUrl(url) : BASE
    const params = buildSmileRequestParams({
      product:   game,
      productid: productId,
      userid:    userId,
      zoneid:    zoneId || userId,
    })
    const response = await axios.post(`${baseUrl}/smilecoin/api/getrole`, new URLSearchParams(params), {
      timeout: 30000,
      headers: { "Content-Type": "application/x-www-form-urlencoded" }
    })
    if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE'))
      return res.status(400).json({ message: 'Invalid Smile API URL configuration' })
    res.json({ success: true, data: response.data })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/smile/servers?game=ragnarokm&url=https://www.smile.one/ph
router.get("/servers", protect, adminOnly, async (req, res) => {
  try {
    const game    = req.query.game
    const baseUrl = req.query.url ? validateSmileUrl(req.query.url) : BASE
    if (!game) return res.status(400).json({ message: "game required" })
    const params = buildSmileRequestParams({ product: game })
    const response = await axios.post(`${baseUrl}/smilecoin/api/getserver`, new URLSearchParams(params), {
      timeout: 30000,
      headers: { "Content-Type": "application/x-www-form-urlencoded" }
    })
    if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE'))
      return res.status(400).json({ message: 'Invalid Smile API URL configuration' })
    res.json({ success: true, data: response.data })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router