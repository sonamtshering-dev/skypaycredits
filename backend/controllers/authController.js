const securityLog = require('../services/securityLogger')
const jwt   = require("jsonwebtoken")
const User  = require("../models/User")
const OTP   = require("../models/OTP")
const { generateOTP, sendOTPEmail, sendPasswordResetEmail } = require("../services/emailService")
const { sendSMSOTP, maskPhone } = require("../services/smsService")

const isProd = process.env.NODE_ENV === 'production'
const makeToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" })

// ── Register — creates unverified account + sends OTP ──
exports.register = async (req, res) => {
  try {
    const name     = req.body.name?.trim()
    const email    = req.body.email?.trim().toLowerCase()
    const rawPhone = req.body.phone?.trim()
    const password = req.body.password

    if (!name || !email || !password || !rawPhone)
      return res.status(400).json({ message: "Name, email, phone and password are required" })

    // Validate Indian phone — strip +91/91 prefix, must be 10 digits starting 6-9
    const phone10 = rawPhone.replace(/^\+?91/, '').replace(/\D/g, '').slice(-10)
    if (!/^[6-9]\d{9}$/.test(phone10))
      return res.status(400).json({ message: "Enter a valid 10-digit Indian mobile number" })
    const phone = `91${phone10}`
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ message: "Invalid email address" })
    if (password.length < 8)
      return res.status(400).json({ message: "Password must be at least 8 characters" })
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password))
      return res.status(400).json({ message: "Password must contain uppercase, lowercase and a number" })
    if (name.length > 50)
      return res.status(400).json({ message: "Name too long" })

    const exists = await User.findOne({ email })
    if (exists && exists.isEmailVerified)
      return res.status(400).json({ message: "An account with this email already exists" })

    // Check if phone already taken by another verified account
    const phoneTaken = await User.findOne({ phone, isEmailVerified: true })
    if (phoneTaken) return res.status(400).json({ message: "This phone number is already registered" })

    // Delete unverified account if exists (re-registration)
    if (exists && !exists.isEmailVerified) await User.deleteOne({ email })

    // Create unverified user
    const user = await User.create({
      name, email, password,
      ...(phone ? { phone } : {}),
      isEmailVerified: false,
    })

    // Generate and store OTP
    await OTP.deleteMany({ email }) // clear old OTPs
    const otp = generateOTP()
    await OTP.create({ email, otp })

    // Send email
    try {
      const settings = await require("../models/Settings").findOne()
      await sendOTPEmail(email, otp, settings?.siteName || 'Nitrogen Store')
    } catch (emailErr) {
      console.error("[EMAIL] Failed to send OTP:", emailErr.message)
      await User.deleteOne({ email })
      await OTP.deleteMany({ email })
      return res.status(500).json({ message: "Failed to send verification email. Please try again." })
    }

    res.status(201).json({
      message: "Verification code sent to your email",
      email,
      requiresVerification: true,
    })
  } catch (err) {
    console.error("register error:", err.message)
    res.status(500).json({ message: isProd ? "Registration failed" : err.message })
  }
}

// ── Verify OTP ─────────────────────────────────────────
exports.verifyOTP = async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase()
    const otp   = req.body.otp?.trim()

    if (!email || !otp)
      return res.status(400).json({ message: "Email and OTP are required" })

    const record = await OTP.findOne({ email })
    if (!record)
      return res.status(400).json({ message: "OTP expired or not found. Please register again." })

    if (record.otp !== otp)
      return res.status(400).json({ message: "Incorrect verification code" })

    // Mark email as verified
    const user = await User.findOneAndUpdate(
      { email },
      { isEmailVerified: true },
      { new: true }
    )
    if (!user) return res.status(404).json({ message: "User not found" })

    // Clean up email OTP
    await OTP.deleteMany({ email, purpose: 'verify' })

    // If user has phone → send phone OTP next
    if (user.phone) {
      await OTP.deleteMany({ email, purpose: 'phone' })
      const phoneOtp = generateOTP()
      await OTP.create({ email, phone: user.phone, otp: phoneOtp, purpose: 'phone' })
      try {
        const settings = await require("../models/Settings").findOne()
        await sendSMSOTP(user.phone, phoneOtp, settings?.siteName || 'Nitrogen Store')
      } catch (smsErr) {
        console.error("[SMS] Failed to send phone OTP:", smsErr.message)
      }
      return res.json({
        requiresPhoneVerification: true,
        phone: maskPhone(user.phone),
        email,
      })
    }

    // No phone — issue token directly
    const token = makeToken(user._id)
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7*24*60*60*1000
    })
    securityLog.loginSuccess(user._id, req.ip)
    res.json({
      token,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar }
    })
  } catch (err) {
    res.status(500).json({ message: isProd ? "Verification failed" : err.message })
  }
}

