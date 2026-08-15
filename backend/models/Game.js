// models/Game.js
const mongoose = require("mongoose")

const regionSchema = new mongoose.Schema({
  name:           { type: String, required: true },  // e.g. "Bangladesh", "Global"
  slug:           { type: String, required: true },  // e.g. "bd", "global"
  banner:         { type: String, default: "" },
  active:         { type: Boolean, default: true },
  provider:       { type: String, enum: ["moogold","smile","g2bulk","manual",""], default: "" },
  providerGameId: { type: String, default: "" },  // game name for smile e.g. "mobilelegends"
  providerUrl:    { type: String, default: "" },  // smile region URL e.g. "https://www.smile.one/ph"
  smileProductId: { type: String, default: "" },
  hasServerList:  { type: Boolean, default: false }, // show server dropdown
  serverSource:   { type: String, enum: ['smile','static',''], default: '' },
    smileRegionUrl: { type: String, default: '' }, // where to get servers
  staticServers:  [{ serverId: String, serverName: String }], // manual server list
  fields:         [{ name: String, label: String }],
  displayTitle:   { type: String, default: "" },
})

const gameSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    slug:     { type: String, required: true, unique: true },
    icon:     { type: String, default: "" },
    banner:   { type: String, default: "" },
    active:   { type: Boolean, default: true },
    category:   { type: String, enum: ["game","voucher","other","premium","ott","smm","gifting"], default: "game" },
    sortOrder:  { type: Number, default: 0 },
    skipVerify: { type: Boolean, default: false },
    fields:   [{ name: String, label: String }],
    provider:       { type: String, enum: ["moogold","smile","g2bulk","manual",""], default: "" },
    providerGameId: { type: String, default: "" },
    smileProductId: { type: String, default: "" },
    // Multiple regions — if empty, game has single region (uses game-level fields/provider)
    regions: [regionSchema],
  },
  { timestamps: true }
)

module.exports = mongoose.model("Game", gameSchema)