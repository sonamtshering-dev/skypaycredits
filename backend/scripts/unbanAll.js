// scripts/unbanAll.js — sets all banned users to active
// Run from backend/: node scripts/unbanAll.js
const mongoose = require('mongoose')
require('dotenv').config()
const User = require('../models/User')

async function run() {
  await mongoose.connect(process.env.MONGO_URI)
  const result = await User.updateMany({ status: 'banned' }, { $set: { status: 'active' } })
  console.log(`Unbanned ${result.modifiedCount} users`)
  await mongoose.disconnect()
}
run().catch(err => { console.error(err); process.exit(1) })
