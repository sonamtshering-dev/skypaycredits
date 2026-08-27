// Probe @gameidchecker_bot to discover its commands and reply format
// Run: node -r dotenv/config scripts/probeBot.js
const { TelegramClient } = require('telegram')
const { StringSession }  = require('telegram/sessions')
const { NewMessage }     = require('telegram/events')

const BOT = 'gameidchecker_bot'

;(async () => {
  const client = new TelegramClient(
    new StringSession(process.env.TG_SESSION || ''),
    parseInt(process.env.TG_API_ID),
    process.env.TG_API_HASH,
    { connectionRetries: 3, baseLogger: { log: () => {} } }
  )
  await client.connect()
  console.log('Connected. Sending /start to bot...\n')

  const waitReply = (afterId, timeoutMs = 8000) => new Promise((resolve, reject) => {
    const timer = setTimeout(() => { client.removeEventHandler(h); reject(new Error('timeout')) }, timeoutMs)
    const h = async (ev) => {
      const m = ev.message
      if (!m.out && m.id > afterId) {
        clearTimeout(timer); client.removeEventHandler(h)
        resolve(m.text)
      }
    }
    client.addEventHandler(h, new NewMessage({ chats: [BOT] }))
  })

  // Step 1: /start
  let sent = await client.sendMessage(BOT, { message: '/start' })
  try {
    const r = await waitReply(sent.id)
    console.log('--- /start reply ---\n', r, '\n')
  } catch { console.log('No reply to /start\n') }

  // Step 2: try plain UID ZoneID (MLBB test account)
  sent = await client.sendMessage(BOT, { message: '422761992 5506' })
  try {
    const r = await waitReply(sent.id, 12000)
    console.log('--- "422761992 5506" reply ---\n', r, '\n')
  } catch { console.log('No reply to plain UID ZoneID\n') }

  // Step 3: try /mlbb command
  sent = await client.sendMessage(BOT, { message: '/mlbb 422761992 5506' })
  try {
    const r = await waitReply(sent.id, 12000)
    console.log('--- /mlbb reply ---\n', r, '\n')
  } catch { console.log('No reply to /mlbb\n') }

  await client.disconnect()
  process.exit(0)
})()
