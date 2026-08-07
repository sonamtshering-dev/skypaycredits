// services/emailService.js
const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  }
})

const crypto = require('crypto')
function generateOTP() {
  return crypto.randomInt(100000, 1000000).toString()
}

// ── Shared wrapper — light-compatible, purple-branded ──
function emailOuter(siteName, logoUrl, bodyHtml, footerText) {
  const footer = footerText ||
    `Sent by <strong>${siteName}</strong> &nbsp;·&nbsp; If you didn't request this, ignore this email.`
  const logoHtml = logoUrl
    ? `<img src="${logoUrl}" alt="${siteName}" width="40" height="40" style="display:inline-block;vertical-align:middle;border-radius:8px;margin-right:10px;" />`
    : ''
  const parts = siteName.trim().split(' ')
  const first = parts[0]
  const rest  = parts.slice(1).join(' ')
  const nameHtml = rest
    ? `<span style="color:#1a1a2e;">${first}</span><span style="color:#6366f1;"> ${rest}</span>`
    : `<span style="color:#1a1a2e;">${first}</span>`

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${siteName}</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f0f5;" bgcolor="#f0f0f5">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f0f0f5" style="background-color:#f0f0f5;">
    <tr>
      <td align="center" style="padding:36px 16px;" bgcolor="#f0f0f5">
        <table width="560" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff"
          style="max-width:560px;width:100%;background-color:#ffffff;border-radius:16px;border:1px solid #e5e7eb;">

          <!-- Header -->
          <tr>
            <td bgcolor="#ffffff" style="background-color:#ffffff;padding:24px 32px 20px;border-bottom:2px solid #6366f1;border-radius:16px 16px 0 0;text-align:left;">
              ${logoHtml}
              <span style="font-size:20px;font-weight:900;letter-spacing:-0.3px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">${nameHtml}</span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td bgcolor="#ffffff" style="background-color:#ffffff;padding:28px 32px 32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
              ${bodyHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td bgcolor="#f9fafb" style="background-color:#f9fafb;padding:16px 32px 20px;border-top:1px solid #e5e7eb;border-radius:0 0 16px 16px;text-align:center;font-size:12px;color:#9ca3af;line-height:1.8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
              ${footer}
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ── OTP email ──────────────────────────────────────────
async function sendOTPEmail(email, otp, siteName = 'Nitrogen Store', logoUrl = '') {
  const body = `
    <h2 style="margin:0 0 6px;font-size:22px;font-weight:800;color:#111827;">Verify your email</h2>
    <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.7;">
      Enter the code below to complete sign-up. It expires in <strong style="color:#374151;">5 minutes</strong>.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
      <tr>
        <td align="center" bgcolor="#f5f3ff" style="background-color:#f5f3ff;border:2px solid #6366f1;border-radius:12px;padding:28px 24px;">
          <div style="font-size:46px;font-weight:900;letter-spacing:14px;color:#4f46e5;font-family:'Courier New',Courier,monospace;padding-left:14px;">${otp}</div>
          <div style="font-size:11px;color:#7c3aed;margin-top:8px;letter-spacing:2px;text-transform:uppercase;font-weight:700;">One-time verification code</div>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td bgcolor="#fffbeb" style="background-color:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:12px 16px;font-size:13px;color:#92400e;line-height:1.6;">
          &#9888; This code is valid for one use only. Do not share it with anyone.
        </td>
      </tr>
    </table>
  `
  await transporter.sendMail({
    from:    `"${siteName}" <${process.env.EMAIL_USER}>`,
    to:      email,
    subject: `${otp} is your ${siteName} verification code`,
    html:    emailOuter(siteName, logoUrl, body),
  })
}

// ── Password reset email ───────────────────────────────
async function sendPasswordResetEmail(email, otp, siteName = 'Nitrogen Store', logoUrl = '') {
  const body = `
    <h2 style="margin:0 0 6px;font-size:22px;font-weight:800;color:#111827;">Reset your password</h2>
    <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.7;">
      Use the code below to reset your password. It expires in <strong style="color:#374151;">5 minutes</strong>.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
      <tr>
        <td align="center" bgcolor="#f5f3ff" style="background-color:#f5f3ff;border:2px solid #6366f1;border-radius:12px;padding:28px 24px;">
          <div style="font-size:46px;font-weight:900;letter-spacing:14px;color:#4f46e5;font-family:'Courier New',Courier,monospace;padding-left:14px;">${otp}</div>
          <div style="font-size:11px;color:#7c3aed;margin-top:8px;letter-spacing:2px;text-transform:uppercase;font-weight:700;">Password reset code</div>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td bgcolor="#fffbeb" style="background-color:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:12px 16px;font-size:13px;color:#92400e;line-height:1.6;">
          Didn't request this? Your password won't change unless you use this code. You can safely ignore this email.
        </td>
      </tr>
    </table>
  `
  await transporter.sendMail({
    from:    `"${siteName}" <${process.env.EMAIL_USER}>`,
    to:      email,
    subject: `Reset your ${siteName} password`,
    html:    emailOuter(siteName, logoUrl, body),
  })
}

// ── Order confirmation email ───────────────────────────
async function sendOrderConfirmationEmail(email, order, siteName = 'Nitrogen Store', logoUrl = '', currencySymbol = '₹') {
  const orderId    = order._id?.toString().slice(-8).toUpperCase()
  const date       = new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  const playerInfo = order.playerInfo || {}
  const gameIcon   = order.gameIcon
    ? `<img src="${order.gameIcon}" width="48" height="48" style="border-radius:10px;display:block;object-fit:cover;" />`
    : `<div style="width:48px;height:48px;border-radius:10px;background-color:#ede9fe;display:flex;align-items:center;justify-content:center;font-size:22px;line-height:48px;text-align:center;">&#127918;</div>`

  const detailRows = [
    ['Player ID', playerInfo.userId || '—'],
    playerInfo.zoneId ? ['Zone ID', playerInfo.zoneId] : null,
    ['Date',      date],
    order.paymentMethod ? ['Payment', order.paymentMethod] : null,
  ].filter(Boolean).map(([label, val]) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-size:13px;color:#6b7280;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">${label}</td>
      <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-size:13px;color:#111827;font-weight:600;text-align:right;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">${val}</td>
    </tr>`).join('')

  const discountRow = order.couponDiscount > 0
    ? `<tr>
        <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-size:13px;color:#6b7280;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">Discount</td>
        <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;font-size:13px;color:#16a34a;font-weight:700;text-align:right;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">- ${currencySymbol}${order.couponDiscount}</td>
       </tr>` : ''

  const body = `
    <!-- Success banner -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
      <tr>
        <td bgcolor="#f0fdf4" style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:18px 20px;text-align:center;">
          <div style="font-size:28px;margin-bottom:6px;">&#10003;</div>
          <div style="font-size:17px;font-weight:800;color:#15803d;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">Order Completed!</div>
          <div style="font-size:13px;color:#4ade80;color:#16a34a;margin-top:2px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">Your top-up has been processed successfully.</div>
        </td>
      </tr>
    </table>

    <!-- Order ID chip -->
    <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
      <tr>
        <td bgcolor="#ede9fe" style="background-color:#ede9fe;border-radius:6px;padding:5px 12px;font-size:11px;font-weight:800;color:#6366f1;letter-spacing:1.5px;text-transform:uppercase;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
          ORDER &nbsp;# &nbsp;${orderId}
        </td>
      </tr>
    </table>

    <!-- Game card -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
      <tr>
        <td bgcolor="#f9fafb" style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:14px 16px;">
          <table cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td width="48" style="vertical-align:middle;">
                ${gameIcon}
              </td>
              <td style="padding-left:14px;vertical-align:middle;">
                <div style="font-size:15px;font-weight:700;color:#111827;margin-bottom:2px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">${order.gameName || '—'}</div>
                <div style="font-size:13px;color:#6b7280;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">${order.packName || order.packSnapshot?.title || '—'}</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Detail rows -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
      ${detailRows}
      ${discountRow}
      <tr>
        <td style="padding:14px 0 0;font-size:14px;color:#374151;font-weight:700;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">Amount Paid</td>
        <td style="padding:14px 0 0;font-size:22px;color:#16a34a;font-weight:900;text-align:right;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">${currencySymbol}${order.price}</td>
      </tr>
    </table>

    <!-- Support note -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td bgcolor="#f9fafb" style="background-color:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px 16px;font-size:13px;color:#6b7280;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
          Questions about your order? Contact support with Order ID
          <strong style="color:#6366f1;">#${orderId}</strong> and we'll help you right away.
        </td>
      </tr>
    </table>
  `

  const footerText = `Thank you for shopping at <strong>${siteName}</strong>! &nbsp;·&nbsp; Keep this email as your receipt.`

  await transporter.sendMail({
    from:    `"${siteName}" <${process.env.EMAIL_USER}>`,
    to:      email,
    subject: `Your ${order.gameName || 'top-up'} receipt from ${siteName} #${orderId}`,
    html:    emailOuter(siteName, logoUrl, body, footerText),
  })
}

module.exports = { generateOTP, sendOTPEmail, sendPasswordResetEmail, sendOrderConfirmationEmail }
