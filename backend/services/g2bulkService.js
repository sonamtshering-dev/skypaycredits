// services/g2bulkService.js
const axios = require("axios")

const BASE = "https://api.g2bulk.com/v1"

function getHeaders() {
  return {
    "X-API-Key": process.env.G2BULK_API_KEY,
    "Content-Type": "application/json"
  }
}

// ── Verify player ID ──────────────────────────────
async function checkPlayerId(gameCode, userId, serverId) {
  const body = { game: gameCode, user_id: userId }
  if (serverId && serverId.trim()) body.server_id = serverId.trim()

  const r = await axios.post(`${BASE}/games/checkPlayerId`, body, {
    headers: getHeaders()
  })

  const d = r.data
  if (d.valid === "valid" || d.valid === true) {
    return { ok: true, username: d.name || d.nickname || d.fullname || userId }
  }
  throw new Error("Player not found")
}

// ── Get servers for a game ────────────────────────
async function getServers(gameCode) {
  try {
    const r = await axios.post(`${BASE}/games/servers`, { game: gameCode }, {
      headers: getHeaders()
    })
    if (r.data.servers) {
      return Object.entries(r.data.servers).map(([id, name]) => ({
        serverId: id,
        serverName: name
      }))
    }
    return []
  } catch (e) {
    if (e.response?.status === 403) return [] // game has no servers
    throw e
  }
}

// ── Get catalogue for a game ──────────────────────
async function getCatalogue(gameCode) {
  const r = await axios.get(`${BASE}/games/${gameCode}/catalogue`, {
    headers: getHeaders()
  })
  return r.data.catalogues || []
}

// ── Get account balance ───────────────────────────
async function getBalance() {
  const r = await axios.get(`${BASE}/getMe`, { headers: getHeaders() })
  return r.data
}

// ── Get all games ─────────────────────────────────
async function getGames() {
  const r = await axios.get(`${BASE}/games`, { headers: getHeaders() })
  return r.data.games || []
}

// ── Get required fields for a game ───────────────
async function getFields(gameCode) {
  const r = await axios.post(`${BASE}/games/fields`, { game: gameCode }, {
    headers: getHeaders()
  })
  return r.data.info || {}
}

// ── Place a game top-up order ─────────────────────
async function placeOrder({ gameCode, catalogueName, playerId, serverId, callbackUrl, idempotencyKey }) {
  const headers = getHeaders()
  if (idempotencyKey) headers["X-Idempotency-Key"] = idempotencyKey

  const body = {
    catalogue_name: catalogueName,
    player_id: playerId,
  }
  if (serverId && serverId.trim()) body.server_id = serverId.trim()
  if (callbackUrl) body.callback_url = callbackUrl

  const r = await axios.post(`${BASE}/games/${gameCode}/order`, body, { headers })
  return r.data
}

// ── Check order status ────────────────────────────
async function getOrderStatus(orderId, gameCode) {
  const r = await axios.post(`${BASE}/games/order/status`,
    { order_id: orderId, game: gameCode },
    { headers: getHeaders() }
  )
  return r.data
}

// ── Buy a product (vouchers/gift cards) ───────────
async function buyProduct(productId, quantity = 1, idempotencyKey) {
  const headers = getHeaders()
  if (idempotencyKey) headers["X-Idempotency-Key"] = idempotencyKey

  const r = await axios.post(`${BASE}/products/${productId}/purchase`,
    { quantity },
    { headers }
  )
  return r.data
}

// ── Get all products (vouchers) ───────────────────
async function getProducts() {
  const r = await axios.get(`${BASE}/products`, { headers: getHeaders() })
  return r.data.products || []
}

// ── Get product by ID ─────────────────────────────
async function getProduct(productId) {
  const r = await axios.get(`${BASE}/products/${productId}`, { headers: getHeaders() })
  return r.data
}

module.exports = {
  checkPlayerId,
  getServers,
  getCatalogue,
  getBalance,
  getGames,
  getFields,
  placeOrder,
  getOrderStatus,
  buyProduct,
  getProducts,
  getProduct,
}
