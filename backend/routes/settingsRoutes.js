const crypto = require("crypto")
// routes/settingsRoutes.js
const express  = require("express")
const router   = express.Router()
const multer   = require("multer")
const path     = require("path")
const fs       = require("fs")
const Settings = require("../models/Settings")
const { protect, adminOnly } = require("../middlewares/authMiddleware")

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "../uploads/site")
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    cb(null, dir)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().replace(/[^.a-z0-9]/g, '')
    cb(null, `${Date.now()}-${require('crypto').randomBytes(16).toString('hex')}${ext}`)
  },
})
const ALLOWED_TYPES = ['image/jpeg','image/jpg','image/png','image/gif','image/webp']
const ALLOWED_EXT   = ['.jpg','.jpeg','.png','.gif','.webp']
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    if (ALLOWED_TYPES.includes(file.mimetype) && ALLOWED_EXT.includes(ext)) cb(null, true)
    else cb(new Error('Only image files are allowed'), false)
  }
})

let _settingsCache = null, _settingsCacheAt = 0
const SETTINGS_TTL = 60 * 1000 // 60 seconds

// GET /api/settings — public (only safe fields)
router.get("/", async (req, res) => {
  try {
    const now = Date.now()
    if (_settingsCache && now - _settingsCacheAt < SETTINGS_TTL) return res.json(_settingsCache)
    let settings = await Settings.findOne()
    if (!settings) settings = await Settings.create({})
    // Only expose safe public fields — never expose API keys or internal config
    const safe = {
      siteName:        settings.siteName,
      logo:            settings.logo,
      favicon:         settings.favicon,
      primaryColor:    settings.primaryColor,
      currency:        settings.currency,
      currencySymbol:  settings.currencySymbol,
      maintenanceMode: settings.maintenanceMode,
      whatsapp:        settings.whatsapp,
      whatsappSupport: settings.whatsappSupport,
      email:           settings.email,
      instagram:       settings.instagram,
      facebook:        settings.facebook,
      purchasesEnabled: settings.purchasesEnabled,
    }
    _settingsCache = safe
    _settingsCacheAt = now
    res.json(safe)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// PUT /api/settings — admin
router.put("/", protect, adminOnly, upload.fields([{ name: "logo" },{ name: "favicon" }]), async (req, res) => {
  try {
    const body = { ...req.body }
    if (req.files?.logo)    body.logo    = `/uploads/site/${req.files.logo[0].filename}`
    if (req.files?.favicon) body.favicon = `/uploads/site/${req.files.favicon[0].filename}`
    if (typeof body.maintenanceMode === "string") body.maintenanceMode = body.maintenanceMode === "true"

    // Auto-set currency symbol from currency code
    const SYMBOLS = {
      BDT: '৳', USD: '$', INR: '₹', EUR: '€', GBP: '£',
      PHP: '₱', MYR: 'RM', IDR: 'Rp', SGD: 'S$', THB: '฿',
      PKR: '₨', NPR: '₨', LKR: '₨', MMK: 'K',
    }
    if (body.currency && SYMBOLS[body.currency]) {
      body.currencySymbol = SYMBOLS[body.currency]
    }

    let settings = await Settings.findOne()
    if (!settings) settings = await Settings.create(body)
    else { Object.assign(settings, body); await settings.save() }
    _settingsCache = null // bust cache on update
    res.json(settings)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

module.exports = router