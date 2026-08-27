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
    { connectionRetries: 3 }
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

  // Step 1: /help — list all commands
  let sent = await client.sendMessage(BOT, { message: '/help' })
  try {
    const r = await waitReply(sent.id, 8000)
    console.log('--- /help reply ---\n', r, '\n')
  } catch { console.log('No reply to /help\n') }

  // Step 2: /check — common MLBB check command
  sent = await client.sendMessage(BOT, { message: '/check 422761992 5506' })
  try {
    const r = await waitReply(sent.id, 12000)
    console.log('--- /check reply ---\n', r, '\n')
  } catch { console.log('No reply to /check\n') }

  // Step 3: /id — another common variant
  sent = await client.sendMessage(BOT, { message: '/id 422761992 5506' })
  try {
    const r = await waitReply(sent.id, 12000)
    console.log('--- /id reply ---\n', r, '\n')
  } catch { console.log('No reply to /id\n') }

  // Step 4: /region
  sent = await client.sendMessage(BOT, { message: '/region 422761992 5506' })
  try {
    const r = await waitReply(sent.id, 12000)
    console.log('--- /region reply ---\n', r, '\n')
  } catch { console.log('No reply to /region\n') }

  await client.disconnect()
  process.exit(0)
})()
