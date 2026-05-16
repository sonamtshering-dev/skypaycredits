const express = require("express")
const router  = express.Router()
const rateLimit = require("express-rate-limit")
const { register, login, getMe, logout, verifyOTP, resendOTP, forgotPassword, resetPassword } = require("../controllers/authController")
const { protect } = require("../middlewares/authMiddleware")

// Rate limit OTP endpoints
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 min
  max: 5, // 5 attempts per 10 min
  message: { message: "Too many OTP attempts, try again later" }
})

router.post("/register",         register)
router.post("/verify-otp",       otpLimiter, verifyOTP)
router.post("/resend-otp",       otpLimiter, resendOTP)
router.post("/forgot-password",  otpLimiter, forgotPassword)
router.post("/reset-password",   otpLimiter, resetPassword)
router.post("/login",            login)
router.get("/me",                protect, getMe)
router.post("/logout",           logout)

module.exports = router