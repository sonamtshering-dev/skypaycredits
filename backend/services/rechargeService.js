// services/rechargeService.js
const fintopup   = require("./fintopupService")
const smile      = require("./smileService")
const fazercards = require("./fazercardsService")
const g2bulk     = require("./g2bulkService")

const isProd = process.env.NODE_ENV === "production"
const log    = (...a) => { if (!isProd) console.log(...a) }
const warn   = (...a) => console.warn(...a)

function cleanId(str) {
  if (!str) return ""
  return str.replace(/[^\x20-\x7E]/g, "").trim()
}

// Smile verify config per FinTopup MLBB game code
const SMILE_VERIFY_CONFIG = {
  "484": { productId: "mobilelegends", baseUrl: "https://www.smile.one" },
  "412": { productId: "mobilelegends", baseUrl: "https://www.smile.one" },
  "413": { productId: "mobilelegends", baseUrl: "https://www.smile.one" },
  "414": { productId: "mobilelegends", baseUrl: "https://www.smile.one" },
  "432": { productId: "mobilelegends", baseUrl: "https://www.smile.one" },
  "485": { productId: "mobilelegends", baseUrl: "https://www.smile.one" },
  "467": { productId: "mobilelegends", baseUrl: "https://www.smile.one" },
  "468": { productId: "mobilelegends", baseUrl: "https://www.smile.one" },
  "443": { productId: "mobilelegends", baseUrl: "https://www.smile.one" },
}

// ── Verify Player ─────────────────────────────────
async function verifyPlayer(game, playerData, packs) {
  const regionSlug     = playerData.regionSlug || ""
  const region         = game.regions?.find(r => r.slug === regionSlug && r.active)
                      || game.regions?.find(r => r.active)
  const provider       = region?.provider || (packs[0] && packs[0].provider) || game?.provider || "fintopup"
  const providerGameId = region?.providerGameId || (packs[0] && packs[0].providerGameId) || game?.providerGameId || ""
  const userId         = cleanId(playerData.userId)
  const zoneId         = cleanId(playerData.zoneId || playerData.serverId || "")

  log("[RECHARGE] Verifying player", { provider, providerGameId, userId, zoneId })

  if (game.skipVerify) {
    return { username: userId, skipped: true }
  }

  if (provider === "fintopup") {
    const smileConfig = SMILE_VERIFY_CONFIG[providerGameId]
    if (smileConfig) {
      try {
        const skuCode = packs[0]?.skuCodes?.[0]?.skuCode || "212"
        log("[RECHARGE] Using Smile verify for MLBB (code:", providerGameId + ")")
        return await smile.verifyPlayer({
          productId: smileConfig.productId,
          userId,
          zoneId,
          skuCode,
          baseUrl: smileConfig.baseUrl
        })
      } catch (e) {
        warn("[RECHARGE] Smile verify failed:", e.message)
        throw new Error("Player not found. Please check your User ID and Zone ID.")
      }
    }
    // Non-MLBB FinTopup — skip verify
    return { username: `Player ${userId}`, skipped: true }
  }

  if (provider === "smile") {
    try {
      const skuCode = packs[0]?.skuCodes?.[0]?.skuCode || "212"
      const baseUrl = region?.smileRegionUrl || process.env.SMILE_BASE_URL || "https://www.smile.one/ph"
      return await smile.verifyPlayer({ productId: providerGameId, userId, zoneId, skuCode, baseUrl })
    } catch (e) {
      warn("[RECHARGE] Smile verify failed", { error: e.message })
      throw new Error("Player not found. Please check your Player ID and Zone ID.")
    }
  }

  if (provider === "fazercards") {
    try {
      const res = await g2bulk.checkPlayerId({
        fazercardsGameId: providerGameId,
        userId,
        serverId: zoneId || undefined,
      })
      if (res.valid === 'valid') return { username: res.name }
      if (res.valid === 'invalid') throw new Error('Player not found. Please check your Player ID.')
      // 'skip' — game doesn't support validation
    } catch (e) {
      if (e.message.includes('Player not found')) throw e
    }
    return { username: userId, skipped: true }
  }

  return { username: userId, skipped: true }
}

