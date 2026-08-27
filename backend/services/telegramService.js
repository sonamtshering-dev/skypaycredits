// Telegram MTProto client — queries @gameidchecker_bot and returns structured replies
const { TelegramClient } = require('telegram')
const { StringSession }  = require('telegram/sessions')
const { NewMessage }     = require('telegram/events')

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

function _sendAndWait(client, command, timeoutMs = 20000) {
  return new Promise((resolve, reject) => {
    _queue = _queue.then(async () => {
      try {
        const sent = await client.sendMessage(BOT, { message: command })

        const text = await new Promise((res, rej) => {
          const timer = setTimeout(() => {
            client.removeEventHandler(h)
            rej(new Error('Bot did not respond in time'))
          }, timeoutMs)

          const h = async (ev) => {
            const m = ev.message
            if (m.out || m.id <= sent.id) return

            const t = (m.text || '').trim()
            // Skip transient "Verifying..." messages and retry
            if (/verif|🔍/i.test(t)) return

            clearTimeout(timer)
            client.removeEventHandler(h)
            res(t)
          }
          client.addEventHandler(h, new NewMessage({ chats: [BOT] }))
        })

        resolve(text)
      } catch (err) {
        reject(err)
      }
    })
  })
}

// Parse /ml reply → { username, zone }
function parseML(text) {
  // Common formats the bot uses:
  // "Name: PlayerName\nZone: 5506"
  // "👤 PlayerName\n🌍 Region..."
  // Just extract lines that look like a name
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)

  let username = null
  for (const line of lines) {
    const m = line.match(/(?:name|username|player|user)[:\s]+(.+)/i)
    if (m) { username = m[1].trim(); break }
  }
  // Fallback: first non-emoji, non-label line
  if (!username) {
    for (const line of lines) {
      if (!/^[🎁📦✅❌🔍👤🌍💎]/.test(line) && !/^(zone|region|id|server|status)/i.test(line)) {
        username = line.replace(/^[^a-zA-Z0-9]+/, '').trim()
        if (username.length > 1) break
      }
    }
  }

  return { username: username || null, raw: text }
}

// Parse /ddml reply → array of { size, claimable }
function parseDDML(text) {
  const packs = []
  const sections = text.split(/Pack\s*🎁\s*/i).slice(1)
  for (const sec of sections) {
    const sizeM   = sec.match(/^(\d+\+\d+)/i)
    const claimM  = sec.match(/Claimable[:\s]+(Yes|No)/i)
    if (sizeM) {
      packs.push({
        size:      sizeM[1],
        claimable: claimM?.[1]?.toLowerCase() === 'yes',
      })
    }
  }
  return packs
}

// Main export — query both /ml and /ddml, return structured result
async function queryMLBB(userId, zoneId) {
  const client = await _getClient()

  const mlText   = await _sendAndWait(client, `/ml ${userId} ${zoneId}`)
  const ddmlText = await _sendAndWait(client, `/ddml ${userId} ${zoneId}`)

  const ml   = parseML(mlText)
  const packs = parseDDML(ddmlText)

  return { username: ml.username, mlRaw: mlText, packs, ddRaw: ddmlText, userId, zoneId }
}

module.exports = { queryMLBB }
