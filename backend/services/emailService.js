// services/emailService.js
const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  }
})

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

function brandHeader(siteName, logoUrl) {
  const parts = siteName.trim().split(' ')
  const first = parts[0]
  const rest  = parts.slice(1).join(' ')
  const nameHtml = rest
    ? `<span style="color:#ffffff;">${first}</span> <span style="color:#6366f1;">${rest}</span>`
    : `<span style="color:#ffffff;">${first}</span>`

  const logoHtml = logoUrl
    ? `<img src="${logoUrl}" alt="${siteName}" width="52" style="display:block;margin:0 auto 12px;border-radius:8px;height:auto;" />`
    : ''

  return `
    <td style="padding:32px 36px 28px;border-bottom:1px solid rgba(255,255,255,0.05);text-align:center;">
      ${logoHtml}
      <div style="font-size:22px;font-weight:900;letter-spacing:-0.3px;">${nameHtml}</div>
    </td>`
}

function emailWrapper(siteName, logoUrl, content) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${siteName}</title>
</head>
<body style="margin:0;padding:0;background:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#09090b;padding:40px 16px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;width:100%;background:#0f0f14;border-radius:16px;overflow:hidden;border:1px solid rgba(99,102,241,0.2);">

        <!-- Header -->
        <tr>${brandHeader(siteName, logoUrl)}</tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 36px 32px;">
            ${content}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:18px 36px 26px;border-top:1px solid rgba(255,255,255,0.05);">
            <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.18);text-align:center;line-height:1.8;">
              Sent by ${siteName} &nbsp;·&nbsp; If you didn't request this, ignore this email.<br>
              Never share your code — our team will never ask for it.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

async function sendOTPEmail(email, otp, siteName = 'Nitrogen Store', logoUrl = '') {
  const content = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.3px;">Verify your email</h2>
    <p style="margin:0 0 32px;font-size:14px;color:rgba(255,255,255,0.4);line-height:1.7;">
      Enter the code below to complete sign-up. It expires in <strong style="color:rgba(255,255,255,0.7);">5 minutes</strong>.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
      <tr>
        <td align="center" style="background:#0a0a0d;border:1px solid rgba(99,102,241,0.35);border-radius:12px;padding:32px 24px;">
          <div style="font-size:44px;font-weight:900;letter-spacing:16px;color:#ffffff;font-family:'Courier New',Courier,monospace;padding-left:16px;">${otp}</div>
          <div style="font-size:11px;color:rgba(255,255,255,0.22);margin-top:12px;letter-spacing:2px;text-transform:uppercase;">One-time verification code</div>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="background:rgba(99,102,241,0.06);border:1px solid rgba(99,102,241,0.15);border-radius:8px;padding:14px 16px;">
          <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.32);line-height:1.6;">
            This code is valid for one use only. Do not share it with anyone.
          </p>
        </td>
      </tr>
    </table>
  `
  await transporter.sendMail({
    from: `"${siteName}" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `${otp} is your ${siteName} verification code`,
    html: emailWrapper(siteName, logoUrl, content),
  })
}

async function sendPasswordResetEmail(email, otp, siteName = 'Nitrogen Store', logoUrl = '') {
  const content = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.3px;">Reset your password</h2>
    <p style="margin:0 0 32px;font-size:14px;color:rgba(255,255,255,0.4);line-height:1.7;">
      Use the code below to reset your password. It expires in <strong style="color:rgba(255,255,255,0.7);">5 minutes</strong>.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
      <tr>
        <td align="center" style="background:#0a0a0d;border:1px solid rgba(99,102,241,0.35);border-radius:12px;padding:32px 24px;">
          <div style="font-size:44px;font-weight:900;letter-spacing:16px;color:#ffffff;font-family:'Courier New',Courier,monospace;padding-left:16px;">${otp}</div>
          <div style="font-size:11px;color:rgba(255,255,255,0.22);margin-top:12px;letter-spacing:2px;text-transform:uppercase;">Password reset code</div>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="background:rgba(99,102,241,0.06);border:1px solid rgba(99,102,241,0.15);border-radius:8px;padding:14px 16px;">
          <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.32);line-height:1.6;">
            Didn't request this? Your password won't change unless you use this code. You can safely ignore this email.
          </p>
        </td>
      </tr>
    </table>
  `
  await transporter.sendMail({
    from: `"${siteName}" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Reset your ${siteName} password`,
    html: emailWrapper(siteName, logoUrl, content),
  })
}

async function sendOrderConfirmationEmail(email, order, siteName = 'Nitrogen Store', logoUrl = '', currencySymbol = '₹') {
  const orderId   = order._id?.toString().slice(-8).toUpperCase()
  const date      = new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  const playerInfo = order.playerInfo || {}
  const discount  = order.couponDiscount > 0
    ? `<tr><td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:13px;color:rgba(255,255,255,0.4);">Coupon Discount</td><td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:13px;color:#4ade80;text-align:right;">- ${currencySymbol}${order.couponDiscount}</td></tr>`
    : ''

  const rows = [
    ['Game',    order.gameName || '—'],
    ['Pack',    order.packName || order.packSnapshot?.title || '—'],
    ['Player ID', playerInfo.userId || '—'],
    playerInfo.zoneId ? ['Zone ID', playerInfo.zoneId] : null,
    ['Amount Paid', `${currencySymbol}${order.price}`],
    ['Date',    date],
    ['Order ID', `#${orderId}`],
  ].filter(Boolean)

  const tableRows = rows.map(([label, val]) => `
    <tr>
      <td style="padding:11px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:13px;color:rgba(255,255,255,0.4);">${label}</td>
      <td style="padding:11px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:13px;color:#ffffff;text-align:right;font-weight:600;">${val}</td>
    </tr>`).join('')

  const content = `
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-block;background:rgba(74,222,128,0.12);border:1px solid rgba(74,222,128,0.3);border-radius:50%;width:56px;height:56px;line-height:56px;font-size:26px;margin-bottom:14px;">✓</div>
      <h2 style="margin:0 0 6px;font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.3px;">Order Completed!</h2>
      <p style="margin:0;font-size:14px;color:rgba(255,255,255,0.4);">Your top-up has been delivered successfully.</p>
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
      ${tableRows}
      ${discount}
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="background:rgba(99,102,241,0.06);border:1px solid rgba(99,102,241,0.15);border-radius:8px;padding:14px 16px;">
          <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.32);line-height:1.6;">
            If you did not receive your top-up or have any issues, please contact our support with your Order ID <strong style="color:rgba(255,255,255,0.5);">#${orderId}</strong>.
          </p>
        </td>
      </tr>
    </table>
  `

  await transporter.sendMail({
    from:    `"${siteName}" <${process.env.EMAIL_USER}>`,
    to:      email,
    subject: `Order #${orderId} Completed — ${order.gameName || 'Top-up'} delivered`,
    html:    emailWrapper(siteName, logoUrl, content),
  })
}

module.exports = { generateOTP, sendOTPEmail, sendPasswordResetEmail, sendOrderConfirmationEmail }
