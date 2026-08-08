// scripts/migrateUsers.js
// Run: node scripts/migrateUsers.js /path/to/nitrogendb.sql
// Reads users from old MySQL dump, hashes passwords, inserts into MongoDB.

const fs        = require('fs')
const mongoose  = require('mongoose')
const bcrypt    = require('bcryptjs')
require('dotenv').config()

const User = require('../models/User')

const SQL_FILE = process.argv[2]
if (!SQL_FILE) { console.error('Usage: node scripts/migrateUsers.js <path-to-nitrogendb.sql>'); process.exit(1) }

function parseUsers(sql) {
  const match = sql.match(/INSERT INTO `users`[^;]+;/s)
  if (!match) throw new Error('No users INSERT found in SQL file')

  const users = []
  const rowRegex = /\((\d+),\s*'((?:[^'\\]|\\.)*)'\s*,\s*'((?:[^'\\]|\\.)*)'\s*,\s*'((?:[^'\\]|\\.)*)'\s*,\s*'((?:[^'\\]|\\.)*)'\s*,[^,]+,\s*(\d+),\s*(\d+),\s*'([^']+)'/g
  let m
  while ((m = rowRegex.exec(match[0])) !== null) {
    const [, , name, email, phone, password, is_active] = m
    if (!email || !password) continue
    users.push({
      name:     name.replace(/\\'/g, "'"),
      email:    email.toLowerCase().trim(),
      phone:    phone.replace(/\D/g, '').slice(-10) || undefined,
      password: password.replace(/\\'/g, "'"),
      status:   is_active === '1' ? 'active' : 'banned',
      isEmailVerified: false,
      isPhoneVerified: false,
      createdAt: new Date(created_at),
    })
  }
  return users
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI)
  console.log('Connected to MongoDB')

  const sql   = fs.readFileSync(SQL_FILE, 'utf8')
  const users = parseUsers(sql)
  console.log(`Found ${users.length} users in SQL dump`)

  let inserted = 0, skipped = 0

  for (const u of users) {
    const exists = await User.findOne({ email: u.email })
    if (exists) { console.log(`  SKIP (already exists): ${u.email}`); skipped++; continue }

    const hash = await bcrypt.hash(u.password, 10)
    try {
      await User.create({
        name:            u.name,
        email:           u.email,
        phone:           u.phone,
        password:        hash,
        role:            'user',
        status:          u.status,
        isEmailVerified: false,
        isPhoneVerified: false,
        tokenVersion:    0,
      })
      console.log(`  OK: ${u.email}`)
      inserted++
    } catch (err) {
      console.log(`  ERR (${u.email}): ${err.message}`)
      skipped++
    }
  }

  console.log(`\nDone. Inserted: ${inserted}, Skipped: ${skipped}`)
  await mongoose.disconnect()
}

run().catch(err => { console.error(err); process.exit(1) })
