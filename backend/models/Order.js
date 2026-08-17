// models/Order.js
const mongoose = require("mongoose")

const providerTxSchema = new mongoose.Schema({
  skuCode:         { type: String },
  providerOrderId: { type: String },
  status:          { type: String },
  response:        { type: Object },
})

const orderSchema = new mongoose.Schema(
  {
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    orderType: { type: String, enum: ["game","wallet_topup"], default: "game" },
    gameId:    { type: mongoose.Schema.Types.ObjectId, ref: "Game" },
    packId:    { type: mongoose.Schema.Types.ObjectId, ref: "Pack" },

    // Denormalized for readable history
    gameName: { type: String },
    packName: { type: String },
    price:    { type: Number, required: true },

    playerData: { type: mongoose.Schema.Types.Mixed, default: {} },

    status: {
      type: String,
      enum: ["Pending","Processing","Completed","Failed","Refunded"],
      default: "Pending",
    },

    paymentMethod: { type: String, default: "" },
    paymentStatus:     { type: String, enum: ["unpaid","paid","refunded"], default: "unpaid" },
    rechargeTriggered: { type: Boolean, default: false }, // idempotency guard
    paymentId:     { type: String, default: "" },

    couponCode:     { type: String, default: "" },
    couponDiscount: { type: Number, default: 0 },

    // Snapshot of pack at order time — so recharge works even if pack is edited/deleted later
    packSnapshot: {
      title:          { type: String, default: "" },
      price:          { type: Number, default: 0 },
      provider:       { type: String, default: "" },
      providerGameId: { type: String, default: "" },
      skuCodes:       [{ skuCode: String, quantity: { type: Number, default: 1 } }],
    },

    providerOrderId:      { type: String, default: "", index: true },
    providerTransactions: [providerTxSchema],
    playerName: { type: String, default: "" },
    adminNote: { type: String, default: "" },

    // Wallet-related
    walletAmountUsed:   { type: Number, default: 0 },  // paise debited at order time
    walletAmountTopup:  { type: Number, default: 0 },  // paise to credit for wallet_topup
    walletCredited:     { type: Boolean, default: false }, // idempotency: topup credited
    walletRefunded:     { type: Boolean, default: false }, // idempotency: refunded to wallet
  },
  { timestamps: true }
)

module.exports = mongoose.model("Order", orderSchema)