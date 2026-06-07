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
    userId:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    gameId:   { type: mongoose.Schema.Types.ObjectId, ref: "Game", required: true },
    packId:   { type: mongoose.Schema.Types.ObjectId, ref: "Pack", required: true },

    // Denormalized for readable history
    gameName: { type: String },
    packName: { type: String },
    price:    { type: Number, required: true },

    playerData: {
      type: {
        userId:     { type: String, default: '' },
        zoneId:     { type: String, default: '' },
        serverId:   { type: String, default: '' },
        regionSlug: { type: String, default: '' },
      },
      default: {}
    },

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

    providerTransactions: [providerTxSchema],
    playerName: { type: String, default: "" },
    adminNote: { type: String, default: "" },
  },
  { timestamps: true }
)

module.exports = mongoose.model("Order", orderSchema)