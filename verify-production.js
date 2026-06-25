#!/usr/bin/env node
/**
 * NCC Portal – Production Sanity Check Script
 *
 * Verifies:
 *  1. Backend /health endpoint is reachable
 *  2. CORS headers are correctly returned for the Vercel origin
 *  3. All five API routes respond with expected shapes
 *  4. POST /attendance transaction works end-to-end
 *
 * Usage:
 *   RENDER_URL=https://ncc-api.onrender.com \
 *   VERCEL_URL=https://ncc-portal.vercel.app \
 *   node scripts/verify-production.js
 */

const RENDER_URL  = process.env.RENDER_URL?.replace(/\/$/, "");
const VERCEL_URL  = process.env.VERCEL_URL?.replace(/\/$/, "");
const API_BASE    = `${RENDER_URL}/api/v1`;

if (!RENDER_URL || !VERCEL_URL) {
  console.error("❌  Set RENDER_URL and VERCEL_URL before running.\n");
  console.error(
    "   RENDER_URL=https://ncc-api.onrender.com \\\n" +
    "   VERCEL_URL=https://ncc-portal.vercel.app \\\n" +
    "   node scripts/verify-production.js"
  );
  process.exit(1);
}

// ─── tiny fetch wrapper ───────────────────────
async function get(url, { origin } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (origin) headers["Origin"] = origin;

  const res = await fetch(url, { headers });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, headers: res.headers, body };
}

async function post(url, data, { origin } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (origin) headers["Origin"] = origin;

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, headers: res.headers, body };
}

// ─── check helpers ───────────────────────────
let passed = 0;
let failed = 0;

function ok(label, expr, detail = "") {
  if (expr) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.log(`  ❌ ${label}${detail ? `  →  ${detail}` : ""}`);
    failed++;
  }
}

// ─── test suites ─────────────────────────────

async function testHealth() {
  console.log("\n📡  [1/5] Health Check");
  const { status, body } = await get(`${RENDER_URL}/health`);
  ok("Returns HTTP 200", status === 200, `got ${status}`);
  ok("status=ok in body", body.status === "ok", JSON.stringify(body));
}

async function testCors() {
  console.log("\n🔒  [2/5] CORS Headers");
  const { status, headers } = await get(`${API_BASE}/colleges`, {
    origin: VERCEL_URL,
  });
  const acao = headers.get("access-control-allow-origin");
  ok("Request succeeds (2xx)", status >= 200 && status < 300, `got ${status}`);
  ok(
    `Access-Control-Allow-Origin matches Vercel URL`,
    acao === VERCEL_URL || acao === "*",
    `got: ${acao}`
  );

  // Preflight
  const pre = await fetch(`${API_BASE}/attendance`, {
    method: "OPTIONS",
    headers: {
      Origin: VERCEL_URL,
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "Content-Type",
    },
  });
  ok(
    "OPTIONS preflight returns 200 or 204",
    pre.status === 200 || pre.status === 204,
    `got ${pre.status}`
  );
  ok(
    "Access-Control-Allow-Methods includes POST",
    (pre.headers.get("access-control-allow-methods") || "").includes("POST"),
    pre.headers.get("access-control-allow-methods")
  );
}

async function testColleges() {
  console.log("\n🏫  [3/5] GET /colleges");
  const { status, body } = await get(`${API_BASE}/colleges`, {
    origin: VERCEL_URL,
  });
  ok("Returns 200", status === 200, `got ${status}`);
  ok(
    "Body has colleges array",
    Array.isArray(body.colleges) || Array.isArray(body),
    JSON.stringify(body).slice(0, 120)
  );

  const colleges = body.colleges || body;
  ok("At least one college returned", colleges.length > 0, `got ${colleges.length}`);

  if (colleges.length > 0) {
    const c = colleges[0];
    ok("College has id field", !!c.id);
    ok("College has name field", !!c.name);
    return c.id; // return for downstream tests
  }
}

async function testCadetsAndParades(collegeId) {
  if (!collegeId) {
    console.log("\n⏭️  [4/5] Skipping cadets/parades (no collegeId)");
    return { cadetId: null, paradeId: null };
  }

  console.log(`\n👥  [4/5] GET /cadets/${collegeId} and /parades/${collegeId}`);

  const [cadetRes, paradeRes] = await Promise.all([
    get(`${API_BASE}/cadets/${collegeId}`, { origin: VERCEL_URL }),
    get(`${API_BASE}/parades/${collegeId}`, { origin: VERCEL_URL }),
  ]);

  ok("Cadets: 200", cadetRes.status === 200, `got ${cadetRes.status}`);
  const cadets = cadetRes.body.cadets || cadetRes.body;
  ok("Cadets: array returned", Array.isArray(cadets), JSON.stringify(cadetRes.body).slice(0, 80));

  ok("Parades: 200", paradeRes.status === 200, `got ${paradeRes.status}`);
  const parades = paradeRes.body.parades || paradeRes.body;
  ok("Parades: array returned", Array.isArray(parades));

  if (cadets.length > 0) {
    ok("Cadet has attendance_pct field", "attendance_pct" in cadets[0]);
  }

  return {
    cadetId:  cadets[0]?.id  || null,
    paradeId: parades[0]?.id || null,
  };
}

async function testAttendancePost(paradeId, cadetId, collegeId) {
  console.log("\n✅  [5/5] POST /attendance");

  if (!paradeId || !cadetId || !collegeId) {
    console.log("  ⏭️  Skipped – need a real parade_id and cadet_id from DB.");
    console.log("       Seed some data first, then re-run this script.");
    return;
  }

  const { status, body } = await post(
    `${API_BASE}/attendance`,
    {
      parade_id:  paradeId,
      college_id: collegeId,
      records: [{ cadet_id: cadetId, present: true, remarks: "Verify script" }],
    },
    { origin: VERCEL_URL }
  );

  ok("Returns 201", status === 201, `got ${status} – ${JSON.stringify(body)}`);
  ok("Body has count", typeof body.count === "number", JSON.stringify(body));
}

// ─── run all ─────────────────────────────────
(async () => {
  console.log("═══════════════════════════════════════════════");
  console.log("  NCC Portal – Production Sanity Check");
  console.log(`  Backend : ${RENDER_URL}`);
  console.log(`  Frontend: ${VERCEL_URL}`);
  console.log("═══════════════════════════════════════════════");

  try {
    await testHealth();
    await testCors();
    const collegeId = await testColleges();
    const { cadetId, paradeId } = await testCadetsAndParades(collegeId);
    await testAttendancePost(paradeId, cadetId, collegeId);
  } catch (err) {
    console.error("\n💥  Unexpected error:", err.message);
    failed++;
  }

  console.log("\n═══════════════════════════════════════════════");
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  console.log("═══════════════════════════════════════════════\n");
  process.exit(failed > 0 ? 1 : 0);
})();