// ── Process Recharge ──────────────────────────────
async function processRecharge(order, pack, game) {
  pack = pack || order.packSnapshot || {}
  const region         = game?.regions?.find(r => r.slug === order.playerData?.regionSlug && r.active)
                      || game?.regions?.find(r => r.active)
  const provider       = region?.provider || pack?.provider || game?.provider || "fintopup"
  const providerGameId = pack.providerGameId || region?.providerGameId || game?.providerGameId || ""
  const userId         = cleanId(order.playerData?.userId || "")
  const zoneId         = cleanId(order.playerData?.zoneId || order.playerData?.serverId || "")
  const baseUrl        = region?.smileRegionUrl || process.env.SMILE_BASE_URL || "https://www.smile.one/ph"

  const allSkus = []
  if (pack.skuCodes?.length > 0) {
    for (const s of pack.skuCodes) {
      for (let q = 0; q < (s.quantity || 1); q++) allSkus.push(s.skuCode)
    }
  } else {
    allSkus.push(pack.skuCode || "")
  }

  if (!userId)                              throw new Error("Player ID missing")
  if (allSkus.length === 0 || !allSkus[0]) throw new Error("SKU code missing from pack")

  log("[RECHARGE] Processing", { provider, providerGameId, skus: allSkus, userId })

  if (provider === "manual") {
    return { providerOrderId: `MANUAL-${Date.now()}`, status: "PENDING", message: "Manual order" }
  }

  const transactions = []

  for (let i = 0; i < allSkus.length; i++) {
    const skuCode = allSkus[i]
    try {
      let result

      if (provider === "fintopup") {
        if (!providerGameId) throw new Error("Provider game ID missing")
        result = await fintopup.placeOrder({
          gameCode:      providerGameId,
          sku:           skuCode,
          userId,
          zoneId:        zoneId || undefined,
          txnMerchantId: `${order._id}-${i}-${skuCode}`,
        })
        console.log("[FINTOPUP] Order response:", JSON.stringify(result))
        const extractedName = result.charName || result.character_name || result.player_name
          || result.username || result.name || result.playerName || ""
        transactions.push({
          skuCode,
          providerOrderId: String(result.uuid || result.order_id || result.id || ""),
          playerName: extractedName,
          status: "success"
        })
      }

      else if (provider === "smile") {
        result = await smile.placeOrder({
          productId:   providerGameId,
          userId,
          zoneId,
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

      else if (provider === "fazercards") {
        // Build fields object using game/region field key names so they match FazerCards' category schema
        const gameFields = (region?.fields?.length ? region.fields : game?.fields) || []
        const key0 = gameFields[0]?.name || 'userId'
        const key1 = gameFields[1]?.name || 'zoneId'
        const fieldsObj = { [key0]: userId }
        if (zoneId) fieldsObj[key1] = zoneId
        result = await fazercards.placeOrder({
          categoryId:    providerGameId,
          offerId:       skuCode,
          fields:        fieldsObj,
          idempotencyKey: `${order._id}-${i}`,
        })
        transactions.push({
          skuCode,
          providerOrderId: String(result.order?.id || result.order?.orderId || ""),
          status: "success"
        })
      }

      else if (provider === "moogold") {
        throw new Error("Moogold provider is not active. Reconfigure this game to use fintopup, smile, fazercards, or manual.")
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
  const failed     = transactions.filter(t => t.status === "failed")

  if (successful.length === 0) throw new Error(failed[0]?.error || "All SKUs failed")

  return {
    providerOrderId: successful[0]?.providerOrderId || "",
    playerName:      successful[0]?.playerName || "",
    status:          "PENDING",
    message:         `Delivered ${successful.length}/${allSkus.length} items`,
    transactions
  }
}

// ── Get Servers ───────────────────────────────────
async function getServers(provider, gameId, smileUrl) {
  if (provider === "smile") return await smile.getServers(gameId, smileUrl)
  return []
}

module.exports = { verifyPlayer, processRecharge, getServers }