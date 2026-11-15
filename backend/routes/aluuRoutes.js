// routes/aluuRoutes.js — Aluu.in admin endpoints
const express = require('express')
const crypto  = require('crypto')
const router  = express.Router()
const aluu    = require('../services/aluuService')
const Order   = require('../models/Order')
const User    = require('../models/User')
const Settings = require('../models/Settings')
const { protect, adminOnly } = require('../middlewares/authMiddleware')
const { sendOrderConfirmationEmail } = require('../services/emailService')
const SITE_URL = process.env.SITE_URL || 'https://nitrogenstore.in'

// ── GET /api/aluu/balance — admin ────────────────
router.get('/balance', protect, adminOnly, async (req, res) => {
  try {
    const data = await aluu.getBalance()
    res.json({ success: true, balance: data.wallet_balance, currency: data.currency })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ── GET /api/aluu/packs/:game — admin ────────────
// e.g. /api/aluu/packs/bgmi_instant
router.get('/packs/:game', protect, adminOnly, async (req, res) => {
  try {
    const data = await aluu.getProducts(req.params.game)
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ── GET /api/aluu/bgmi-packs — public (no auth) ──
router.get('/bgmi-packs', async (req, res) => {
  try {
    const data = await aluu.getBgmiPacks()
    res.json({ success: true, data })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ── Webhook handler (exported separately for raw body) ──
// POST /api/aluu/webhook
// Called by aluuWebhookHandler from server.js with raw body already attached
async function webhookHandler(req, res) {
  try {
    const rawBody  = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : JSON.stringify(req.body)
    const parsed   = Buffer.isBuffer(req.body) ? JSON.parse(rawBody) : req.body

    // Verify signature if secret key is configured
    const secret    = process.env.ALUU_SECRET_KEY
    const timestamp = req.headers['x-webhook-timestamp'] || ''
    const signature = req.headers['x-webhook-signature'] || ''

    if (secret) {
      if (!signature) {
        console.warn('[ALUU WEBHOOK] Missing signature header')
        return res.status(401).json({ success: false, message: 'Missing signature' })
      }
      if (!/^\d+$/.test(timestamp) || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) {
        console.warn('[ALUU WEBHOOK] Stale timestamp:', timestamp)
        return res.status(400).json({ success: false, message: 'Stale webhook' })
      }
      const expected = crypto
        .createHmac('sha256', secret)
        .update(timestamp + '.' + rawBody)
        .digest('hex')
      const ok = expected.length === signature.length &&
        crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
      if (!ok) {
        console.warn('[ALUU WEBHOOK] Invalid signature')
        return res.status(401).json({ success: false, message: 'Invalid signature' })
      }
    }

    const data = parsed?.data || {}
    const partnerOrderId = data.orderid  // this is the partner_orderid we sent
    const status = data.status           // 'successful' | 'error' | 'cancelled'

    console.log('[ALUU WEBHOOK] Received:', { partnerOrderId, status })

    if (!partnerOrderId) return res.json({ received: true })

    // partner_orderid format: "<mongoId>-<index>"
    // Strip the index suffix to get the MongoDB order _id
    const orderId = partnerOrderId.replace(/-\d+$/, '')
    if (!/^[a-f\d]{24}$/i.test(orderId)) {
      console.warn('[ALUU WEBHOOK] Invalid orderId:', orderId)
      return res.json({ received: true })
    }

    if (status === 'successful') {
      // Idempotency: only update if not already Completed
      const order = await Order.findOneAndUpdate(
        { _id: orderId, status: { $nin: ['Completed', 'Failed'] } },
        {
          status:            'Completed',
          providerOrderId:   data.provider_order_id || data.reference || partnerOrderId,
          providerTransactions: [{ skuCode: data.denom || '', providerOrderId: data.reference || '', status: 'success' }],
        },
        { new: true }
      )
      if (order) {
        console.log('[ALUU WEBHOOK] Order completed:', orderId)
        try {
          const [settings, user] = await Promise.all([
            Settings.findOne(),
            User.findById(order.userId).select('email'),
          ])
          if (user?.email) {
            const emailOrder = { ...order.toObject(), gameIcon: '', playerInfo: order.playerData || {} }
            await sendOrderConfirmationEmail(
              user.email, emailOrder,
              settings?.siteName || 'Nitrogen Store',
              settings?.logo ? `${SITE_URL}${settings.logo}` : '',
              settings?.currencySymbol || '₹'
            )
          }
        } catch (e) {
          console.error('[ALUU WEBHOOK] Email failed:', e.message)
        }
      }
    } else if (status === 'error' || status === 'cancelled') {
      await Order.findOneAndUpdate(
        { _id: orderId, status: { $nin: ['Completed', 'Failed'] } },
        { status: 'Failed' }
      )
      console.log('[ALUU WEBHOOK] Order failed:', orderId, status)
    }

    res.json({ received: true })
  } catch (err) {
    console.error('[ALUU WEBHOOK] Error:', err.message)
    res.status(400).json({ message: 'Webhook processing failed' })
  }
}

module.exports = router
module.exports.webhookHandler = webhookHandler
