// services/fintopupService.js
const axios = require("axios")

const BASE    = process.env.NODE_ENV === "production"
  ? "https://fintopup.com/api"
  : "https://fintopup.com/api/development"

const API_KEY = process.env.FINTOPUP_API_KEY

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

// ── Get all SKUs ──────────────────────────────────
async function getSkus(gameCode) {
  const r = await axios.get(`${BASE}/skus`, {
    headers: getHeaders(),
    params: gameCode ? { game_code: gameCode } : {}
  })
  return r.data?.response || []
}

// ── Place an order ────────────────────────────────
async function placeOrder({ gameCode, sku, userId, zoneId, secondaryForm, txnMerchantId }) {
  const body = {
    game_code:     gameCode,
    sku,
    user_id:       userId,
    txnMerchantId: txnMerchantId || undefined,
  }
  if (zoneId)        body.zone_id        = zoneId
  if (secondaryForm) body.secondary_form = secondaryForm

  const r = await axios.post(`${BASE}/order`, body, { headers: getHeaders() })
  if (!r.data?.success) throw new Error(r.data?.message || "FinTopup order failed")
  return r.data?.response || r.data
}

// ── Check order status by UUID ────────────────────
async function getOrderStatusByUuid(uuid) {
  const r = await axios.get(`${BASE}/orderStatus`, {
    headers: getHeaders(),
    params: { uuid }
  })
  return r.data?.response || r.data
}

// ── Check order status by merchant txn ID ─────────
async function getOrderStatusByMerchantId(txnMerchantId) {
  const r = await axios.get(`${BASE}/orderStatus`, {
    headers: getHeaders(),
    params: { txnMerchantId }
  })
  return r.data?.response || r.data
}

// ── Map FinTopup status to internal status ─────────
function mapStatus(fintopupStatus) {
  switch (fintopupStatus) {
    case "Success":    return "Completed"
    case "Canceled":   return "Failed"
    case "Refunded":   return "Failed"
    case "Processing": return "Processing"
    case "Pending":
    default:           return "Pending"
  }
}

module.exports = {
  getBalance,
  getGames,
  getSkus,
  placeOrder,
  getOrderStatusByUuid,
  getOrderStatusByMerchantId,
  mapStatus,
}