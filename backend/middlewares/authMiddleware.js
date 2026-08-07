// middlewares/authMiddleware.js
const jwt      = require("jsonwebtoken")
const mongoose = require("mongoose")
const User     = require("../models/User")

const protect = async (req, res, next) => {
  const header = req.headers.authorization

  // Extract token — header takes priority over cookie
  let token = null
  if (header && header.startsWith("Bearer ")) {
    token = header.split(" ")[1]
  } else if (req.cookies?.token) {
    token = req.cookies.token
  }

  if (!token) return res.status(401).json({ message: "Not authorized — no token" })

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user    = await User.findById(decoded.id).select("-password")
    if (!user) return res.status(401).json({ message: "User not found" })

    // Reject tokens issued before a password change (VULN-19)
    if (decoded.tokenVersion !== undefined && decoded.tokenVersion !== user.tokenVersion)
      return res.status(401).json({ message: "Session expired, please log in again" })

    // Block banned users from all protected routes
    if (user.status === "banned") return res.status(403).json({ message: "Account has been banned" })

    req.user = user
    next()
  } catch {
    res.status(401).json({ message: "Token invalid or expired" })
  }
}

const adminOnly = (req, res, next) => {
  if (req.user?.role !== "admin")
    return res.status(403).json({ message: "Admin access required" })
  next()
}

// Validate MongoDB ObjectId — use as middleware on routes with :id param
const validateObjectId = (req, res, next) => {
  const id = req.params.id
  if (id && !mongoose.isValidObjectId(id))
    return res.status(400).json({ message: "Invalid ID format" })
  next()
}

module.exports = { protect, adminOnly, validateObjectId }