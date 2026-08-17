// services/smileService.js
const axios  = require("axios")
const { buildSmileRequestParams } = require("./smileSignatureUtil")

const BASE = process.env.SMILE_BASE_URL

const isProd = process.env.NODE_ENV === 'production'

const ALLOWED_SMILE_HOSTS = ['smile.one', 'www.smile.one']
function validateSmileUrl(url) {
  try {
    const { hostname } = new URL(url)
    if (!ALLOWED_SMILE_HOSTS.includes(hostname))
      throw new Error(`Blocked outbound request to non-Smile host: ${hostname}`)
  } catch (e) {
    if (e.message.startsWith('Blocked')) throw e
    throw new Error('Invalid Smile.one base URL')
  }
}
const logger = {
  info:  (msg, data) => { if (!isProd) console.log(`[SMILE] ${msg}`, data || "") },
  error: (msg, data) => console.error(`[SMILE] ERROR: ${msg}`, typeof data === 'object' ? data?.error || '' : data || ""),
  warn:  (msg, data) => console.warn(`[SMILE] WARN: ${msg}`, data || ""),
  debug: () => {},
}

// ── 1. VERIFY PLAYER ─────────────────────────────────
async function verifyPlayer({ productId, userId, zoneId, skuCode, baseUrl }) {
  const API_BASE = (baseUrl || BASE || "https://www.smile.one").replace(/\/+$/, "")
  validateSmileUrl(API_BASE)
  if (!userId) throw new Error("Player ID is required")
  if (!skuCode) throw new Error("No SKU code available for this region. Add packs with SKU codes first.")

  const params = buildSmileRequestParams({
    product:   productId,
    productid: skuCode,
    userid:    userId.trim(),
    zoneid:    zoneId && zoneId.trim() !== "" ? zoneId.trim() : userId.trim()
  })

  const res = await axios.post(`${API_BASE}/smilecoin/api/getrole`, new URLSearchParams(params), {
    timeout: 30000,
    headers: { "Content-Type": "application/x-www-form-urlencoded" }
  })

  const status = res.data?.status
  if (status === 200 || status === "200") {
    const username = res.data.username || res.data.nickname
    if (!username) throw new Error("Player not found. Check your Player ID and Zone ID.")
    return { ok: true, username, message: "" }
  }

  throw new Error(
    status === 202 ? "Player ID or Zone ID does not exist." :
    status === 205 ? "API signature error. Contact admin." :
    `Verification failed: ${res.data?.error || res.data?.message || "Player not found"}`
  )
}

// ── 2. GET PRODUCT LIST ──────────────────────────────
async function getProductList(productId, baseUrl) {
  const API_BASE = (baseUrl || BASE || "https://www.smile.one").replace(/\/+$/, "")
  validateSmileUrl(API_BASE)
  const params = buildSmileRequestParams({ product: productId })
  const res = await axios.post(`${API_BASE}/smilecoin/api/productlist`, new URLSearchParams(params), {
    timeout: 30000,
    headers: { "Content-Type": "application/x-www-form-urlencoded" }
  })
  if (res.data?.status === 200 || res.data?.status === "200") return res.data.data || res.data
  throw new Error(res.data?.message || "Failed to fetch product list")
}

// ── 3. PLACE ORDER ───────────────────────────────────
async function placeOrder({ productId, skuCode, userId, zoneId, referenceId, baseUrl }) {
  const API_BASE = (baseUrl || BASE || "https://www.smile.one").replace(/\/+$/, "")
  validateSmileUrl(API_BASE)
  if (!userId || userId.trim() === "") throw new Error("Player ID is required")
  if (!skuCode || skuCode.trim() === "") throw new Error("SKU code is required")

  const params = buildSmileRequestParams({
    product:   productId,
    productid: skuCode.trim(),
    userid:    userId.trim(),
    zoneid:    zoneId && zoneId.trim() !== "" ? zoneId.trim() : userId.trim()
  })

  const res = await axios.post(`${API_BASE}/smilecoin/api/createorder`, new URLSearchParams(params), {
    timeout: 30000,
    headers: { "Content-Type": "application/x-www-form-urlencoded" }
  })

  const status = res.data?.status
  if (status === 200 || status === "200") {
    return {
      status:   "success",
      order_id: res.data.order_id || res.data.orderId || res.data.game_order,
      data:     res.data
    }
  }

  const msg = res.data?.error || res.data?.message || "Order failed"
  throw new Error(
    status === 201 ? `Order failed: ${msg}` :
    status === 203 ? "Player already has this subscription." :
    status === 204 ? "Order has already been delivered." :
    status === 205 ? "API signature error. Contact admin." :
    status === 206 ? "Order initialization failed." :
    `Order failed (${status}): ${msg}`
  )
}

// ── 4. CHECK ORDER STATUS ────────────────────────────
async function checkOrderStatus(providerOrderId, baseUrl) {
  const API_BASE = (baseUrl || BASE || "https://www.smile.one").replace(/\/+$/, "")
  validateSmileUrl(API_BASE)
  if (!providerOrderId) throw new Error("Order ID is required")

  const params = buildSmileRequestParams({ orderid: providerOrderId.toString().trim() })
  const res = await axios.post(`${API_BASE}/smilecoin/api/checkorder`, new URLSearchParams(params), {
    timeout: 30000,
    headers: { "Content-Type": "application/x-www-form-urlencoded" }
  })
  return res.data
}

// ── 5. GET BALANCE ───────────────────────────────────
async function getBalance(baseUrl) {
  const API_BASE = (baseUrl || BASE || "https://www.smile.one/br").replace(/\/+$/, "")
  validateSmileUrl(API_BASE)
  const params = buildSmileRequestParams({})
  const res = await axios.post(`${API_BASE}/smilecoin/api/getsmilecoin`, new URLSearchParams(params), {
    timeout: 15000,
    headers: { "Content-Type": "application/x-www-form-urlencoded" }
  })
  if (res.data?.status === 200 || res.data?.status === "200") {
    return { balance: res.data.smilecoin ?? res.data.balance ?? res.data.coin ?? 0, raw: res.data }
  }
  throw new Error(res.data?.message || `Balance check failed (status ${res.data?.status})`)
}

module.exports = { verifyPlayer, getProductList, placeOrder, checkOrderStatus, getBalance }