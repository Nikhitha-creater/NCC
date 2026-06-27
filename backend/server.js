"use strict";

// ─────────────────────────────────────────────────────────────────────────────
// NCC Portal — Express Backend (Render Deployment + local dev)
// ─────────────────────────────────────────────────────────────────────────────

const express = require("express");
const cors    = require("cors");
const helmet  = require("helmet"); 

// ── Environment ───────────────────────────────────────────────────────────────
const NODE_ENV     = process.env.NODE_ENV || "development";
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.warn(
    "[NCC WARN] DATABASE_URL is not set." +
    " All /api/v1 database routes will return 503 until it is configured."
  );
}

// ── CORS CONFIGURATION (UPDATED WITH NETLIFY PRODUCTION WHITELIST) ────────────
// Hardcoding your production domain ensures it is always permitted, regardless of env vars.
const ALLOWED_ORIGINS = [
  "https://lucent-manatee-d0af5b.netlify.app"
];

// Parse any extra custom origins from the environment configuration panel if present
const parsedEnvOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

ALLOWED_ORIGINS.push(...parsedEnvOrigins);

// Include local development ports if not running in a production pipeline
if (NODE_ENV !== "production") {
  ALLOWED_ORIGINS.push("http://localhost:3000", "http://localhost:5173");
}

const corsOptions = {
  origin(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, or Postman)
    if (!origin) return callback(null, true);
    
    if (ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    
    // Fallback error generation block
    callback(new Error(`CORS: origin '${origin}' is not permitted`));
  },
  methods:          ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders:   ["Content-Type", "Authorization"],
  credentials:      true,
  optionsSuccessStatus: 200,
};

// ── Database pool (lazy) ──────────────────────────────────────────────────────
let _pool = null;

function getPool() {
  if (_pool) return _pool;

  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured.");
  }

  const { Pool } = require("pg");
  _pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    max:                     5,
    idleTimeoutMillis:  10_000,
    connectionTimeoutMillis: 5_000,
  });

  _pool.on("error", (err) => {
    console.error("[DB POOL]", err.message);
  });

  return _pool;
}

const db = {
  query: (text, params) => getPool().query(text, params),
};

// ── App ───────────────────────────────────────────────────────────────────────
const app = express();

app.use(helmet()); 
app.use(cors(corsOptions));
app.use(express.json({ limit: "512kb" }));
app.use(express.urlencoded({ extended: true }));

// ── Root health route ─────────────────────────────────────────────────────────
app.get("/", (_req, res) => {
  res.status(200).json({
    message:     "NCC Portal API Server is running live. 🎖️",
    version:     "1.0.0",
    environment: NODE_ENV,
    timestamp:   new Date().toISOString(),
    db_ready:    !!DATABASE_URL,
    endpoints: {
      health:   "GET  /api/v1/health",
      login:    "POST /api/v1/auth/login",
      logout:   "POST /api/v1/auth/logout",
      colleges: "GET  /api/v1/colleges",
      users:    "GET  /api/v1/users/:collegeId",
      cadets:   "GET  /api/v1/cadets/:collegeId",
      parades:  "GET  /api/v1/parades/:collegeId",
      attendance:"POST /api/v1/attendance",
    },
  });
});

// ── API router ────────────────────────────────────────────────────────────────
const router = express.Router();

// GET /api/v1/health
router.get("/health", async (_req, res) => {
  let dbStatus = "not_configured";

  if (DATABASE_URL) {
    try {
      await db.query("SELECT 1");
      dbStatus = "connected";
    } catch (err) {
      console.error("[HEALTH] DB ping failed:", err.message);
      dbStatus = `error — ${err.message}`;
    }
  }

  const ok = dbStatus === "connected";
  res.status(ok ? 200 : 503).json({
    status:    ok ? "ok" : "degraded",
    db:        dbStatus,
    timestamp: new Date().toISOString(),
  });
});

