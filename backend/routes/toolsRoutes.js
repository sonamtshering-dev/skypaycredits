// routes/toolsRoutes.js — public game utility tools (no auth needed)
const express    = require('express')
const router     = express.Router()
const axios      = require('axios')
const rateLimit  = require('express-rate-limit')

const toolsLimiter = rateLimit({
  windowMs: 60_000, max: 20,
  standardHeaders: true, legacyHeaders: false,
  message: { message: 'Too many requests, please wait a moment.' },
})

// POST /api/tools/mlbb
// Body: { userId, zoneId }
// Proxies Moonton's web order API — no auth needed, public tool
router.post('/mlbb', toolsLimiter, async (req, res) => {
  const userId  = String(req.body.userId  || '').trim()
  const zoneId  = String(req.body.zoneId  || '').trim()

  if (!userId || !zoneId) return res.status(400).json({ message: 'User ID and Zone ID are required.' })
  if (!/^\d+$/.test(userId) || !/^\d+$/.test(zoneId))
    return res.status(400).json({ message: 'User ID and Zone ID must be numbers.' })

  const HEADERS = {
    'Content-Type':  'application/json',
    'User-Agent':    'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/120 Safari/537.36',
    'Accept':        'application/json',
    'Referer':       'https://order.moonton.com/',
    'Origin':        'https://order.moonton.com',
  }

  try {
    const [playerRes, ddRes] = await Promise.allSettled([
      // Player name lookup
      axios.post('https://order.moonton.com/api/v1/user/confirm', {
        productId: '1', serverId: zoneId, userId,
      }, { headers: HEADERS, timeout: 10000 }),

      // First-recharge (double diamond) eligibility
      axios.post('https://order.moonton.com/api/v1/first_pay_discount/confirm', {
        productId: '1', serverId: zoneId, userId,
      }, { headers: HEADERS, timeout: 10000 }),
    ])

    // Parse player name
    let username = null
    if (playerRes.status === 'fulfilled') {
      const d = playerRes.value.data
      username = d?.data?.username || d?.data?.name || d?.username || null
    }

    if (!username) {
      return res.status(404).json({ message: 'Player not found. Check your User ID and Zone ID.' })
    }

    // Parse double diamond — is_first_pay: true = still eligible (never paid), false = already used
    let doubleDD = null
    if (ddRes.status === 'fulfilled') {
      const d = ddRes.value.data
      if (d?.data && typeof d.data.is_first_pay !== 'undefined') {
        doubleDD = Boolean(d.data.is_first_pay)
      }
    }

    res.json({ username, doubleDD, userId, zoneId })
  } catch (err) {
    console.error('[TOOLS] MLBB lookup error:', err.message)
    res.status(502).json({ message: 'Could not reach game servers. Try again in a moment.' })
  }
})

module.exports = router
