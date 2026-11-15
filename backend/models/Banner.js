const mongoose = require('mongoose')

const bannerSchema = new mongoose.Schema({
  title:       { type: String, default: '' },
  image:       { type: String, default: '' },
  imageMobile: { type: String, default: '' },
  link:        { type: String, default: '' },
  active:      { type: Boolean, default: true },
}, { timestamps: true })

module.exports = mongoose.models.Banner || mongoose.model('Banner', bannerSchema)
