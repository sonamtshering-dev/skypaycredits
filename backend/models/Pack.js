// models/Pack.js
const mongoose = require("mongoose")

const skuSchema = new mongoose.Schema({
  skuCode:  { type: String, required: true },
  quantity: { type: Number, default: 1 },
})

const packSchema = new mongoose.Schema(
  {
    gameId:      { type: mongoose.Schema.Types.ObjectId, ref: "Game", required: true },
    regionSlug:  { type: String, default: "" },
    sectionName: { type: String, default: "" }, // e.g. "Bonus Packs", "Double Diamond", "Weekly Passes"
    title:       { type: String, required: true },
    diamonds:    { type: Number, default: 0 },
    bonus:       { type: Number, default: 0 },
    price:       { type: Number, required: true },
    oldPrice:    { type: Number, default: 0 },
    image:       { type: String, default: "" },
    active:      { type: Boolean, default: true },
    provider:    { type: String, enum: ["moogold","smile","g2bulk","manual",""], default: "" },
    providerGameId: { type: String, default: "" },
    skuCodes:    [skuSchema],
    sortOrder:   { type: Number, default: 0 },
  },
  { timestamps: true }
)

module.exports = mongoose.model("Pack", packSchema)