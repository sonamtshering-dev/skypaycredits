// routes/toolsRoutes.js — public game utility tools (no auth needed)
const express   = require('express')
const router    = express.Router()
const rateLimit = require('express-rate-limit')
const { queryGameBot } = require('../services/telegramService')

const toolsLimiter = rateLimit({
  windowMs: 60_000, max: 20,
  standardHeaders: true, legacyHeaders: false,
  message: { message: 'Too many requests, please wait a moment.' },
})

// POST /api/tools/mlbb
// Body: { userId, zoneId }
// Messages @gameidchecker_bot via Telegram and returns its reply
router.post('/mlbb', toolsLimiter, async (req, res) => {
  const userId = String(req.body.userId || '').trim()
  const zoneId = String(req.body.zoneId || '').trim()

  if (!userId || !zoneId)
    return res.status(400).json({ message: 'User ID and Zone ID are required.' })
  if (!/^\d+$/.test(userId) || !/^\d+$/.test(zoneId))
    return res.status(400).json({ message: 'User ID and Zone ID must be numbers.' })

  try {
    const reply = await queryGameBot(userId, zoneId)
    res.json({ reply, userId, zoneId })
  } catch (err) {
    console.error('[TOOLS] Telegram bot error:', err.message)
    res.status(502).json({ message: 'Could not get a response from the checker. Try again.' })
  }
})

module.exports = router
