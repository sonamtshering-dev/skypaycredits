const securityLog = require('../services/securityLogger')
const express = require("express")
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').substring(0, 100)
}
const router  = express.Router()
const User    = require("../models/User")
const { protect, adminOnly, validateObjectId } = require("../middlewares/authMiddleware")

// GET /api/users — admin
router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1)
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 30))
    const skip  = (page - 1) * limit

    const filter = {}
    if (req.query.search) {
      const search = req.query.search.slice(0, 50)
      filter.$or = [
        { name:  { $regex: escapeRegex(search), $options: "i" } },
        { email: { $regex: escapeRegex(search), $options: "i" } },
      ]
    }
    const VALID_USER_STATUSES = ["active", "banned"]
    if (req.query.status && VALID_USER_STATUSES.includes(req.query.status)) filter.status = req.query.status

    const [users, total] = await Promise.all([
      User.find(filter).select("-password").sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter),
    ])
    res.json({ users, total, page, pages: Math.ceil(total / limit) })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// PUT /api/users/me — update own profile (MUST be before /:id)
router.put("/me", protect, async (req, res) => {
  try {
    const name = req.body.name?.trim().slice(0, 50)
    if (!name) return res.status(400).json({ message: "Name is required" })
    const user = await User.findByIdAndUpdate(req.user._id, { name }, { new: true }).select("-password")
    res.json(user)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// PUT /api/users/:id — admin: update role / status
router.put("/:id", protect, adminOnly, validateObjectId, async (req, res) => {
  try {
    // Prevent admin from demoting themselves
    if (req.params.id === req.user._id.toString())
      return res.status(400).json({ message: "You cannot change your own role or status" })

    const { role, status } = req.body
    const VALID_ROLES    = ["user", "admin"]
    const VALID_STATUSES = ["active", "banned"]
    const update = {}
    if (role   && VALID_ROLES.includes(role))     update.role   = role
    if (status && VALID_STATUSES.includes(status)) update.status = status
    if (!Object.keys(update).length)
      return res.status(400).json({ message: "No valid fields to update" })

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select("-password")
    if (!user) return res.status(404).json({ message: "User not found" })
    securityLog.adminAction(req.user._id, `update_user:${JSON.stringify(update)}`, req.params.id)
    res.json(user)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

module.exports = router