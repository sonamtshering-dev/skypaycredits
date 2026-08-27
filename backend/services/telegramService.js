// Telegram MTProto client — queries @gameidchecker_bot /ml and parses the result
const { TelegramClient } = require('telegram')
const { StringSession }  = require('telegram/sessions')
const { NewMessage, MessageEdited } = require('telegram/events')

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
          let done = false

          const finish = (t) => {
            if (done) return
            done = true
            clearTimeout(timer)
            client.removeEventHandler(hNew)
            client.removeEventHandler(hEdit)
            res(t)
          }

          const timer = setTimeout(() => {
            if (done) return
            done = true
            client.removeEventHandler(hNew)
            client.removeEventHandler(hEdit)
            rej(new Error('Bot did not respond in time'))
          }, timeoutMs)

          const accept = (m) => {
            if (m.out || m.id <= sent.id) return
            const t = (m.text || '').trim()
            // Bot edits its "Verifying..." message in-place with the real result,
            // so we listen for both new messages AND edits.
            // Skip the initial interim message either way.
            if (!t || (/verif|🔍/i.test(t) && t.length < 60)) return
            finish(t)
          }

          const hNew  = async (ev) => accept(ev.message)
          const hEdit = async (ev) => accept(ev.message)

          // chats filter keeps IDs scoped to the bot's dialog (IDs are per-dialog).
          // MessageEdited catches the in-place edit from "Verifying..." → real result.
          client.addEventHandler(hNew,  new NewMessage({ chats: [BOT] }))
          client.addEventHandler(hEdit, new MessageEdited({ chats: [BOT] }))
        })

        resolve(text)
      } catch (err) {
        reject(err)
      }
    })
  })
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
  const mlText  = await _sendAndWait(client, `/ml ${userId} ${zoneId}`)
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
