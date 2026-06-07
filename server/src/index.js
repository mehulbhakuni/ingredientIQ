require("dotenv").config();

// ── Environment variable validation ──────────────────────
// Fail immediately at startup with a clear message rather than
// crashing later with a cryptic error mid-request.
const REQUIRED_ENV = ["GROQ_API_KEY", "MONGO_URI", "JWT_SECRET"];
const missingEnv = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missingEnv.length) {
  console.error(`[STARTUP ERROR] Missing required environment variables: ${missingEnv.join(", ")}`);
  console.error("Add them to your .env file and restart the server.");
  process.exit(1);
}

const express   = require("express");
const cors      = require("cors");
const helmet    = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoose  = require("mongoose");

const authRoute    = require("./routes/auth");
const analyzeRoute = require("./routes/analyze");
const scansRoute    = require("./routes/scans");
const productsRoute = require("./routes/products");

const app  = express();
const PORT = process.env.PORT || 5000;

// ── MongoDB ───────────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => { console.error("MongoDB error:", err.message); process.exit(1); });

// ── Helmet — security headers ─────────────────────────────
// Sets: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection,
// Strict-Transport-Security, Referrer-Policy, and more.
// Explicitly removes X-Powered-By so attackers can't fingerprint Express.
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // allow image/asset requests from frontend
  contentSecurityPolicy: false,  // CSP handled by frontend (Vite), not API server
}));
app.disable("x-powered-by"); // belt-and-suspenders — helmet does this too

app.use(express.json({ limit: "10mb" }));

// ── CORS whitelist ────────────────────────────────────────
// Origins are read from ALLOWED_ORIGINS env var (comma-separated).
// Falls back to localhost for local development.
// Unknown origins receive a clean 403 — not a 500 from the error handler.
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean)
  : ["http://localhost:5173", "http://localhost:3000"];

app.use(cors({
  origin: (origin, cb) => {
    // Allow server-to-server requests (no origin header) and whitelisted origins
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    // Return a proper 403-style error — not an unhandled exception
    cb(Object.assign(new Error("CORS: origin not allowed"), { status: 403 }));
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false,
}));

// ── Rate limiting ─────────────────────────────────────────

// General API limit: 30 requests per minute per IP.
// Covers auth, scans, and everything else.
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,   // send RateLimit-* headers so clients know their limit
  legacyHeaders: false,
  message: { error: "Too many requests. Please wait a moment and try again." },
  skip: (req) => req.path === "/health", // health check never rate-limited
});

// Strict AI limit: 10 requests per minute per IP.
// AI calls are expensive — this prevents abuse and protects your Groq quota.
const analyzeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many analysis requests. Please wait a minute and try again." },
});

app.use("/api/", generalLimiter);
app.use("/api/analyze", analyzeLimiter); // stacked — analyze hits BOTH limiters

// ── Routes ────────────────────────────────────────────────
app.use("/api/auth",    authRoute);
app.use("/api/analyze", analyzeRoute);
app.use("/api/scans",    scansRoute);
app.use("/api/products", productsRoute);

app.get("/health", (_, res) => res.json({ status: "ok" }));

// ── Global error handler ──────────────────────────────────
// Catches CORS errors (403), validation errors, and unexpected crashes.
// Never leaks stack traces to the client in production.
app.use((err, req, res, next) => {
  const status = err.status || 500;

  if (status === 403) {
    return res.status(403).json({ error: err.message || "Forbidden." });
  }

  // Log unexpected errors server-side only
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.path} →`, err.message);
  res.status(500).json({ error: "Internal server error." });
});

app.listen(PORT, () => {
  console.log(`IngredientIQ server running on port ${PORT}`);
  console.log(`Allowed origins: ${allowedOrigins.join(", ")}`);
});
