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

async function sendOTPEmail(email, otp, siteName = 'BD COINS') {
  await transporter.sendMail({
    from: `"${siteName}" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `${otp} is your ${siteName} verification code`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0a0a0a; border-radius: 16px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #f97316, #ea580c); padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 900;">⚡ ${siteName}</h1>
        </div>
        <div style="padding: 32px; background: #1a1a1a;">
          <h2 style="color: #fff; margin: 0 0 12px;">Verify your email</h2>
          <p style="color: #aaa; margin: 0 0 28px; font-size: 15px;">Use the code below to verify your account. It expires in <strong style="color: #f97316;">5 minutes</strong>.</p>
          <div style="background: #0a0a0a; border: 2px solid #f97316; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 28px;">
            <div style="font-size: 42px; font-weight: 900; letter-spacing: 10px; color: #f97316;">${otp}</div>
          </div>
          <p style="color: #666; font-size: 13px; margin: 0;">If you didn't request this code, ignore this email. Never share this code with anyone.</p>
        </div>
      </div>
    `
  })
}



async function sendPasswordResetEmail(email, otp, siteName = 'BD COINS') {
  await transporter.sendMail({
    from: `"${siteName}" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Reset your ${siteName} password`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0a0a0a; border-radius: 16px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #f97316, #ea580c); padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 900;">⚡ ${siteName}</h1>
        </div>
        <div style="padding: 32px; background: #1a1a1a;">
          <h2 style="color: #fff; margin: 0 0 12px;">Reset your password</h2>
          <p style="color: #aaa; margin: 0 0 28px; font-size: 15px;">Use the code below to reset your password. It expires in <strong style="color: #f97316;">5 minutes</strong>.</p>
          <div style="background: #0a0a0a; border: 2px solid #f97316; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 28px;">
            <div style="font-size: 42px; font-weight: 900; letter-spacing: 10px; color: #f97316;">${otp}</div>
          </div>
          <p style="color: #666; font-size: 13px; margin: 0;">If you didn't request a password reset, ignore this email. Your password won't change.</p>
        </div>
      </div>
    `
  })
}

module.exports = { generateOTP, sendOTPEmail, sendPasswordResetEmail }