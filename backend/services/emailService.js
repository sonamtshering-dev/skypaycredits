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

function emailWrapper(siteName, content) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#000000;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#000000;padding:40px 16px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;width:100%;background:#0d0d0d;border-radius:20px;overflow:hidden;border:1px solid #2a0060;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#4c00b0,#2d0070);padding:32px 32px 28px;text-align:center;">
            <div style="font-size:13px;font-weight:700;color:rgba(255,255,255,0.5);letter-spacing:3px;text-transform:uppercase;margin-bottom:10px;">Game Top-Up Store</div>
            <div style="font-size:30px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">⚡ ${siteName}</div>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 32px 28px;">
            ${content}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px 28px;border-top:1px solid #1a1a1a;">
            <p style="margin:0;font-size:12px;color:#444444;text-align:center;line-height:1.7;">
              This email was sent by ${siteName}. If you didn't request this, you can safely ignore it.<br>
              Never share your code with anyone — our team will never ask for it.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

async function sendOTPEmail(email, otp, siteName = 'Nitrogen Store') {
  const content = `
    <h2 style="margin:0 0 10px;font-size:22px;font-weight:900;color:#ffffff;">Verify your email</h2>
    <p style="margin:0 0 28px;font-size:15px;color:#888888;line-height:1.6;">
      Use the code below to complete your sign-up. It expires in
      <strong style="color:#7c3aed;">5 minutes</strong>.
    </p>

    <!-- OTP Box -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
      <tr>
        <td align="center" style="background:#000000;border:2px solid #4c00b0;border-radius:14px;padding:28px 20px;">
          <div style="font-size:48px;font-weight:900;letter-spacing:14px;color:#ffffff;font-family:Courier,monospace;">${otp}</div>
          <div style="font-size:12px;color:#555555;margin-top:10px;letter-spacing:1px;text-transform:uppercase;">One-time verification code</div>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="background:#0a0a0a;border-left:3px solid #4c00b0;border-radius:4px;padding:12px 16px;">
          <p style="margin:0;font-size:13px;color:#666666;">
            🔒 <strong style="color:#888888;">Security tip:</strong> This code is valid for one use only. Do not share it with anyone.
          </p>
        </td>
      </tr>
    </table>
  `
  await transporter.sendMail({
    from: `"${siteName}" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `${otp} — Your ${siteName} verification code`,
    html: emailWrapper(siteName, content),
  })
}

async function sendPasswordResetEmail(email, otp, siteName = 'Nitrogen Store') {
  const content = `
    <h2 style="margin:0 0 10px;font-size:22px;font-weight:900;color:#ffffff;">Reset your password</h2>
    <p style="margin:0 0 28px;font-size:15px;color:#888888;line-height:1.6;">
      We received a request to reset your password. Use the code below — it expires in
      <strong style="color:#7c3aed;">5 minutes</strong>.
    </p>

    <!-- OTP Box -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
      <tr>
        <td align="center" style="background:#000000;border:2px solid #4c00b0;border-radius:14px;padding:28px 20px;">
          <div style="font-size:48px;font-weight:900;letter-spacing:14px;color:#ffffff;font-family:Courier,monospace;">${otp}</div>
          <div style="font-size:12px;color:#555555;margin-top:10px;letter-spacing:1px;text-transform:uppercase;">Password reset code</div>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="background:#0a0a0a;border-left:3px solid #4c00b0;border-radius:4px;padding:12px 16px;">
          <p style="margin:0;font-size:13px;color:#666666;">
            🔒 <strong style="color:#888888;">Didn't request this?</strong> Your password won't change unless you use this code. You can safely ignore this email.
          </p>
        </td>
      </tr>
    </table>
  `
  await transporter.sendMail({
    from: `"${siteName}" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Reset your ${siteName} password`,
    html: emailWrapper(siteName, content),
  })
}

module.exports = { generateOTP, sendOTPEmail, sendPasswordResetEmail }
