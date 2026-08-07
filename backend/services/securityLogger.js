// services/securityLogger.js — Structured security event logger
const crypto = require('crypto')
const isProd = process.env.NODE_ENV === 'production'

function logEvent(type, data) {
  const event = {
    t:    new Date().toISOString(),
    type,
    ...data,
  }
  if (isProd) {
    console.log(JSON.stringify(event))
  } else {
    console.log(`[SECURITY] ${type}`, data)
  }
}

function hashEmail(email) {
  return crypto.createHash('sha256').update(String(email).toLowerCase()).digest('hex').slice(0, 16)
}

module.exports = {
  loginFailed:     (email, ip)              => logEvent('LOGIN_FAILED',       { email: hashEmail(email), ip }),
  loginSuccess:    (userId, ip)             => logEvent('LOGIN_SUCCESS',       { userId, ip }),
  loginLocked:     (email, ip)              => logEvent('LOGIN_LOCKED',        { email: hashEmail(email), ip }),
  webhookReceived: (valId, status, ip)      => logEvent('WEBHOOK_RECEIVED',    { valId, status, ip }),
  webhookInvalid:  (ip)                     => logEvent('WEBHOOK_INVALID_SIG', { ip }),
  adminAction:     (userId, action, target) => logEvent('ADMIN_ACTION',        { userId, action, target }),
  paymentCreated:  (userId, orderId, amount)=> logEvent('PAYMENT_CREATED',     { userId, orderId, amount }),
  fileUpload:      (userId, filename, type) => logEvent('FILE_UPLOAD',         { userId, filename, type }),
}
