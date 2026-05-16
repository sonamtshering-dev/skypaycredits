// services/rechargeService.js
const g2bulk = require("./g2bulkService")
const smile  = require("./smileService")

const isProd = process.env.NODE_ENV === "production"
const log    = (...a) => { if (!isProd) console.log(...a) }
const warn   = (...a) => console.warn(...a)

// Clean invisible unicode characters from player IDs
function cleanId(str) {
  if (!str) return ""
  return str.replace(/[^\x20-\x7E]/g, "").trim()
}

// Games that don't support player verification
const NO_VERIFY_GAMES = ["magic_chess_gogo", "magic_chest_gogo"]

// ── Verify Player ─────────────────────────────────
async function verifyPlayer(game, playerData, packs) {
  const regionSlug = playerData.regionSlug || ""
  const region     = game.regions?.find(r => r.slug === regionSlug && r.active)
                  || game.regions?.find(r => r.active)
  const provider   = region?.provider || playerData.regionProvider || (packs[0] && packs[0].provider) || "g2bulk"
  const gameId     = region?.providerGameId || playerData.regionGameId || (packs[0] && packs[0].providerGameId) || ""
  const userId     = cleanId(playerData.userId)
  const zoneId     = cleanId(playerData.zoneId || playerData.serverId || "")

  log("[RECHARGE] Verifying player", { provider, userId, zoneId, gameId })

  // Skip verify for games that don't support it
  if (NO_VERIFY_GAMES.includes(gameId)) {
    log("[RECHARGE] Skipping verify — game does not support it")
    return { username: userId, skipped: true }
  }

  if (provider === "smile") {
    try {
      const skuCode = packs[0]?.skuCodes?.[0]?.skuCode || "212"
      const regionData = game.regions?.find(r => r.slug === (playerData.regionSlug || "") && r.active) || game.regions?.find(r => r.active)
      const baseUrl = regionData?.smileRegionUrl || process.env.SMILE_BASE_URL || "https://www.smile.one/ph"
      return await smile.verifyPlayer({ productId: gameId, userId, zoneId, skuCode, baseUrl })
    } catch (e) {
      warn("[RECHARGE] Smile verify failed", { error: e.message })
      throw new Error("Player not found. Please check your Player ID and Zone ID.")
    }
  }

  if (provider === "g2bulk") {
    try {
      const serverId = zoneId || ""
      return await g2bulk.checkPlayerId(gameId, userId, serverId)
    } catch (e) {
      warn("[RECHARGE] G2Bulk verify failed", { error: e.message })
      throw new Error("Player not found. Please check your Player ID and try again.")
    }
  }

  // Manual provider — skip verify
  return { username: userId, skipped: true }
}

// ── Process Recharge ──────────────────────────────
async function processRecharge(order, pack, game) {
  pack = pack || order.packSnapshot || {}
  const region = game?.regions?.find(r => r.slug === order.playerData?.regionSlug && r.active)
              || game?.regions?.find(r => r.active)
  const provider       = region?.provider || order.providerTransactions?.[0]?.provider || "g2bulk"
  const providerGameId = pack.providerGameId || region?.providerGameId || order.providerTransactions?.[0]?.providerGameId || ""
  const userId   = cleanId(order.playerData?.userId || "")
  const serverId = cleanId(order.playerData?.zoneId || order.playerData?.serverId || "")
  const callbackUrl = `${process.env.BACKEND_URL}/api/recharge/g2bulk-callback`
  const baseUrl = region?.smileRegionUrl || process.env.SMILE_BASE_URL || "https://www.smile.one/ph"

  // Build full list of SKUs to process (supports multiple SKUs per pack)
  const allSkus = []
  if (pack.skuCodes?.length > 0) {
    for (const s of pack.skuCodes) {
      for (let q = 0; q < (s.quantity || 1); q++) {
        allSkus.push(s.skuCode)
      }
    }
  } else {
    allSkus.push(pack.skuCode || "")
  }

  if (!userId) throw new Error("Player ID missing")
  if (allSkus.length === 0 || !allSkus[0]) throw new Error("SKU code missing from pack")

  log("[RECHARGE] Processing", { provider, providerGameId, skus: allSkus, userId })

  // ── Manual ───────────────────────────────────────
  if (provider === "manual") {
    return {
      providerOrderId: `MANUAL-${Date.now()}`,
      status:          "PENDING",
      message:         "Manual order — admin will process"
    }
  }

  const transactions = []

  for (let i = 0; i < allSkus.length; i++) {
    const skuCode = allSkus[i]
    try {
      let result

      // ── G2Bulk ─────────────────────────────────
      if (provider === "g2bulk") {
        if (!providerGameId) throw new Error("Provider game ID missing")
        const crypto = require('crypto')
        const idempotencyKey = crypto.createHash('md5').update(order._id.toString() + "_" + i + "_" + skuCode).digest('hex').replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5')
        result = await g2bulk.placeOrder({
          gameCode:      providerGameId,
          catalogueName: skuCode,
          playerId:      userId,
          serverId:      serverId,
          callbackUrl,
          idempotencyKey
        })
        if (!result.success) throw new Error(result.message || "G2Bulk order failed")
        transactions.push({
          skuCode,
          providerOrderId: String(result.order?.order_id || ""),
          status: "success"
        })
      }

      // ── Smile ──────────────────────────────────
      else if (provider === "smile") {
        result = await smile.placeOrder({
          productId:   providerGameId,
          userId,
          zoneId:      serverId,
          skuCode,
          referenceId: `${order._id}-${i}-${skuCode}`,
          baseUrl
        })
        transactions.push({
          skuCode,
          providerOrderId: String(result.order_id || result.orderId || ""),
          status: "success"
        })
      }

      else {
        throw new Error(`Unknown provider: ${provider}`)
      }

      log("[RECHARGE] SKU success", { skuCode, index: i })

    } catch(e) {
      log("[RECHARGE] SKU failed", { skuCode, index: i, error: e.message })
      transactions.push({ skuCode, providerOrderId: "", status: "failed", error: e.message })
    }
  }

  const successful = transactions.filter(t => t.status === "success")
  const failed = transactions.filter(t => t.status === "failed")

  if (successful.length === 0) throw new Error(failed[0]?.error || "All SKUs failed")

  log("[RECHARGE] Done", { total: allSkus.length, success: successful.length, failed: failed.length })

  return {
    providerOrderId: successful[0]?.providerOrderId || "",
    status:          "PENDING",
    message:         `Delivered ${successful.length}/${allSkus.length} items`,
    transactions
  }
}
// ── Get Servers for a region ──────────────────────
async function getServers(provider, gameId, smileUrl) {
  if (provider === "smile") return []
  if (provider === "g2bulk") {
    return await g2bulk.getServers(gameId)
  }
  if (provider === "smile") {
    return await smile.getServers(gameId, smileUrl)
  }
  return []
}

module.exports = { verifyPlayer, processRecharge, getServers }
