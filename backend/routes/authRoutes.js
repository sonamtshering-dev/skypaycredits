const express = require("express")
const router  = express.Router()
const rateLimit = require("express-rate-limit")
const { register, login, getMe, logout, verifyOTP, resendOTP, verifyPhoneOTP, resendPhoneOTP, forgotPassword, resetPassword } = require("../controllers/authController")
const { protect } = require("../middlewares/authMiddleware")

// Rate limit OTP endpoints
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 min
  max: 5, // 5 attempts per 10 min
  message: { message: "Too many OTP attempts, try again later" }
})

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: { message: "Too many registration attempts, try again in an hour" }
})

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 20,
  message: { message: "Too many login attempts, try again later" }
})

router.post("/register",         registerLimiter, register)
router.post("/verify-otp",       otpLimiter, verifyOTP)
router.post("/resend-otp",       otpLimiter, resendOTP)
router.post("/verify-phone-otp", otpLimiter, verifyPhoneOTP)
router.post("/resend-phone-otp", otpLimiter, resendPhoneOTP)
router.post("/forgot-password",  otpLimiter, forgotPassword)
router.post("/reset-password",   otpLimiter, resetPassword)
router.post("/login",            loginLimiter, login)
router.get("/me",                protect, getMe)
router.post("/logout",           logout)

module.exports = router