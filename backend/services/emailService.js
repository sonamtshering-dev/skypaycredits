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
    ? `<span style="color:#ffffff;">${first}</span>&nbsp;<span style="color:#6366f1;">${rest}</span>`
    : `<span style="color:#ffffff;">${first}</span>`
  const logoHtml = logoUrl
    ? `<img src="${logoUrl}" alt="${siteName}" width="48" height="48" style="display:block;margin:0 auto 10px;border-radius:8px;" />`
    : ''
  return `
    <td bgcolor="#111116" style="background-color:#111116;padding:28px 36px 22px;border-bottom:1px solid #1e1e2a;text-align:center;">
      ${logoHtml}
      <div style="font-size:20px;font-weight:900;letter-spacing:-0.3px;">${nameHtml}</div>
    </td>`
}

function emailOuter(siteName, logoUrl, bannerHtml, bodyHtml, footerText) {
  const footer = footerText ||
    `Sent by ${siteName} &nbsp;·&nbsp; If you didn't request this, ignore this email.<br>Never share your code — our team will never ask for it.`
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${siteName}</title>
</head>
<body style="margin:0;padding:0;background-color:#000000;" bgcolor="#000000">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#000000" style="background-color:#000000;">
    <tr>
      <td align="center" style="padding:36px 16px;">
        <table width="540" cellpadding="0" cellspacing="0" border="0" bgcolor="#111116"
          style="max-width:540px;width:100%;background-color:#111116;border-radius:16px;border:1px solid #2a2a3a;">

          <tr>${brandHeader(siteName, logoUrl)}</tr>

          ${bannerHtml}

          <tr>
            <td bgcolor="#111116" style="background-color:#111116;padding:26px 36px 30px;">
              ${bodyHtml}
            </td>
          </tr>

          <tr>
            <td bgcolor="#0d0d12" style="background-color:#0d0d12;padding:16px 36px 24px;border-top:1px solid #1e1e2a;text-align:center;font-size:12px;color:#6b7280;line-height:1.8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
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
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.3px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">Verify your email</h2>
    <p style="margin:0 0 28px;font-size:14px;color:#9ca3af;line-height:1.7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
      Enter the code below to complete sign-up. It expires in <strong style="color:#e5e7eb;">5 minutes</strong>.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
      <tr>
        <td align="center" bgcolor="#0a0a0d" style="background-color:#0a0a0d;border:1px solid #2a2a5a;border-radius:12px;padding:30px 24px;">
          <div style="font-size:44px;font-weight:900;letter-spacing:16px;color:#ffffff;font-family:'Courier New',Courier,monospace;padding-left:16px;">${otp}</div>
          <div style="font-size:11px;color:#6b7280;margin-top:10px;letter-spacing:2px;text-transform:uppercase;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">One-time verification code</div>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td bgcolor="#16161f" style="background-color:#16161f;border:1px solid #2a2a3a;border-radius:8px;padding:13px 16px;font-size:13px;color:#9ca3af;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
          This code is valid for one use only. Do not share it with anyone.
        </td>
      </tr>
    </table>
  `
  await transporter.sendMail({
    from:    `"${siteName}" <${process.env.EMAIL_USER}>`,
    to:      email,
    subject: `${otp} is your ${siteName} verification code`,
    html:    emailOuter(siteName, logoUrl, '', body),
  })
}

// ── Password reset email ───────────────────────────────
async function sendPasswordResetEmail(email, otp, siteName = 'Nitrogen Store', logoUrl = '') {
  const body = `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.3px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">Reset your password</h2>
    <p style="margin:0 0 28px;font-size:14px;color:#9ca3af;line-height:1.7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
      Use the code below to reset your password. It expires in <strong style="color:#e5e7eb;">5 minutes</strong>.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
      <tr>
        <td align="center" bgcolor="#0a0a0d" style="background-color:#0a0a0d;border:1px solid #2a2a5a;border-radius:12px;padding:30px 24px;">
          <div style="font-size:44px;font-weight:900;letter-spacing:16px;color:#ffffff;font-family:'Courier New',Courier,monospace;padding-left:16px;">${otp}</div>
          <div style="font-size:11px;color:#6b7280;margin-top:10px;letter-spacing:2px;text-transform:uppercase;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">Password reset code</div>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td bgcolor="#16161f" style="background-color:#16161f;border:1px solid #2a2a3a;border-radius:8px;padding:13px 16px;font-size:13px;color:#9ca3af;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
          Didn't request this? Your password won't change unless you use this code. You can safely ignore this email.
        </td>
      </tr>
    </table>
  `
  await transporter.sendMail({
    from:    `"${siteName}" <${process.env.EMAIL_USER}>`,
    to:      email,
    subject: `Reset your ${siteName} password`,
    html:    emailOuter(siteName, logoUrl, '', body),
  })
}

// ── Order confirmation email ───────────────────────────
async function sendOrderConfirmationEmail(email, order, siteName = 'Nitrogen Store', logoUrl = '', currencySymbol = '₹') {
  const orderId    = order._id?.toString().slice(-8).toUpperCase()
  const date       = new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  const playerInfo = order.playerInfo || {}
  const gameIcon   = order.gameIcon
    ? `<img src="${order.gameIcon}" width="52" height="52" style="border-radius:10px;display:block;" />`
    : ''

  const detailRows = [
    ['Player ID', playerInfo.userId || '—'],
    playerInfo.zoneId ? ['Zone ID', playerInfo.zoneId] : null,
    ['Date',      date],
    order.paymentMethod ? ['Payment', order.paymentMethod] : null,
  ].filter(Boolean).map(([label, val]) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #1e1e28;font-size:13px;color:#9ca3af;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">${label}</td>
      <td style="padding:10px 0;border-bottom:1px solid #1e1e28;font-size:13px;color:#ffffff;font-weight:600;text-align:right;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">${val}</td>
    </tr>`).join('')

  const discountRow = order.couponDiscount > 0
    ? `<tr>
        <td style="padding:10px 0;border-bottom:1px solid #1e1e28;font-size:13px;color:#9ca3af;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">Discount</td>
        <td style="padding:10px 0;border-bottom:1px solid #1e1e28;font-size:13px;color:#4ade80;font-weight:600;text-align:right;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">- ${currencySymbol}${order.couponDiscount}</td>
       </tr>` : ''

  const banner = `
    <tr>
      <td bgcolor="#0d1a0d" style="background-color:#0d1a0d;padding:26px 36px 22px;border-bottom:1px solid #1a2a1a;text-align:center;">
        <table align="center" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:12px;">
          <tr>
            <td width="58" height="58" bgcolor="#0f2a0f" style="background-color:#0f2a0f;border:2px solid #22c55e;border-radius:29px;text-align:center;vertical-align:middle;font-size:26px;line-height:54px;color:#22c55e;">&#10003;</td>
          </tr>
        </table>
        <div style="font-size:20px;font-weight:800;color:#ffffff;margin-bottom:4px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">Order Completed!</div>
        <div style="font-size:13px;color:#9ca3af;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">Your top-up has been processed successfully.</div>
      </td>
    </tr>`

  const body = `
    <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:18px;">
      <tr>
        <td bgcolor="#1a1a2e" style="background-color:#1a1a2e;border:1px solid #2d2d5e;border-radius:6px;padding:5px 12px;font-size:11px;font-weight:700;color:#818cf8;letter-spacing:1.5px;text-transform:uppercase;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
          ORDER &nbsp;# &nbsp;${orderId}
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
      <tr>
        <td bgcolor="#18181f" style="background-color:#18181f;border:1px solid #2a2a3a;border-radius:12px;padding:14px 16px;">
          <table cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td width="52" height="52" bgcolor="#2d1f6e" style="background-color:#2d1f6e;border-radius:10px;text-align:center;vertical-align:middle;font-size:0;">
                ${gameIcon}
              </td>
              <td style="padding-left:14px;vertical-align:middle;">
                <div style="font-size:15px;font-weight:700;color:#ffffff;margin-bottom:3px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">${order.gameName || '—'}</div>
                <div style="font-size:13px;color:#9ca3af;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">${order.packName || order.packSnapshot?.title || '—'}</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
      ${detailRows}
      ${discountRow}
      <tr>
        <td style="padding:14px 0 0;font-size:14px;color:#d1d5db;font-weight:700;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">Amount Paid</td>
        <td style="padding:14px 0 0;font-size:20px;color:#4ade80;font-weight:800;text-align:right;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">${currencySymbol}${order.price}</td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td bgcolor="#16161f" style="background-color:#16161f;border:1px solid #2a2a3a;border-radius:8px;padding:13px 16px;font-size:13px;color:#9ca3af;line-height:1.6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
          Questions about your order? Contact support with Order ID
          <span style="color:#a5b4fc;font-weight:700;">#${orderId}</span> and we'll help you.
        </td>
      </tr>
    </table>
  `

  const footerText = `Thank you for shopping at ${siteName}! &nbsp;·&nbsp; Keep this email as your receipt.`

  await transporter.sendMail({
    from:    `"${siteName}" <${process.env.EMAIL_USER}>`,
    to:      email,
    subject: `Your ${order.gameName || 'top-up'} receipt from ${siteName} #${orderId}`,
    html:    emailOuter(siteName, logoUrl, banner, body, footerText),
  })
}

module.exports = { generateOTP, sendOTPEmail, sendPasswordResetEmail, sendOrderConfirmationEmail }
