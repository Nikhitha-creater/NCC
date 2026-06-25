/**
 * NCC Portal – Express Backend
 * Deploy target: Render.com Web Service
 */

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { Pool } = require("pg");

// ─────────────────────────────────────────────
// ENV VALIDATION
// ─────────────────────────────────────────────
const requiredEnv = ["DATABASE_URL"];
requiredEnv.forEach((key) => {
  if (!process.env[key]) {
    console.error(`❌ Missing required env var: ${key}`);
    process.exit(1);
  }
});

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";

// ─────────────────────────────────────────────
// CORS CONFIGURATION
// ─────────────────────────────────────────────
// List every Vercel domain that should be allowed.
// Add your custom domain here too once configured.
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

// In development, also allow localhost
if (NODE_ENV !== "production") {
  ALLOWED_ORIGINS.push("http://localhost:3000", "http://localhost:5173");
}

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, server-to-server)
    if (!origin) return callback(null, true);

    // Allow exact matches
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);

    // Allow any *.vercel.app subdomain for preview deployments
    if (/^https:\/\/[a-z0-9-]+-[a-z0-9]+-[a-z0-9]+\.vercel\.app$/.test(origin)) {
      return callback(null, true);
    }

    callback(new Error(`CORS: origin '${origin}' not permitted`));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 200, // IE11 compatibility
};

// ─────────────────────────────────────────────
// DATABASE POOL
// ─────────────────────────────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    NODE_ENV === "production"
      ? { rejectUnauthorized: false } // required by Neon/Supabase
      : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on("error", (err) => {
  console.error("Unexpected DB pool error:", err);
});

// Helper: run parameterized queries safely
const db = {
  query: (text, params) => pool.query(text, params),
};

// ─────────────────────────────────────────────
// APP SETUP
// ─────────────────────────────────────────────
const app = express();

app.use(helmet());            // Security headers
app.use(cors(corsOptions));   // CORS – must come BEFORE routes
app.use(express.json());

// Render health check (required for Render to mark service as healthy)
app.get("/health", (_req, res) => {
  res.json({ status: "ok", env: NODE_ENV, ts: new Date().toISOString() });
});

// ─────────────────────────────────────────────
// ROUTES  –  /api/v1
// ─────────────────────────────────────────────
const router = express.Router();

// GET /colleges
router.get("/colleges", async (_req, res, next) => {
  try {
    const { rows } = await db.query(
      "SELECT id, name, code, city, battalion, wing FROM colleges ORDER BY name"
    );
    res.json({ colleges: rows });
  } catch (err) {
    next(err);
  }
});

// GET /users/:collegeId
router.get("/users/:collegeId", async (req, res, next) => {
  try {
    const { collegeId } = req.params;
    const { rows } = await db.query(
      "SELECT id, name, rank, role FROM users WHERE college_id = $1 ORDER BY name",
      [collegeId]
    );
    res.json({ users: rows });
  } catch (err) {
    next(err);
  }
});

// GET /cadets/:collegeId
router.get("/cadets/:collegeId", async (req, res, next) => {
  try {
    const { collegeId } = req.params;
    const { rows } = await db.query(
      `SELECT
         c.id, c.name, c.roll_no, c.rank, c.wing, c.year,
         COALESCE(
           ROUND(
             100.0 * COUNT(a.id) FILTER (WHERE a.present = true) /
             NULLIF(COUNT(a.id), 0)
           ), 0
         )::int AS attendance_pct
       FROM cadets c
       LEFT JOIN attendance a ON a.cadet_id = c.id
       WHERE c.college_id = $1
       GROUP BY c.id
       ORDER BY c.name`,
      [collegeId]
    );
    res.json({ cadets: rows });
  } catch (err) {
    next(err);
  }
});

// GET /parades/:collegeId
router.get("/parades/:collegeId", async (req, res, next) => {
  try {
    const { collegeId } = req.params;
    const { rows } = await db.query(
      `SELECT id, title, type, date, notes
       FROM parades
       WHERE college_id = $1
       ORDER BY date DESC
       LIMIT 100`,
      [collegeId]
    );
    res.json({ parades: rows });
  } catch (err) {
    next(err);
  }
});

// POST /attendance  – transactional bulk upsert
router.post("/attendance", async (req, res, next) => {
  const { parade_id, college_id, records } = req.body;

  if (!parade_id || !college_id || !Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ message: "parade_id, college_id, and records[] are required" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    for (const { cadet_id, present, remarks } of records) {
      await client.query(
        `INSERT INTO attendance (parade_id, cadet_id, present, remarks)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (parade_id, cadet_id)
         DO UPDATE SET present = EXCLUDED.present, remarks = EXCLUDED.remarks`,
        [parade_id, cadet_id, Boolean(present), remarks || null]
      );
    }

    await client.query("COMMIT");
    res.status(201).json({ message: "Attendance saved", count: records.length });
  } catch (err) {
    await client.query("ROLLBACK");
    next(err);
  } finally {
    client.release();
  }
});

app.use("/api/v1", router);

// ─────────────────────────────────────────────
// GLOBAL ERROR HANDLER
// ─────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const isCors = err.message?.startsWith("CORS:");
  const status = isCors ? 403 : 500;
  if (!isCors) console.error("Unhandled error:", err);
  res.status(status).json({
    message: NODE_ENV === "production" ? "Internal server error" : err.message,
  });
});

// ─────────────────────────────────────────────
// START
// ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ NCC Portal API running on port ${PORT} [${NODE_ENV}]`);
  console.log(`   Allowed origins: ${ALLOWED_ORIGINS.join(", ") || "(dev mode)"}`);
});
