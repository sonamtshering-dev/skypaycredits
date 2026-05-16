const crypto = require("crypto")
// routes/packRoutes.js
const express = require("express")
const router  = express.Router()
const multer  = require("multer")
const path    = require("path")
const fs      = require("fs")
const Pack    = require("../models/Pack")
const { protect, adminOnly, validateObjectId } = require("../middlewares/authMiddleware")

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "../uploads/packs")
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().replace(/[^.a-z0-9]/g, '')
    const rand = crypto.randomBytes(16).toString('hex')
    cb(null, `${Date.now()}-${rand}${ext}`)
  },
})
const ALLOWED_TYPES = ['image/jpeg','image/jpg','image/png','image/gif','image/webp']
const ALLOWED_EXT   = ['.jpg','.jpeg','.png','.gif','.webp']
const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = require('path').extname(file.originalname).toLowerCase()
    if (ALLOWED_TYPES.includes(file.mimetype) && ALLOWED_EXT.includes(ext)) cb(null, true)
    else cb(new Error('Only image files allowed (jpg, png, gif, webp)'), false)
  }
})

router.get("/", async (req, res) => {
  try {
    const filter = { active: true }
    if (req.query.gameId) filter.gameId = req.query.gameId
    const regionSlug = req.query.region || ""
    if (regionSlug) {
      const regionPacks = await Pack.find({ ...filter, regionSlug }).sort({ sortOrder: 1, price: 1 })
      if (regionPacks.length > 0) return res.json(regionPacks)
      const fallback = await Pack.find({ ...filter, $or: [{ regionSlug: "" }, { regionSlug: { $exists: false } }] }).sort({ sortOrder: 1, price: 1 })
      return res.json(fallback)
    }
    const packs = await Pack.find(filter).sort({ regionSlug: 1, sortOrder: 1, price: 1 })
    res.json(packs)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.get("/all", protect, adminOnly, async (req, res) => {
  try {
    const filter = {}
    if (req.query.gameId) filter.gameId = req.query.gameId
    if (req.query.region !== undefined) filter.regionSlug = req.query.region
    const packs = await Pack.find(filter).sort({ regionSlug: 1, sortOrder: 1, price: 1 })
    res.json(packs)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.post("/", protect, adminOnly, upload.single("image"), async (req, res) => {
  try {
    const body = { ...req.body }
    if (typeof body.skuCodes === "string") body.skuCodes = JSON.parse(body.skuCodes || "[]")
    if (typeof body.active === "string") body.active = body.active === "true"
    body.price    = Number(body.price)    || 0
    body.oldPrice = Number(body.oldPrice) || 0
    body.diamonds = Number(body.diamonds) || 0
    body.bonus    = Number(body.bonus)    || 0
    body.sortOrder = Number(body.sortOrder) || 0
    if (req.file) body.image = `/uploads/packs/${req.file.filename}`
    const pack = await Pack.create(body)
    res.status(201).json(pack)
  } catch (err) { res.status(400).json({ message: err.message }) }
})

router.put("/:id", protect, adminOnly, validateObjectId, upload.single("image"), async (req, res) => {
  try {
    const body = { ...req.body }
    if (typeof body.skuCodes === "string") body.skuCodes = JSON.parse(body.skuCodes || "[]")
    if (typeof body.active === "string") body.active = body.active === "true"
    body.price    = Number(body.price)    || 0
    body.oldPrice = Number(body.oldPrice) || 0
    body.diamonds = Number(body.diamonds) || 0
    body.bonus    = Number(body.bonus)    || 0
    body.sortOrder = Number(body.sortOrder) || 0
    if (req.file) body.image = `/uploads/packs/${req.file.filename}`
    const pack = await Pack.findByIdAndUpdate(req.params.id, body, { new: true })
    if (!pack) return res.status(404).json({ message: "Pack not found" })
    res.json(pack)
  } catch (err) { res.status(400).json({ message: err.message }) }
})

router.delete("/:id", protect, adminOnly, validateObjectId, async (req, res) => {
  try {
    await Pack.findByIdAndDelete(req.params.id)
    res.json({ message: "Pack deleted" })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

module.exports = router