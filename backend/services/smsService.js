// services/smsService.js — OneAPI (oneapi.in)
const https = require('https')

function stripCountryCode(phone) {
  return phone.replace(/^\+?91/, '').replace(/\D/g, '').slice(-10)
}

async function sendSMSOTP(phone, otp, siteName = 'Nitrogen Store') {
  const apiKey = process.env.ONEAPI_KEY
  const number = stripCountryCode(phone)

  if (!apiKey) {
    console.log(`[SMS DEV] OTP for ${number}: ${otp}  (set ONEAPI_KEY to enable real SMS)`)
    return
  }

  const message = encodeURIComponent(`${otp} is your ${siteName} verification code. Valid for 5 minutes. Do not share with anyone.`)
  const url = `https://backend.oneapi.in/sms/send?apiKey=${apiKey}&mobile=${number}&message=${message}`

  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'cache-control': 'no-cache' } }, res => {
      let body = ''
      res.on('data', d => { body += d })
      res.on('end', () => {
        try {
          const json = JSON.parse(body)
          if (json.status === true || json.success === true) resolve(json)
          else {
            console.warn('[SMS] OneAPI response:', json)
            resolve(json) // still resolve — don't block registration if SMS fails
          }
        } catch (e) { resolve({ raw: body }) }
      })
    })
    req.on('error', err => {
      console.error('[SMS] OneAPI request failed:', err.message)
      resolve() // non-fatal
    })
  })
}

function maskPhone(phone) {
  const n = stripCountryCode(phone)
  return `+91 ${n.slice(0,2)}****${n.slice(-4)}`
}

module.exports = { sendSMSOTP, maskPhone, stripCountryCode }
