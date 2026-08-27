const crypto = require("crypto")
// routes/bannerRoutes.js
const express = require("express")
const router  = express.Router()
const multer  = require("multer")
const path    = require("path")
const fs      = require("fs")
const mongoose = require("mongoose")
const { protect, adminOnly, validateObjectId } = require("../middlewares/authMiddleware")

// Simple inline Banner model
const bannerSchema = new mongoose.Schema({
  title:  { type: String, default: "" },
  image:  { type: String, default: "" },
  link:   { type: String, default: "" },
  active: { type: Boolean, default: true },
}, { timestamps: true })
const Banner = mongoose.models.Banner || mongoose.model("Banner", bannerSchema)

// Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "../uploads/banners")
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename: (req, file, cb) => cb(null, `${Date.now()}-${crypto.randomBytes(16).toString('hex')}${require('path').extname(file.originalname).toLowerCase().replace(/[^.a-z0-9]/g, '')}`),
})
const ALLOWED_TYPES = ['image/jpeg','image/jpg','image/png','image/gif','image/webp']
const ALLOWED_EXT   = ['.jpg','.jpeg','.png','.gif','.webp']
const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    if (ALLOWED_TYPES.includes(file.mimetype) && ALLOWED_EXT.includes(ext)) cb(null, true)
    else cb(new Error('Only image files are allowed'), false)
  }
})

// GET /api/banners — public
router.get("/", async (req, res) => {
  try {
    const banners = await Banner.find({ active: true }).sort({ createdAt: -1 })
    res.json(banners)
  } catch (err) { res.status(500).json({ message: 'Something went wrong' }) }
})

// GET /api/banners/all — admin (all including inactive)
router.get("/all", protect, adminOnly, async (req, res) => {
  try {
    const banners = await Banner.find().sort({ createdAt: -1 })
    res.json(banners)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

function isSafeUrl(url) {
  if (!url) return true
  try {
    const u = new URL(url)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch { return false }
}

// POST /api/banners — admin
router.post("/", protect, adminOnly, upload.single("image"), async (req, res) => {
  try {
    const body = { ...req.body }
    if (body.link !== undefined && !isSafeUrl(body.link))
      return res.status(400).json({ message: "Invalid banner link URL" })
    if (req.file) body.image = `/uploads/banners/${req.file.filename}`
    const banner = await Banner.create(body)
    res.status(201).json(banner)
  } catch (err) { res.status(400).json({ message: err.message }) }
})

// PUT /api/banners/:id — admin
router.put("/:id", protect, adminOnly, validateObjectId, async (req, res) => {
  try {
    const { title, link, active, image } = req.body
    const update = {}
    if (title !== undefined) update.title = title
    if (link !== undefined) {
      if (!isSafeUrl(link)) return res.status(400).json({ message: "Invalid banner link URL" })
      update.link = link
    }
    if (active !== undefined) update.active = active === 'true' || active === true
    if (image !== undefined) update.image = image
    const banner = await Banner.findByIdAndUpdate(req.params.id, update, { new: true })
    if (!banner) return res.status(404).json({ message: "Banner not found" })
    res.json(banner)
  } catch (err) { res.status(400).json({ message: err.message }) }
})

// DELETE /api/banners/:id — admin
router.delete("/:id", protect, adminOnly, validateObjectId, async (req, res) => {
  try {
    await Banner.findByIdAndDelete(req.params.id)
    res.json({ message: "Deleted" })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

module.exports = router