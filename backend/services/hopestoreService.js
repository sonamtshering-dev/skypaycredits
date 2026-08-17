// services/hopestoreService.js
const https = require('https')

const BASE = 'https://api.hopestore.id'
const API_KEY = () => process.env.HOPESTORE_API_KEY || ''

async function post(path, body) {
  if (!API_KEY()) throw new Error('HOPESTORE_API_KEY is not configured in .env')
  const payload = JSON.stringify({ api_key: API_KEY(), ...body })
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.hopestore.id',
      port: 443,
      path,
      method: 'POST',
      headers: {
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    }
    const req = https.request(options, res => {
      let data = ''
      res.on('data', chunk => { data += chunk })
      res.on('end', () => {
        try { resolve(JSON.parse(data)) }
        catch (e) { reject(new Error('Invalid JSON from HopeStore: ' + data.slice(0, 200))) }
      })
    })
    req.on('error', reject)
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('HopeStore request timed out')) })
    req.write(payload)
    req.end()
  })
}

// Check balance (in IDR)
async function getBalance() {
  return post('/saldo', {})
}

// List all available services
async function getServices() {
  return post('/service', {})
}

// Place a top-up order.
// target: "userId|zoneId" or just "userId" if no zone
async function placeOrder({ serviceId, target, idtrx, kontak }) {
  if (!serviceId) throw new Error('HopeStore: serviceId (Provider Game ID) is required')
  const body = { service_id: serviceId, target: String(target), idtrx: String(idtrx) }
  if (kontak) body.kontak = String(kontak)
  const res = await post('/order', body)
  if (res.status === false || res.status === 'false')
    throw new Error(res.msg || 'HopeStore order failed')
  return res
}

// Check order status by HopeStore's order_id (invoice)
async function checkStatus(orderId) {
  return post('/status', { order_id: String(orderId) })
}

module.exports = { placeOrder, checkStatus, getBalance, getServices }
