// ─────────────────────────────────────────────────
//  services/moogoldService.js
//  Moogold API — correct implementation
//  Auth: HMAC-SHA256 + Basic Auth (partner_id:secret)
//  Base: https://moogold.com/wp-json/v1/api
//
//  Player verification uses Smile.One getrole
//  since Moogold product/validate needs membership
// ─────────────────────────────────────────────────

const axios  = require("axios")
const crypto = require("crypto")

const BASE       = process.env.MOOGOLD_BASE_URL || "https://moogold.com/wp-json/v1/api"
const PARTNER_ID = process.env.MOOGOLD_PARTNER_ID
const SECRET     = process.env.MOOGOLD_SECRET

// Smile.One credentials for player verification
const SMILE_UID     = process.env.SMILE_UID
const SMILE_EMAIL   = process.env.SMILE_EMAIL
const SMILE_API_KEY = process.env.SMILE_API_KEY
const SMILE_BASE    = process.env.SMILE_BASE_URL || "https://www.smile.one/smilecoin/api"

const logger = {
  info:  (msg, data) => console.log(`[MOOGOLD] INFO: ${msg}`, data || ""),
  error: (msg, data) => console.error(`[MOOGOLD] ERROR: ${msg}`, data || ""),
  debug: (msg, data) => console.log(`[MOOGOLD] DEBUG: ${msg}`, data || "")
}

// ── Build Moogold auth headers ─────────────────────
function buildHeaders(path, payloadStr) {
  const timestamp    = String(Math.floor(Date.now() / 1000))
  const stringToSign = payloadStr + timestamp + path
  const auth         = crypto.createHmac("sha256", SECRET).update(stringToSign).digest("hex")
  const authBasic    = Buffer.from(`${PARTNER_ID}:${SECRET}`).toString("base64")
  return {
    "Content-Type":  "application/json",
    "timestamp":     timestamp,
    "auth":          auth,
    "Authorization": `Basic ${authBasic}`
  }
}

// ── Generic Moogold API request ────────────────────
async function moogoldRequest(path, extraFields = {}) {
  const payload = JSON.stringify({ path, ...extraFields })
  const headers = buildHeaders(path, payload)
  const url     = `${BASE}/${path}`
  logger.debug(`Request to ${url}`, extraFields)
  const res = await axios.post(url, payload, { headers, timeout: 30000 })
  logger.debug(`Response from ${url}`, res.data)
  return res.data
}

// ── Build Smile.One double MD5 signature ───────────
function buildSmileSign(params) {
  const sorted = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join("&")
  const signStr = sorted + "&" + SMILE_API_KEY
  const first   = crypto.createHash("md5").update(signStr).digest("hex")
  return crypto.createHash("md5").update(first).digest("hex")
}

// ─────────────────────────────────────────────────
// 1. VERIFY PLAYER
//    Uses Smile.One getrole to get username
//    Works for all MLBB regions
//    Falls back to Player ID display if Smile fails
// ─────────────────────────────────────────────────
async function verifyPlayer({ productId, userId, zoneId, serverId }) {
  try {
    logger.info("Verifying player via Smile.One", { productId, userId, zoneId })

    if (!userId || userId.trim() === "") throw new Error("Player ID is required")
    if (!/^\d+$/.test(userId.trim()))    throw new Error("Player ID must be numeric")

    const effectiveZone = (serverId || zoneId || "").trim()
    if (!effectiveZone)                  throw new Error("Server ID is required")
    if (!/^\d+$/.test(effectiveZone))    throw new Error("Server ID must be numeric")

    // Use Smile.One getrole for username lookup
    try {
      const timestamp = String(Math.floor(Date.now() / 1000))
      const params = {
        email:     SMILE_EMAIL,
        uid:       SMILE_UID,
        userid:    userId.trim(),
        zoneid:    effectiveZone,
        product:   "mobilelegends",
        productid: "22590",
        time:      timestamp
      }
      params.sign = buildSmileSign(params)

      const res = await axios.post(
        `${SMILE_BASE}/getrole`,
        new URLSearchParams(params),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" }, timeout: 15000 }
      )

      const status   = res.data?.status
      const username = res.data?.username || res.data?.nickname

      if ((status === 200 || status === "200") && username) {
        logger.info("Player verified via Smile.One", { username })
        return { ok: true, username, region: null, message: "" }
      }
    } catch(smileErr) {
      logger.debug("Smile.One getrole failed, using fallback", { error: smileErr.message })
    }

    // Fallback — input is valid, just can't get username
    return {
      ok:       true,
      username: `Player ${userId.trim()}`,
      region:   null,
      message:  "Please double-check your Player ID and Server ID before checkout."
    }

  } catch (err) {
    logger.error("verifyPlayer failed", { error: err.message })
    throw new Error(err.message || "Player verification failed")
  }
}

