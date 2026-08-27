// Run once on VPS to generate TG_SESSION: node scripts/tgSession.js
const { TelegramClient } = require('telegram')
const { StringSession }  = require('telegram/sessions')
const readline           = require('readline')

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const ask = (q) => new Promise(r => rl.question(q, r))

;(async () => {
  const apiId   = parseInt(process.env.TG_API_ID)
  const apiHash = process.env.TG_API_HASH
  if (!apiId || !apiHash) { console.error('Set TG_API_ID and TG_API_HASH in .env first'); process.exit(1) }

  const client = new TelegramClient(new StringSession(''), apiId, apiHash, { connectionRetries: 5 })

  await client.start({
    phoneNumber: async () => ask('Phone number (with country code, e.g. +917085396397): '),
    password:    async () => ask('2FA password (press Enter if none): '),
    phoneCode:   async () => ask('Telegram code sent to your app: '),
    onError:     (err) => console.error(err),
  })

  console.log('\n✅ Session string (add this to .env as TG_SESSION):\n')
  console.log(client.session.save())
  console.log()

  await client.disconnect()
  rl.close()
  process.exit(0)
})()
