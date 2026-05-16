const crypto = require("crypto")
// routes/gameRoutes.js
const express  = require("express")
const router   = express.Router()
const multer   = require("multer")
const path     = require("path")
const fs       = require("fs")
const Game     = require("../models/Game")
const { protect, adminOnly, validateObjectId } = require("../middlewares/authMiddleware")

// ── Multer setup ──────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "../uploads/games")
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
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB
  fileFilter: (req, file, cb) => {
    const ext = require('path').extname(file.originalname).toLowerCase()
    if (ALLOWED_TYPES.includes(file.mimetype) && ALLOWED_EXT.includes(ext)) cb(null, true)
    else cb(new Error('Only image files are allowed (jpg, png, gif, webp)'), false)
  }
})

// Helper to process region image uploads (upload.any() gives array)
function processRegionImages(files, regions) {
  if (!regions || !files) return regions
  const fileMap = {}
  if (Array.isArray(files)) {
    files.forEach(f => { fileMap[f.fieldname] = f })
  } else {
    Object.entries(files).forEach(([k, v]) => { fileMap[k] = v[0] })
  }
  return regions.map(r => {
    const key = `region_image_${r.slug}`
    if (fileMap[key]) r.banner = `/uploads/games/${fileMap[key].filename}`
    return r
  })
}

// Fix req.files for icon/banner when using upload.any()
function extractFiles(files) {
  const map = {}
  if (Array.isArray(files)) files.forEach(f => { map[f.fieldname] = [f] })
  return map
}

// GET /api/games — public
router.get("/", async (req, res) => {
  try {
    const filter = { active: true }
    if (req.query.category) filter.category = req.query.category
    const games = await Game.find(filter).sort({ sortOrder: 1, name: 1 })
    res.json(games)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/games/all — admin (includes inactive)
router.get("/all", protect, adminOnly, async (req, res) => {
  try {
    const games = await Game.find().sort({ sortOrder: 1, name: 1 })
    res.json(games)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/games/:id
router.get("/:id", validateObjectId, async (req, res) => {
  try {
    const game = await Game.findById(req.params.id)
    if (!game) return res.status(404).json({ message: "Game not found" })
    res.json(game)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/games — admin
router.post("/", protect, adminOnly, upload.any(), async (req, res) => {
  try {
    const body = { ...req.body }
    const files = extractFiles(req.files)
    if (files.icon)   body.icon   = `/uploads/games/${files.icon[0].filename}`
    if (files.banner) body.banner = `/uploads/games/${files.banner[0].filename}`
    if (typeof body.fields  === "string") body.fields  = JSON.parse(body.fields  || "[]")
    if (typeof body.regions === "string") body.regions = JSON.parse(body.regions || "[]")
    if (typeof body.active  === "string") body.active  = body.active === "true"
    body.regions = processRegionImages(req.files, body.regions)
    const game = await Game.create(body)
    res.status(201).json(game)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// PUT /api/games/:id — admin
// PATCH /api/games/:id/sort
router.patch("/:id/sort", protect, adminOnly, validateObjectId, async (req, res) => {
  try {
    const { sortOrder } = req.body
    await Game.findByIdAndUpdate(req.params.id, { sortOrder })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.put("/:id", protect, adminOnly, validateObjectId, upload.any(), async (req, res) => {
  try {
    const body = { ...req.body }
    const files = extractFiles(req.files)
    if (files.icon)   body.icon   = `/uploads/games/${files.icon[0].filename}`
    if (files.banner) body.banner = `/uploads/games/${files.banner[0].filename}`
    if (typeof body.fields  === "string") body.fields  = JSON.parse(body.fields  || "[]")
    if (typeof body.regions === "string") body.regions = JSON.parse(body.regions || "[]")
    if (typeof body.active  === "string") body.active  = body.active === "true"
    body.regions = processRegionImages(req.files, body.regions)
    const game = await Game.findByIdAndUpdate(req.params.id, body, { new: true })
    if (!game) return res.status(404).json({ message: "Game not found" })
    res.json(game)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// DELETE /api/games/:id — admin
router.delete("/:id", protect, adminOnly, validateObjectId, async (req, res) => {
  try {
    await Game.findByIdAndDelete(req.params.id)
    res.json({ message: "Game deleted" })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router