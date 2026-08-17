// services/g2bulkService.js
const https = require('https')

const HOST    = 'api.g2bulk.com'
const API_KEY = () => process.env.G2BULK_API_KEY || ''

// FazerCards category_id → G2Bulk game code
const FC_TO_G2BULK = {
  // MLBB
  mobile_legends_global:        'mlbb_global',
  mobile_legends_brazil:        'mlbb_br',
  mobile_legends_exclusive:     'mlbb_exclusive',
  mobile_legends_indonesia:     'mlbb_global',   // ID users map to global per G2Bulk notes
  mobile_legends_malaysia:      'mlbb',
  mobile_legends_philippines:   'mlbb',
  mobile_legends_promo:         'mlbb',
  mobile_legends_ru:            'mlbb_ru',
  mobile_legends_singapore:     'mlbb',
  mobile_legends_special:       'mlbb_special',
  mobile_legends_turkey:        'mlbb_tr',
  mobile_legends_united_states: 'mlbb_us',
  // PUBG
  pubg_mobile_auto:    'pubgm',
  pubg_mobile_fast:    'pubgm',
  pubg_mobile_manual:  'pubgm',
  pubg_mobile_reserve: 'pubgm',
  // Free Fire
  free_fire_my_sg: 'freefire_sgmy',
  free_fire_bd:    'freefire_bd',
  free_fire_br:    'freefire_br',
  free_fire_cis:   'freefire_cis',
  free_fire_eu:    'freefire_eu',
  free_fire_id:    'freefire_id',
  free_fire_latam: 'freefire_latam',
  free_fire_mena:  'freefire_me',
  free_fire_ph:    'freefire_global',
  free_fire_pk:    'freefire_global',
  free_fire_sg:    'freefire_sg',
  free_fire_th:    'freefire_global',
  free_fire_tw:    'freefire_tw',
  free_fire_vn:    'freefire_vn',
  // Genshin & WW
  genshin_impact_global: 'genshin',
  wuthering_waves:       'wuwa',
}

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null
    const options = {
      hostname: HOST,
      path,
      method,
      headers: {
        'X-API-Key':    API_KEY(),
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
      },
    }
    const req = https.request(options, res => {
      let data = ''
      res.on('data', c => { data += c })
      res.on('end', () => {
        try { resolve(JSON.parse(data)) }
        catch { resolve({ error: data }) }
      })
    })
    req.on('error', reject)
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('G2Bulk request timed out')) })
    if (payload) req.write(payload)
    req.end()
  })
}

async function checkPlayerId({ fazercardsGameId, userId, serverId }) {
  const gameCode = FC_TO_G2BULK[fazercardsGameId]
  if (!gameCode) return { valid: 'skip', name: userId }

  const body = { game: gameCode, user_id: userId }
  if (serverId) body.server_id = serverId

  const res = await request('POST', '/v1/games/checkPlayerId', body)

  if (res.valid === 'valid') {
    const name = res.name || res.username || res.nickname || ''
    if (!name || name === 'No validation required') {
      return { valid: 'skip', name: userId }
    }
    return { valid: 'valid', name }
  }

  if (res.valid === 'invalid') {
    return { valid: 'invalid', name: '' }
  }

  // Network error / unexpected — skip rather than block
  return { valid: 'skip', name: userId }
}

async function getBalance() {
  return request('GET', '/v1/getMe')
}

module.exports = { checkPlayerId, getBalance, FC_TO_G2BULK }
