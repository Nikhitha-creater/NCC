/**
 * NCC Portal – Database Migration
 * Run once: node scripts/migrate.js
 * Requires DATABASE_URL to be set in environment.
 */

require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const SQL = `
-- Colleges / NCC units
CREATE TABLE IF NOT EXISTS colleges (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  code        TEXT NOT NULL UNIQUE,
  city        TEXT,
  battalion   TEXT,
  wing        TEXT CHECK (wing IN ('Army', 'Air', 'Navy')),
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Portal users (ANOs, SUOs)
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id  UUID REFERENCES colleges(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  rank        TEXT,
  role        TEXT CHECK (role IN ('ano', 'suo', 'cadet_officer', 'admin')),
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Cadets
CREATE TABLE IF NOT EXISTS cadets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id  UUID REFERENCES colleges(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  roll_no     TEXT,
  rank        TEXT DEFAULT 'Cadet',
  wing        TEXT CHECK (wing IN ('Army', 'Air', 'Navy')),
  year        INT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Parades / training events
CREATE TABLE IF NOT EXISTS parades (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id  UUID REFERENCES colleges(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  type        TEXT,
  date        DATE NOT NULL,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Attendance records (one row per cadet per parade)
CREATE TABLE IF NOT EXISTS attendance (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parade_id   UUID REFERENCES parades(id) ON DELETE CASCADE,
  cadet_id    UUID REFERENCES cadets(id) ON DELETE CASCADE,
  present     BOOLEAN NOT NULL DEFAULT false,
  remarks     TEXT,
  marked_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE (parade_id, cadet_id)   -- enables ON CONFLICT upsert
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_cadets_college     ON cadets(college_id);
CREATE INDEX IF NOT EXISTS idx_parades_college    ON parades(college_id);
CREATE INDEX IF NOT EXISTS idx_attendance_parade  ON attendance(parade_id);
CREATE INDEX IF NOT EXISTS idx_attendance_cadet   ON attendance(cadet_id);
CREATE INDEX IF NOT EXISTS idx_users_college      ON users(college_id);
`;

async function migrate() {
  const client = await pool.connect();
  try {
    console.log("🔄 Running migrations...");
    await client.query(SQL);
    console.log("✅ All tables created/verified.");
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
