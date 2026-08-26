// server.js — Nitrogen Store API
const express      = require("express")
const mongoose     = require("mongoose")
const cors         = require("cors")
const dotenv       = require("dotenv")
const rateLimit    = require("express-rate-limit")
const helmet       = require("helmet")
const cookieParser = require("cookie-parser")
const path         = require("path")

dotenv.config()

const app = express()
app.set('trust proxy', 1)
app.use(cookieParser())

if (process.env.NODE_ENV !== "production") {
  app.use((req, res, next) => {
    res.setHeader('ngrok-skip-browser-warning', 'true')
    next()
  })
}

app.use(helmet({
  crossOriginOpenerPolicy: false,
  contentSecurityPolicy: process.env.NODE_ENV === "production" ? undefined : false,
}))

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:4173",
].filter(Boolean)

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true)
    cb(new Error("CORS: origin not allowed"))
  },
  credentials: true,
  methods: ["GET","POST","PUT","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"],
}))

// Webhook — raw body MUST be before express.json; own rate limiter (VULN-09)
app.post(
  "/api/payment/webhook",
  rateLimit({ windowMs: 60_000, max: 60, standardHeaders: true, legacyHeaders: false }),
  express.raw({ type: "application/json" }),
  require("./routes/paymentRoutes").webhookHandler
)

app.use(express.json({ limit: "100kb" }))
app.use(express.urlencoded({ extended: true, limit: "100kb" }))

function sanitize(obj) {
  if (!obj || typeof obj !== "object") return obj
  if (Array.isArray(obj)) {
    obj.forEach((item, i) => { obj[i] = sanitize(item) })
    return obj
  }
  for (const key of Object.keys(obj)) {
    if (key.startsWith("$") || key.includes(".")) delete obj[key]
    else obj[key] = sanitize(obj[key])
  }
  return obj
}
app.use((req, res, next) => {
  if (req.body)  sanitize(req.body)
  if (req.query) sanitize(req.query)
  next()
})

app.use("/uploads", (req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff")
  res.setHeader("Content-Security-Policy", "default-src 'none'; img-src 'self'; script-src 'none'")
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin")
  if (!/\.(jpg|jpeg|png|gif|webp|ico)$/i.test(req.path)) res.setHeader("Content-Disposition", "attachment")
  next()
}, express.static(path.join(__dirname, "uploads")))

const globalLimiter  = rateLimit({ windowMs: 60_000,      max: 200, standardHeaders: true, legacyHeaders: false, message: { message: "Too many requests" } })
const authLimiter    = rateLimit({ windowMs: 15*60_000,   max: 20,  standardHeaders: true, legacyHeaders: false, message: { message: "Too many auth attempts" } })
const payLimiter     = rateLimit({ windowMs: 60_000,      max: 20,  standardHeaders: true, legacyHeaders: false, message: { message: "Too many payment requests" } })
const rechargeLimiter= rateLimit({ windowMs: 60_000,      max: 10,  standardHeaders: true, legacyHeaders: false, message: { message: "Too many recharge requests" } })
const orderLimiter   = rateLimit({ windowMs: 60_000,      max: 15,  standardHeaders: true, legacyHeaders: false, message: { message: "Too many orders" } })
const adminLimiter   = rateLimit({ windowMs: 60_000,      max: 60,  standardHeaders: true, legacyHeaders: false, message: { message: "Too many admin requests" } })

app.use("/api", globalLimiter)

app.use("/api/auth",      authLimiter,     require("./routes/authRoutes"))
app.use("/api/home",                       require("./routes/homeRoutes"))
app.use("/api/games",                      require("./routes/gameRoutes"))
app.use("/api/packs",                      require("./routes/packRoutes"))
app.use("/api/orders",    orderLimiter,    require("./routes/orderRoutes"))
app.use("/api/users",     adminLimiter,    require("./routes/userRoutes"))
app.use("/api/payment",   payLimiter,      require("./routes/paymentRoutes"))
app.use("/api/smile",     adminLimiter,    require("./routes/smileRoutes"))
app.use("/api/fazercards", adminLimiter,   require("./routes/fazercardsRoutes"))
app.use("/api/fintopup",                   require("./routes/fintopupRoutes"))
app.use("/api/recharge",  rechargeLimiter, require("./routes/rechargeRoutes"))
app.use("/api/settings",                   require("./routes/settingsRoutes"))
app.use("/api/banners",                    require("./routes/bannerRoutes"))
app.use("/api/coupons",   adminLimiter,    require("./routes/couponRoutes"))
app.use("/api/wallet",    orderLimiter,    require("./routes/walletRoutes"))
app.use("/api/admin/wallet", adminLimiter, require("./routes/adminWalletRoutes"))
app.use("/api/tickets",    orderLimiter, require("./routes/ticketRoutes"))

app.get("/", (req, res) => res.json({ status: "✓ API running" }))

app.use((err, req, res, next) => {
  console.error(err.stack)
  const isProd = process.env.NODE_ENV === "production"
  res.status(err.status || 500).json({
    message: isProd ? "Internal server error" : (err.message || "Internal server error")
  })
})

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)
  { console.error("FATAL: JWT_SECRET must be at least 32 characters"); process.exit(1) }
if (!process.env.NOVAPAY_API_KEY)  console.warn("WARNING: NOVAPAY_API_KEY not set — payments will fail")
if (!process.env.FINTOPUP_API_KEY) console.warn("WARNING: FINTOPUP_API_KEY not set — game top-ups will fail")
if (!process.env.FINTOPUP_CALLBACK_SECRET && process.env.NODE_ENV === "production")
  console.warn("WARNING: FINTOPUP_CALLBACK_SECRET not set — fintopup callbacks are unauthenticated")

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✓ MongoDB connected")
    app.listen(process.env.PORT || 5002, () =>
      console.log(`✓ API running on port ${process.env.PORT || 5002}`)
    )
  })
  .catch(err => { console.error("✗ MongoDB error:", err.message); process.exit(1) })