// ── Verify Phone OTP ───────────────────────────────────
exports.verifyPhoneOTP = async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase()
    const otp   = req.body.otp?.trim()
    if (!email || !otp) return res.status(400).json({ message: "Email and OTP are required" })

    const record = await OTP.findOne({ email, purpose: 'phone' })
    if (!record) return res.status(400).json({ message: "OTP expired. Please request a new one." })
    if (record.otp !== otp) return res.status(400).json({ message: "Incorrect code" })

    const user = await User.findOneAndUpdate({ email }, { isPhoneVerified: true }, { new: true })
    if (!user) return res.status(404).json({ message: "User not found" })

    await OTP.deleteMany({ email, purpose: 'phone' })

    const token = makeToken(user._id)
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7*24*60*60*1000
    })
    securityLog.loginSuccess(user._id, req.ip)
    res.json({
      token,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar }
    })
  } catch (err) {
    res.status(500).json({ message: isProd ? "Verification failed" : err.message })
  }
}

// ── Resend Phone OTP ───────────────────────────────────
exports.resendPhoneOTP = async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase()
    if (!email) return res.status(400).json({ message: "Email required" })

    const user = await User.findOne({ email, isEmailVerified: true })
    if (!user || !user.phone) return res.status(404).json({ message: "No pending phone verification" })

    await OTP.deleteMany({ email, purpose: 'phone' })
    const otp = generateOTP()
    await OTP.create({ email, phone: user.phone, otp, purpose: 'phone' })

    const settings = await require("../models/Settings").findOne()
    await sendSMSOTP(user.phone, otp, settings?.siteName || 'Nitrogen Store')

    res.json({ message: "New code sent to your phone" })
  } catch (err) {
    res.status(500).json({ message: "Failed to resend OTP" })
  }
}

// ── Resend OTP ─────────────────────────────────────────
exports.resendOTP = async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase()
    if (!email) return res.status(400).json({ message: "Email required" })

    const user = await User.findOne({ email, isEmailVerified: false })
    if (!user) return res.status(404).json({ message: "No pending verification for this email" })

    await OTP.deleteMany({ email })
    const otp = generateOTP()
    await OTP.create({ email, otp })

    const settings = await require("../models/Settings").findOne()
    await sendOTPEmail(email, otp, settings?.siteName || 'Nitrogen Store')

    res.json({ message: "New verification code sent" })
  } catch (err) {
    res.status(500).json({ message: "Failed to resend OTP" })
  }
}

// ── Login ─────────────────────────────────────────────
const loginAttempts = new Map()
const LOCKOUT_MS    = 15 * 60 * 1000

setInterval(() => {
  const now = Date.now()
  for (const [email, record] of loginAttempts) {
    if (now - record.firstAt > LOCKOUT_MS) loginAttempts.delete(email)
  }
}, 60_000)

const MAX_ATTEMPTS = 10

