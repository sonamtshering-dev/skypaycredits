// services/smsService.js — OneAPI (oneapi.in)
const axios = require('axios')

function stripCountryCode(phone) {
  return phone.replace(/^\+?91/, '').replace(/\D/g, '').slice(-10)
}

async function sendSMSOTP(phone, otp, siteName = 'SkyPay') {
  const apiKey = process.env.ONEAPI_KEY
  const number = stripCountryCode(phone)

  if (!apiKey) {
    console.log(`[SMS DEV] OTP for ${number}: ${otp}  (set ONEAPI_KEY to enable real SMS)`)
    return
  }

  try {
    const response = await axios.post(
      'https://backend.oneapi.in/sms/sendotp',
      {
        apiKey,
        brandName:    siteName,
        customerName: 'User',
        number:       parseInt(number),
        otp,
      },
      { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
    )

    if (!response.data?.success) {
      console.warn('[SMS] OneAPI error:', response.data)
      throw new Error(response.data?.msg || 'SMS failed')
    }

    console.log(`[SMS] OTP sent to ${number}`)
  } catch (err) {
    console.error('[SMS] Request failed:', err.response?.data || err.message)
    throw new Error(err.response?.data?.msg || err.message)
  }
}

function maskPhone(phone) {
  const n = stripCountryCode(phone)
  return `+91 ${n.slice(0,2)}****${n.slice(-4)}`
}

module.exports = { sendSMSOTP, maskPhone, stripCountryCode }