// ── Essential Auth Routes ────────────────────────────────────────────────────
router.post("/auth/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required fields." });
    }

    const mockRole = email.includes("ano") || email.includes("admin") ? "admin" : "cadet";
    
    res.status(200).json({
      token: "secure-jwt-session-token-fallback",
      user: {
        email: email,
        role: mockRole,
        name: mockRole === "admin" ? "Commanding Officer" : "NCC Cadet"
      }
    });
  } catch (err) {
    next(err);
  }
});

router.post("/auth/logout", (req, res) => {
  res.status(200).json({ message: "Logged out from system securely." });
});

// ── Database Dependent Routes ────────────────────────────────────────────────
router.get("/colleges", async (_req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT id, name, code, city, battalion, wing
       FROM   colleges
       ORDER  BY name`
    );
    res.json({ colleges: rows });
  } catch (err) {
    next(err);
  }
});

router.get("/users/:collegeId", async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT id, name, rank, role, email
       FROM   users
       WHERE  college_id = $1
       ORDER  BY name`,
      [req.params.collegeId]
    );
    res.json({ users: rows });
  } catch (err) {
    next(err);
  }
});

router.get("/cadets/:collegeId", async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT
         c.id,
         c.name,
         c.roll_no,
         c.rank,
         c.wing,
         c.year,
         COALESCE(
           ROUND(
             100.0
             * COUNT(a.id) FILTER (WHERE a.present = true)
             / NULLIF(COUNT(a.id), 0)
           ), 0
         )::int AS attendance_pct
       FROM   cadets c
       LEFT   JOIN attendance a ON a.cadet_id = c.id
       WHERE  c.college_id = $1
       GROUP  BY c.id
       ORDER  BY c.name`,
      [req.params.collegeId]
    );
    res.json({ cadets: rows });
  } catch (err) {
    next(err);
  }
});

router.get("/parades/:collegeId", async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT id, title, type, date, location, notes
       FROM   parades
       WHERE  college_id = $1
       ORDER  BY date DESC
       LIMIT  100`,
      [req.params.collegeId]
    );
    res.json({ parades: rows });
  } catch (err) {
    next(err);
  }
});

router.post("/attendance", async (req, res, next) => {
  const { parade_id, college_id, records } = req.body;

  if (!parade_id || !college_id || !Array.isArray(records) || records.length === 0) {
    return res.status(400).json({
      message: "parade_id, college_id, and a non-empty records[] array are all required.",
    });
  }

  const client = await getPool().connect();
  try {
    await client.query("BEGIN");

    for (const { cadet_id, present, remarks } of records) {
      await client.query(
        `INSERT INTO attendance (parade_id, cadet_id, present, remarks)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (parade_id, cadet_id)
         DO UPDATE SET present = EXCLUDED.present,
                       remarks = EXCLUDED.remarks,
                       marked_at = now()`,
        [parade_id, cadet_id, Boolean(present), remarks ?? null]
      );
    }

    await client.query("COMMIT");
    res.status(201).json({ message: "Attendance saved.", count: records.length });
  } catch (err) {
    await client.query("ROLLBACK");
    next(err);
  } finally {
    client.release();
  }
});

app.use("/api/v1", router);

// ── 404 catch-all ────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.path}`,
    hint:    "Visit GET / for the full endpoint list.",
  });
});

// ── Global error handler ─────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  const isCors = err.message?.startsWith("CORS:");
  const status = isCors ? 403 : 500;

  console.error(`[ERROR ${status}]`, err.message);
  if (!isCors) console.error(err.stack);

  res.status(status).json({
    message:
      NODE_ENV === "production"
        ? isCors
          ? err.message
          : "Internal server error"
        : err.message,
    ...(NODE_ENV !== "production" && { stack: err.stack }),
  });
});

// ── Local dev server port configuration ───────────────────────────────────────
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () =>
    console.log(`✅  NCC Portal API running locally → http://localhost:${PORT}`)
  );
}

module.exports = app;
