// routes/homeRoutes.js — single endpoint for homepage data with short TTL cache
const express  = require('express')
const router   = express.Router()
const Game     = require('../models/Game')
const Settings = require('../models/Settings')
const mongoose = require('mongoose')

const bannerSchema = new mongoose.Schema({
  title:  { type: String, default: '' },
  image:  { type: String, default: '' },
  link:   { type: String, default: '' },
  active: { type: Boolean, default: true },
}, { timestamps: true })
const Banner = mongoose.models.Banner || mongoose.model('Banner', bannerSchema)

let cache = null
let cacheAt = 0
const TTL = 30 * 1000 // 30 seconds

// GET /api/home — returns games + banners + settings in one round trip
router.get('/', async (req, res) => {
  try {
    const now = Date.now()
    if (cache && now - cacheAt < TTL) {
      return res.json(cache)
    }
    const [games, banners, settings] = await Promise.all([
      Game.find({ active: true }).sort({ sortOrder: 1, name: 1 }).select('-provider -providerGameId -providerUrl -regions.provider -regions.providerGameId').lean(),
      Banner.find({ active: true }).sort({ createdAt: -1 }).lean(),
      Settings.findOne().lean(),
    ])
    cache = { games, banners, settings }
    cacheAt = now
    res.json(cache)
  } catch (err) {
    res.status(500).json({ message: 'Something went wrong' })
  }
})

module.exports = router
