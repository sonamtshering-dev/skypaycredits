const crypto  = require('crypto')
const Order   = require('../models/Order')
const User    = require('../models/User')
const { creditWallet, debitWallet, redeemCode, getBalance, getTransactions } = require('../services/walletService')
const { MIN_TOPUP_USER, MIN_TOPUP_RESELLER, MAX_TOPUP } = require('../config/wallet')

const NOVAPAY_API_KEY    = process.env.NOVAPAY_API_KEY
const NOVAPAY_API_SECRET = process.env.NOVAPAY_API_SECRET
const NOVAPAY_BASE       = 'https://nova-pay.in/api/v1'
const FRONTEND           = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '')
const SITE_URL           = process.env.SITE_URL || 'https://nitrogenstore.in'
const isProd             = process.env.NODE_ENV === 'production'
const axios              = require('axios')

function signRequest(secret, timestamp, rawBody) {
  return crypto.createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex')
}

function novaHeaders(rawBody) {
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const signature = signRequest(NOVAPAY_API_SECRET, timestamp, rawBody)
  return {
    'Content-Type': 'application/json',
    'X-API-Key':    NOVAPAY_API_KEY,
    'X-Timestamp':  timestamp,
    'X-Signature':  signature,
  }
}

// GET /api/wallet/balance
exports.getBalance = async (req, res) => {
  try {
    const data = await getBalance(req.user._id)
    if (!data) return res.status(404).json({ message: 'User not found' })
    res.json(data)
  } catch (err) {
    res.status(500).json({ message: isProd ? 'Server error' : err.message })
  }
}

// GET /api/wallet/transactions?page=1&limit=20
exports.getTransactions = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1)
    const limit = Math.min(50, parseInt(req.query.limit) || 20)
    const data  = await getTransactions(req.user._id, page, limit)
    res.json(data)
  } catch (err) {
    res.status(500).json({ message: isProd ? 'Server error' : err.message })
  }
}

// POST /api/wallet/topup  { amount: <paise> }
exports.createTopup = async (req, res) => {
  try {
    const amountPaise = parseInt(req.body.amount)
    if (!amountPaise || isNaN(amountPaise)) return res.status(400).json({ message: 'amount required (paise)' })

    const minTopup = req.user.role === 'reseller' ? MIN_TOPUP_RESELLER : MIN_TOPUP_USER
    if (amountPaise < minTopup) return res.status(400).json({ message: `Minimum topup is ₹${minTopup / 100}` })
    if (amountPaise > MAX_TOPUP) return res.status(400).json({ message: `Maximum topup is ₹${MAX_TOPUP / 100}` })

    const walletUser = await User.findById(req.user._id).select('walletStatus').lean()
    if (walletUser?.walletStatus === 'blocked')
      return res.status(403).json({ message: 'Your wallet is blocked. Contact support.' })

    if (!NOVAPAY_API_KEY || !NOVAPAY_API_SECRET)
      return res.status(500).json({ message: 'Payment gateway not configured' })

    // Create a wallet_topup order first
    const order = await Order.create({
      userId:           req.user._id,
      orderType:        'wallet_topup',
      price:            amountPaise / 100,
      walletAmountTopup: amountPaise,
      paymentMethod:    'novapay',
      paymentStatus:    'unpaid',
      status:           'Pending',
      gameName:         'Wallet Topup',
      packName:         `₹${amountPaise / 100} topup`,
    })

    // Create NovaPay payment
    const novaOrderId = `ORD-${order._id}`
    const bodyObj = {
      order_id:           novaOrderId,
      amount:             amountPaise,
      currency:           'INR',
      customer_reference: req.user.name?.substring(0, 128) || 'Customer',
      redirect_url:       `${FRONTEND}/payment/success?order_id=${order._id}&type=wallet`,
    }
    const rawBody = JSON.stringify(bodyObj)

    const { data } = await axios.post(
      `${NOVAPAY_BASE}/payments/create`,
      rawBody,
      { headers: novaHeaders(rawBody), timeout: 30000 }
    )

    if (!data.success) {
      await Order.findByIdAndDelete(order._id)
      return res.status(400).json({ message: data.error || 'Payment creation failed' })
    }

    const paymentId = data.data.payment_id
    await Order.findByIdAndUpdate(order._id, { paymentId })

    res.json({
      success:     true,
      orderId:     order._id,
      payment_url: `https://nova-pay.in/pay/${paymentId}`,
      payment_id:  paymentId,
      qr_code:     data.data.qr_code_base64,
      upi_intent:  data.data.upi_intent_link,
    })
  } catch (err) {
    console.error('[WALLET] Topup create error:', err.message)
    res.status(500).json({ message: isProd ? 'Payment service error' : err.message })
  }
}

// POST /api/wallet/redeem  { code: "ABC123" }
exports.redeemCode = async (req, res) => {
  try {
    const { code } = req.body
    if (!code || typeof code !== 'string') return res.status(400).json({ message: 'code required' })

    // Only resellers can redeem codes
    if (req.user.role !== 'reseller') return res.status(403).json({ message: 'Only resellers can redeem codes' })

    const ip = req.ip || req.socket?.remoteAddress || ''
    const result = await redeemCode(req.user._id, code, req.user.role, ip)
    if (!result.ok) return res.status(400).json({ message: result.error })

    res.json({ success: true, credited: result.value, message: `₹${result.value / 100} credited to your wallet` })
  } catch (err) {
    res.status(500).json({ message: isProd ? 'Server error' : err.message })
  }
}
