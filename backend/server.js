// server.js — Sky Pay Credits API
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

app.use((req, res, next) => {
  res.setHeader('ngrok-skip-browser-warning', 'true')
  next()
})

app.use(helmet({
  crossOriginOpenerPolicy: false,
  contentSecurityPolicy: process.env.NODE_ENV === "production" ? undefined : false,
}))

// ── CORS ──────────────────────────────────────────
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

// ── Webhook (raw body — MUST be before express.json) ──
app.post(
  "/api/payment/webhook",
  express.raw({ type: "application/json" }),
  require("./routes/paymentRoutes").webhookHandler
)

// ── Body parser ───────────────────────────────────
app.use(express.json({ limit: "100kb" }))
app.use(express.urlencoded({ extended: true, limit: "100kb" }))

// ── NoSQL injection protection ────────────────────
function sanitize(obj) {
  if (!obj || typeof obj !== "object") return obj
  for (const key of Object.keys(obj)) {
    if (key.startsWith("$") || key.includes(".")) {
      delete obj[key]
    } else {
      sanitize(obj[key])
    }
  }
  return obj
}
app.use((req, res, next) => {
  if (req.body)  sanitize(req.body)
  if (req.query) sanitize(req.query)
  next()
})

// ── Static uploads ────────────────────────────────
app.use("/uploads", (req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff")
  res.setHeader("Content-Security-Policy", "default-src 'none'; img-src 'self'; script-src 'none'")
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin")
  if (!/\.(jpg|jpeg|png|gif|webp|ico)$/i.test(req.path)) {
    res.setHeader("Content-Disposition", "attachment")
  }
  next()
}, express.static(path.join(__dirname, "uploads")))

// ── Rate limiters ─────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 60_000, max: 200,
  message: { message: "Too many requests, please slow down" },
  standardHeaders: true, legacyHeaders: false,
})
const authLimiter = rateLimit({
  windowMs: 15*60_000, max: 20,
  message: { message: "Too many auth attempts, try again later" },
  standardHeaders: true, legacyHeaders: false,
})
const payLimiter = rateLimit({
  windowMs: 60_000, max: 20,
  message: { message: "Too many payment requests" },
  standardHeaders: true, legacyHeaders: false,
})
const rechargeLimiter = rateLimit({
  windowMs: 60_000, max: 10,
  message: { message: "Too many recharge requests" },
  standardHeaders: true, legacyHeaders: false,
})
const orderLimiter = rateLimit({
  windowMs: 60_000, max: 15,
  message: { message: "Too many orders" },
  standardHeaders: true, legacyHeaders: false,
})
const adminLimiter = rateLimit({
  windowMs: 60_000, max: 60,
  message: { message: "Too many admin requests" },
  standardHeaders: true, legacyHeaders: false,
})

app.use("/api", globalLimiter)

// ── Routes ────────────────────────────────────────
app.use("/api/auth",      authLimiter,     require("./routes/authRoutes"))
app.use("/api/games",                      require("./routes/gameRoutes"))
app.use("/api/packs",                      require("./routes/packRoutes"))
app.use("/api/orders",    orderLimiter,    require("./routes/orderRoutes"))
app.use("/api/users",     adminLimiter,    require("./routes/userRoutes"))
app.use("/api/payment",   payLimiter,      require("./routes/paymentRoutes"))
app.use("/api/smile",     adminLimiter,    require("./routes/smileRoutes"))
app.use("/api/recharge",  rechargeLimiter, require("./routes/rechargeRoutes"))
app.use("/api/settings",                   require("./routes/settingsRoutes"))
app.use("/api/banners",                    require("./routes/bannerRoutes"))

// ── Health check ──────────────────────────────────
app.get("/", (req, res) => res.json({ status: "✓ API running" }))

// ── Global error handler ──────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack)
  const isProd = process.env.NODE_ENV === "production"
  res.status(err.status || 500).json({
    message: isProd ? "Internal server error" : (err.message || "Internal server error")
  })
})

// ── Startup validation ────────────────────────────
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)
  { console.error("FATAL: JWT_SECRET must be at least 32 characters"); process.exit(1) }
if (!process.env.NOVAPAY_API_KEY)
  console.warn("WARNING: NOVAPAY_API_KEY not set — payments will fail")
if (!process.env.FINTOPUP_API_KEY)
  console.warn("WARNING: FINTOPUP_API_KEY not set — game top-ups will fail")

// ── Connect & start ───────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✓ MongoDB connected")
    app.listen(process.env.PORT || 5002, () =>
      console.log(`✓ API running on port ${process.env.PORT || 5002}`)
    )
  })
  .catch(err => {
    console.error("✗ MongoDB error:", err.message)
    process.exit(1)
  })

