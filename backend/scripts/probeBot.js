// Probe @gameidchecker_bot to discover its commands and reply format
// Run: node -r dotenv/config scripts/probeBot.js
const { TelegramClient } = require('telegram')
const { StringSession }  = require('telegram/sessions')
const { NewMessage, MessageEdited } = require('telegram/events')

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

  const waitReply = (afterId, timeoutMs = 15000) => new Promise((resolve, reject) => {
    let done = false
    const finish = (t) => {
      if (done) return; done = true
      clearTimeout(timer)
      client.removeEventHandler(hN)
      client.removeEventHandler(hE)
      resolve(t)
    }
    const timer = setTimeout(() => {
      if (done) return; done = true
      client.removeEventHandler(hN)
      client.removeEventHandler(hE)
      reject(new Error('timeout'))
    }, timeoutMs)
    const accept = (m) => {
      if (m.out || m.id <= afterId) return
      const t = (m.text || '').trim()
      // Print interim messages but keep waiting
      if (/verif|🔍/i.test(t) && t.length < 60) { console.log('  [interim]', t); return }
      finish(t)
    }
    const hN = async (ev) => accept(ev.message)
    const hE = async (ev) => accept(ev.message)
    client.addEventHandler(hN, new NewMessage({ chats: [BOT] }))
    client.addEventHandler(hE, new MessageEdited({ chats: [BOT] }))
  })

  // Step 1: /ml — MLBB region check
  let sent = await client.sendMessage(BOT, { message: '/ml 100893609 2521' })
  try {
    const r = await waitReply(sent.id, 12000)
    console.log('--- /ml reply ---\n', r, '\n')
  } catch { console.log('No reply to /ml\n') }

  // Step 2: /ddml — Double Diamond check
  sent = await client.sendMessage(BOT, { message: '/ddml 100893609 2521' })
  try {
    const r = await waitReply(sent.id, 12000)
    console.log('--- /ddml reply ---\n', r, '\n')
  } catch { console.log('No reply to /ddml\n') }

  await client.disconnect()
  process.exit(0)
})()
