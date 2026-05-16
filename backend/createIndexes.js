require('dotenv').config()
const mongoose = require('mongoose')

async function safeIndex(col, keys, opts) {
  try { await col.createIndex(keys, opts) }
  catch(e) {
    if (e.message.includes('already exists') || e.message.includes('same name')) {
      console.log(`  Index already exists, skipping`)
    } else throw e
  }
}

async function createIndexes() {
  await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI)
  console.log('Connected. Creating indexes...')
  const db = mongoose.connection.db

  // Orders
  const orders = db.collection('orders')
  try { await orders.dropIndex('paymentId_1') } catch(e) {}
  await safeIndex(orders, { userId: 1, createdAt: -1 })
  await safeIndex(orders, { paymentId: 1 }, { unique: true, partialFilterExpression: { paymentId: { $exists: true, $gt: "" } } })
  await safeIndex(orders, { status: 1 })
  await safeIndex(orders, { createdAt: -1 })
  await db.collection('orders').createIndex({ paymentStatus: 1 })
  await db.collection('orders').createIndex({ 'providerTransactions.providerOrderId': 1 }, { sparse: true })
  console.log('✅ Orders')

  // Users
  const users = db.collection('users')
  try { await users.dropIndex('email_1') } catch(e) {}
  await safeIndex(users, { email: 1 }, { unique: true })
  await safeIndex(users, { role: 1 })
  console.log('✅ Users')

  // Games
  const games = db.collection('games')
  try { await games.dropIndex('slug_1') } catch(e) {}
  await safeIndex(games, { slug: 1 }, { unique: true })
  await safeIndex(games, { active: 1 })
  console.log('✅ Games')

  // Packs
  const packs = db.collection('packs')
  await safeIndex(packs, { gameId: 1, regionSlug: 1, active: 1 })
  await safeIndex(packs, { gameId: 1, sortOrder: 1 })
  console.log('✅ Packs')

  try {
    await db.collection('otps').createIndex({ createdAt: 1 }, { expireAfterSeconds: 600 })
    console.log('✅ OTPs')
  } catch(e) {}

  console.log('\n✅ All indexes done!')
  process.exit(0)
}

createIndexes().catch(err => { console.error(err.message); process.exit(1) })