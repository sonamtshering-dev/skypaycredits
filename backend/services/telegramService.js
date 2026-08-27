// Telegram MTProto client — sends queries to @gameidchecker_bot and returns its reply
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

// Serialize requests — bot replies in order, so concurrent queries would mix up responses
let _queue = Promise.resolve()

async function queryGameBot(userId, zoneId) {
  return new Promise((resolve, reject) => {
    _queue = _queue.then(async () => {
      try {
        const c = await _getClient()

        const sent = await c.sendMessage(BOT, { message: `${userId} ${zoneId}` })

        // Wait for bot reply (matched by replyToMsgId or next inbound message)
        const text = await new Promise((res, rej) => {
          const timer = setTimeout(() => {
            c.removeEventHandler(handler)
            rej(new Error('Bot did not respond in time'))
          }, 12000)

          const handler = async (event) => {
            const msg = event.message
            if (!msg.out && (msg.replyToMsgId === sent.id || msg.id > sent.id)) {
              clearTimeout(timer)
              c.removeEventHandler(handler)
              res(msg.text)
            }
          }

          c.addEventHandler(handler, new NewMessage({ chats: [BOT] }))
        })

        resolve(text)
      } catch (err) {
        reject(err)
      }
    })
  })
}

module.exports = { queryGameBot }
