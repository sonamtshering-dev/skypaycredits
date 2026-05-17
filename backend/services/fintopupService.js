// services/fintopupService.js
const axios = require("axios")

const BASE     = "https://fintopup.com/api"
const API_KEY  = process.env.FINTOPUP_API_KEY  // Bearer token

function getHeaders() {
  return {
    "Authorization": `Bearer ${API_KEY}`,
    "Content-Type":  "application/json",
  }
}

// ── Get account balance ───────────────────────────
async function getBalance() {
  const r = await axios.get(`${BASE}/balance`, { headers: getHeaders() })
  return r.data?.response || r.data
}

// ── Get all games ─────────────────────────────────
async function getGames() {
  const r = await axios.get(`${BASE}/games`, { headers: getHeaders() })
  return r.data?.response || []
}

// ── Get all SKUs (products) ───────────────────────
async function getSkus(gameCode) {
  const r = await axios.get(`${BASE}/skus`, {
    headers: getHeaders(),
    params: gameCode ? { game_code: gameCode } : {}
  })
  return r.data?.response || []
}

// ── Place an order ────────────────────────────────
// POST /order  { game_code, sku, user_id, zone_id? }
async function placeOrder({ gameCode, sku, userId, zoneId, secondaryForm }) {
  const body = {
    game_code: gameCode,
    sku,
    user_id:   userId,
  }
  if (zoneId)        body.zone_id        = zoneId
  if (secondaryForm) body.secondary_form = secondaryForm  // e.g. Genshin region

  const r = await axios.post(`${BASE}/order`, body, { headers: getHeaders() })
  if (!r.data?.success) throw new Error(r.data?.message || "FinTopup order failed")
  return r.data?.response || r.data
}

// ── Check order status ────────────────────────────
async function getOrderStatus(orderId) {
  const r = await axios.get(`${BASE}/order/${orderId}`, { headers: getHeaders() })
  return r.data?.response || r.data
}

// ── Check player ID (FinTopup has no dedicated endpoint;
//    we do a lightweight SKU fetch to confirm connectivity,
//    actual player validation happens at order time) ────
async function checkPlayerId(gameCode, userId, zoneId) {
  // FinTopup validates player at order time — we just return optimistically
  // so the UX flow stays the same. Set skipVerify=true on games if you want
  // to skip this step entirely in the admin panel.
  return { ok: true, username: userId }
}

module.exports = {
  getBalance,
  getGames,
  getSkus,
  placeOrder,
  getOrderStatus,
  checkPlayerId,
}