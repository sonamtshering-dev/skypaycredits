// routes/paymentRoutes.js
const express = require("express")
const router  = express.Router()
const { protect } = require("../middlewares/authMiddleware")
const { createPayment, getPaymentStatus, getPaymentStatusByOrder, handleWebhook } = require("../controllers/paymentController")

router.post("/create",              protect, createPayment)
router.get("/status/:paymentId",    protect, getPaymentStatus)
router.get("/status-by-order/:orderId", protect, getPaymentStatusByOrder)

// Webhook — no auth, ZiniPay calls this directly
// Supports both JSON body and query params
router.post("/webhook", handleWebhook)
// GET webhook removed — webhooks must use POST only (V-06 fix)

module.exports = router
module.exports.webhookHandler = handleWebhook