exports.login = async (req, res) => {
  try {
    const email    = req.body.email?.trim().toLowerCase()
    const password = req.body.password
    if (!email || !password)
      return res.status(400).json({ message: "Email and password are required" })

    const now    = Date.now()
    const record = loginAttempts.get(email) || { count: 0, firstAt: now }
    if (now - record.firstAt > LOCKOUT_MS) {
      loginAttempts.set(email, { count: 0, firstAt: now })
    } else if (record.count >= MAX_ATTEMPTS) {
      const wait = Math.ceil((LOCKOUT_MS - (now - record.firstAt)) / 60000)
      return res.status(429).json({ message: `Too many failed attempts. Try again in ${wait} minute(s)` })
    }

    const user = await User.findOne({ email })
    if (!user || !user.password) {
      record.count++; loginAttempts.set(email, record)
      securityLog.loginFailed(email, req.ip)
      return res.status(401).json({ message: "Invalid email or password" })
    }
    if (user.status === "banned")
      return res.status(403).json({ message: "Account has been banned" })

    // Check email verified
    if (!user.isEmailVerified) {
      // Re-send OTP
      await OTP.deleteMany({ email })
      const otp = generateOTP()
      await OTP.create({ email, otp })
      const settings = await require("../models/Settings").findOne()
      await sendOTPEmail(email, otp, settings?.siteName || 'Nitrogen Store').catch(() => {})
      return res.status(403).json({
        message: "Email not verified. A new code has been sent.",
        requiresVerification: true,
        email,
      })
    }

    const ok = await user.comparePassword(password)
    if (!ok) {
      record.count++; loginAttempts.set(email, record)
      securityLog.loginFailed(email, req.ip)
      return res.status(401).json({ message: "Invalid email or password" })
    }

    loginAttempts.delete(email)
    securityLog.loginSuccess(user._id, req.ip)

    const token = makeToken(user._id)
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7*24*60*60*1000
    })
    res.json({
      token,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar }
    })
  } catch (err) {
    res.status(500).json({ message: "Login failed" })
  }
}

// ── Get Me ────────────────────────────────────────────
exports.getMe = async (req, res) => {
  const u = req.user
  res.json({ _id: u._id, name: u.name, email: u.email, role: u.role, avatar: u.avatar, createdAt: u.createdAt })
}

// ── Forgot Password — sends reset OTP ────────────────
exports.forgotPassword = async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase()
    if (!email) return res.status(400).json({ message: 'Email required' })

    const user = await User.findOne({ email, isEmailVerified: true })
    // Always respond the same way to prevent email enumeration
    if (!user) return res.json({ message: 'If that email exists, a reset code has been sent.' })

    await OTP.deleteMany({ email, purpose: 'reset' })
    const otp = generateOTP()
    await OTP.create({ email, otp, purpose: 'reset' })

    const settings = await require('../models/Settings').findOne()
    await sendPasswordResetEmail(email, otp, settings?.siteName || 'Nitrogen Store').catch(err => {
      console.error('[EMAIL] Failed to send reset OTP:', err.message)
    })

    res.json({ message: 'If that email exists, a reset code has been sent.' })
  } catch (err) {
    console.error('forgotPassword error:', err.message)
    res.status(500).json({ message: isProd ? 'Failed to send reset email' : err.message })
  }
}

// ── Reset Password — verifies OTP + sets new password ─
exports.resetPassword = async (req, res) => {
  try {
    const email    = req.body.email?.trim().toLowerCase()
    const otp      = req.body.otp?.trim()
    const password = req.body.password

    if (!email || !otp || !password)
      return res.status(400).json({ message: 'Email, code and new password are required' })
    if (password.length < 8)
      return res.status(400).json({ message: 'Password must be at least 8 characters' })
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password))
      return res.status(400).json({ message: 'Password must contain uppercase, lowercase and a number' })

    const record = await OTP.findOne({ email, purpose: 'reset' })
    if (!record) return res.status(400).json({ message: 'Reset code expired. Please request a new one.' })
    if (record.otp !== otp) return res.status(400).json({ message: 'Incorrect reset code' })

    const user = await User.findOne({ email })
    if (!user) return res.status(404).json({ message: 'User not found' })

    user.password = password // pre-save hook will hash it
    await user.save()
    await OTP.deleteMany({ email, purpose: 'reset' })

    res.json({ message: 'Password reset successfully. You can now log in.' })
  } catch (err) {
    console.error('resetPassword error:', err.message)
    res.status(500).json({ message: isProd ? 'Reset failed' : err.message })
  }
}

// ── Logout ────────────────────────────────────────────
exports.logout = (req, res) => {
  res.clearCookie("token")
  res.json({ message: "Logged out" })
}