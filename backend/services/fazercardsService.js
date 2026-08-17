// services/fazercardsService.js
const https = require('https')

const HOST    = 'api.fzr.cards'
const API_KEY = () => process.env.FAZERCARDS_API_KEY || ''

async function request(method, path, body = null) {
  if (!API_KEY()) throw new Error('FAZERCARDS_API_KEY is not configured in .env')
  const payload = body ? JSON.stringify(body) : null
  return new Promise((resolve, reject) => {
    const options = {
      hostname: HOST,
      port: 443,
      path,
      method,
      headers: {
        'X-API-Key':    API_KEY(),
        'Content-Type': 'application/json',
        'Accept':       'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
    }
    const req = https.request(options, res => {
      let data = ''
      res.on('data', c => { data += c })
      res.on('end', () => {
        try { resolve(JSON.parse(data)) }
        catch (e) { reject(new Error('FazerCards invalid JSON: ' + data.slice(0, 200))) }
      })
    })
    req.on('error', reject)
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('FazerCards request timed out')) })
    if (payload) req.write(payload)
    req.end()
  })
}

const get  = (path)       => request('GET',  path)
const post = (path, body) => request('POST', path, body)

// Balance in USD
async function getBalance() {
  return get('/api/v2/balance')
}

// List top-up categories
async function getCategories() {
  return get('/api/v2/topups?include_ui=1&limit=500')
}

// Offers + input field schema for one category
async function getOffers(categoryId) {
  return get(`/api/v2/topups/offers?category_id=${encodeURIComponent(categoryId)}&include_ui=1`)
}

// Validate player ID before ordering (may not be available for all categories)
async function validatePlayer({ categoryId, fields }) {
  const res = await post('/api/v2/topups/validate-id', { category_id: categoryId, fields })
  return res
}

// Place a top-up order; deducts USD balance
// categoryId = providerGameId on the game/region
// offerId    = skuCode on the pack
// fields     = { [fieldKey]: value } — keys must match what /topups/offers returns for that category
async function placeOrder({ categoryId, offerId, fields, idempotencyKey }) {
  if (!categoryId) throw new Error('FazerCards: category_id (Provider Game ID) is required')
  if (!offerId)    throw new Error('FazerCards: offer_id (SKU code) is required')
  const res = await post('/api/v2/topups/order', {
    category_id: categoryId,
    offer_id:    offerId,
    fields:      fields || {},
    ...(idempotencyKey ? { 'idempotency-key': idempotencyKey } : {}),
  })
  if (res.ok === false) throw new Error(res.error || 'FazerCards order failed')
  return res
}

// Check order status
async function getOrder(orderId) {
  return get(`/api/v2/orders/${encodeURIComponent(orderId)}`)
}

module.exports = { getBalance, getCategories, getOffers, validatePlayer, placeOrder, getOrder }
