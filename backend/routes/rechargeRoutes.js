// routes/rechargeRoutes.js
const express = require("express")
const router  = express.Router()
const Game    = require("../models/Game")
const Pack    = require("../models/Pack")
const { verifyPlayer, getServers } = require("../services/rechargeService")
const { protect } = require("../middlewares/authMiddleware")

// POST /api/recharge/verify-player
// Works for all providers: smile, g2bulk, moogold, manual
router.post("/verify-player", protect, async (req, res) => {
  try {
    const { gameId, regionSlug, playerData } = req.body
    if (!gameId) return res.status(400).json({ message: "gameId required" })
    if (!playerData?.userId) return res.status(400).json({ message: "Player ID is required" })

    const game = await Game.findById(gameId)
    if (!game) return res.status(404).json({ message: "Game not found" })

    // Get packs for this region to find SKU (needed for Smile verify)
    const slug  = regionSlug || playerData.regionSlug || ""
    let packs = await Pack.find({ gameId, regionSlug: slug, active: true })
    // Fallback — if no packs found for region, try matching region by provider
    if (packs.length === 0) {
      const smileRegion = game.regions?.find(r => r.active && r.provider === 'smile')
      const fallbackRegion = smileRegion || game.regions?.find(r => r.active)
      if (fallbackRegion) packs = await Pack.find({ gameId, regionSlug: fallbackRegion.slug, active: true })
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('[VERIFY] game:', game.name, 'provider:', game.provider, 'region:', slug)
    }
    const result = await verifyPlayer(game, { ...playerData, regionSlug: slug }, packs)
    res.json(result)
  } catch (err) {
    res.status(400).json({ ok: false, message: err.message })
  }
})

// GET /api/recharge/servers/:gameId?region=slug
// Returns server dropdown list for games that need it
router.get("/servers/:gameId", async (req, res) => {
  try {
    const game = await Game.findById(req.params.gameId)
    if (!game) return res.status(404).json({ message: "Game not found" })

    const regionSlug = req.query.region || ""
    const region = game.regions?.find(r => r.slug === regionSlug && r.active)
                || game.regions?.find(r => r.active)

    if (!region?.hasServerList) return res.json({ servers: [] })

    const region2 = game.regions?.find(r => r.slug === regionSlug && r.active) || game.regions?.find(r => r.active)
    if (region2?.staticServers?.length > 0) return res.json({ servers: region2.staticServers })
    const servers = await getServers(region2?.provider || "g2bulk", region2?.providerGameId || "", "")
    res.json({ servers })
  } catch (err) {
    res.status(500).json({ servers: [], message: err.message })
  }
})

module.exports = router