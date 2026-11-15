// services/aluuService.js — Aluu.in game top-up API
const axios = require('axios')

const BASE       = 'https://aluu.in'
const API_KEY    = () => process.env.ALUU_API_KEY
const BACKEND    = () => (process.env.BACKEND_URL || 'http://localhost:5001').replace(/\/$/, '')

function headers() {
  const key = API_KEY()
  if (!key) throw new Error('ALUU_API_KEY not configured')
  return { 'x-api-key': key, 'Content-Type': 'application/json' }
}

// ── Balance ──────────────────────────────────────
async function getBalance() {
  const r = await axios.get(`${BASE}/api/v.1/balance`, { headers: headers(), timeout: 15000 })
  if (!r.data?.success) throw new Error(r.data?.message || 'Balance check failed')
  return r.data.data
}

// ── Pack list ────────────────────────────────────
// GET /api/v.1/products/:gameCode
async function getProducts(gameCode) {
  const r = await axios.get(`${BASE}/api/v.1/products/${gameCode}`, { headers: headers(), timeout: 15000 })
  if (!r.data?.success) throw new Error(r.data?.message || 'Product list failed')
  return r.data.data
}

// BGMI pack list (no auth needed)
async function getBgmiPacks() {
  const r = await axios.get(`${BASE}/api/v.1/bgmi-instant/packs`, { timeout: 15000 })
  if (!r.data?.success) throw new Error(r.data?.message || 'Pack list failed')
  return r.data.data
}

// ── BGMI Player Verify ───────────────────────────
// GET /api/check/bgmi?gameCode=bgmi&id=<playerId>
async function verifyBgmiPlayer(playerId) {
  const r = await axios.get(`${BASE}/api/check/bgmi`, {
    params:  { gameCode: 'bgmi', id: playerId },
    headers: headers(),
    timeout: 15000,
  })
  if (r.data?.success && r.data.username) {
    return { ok: true, username: r.data.username }
  }
  throw new Error('Player not found. Please check your BGMI Player ID.')
}

// Generic player check for other games
// GET /api/check/game-check?code=<gameCode>&characterId=<id>&server_code=<serverId>
async function verifyPlayer({ gameCode, userId, serverId }) {
  const params = { code: gameCode, characterId: userId }
  if (serverId) params.server_code = serverId
  const r = await axios.get(`${BASE}/api/check/game-check`, {
    params,
    headers: headers(),
    timeout: 15000,
  })
  const d = r.data || {}
  if (d.valid === 'invalid' || d.name === 'na') throw new Error('Player not found.')
  const username = d.username || d.name || d.nickname || userId
  return { ok: true, username }
}

// ── Place Order ──────────────────────────────────
// POST /api/v.1/create
// For BGMI: game="bgmi_instant", denom="bgmi_360uc", userid=playerId
// Set a 90-second timeout — BGMI orders wait for delivery
async function placeOrder({ game, denom, userId, serverId, partnerOrderId }) {
  const webhookUrl = `${BACKEND()}/api/aluu/webhook`
  const body = {
    game,
    denom,
    partner_orderid:     partnerOrderId,
    partner_webhook_url: webhookUrl,
  }
  if (userId)   body.userid   = userId
  if (serverId) body.serverid = serverId

  const r = await axios.post(`${BASE}/api/v.1/create`, body, {
    headers: headers(),
    timeout: 90000, // BGMI waits up to ~60s
  })

  const d = r.data?.data || {}
  // success:true + status:successful = instant delivery (BGMI)
  // success:true + status:pending    = webhook-based delivery
  // success:false                    = order failed
  if (r.data?.success === false) {
    throw new Error(d.message || r.data?.message || 'Order failed')
  }
  return {
    status:          d.status,         // 'successful' | 'pending' | 'error'
    reference:       d.reference || '',
    providerOrderId: d.provider_order_id || d.reference || '',
    username:        d.username || '',
    message:         d.message || '',
    amount:          d.amount,
    raw:             r.data,
  }
}

// ── Order Status ─────────────────────────────────
async function checkOrder(partnerOrderId) {
  const r = await axios.get(`${BASE}/api/v.1/${encodeURIComponent(partnerOrderId)}`, {
    headers: headers(),
    timeout: 15000,
  })
  if (!r.data?.success) throw new Error(r.data?.message || 'Status check failed')
  return r.data.data
}

module.exports = { getBalance, getProducts, getBgmiPacks, verifyBgmiPlayer, verifyPlayer, placeOrder, checkOrder }
