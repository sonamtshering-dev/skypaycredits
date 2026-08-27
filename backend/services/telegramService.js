// Telegram MTProto client — queries @gameidchecker_bot /ml and parses the result
const { TelegramClient } = require('telegram')
const { StringSession }  = require('telegram/sessions')

const BOT = 'gameidchecker_bot'
let _client = null

async function _getClient() {
  if (_client?.connected) return _client
  _client = new TelegramClient(
    new StringSession(process.env.TG_SESSION || ''),
    parseInt(process.env.TG_API_ID),
    process.env.TG_API_HASH,
    { connectionRetries: 3 }
  )
  await _client.connect()
  return _client
}

// Serialize all bot requests — one at a time to avoid reply mixing
let _queue = Promise.resolve()

// Poll the bot conversation until a real reply appears (not the interim "Verifying" message).
// Works whether the bot sends a new message or edits its existing one in-place.
async function _sendAndWait(client, command, timeoutMs = 25000) {
  const sent = await client.sendMessage(BOT, { message: command })

  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 2000))
    const msgs = await client.getMessages(BOT, { limit: 5 })
    for (const m of msgs) {
      if (m.out || m.id < sent.id) continue          // skip our own or older messages
      const t = (m.text || '').trim()
      if (!t) continue
      if (/verif|🔍/i.test(t) && t.length < 60) continue  // skip interim
      return t
    }
  }
  throw new Error('Bot did not respond in time')
}

function _queued(client, command) {
  let resolve, reject
  const p = new Promise((res, rej) => { resolve = res; reject = rej })
  _queue = _queue.then(() => _sendAndWait(client, command).then(resolve, reject))
  return p
}

// Parse the /ml reply which looks like:
// ✅ PLAYER VERIFIED
// 👤 IGN: YT
// 🌍 Region: India
// 🎮 ID: 100893609 (2521)
//
// 🎁 DOUBLE DIAMONDS PACKS
// ❌ 50+50 (claimed)
// ❌ 150+150 (claimed)
// ✅ 250+250
// ✅ 500+500
function parseMLReply(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)

  let username = null
  let region   = null
  const packs  = []

  for (const line of lines) {
    // IGN: YT
    const ignM = line.match(/IGN[:\s]+(.+)/i)
    if (ignM) { username = ignM[1].trim(); continue }

    // Region: India
    const regionM = line.match(/Region[:\s]+(.+)/i)
    if (regionM) { region = regionM[1].trim(); continue }

    // Pack lines: ❌ 50+50 (claimed)  or  ✅ 500+500
    const packM = line.match(/(\d+\+\d+)/)
    if (packM) {
      const claimable = line.trimStart().startsWith('✅') ||
                        (line.includes('Yes') && !line.includes('claimed'))
      packs.push({ size: packM[1], claimable })
    }
  }

  return { username, region, packs, raw: text }
}

// Main export
async function queryMLBB(userId, zoneId) {
  const client = await _getClient()
  const mlText  = await _queued(client, `/ml ${userId} ${zoneId}`)
  const parsed  = parseMLReply(mlText)

  // Check for bot error responses
  if (!parsed.username && (mlText.includes('Error') || mlText.includes('not found') || mlText.includes('invalid'))) {
    throw new Error('Player not found. Check your User ID and Zone ID.')
  }

  return {
    username: parsed.username,
    region:   parsed.region,
    packs:    parsed.packs,
    userId,
    zoneId,
    raw:      mlText,
  }
}

module.exports = { queryMLBB }