// ─────────────────────────────────────────────────
// 2. GET SERVER LIST
// ─────────────────────────────────────────────────
async function getServerList(productId) {
  try {
    const res = await moogoldRequest("product/server_list", {
      product_id: Number(productId)
    })
    if (!res || res === "Product has no server list") return {}
    return res
  } catch (err) {
    logger.error("getServerList failed", { error: err.message })
    return {}
  }
}

// ─────────────────────────────────────────────────
// 3. PLACE ORDER
//    - "product-id" = SKU/variation_id
//    - "Server ID" = zone ID (MLBB Global)
// ─────────────────────────────────────────────────
async function placeOrder({ productId, skuCode, quantity, userId, zoneId, serverId, referenceId }) {
  try {
    logger.info("Placing order", { productId, skuCode, userId, zoneId, referenceId })

    if (!userId || userId.trim() === "") throw new Error("Player ID is required")
    if (!skuCode) throw new Error("SKU code is required")

    const data = {
      category:     "1",
      "product-id": String(skuCode),
      quantity:     String(quantity || 1),
      "User ID":    userId.trim(),
    }

    if (serverId && serverId.trim() !== "") data["Server ID"] = serverId.trim()
    else if (zoneId && zoneId.trim() !== "") data["Server ID"] = zoneId.trim()

    const payload = {
      data,
      ...(referenceId ? { partnerOrderId: String(referenceId) } : {})
    }

    const res = await moogoldRequest("order/create_order", payload)

    logger.info("Order placed", res)

    if (res?.status === "true" || res?.status === true || res?.message?.includes("success")) {
      return {
        status:   "success",
        order_id: res.account_details?.order_id || res.order_id || "",
        username: res.account_details?.Username || res.username || "",
        data:     res
      }
    }

    throw new Error(res?.message || "Order failed")

  } catch (err) {
    logger.error("placeOrder failed", { error: err.message, response: err.response?.data })
    const msg = err.response?.data?.err_message || err.message || "Order failed"
    throw new Error(msg)
  }
}

// ─────────────────────────────────────────────────
// 4. CHECK ORDER STATUS
// ─────────────────────────────────────────────────
async function checkOrderStatus(providerOrderId) {
  try {
    const res = await moogoldRequest("order/order_detail", {
      order_id: String(providerOrderId)
    })
    logger.info("Order status", res)
    return res
  } catch (err) {
    logger.error("checkOrderStatus failed", { error: err.message })
    throw err
  }
}

// ─────────────────────────────────────────────────
// 5. GET PRODUCT DETAIL (SKUs + required fields)
// ─────────────────────────────────────────────────
async function getProductDetail(productId) {
  try {
    return await moogoldRequest("product/product_detail", {
      product_id: Number(productId)
    })
  } catch (err) {
    logger.error("getProductDetail failed", { error: err.message })
    throw err
  }
}

// ─────────────────────────────────────────────────
// 6. CHECK BALANCE
// ─────────────────────────────────────────────────
async function getBalance() {
  try {
    return await moogoldRequest("user/balance")
  } catch (err) {
    logger.error("getBalance failed", { error: err.message })
    throw err
  }
}

module.exports = {
  verifyPlayer,
  getServerList,
  placeOrder,
  checkOrderStatus,
  getProductDetail,
  getBalance
}