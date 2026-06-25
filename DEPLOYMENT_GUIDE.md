# NCC Portal – Full Deployment Guide
### Render (Backend) · Vercel (Frontend) · Neon/Supabase (PostgreSQL)

---

## Prerequisites Checklist

- [ ] GitHub repository with `backend/` and `frontend/` folders committed
- [ ] Neon **or** Supabase account (free tier is fine)
- [ ] Render.com account (free tier works for testing)
- [ ] Vercel account (free tier)
- [ ] Node.js ≥ 18 installed locally for running the verify script

---

## PART 1 – Hosted PostgreSQL (Neon or Supabase)

### Option A: Neon (Recommended – serverless, scales to zero)

1. Go to **https://neon.tech** → Sign up → **Create Project**
2. Name it `ncc-portal`, choose the region closest to your users (e.g., `ap-southeast-1` for India)
3. In the project dashboard, click **Connection Details**
4. Copy the **Connection string** — it looks like:
   ```
   postgres://alex:AbCdEf@ep-cool-darkness.ap-southeast-1.aws.neon.tech/ncc_portal?sslmode=require
   ```
5. Save this as `DATABASE_URL`. You'll paste it into Render next.

### Option B: Supabase

1. Go to **https://supabase.com** → New project → set a strong DB password
2. After creation: **Settings → Database → Connection string → URI** (use the "URI" tab)
3. Replace `[YOUR-PASSWORD]` in the string with your actual password
4. Save as `DATABASE_URL`

### Run Migrations

Once you have `DATABASE_URL`, run the migration from your local machine:

```bash
cd backend
DATABASE_URL="<your-connection-string>" node scripts/migrate.js
```

Expected output:
```
🔄 Running migrations...
✅ All tables created/verified.
```

---

## PART 2 – Render.com (Backend)

### Step 1 – Connect Your GitHub Repo

1. Log into **https://render.com** → Dashboard → **New +** → **Web Service**
2. Click **Connect a repository** → Authorize Render on GitHub → select your repo
3. If your backend is in a subfolder: set **Root Directory** to `backend`

### Step 2 – Configure the Service

| Setting | Value |
|---|---|
| **Name** | `ncc-portal-api` |
| **Region** | Singapore (or closest to your users) |
| **Branch** | `main` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `node server.js` |
| **Instance Type** | Free (or Starter for no cold starts) |

### Step 3 – Set Environment Variables

In the Render dashboard → your service → **Environment** tab → **Add Environment Variable**:

| Key | Value | Notes |
|---|---|---|
| `DATABASE_URL` | `postgres://user:pass@host/db?sslmode=require` | From Neon/Supabase |
| `NODE_ENV` | `production` | Enables SSL mode & prod error messages |
| `ALLOWED_ORIGINS` | `https://ncc-portal.vercel.app` | Add after Vercel deploy; comma-separate multiple |

> ⚠️ **Do not** set `PORT` — Render injects it automatically.

### Step 4 – Deploy

Click **Create Web Service**. Render will:
1. Clone the repo
2. Run `npm install`
3. Start the server with `node server.js`

Watch the **Logs** tab. A healthy start looks like:
```
✅ NCC Portal API running on port 10000 [production]
   Allowed origins: https://ncc-portal.vercel.app
```

### Step 5 – Note Your Render URL

After deployment, Render assigns a URL like:
```
https://ncc-portal-api.onrender.com
```

Save this — you need it for Vercel and for updating `ALLOWED_ORIGINS`.

> **Free Tier Cold Starts**: Free Render services spin down after 15 minutes of inactivity.
> The first request after sleep takes ~30s. Upgrade to **Starter ($7/mo)** to avoid this,
> or use https://uptimerobot.com to ping `/health` every 10 minutes.

---

## PART 3 – Vercel (Frontend)

### Step 1 – Import Repository

1. Go to **https://vercel.com** → **Add New… → Project**
2. Click **Import** next to your GitHub repo
3. If frontend is in a subfolder: set **Root Directory** to `frontend`
4. Framework preset: **Create React App** (auto-detected)

### Step 2 – Set Environment Variable

In the **Environment Variables** section (during setup or in Project Settings later):

| Name | Value |
|---|---|
| `REACT_APP_API_URL` | `https://ncc-portal-api.onrender.com/api/v1` |

> **Critical**: The variable **must** start with `REACT_APP_` — Create React App only
> bakes in variables with that prefix at build time. Do not use `VITE_` or `NEXT_PUBLIC_`.

### Step 3 – Deploy Settings

| Setting | Value |
|---|---|
| Build Command | `npm run build` (auto-detected) |
| Output Directory | `build` (auto-detected) |
| Install Command | `npm install` |

Click **Deploy**. Vercel builds and assigns a URL:
```
https://ncc-portal-abc123.vercel.app
```

### Step 4 – Update ALLOWED_ORIGINS on Render

Now that you have both URLs:

1. Go to Render → your `ncc-portal-api` service → **Environment**
2. Update `ALLOWED_ORIGINS`:
   ```
   https://ncc-portal-abc123.vercel.app
   ```
   If you add a custom domain (e.g. `ncc.yourschool.edu.in`), append it:
   ```
   https://ncc-portal-abc123.vercel.app,https://ncc.yourschool.edu.in
   ```
3. Render will automatically redeploy the backend with the new value

### Step 5 – Add `vercel.json` to Frontend Root

Copy `frontend/vercel.json` from this repo into your React app's root.
This ensures React Router deep links (`/cadets`, `/parades`, etc.) don't 404 on refresh.

---

## PART 4 – CORS Architecture Explained

```
Browser (Vercel)
     │
     │  1. Preflight OPTIONS request with:
     │     Origin: https://ncc-portal.vercel.app
     │     Access-Control-Request-Method: POST
     ▼
Render API (server.js corsOptions)
     │
     │  2. Checks origin against ALLOWED_ORIGINS list
     │     + *.vercel.app regex for preview deploys
     │
     │  3. Returns:
     │     Access-Control-Allow-Origin: https://ncc-portal.vercel.app
     │     Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS
     │     Access-Control-Allow-Headers: Content-Type,Authorization
     ▼
Browser receives CORS approval → sends actual request
```

### Why `credentials: true` in corsOptions?

Your `apiFetch()` doesn't currently send cookies, but setting `credentials: true`
on the server prepares it for future JWT cookie authentication. When enabled,
the `Access-Control-Allow-Origin` header **must** be an exact domain — not `*`.
The `corsOptions` in `server.js` handles this correctly.

---

## PART 5 – Production Verification

After both services are live, run the sanity check:

```bash
# From your local machine (Node 18+ required, no npm install needed)
RENDER_URL=https://ncc-portal-api.onrender.com \
VERCEL_URL=https://ncc-portal-abc123.vercel.app \
node scripts/verify-production.js
```

### What It Tests

| # | Test | What a failure means |
|---|---|---|
| 1 | `GET /health` returns `{status:"ok"}` | Server crashed or hasn't started |
| 2 | CORS headers match Vercel origin | `ALLOWED_ORIGINS` not set / wrong value |
| 3 | OPTIONS preflight returns 200 | Middleware order wrong in server.js |
| 4 | `GET /colleges` returns array | DB connection failed or migration not run |
| 5 | `GET /cadets/:id` has `attendance_pct` | SQL join query failed |
| 6 | `POST /attendance` returns 201 | Transaction or unique-constraint error |

### Expected Output (all passing)

```
═══════════════════════════════════════════════
  NCC Portal – Production Sanity Check
  Backend : https://ncc-portal-api.onrender.com
  Frontend: https://ncc-portal.vercel.app
═══════════════════════════════════════════════

📡  [1/5] Health Check
  ✅ Returns HTTP 200
  ✅ status=ok in body

🔒  [2/5] CORS Headers
  ✅ Request succeeds (2xx)
  ✅ Access-Control-Allow-Origin matches Vercel URL
  ✅ OPTIONS preflight returns 200 or 204
  ✅ Access-Control-Allow-Methods includes POST

🏫  [3/5] GET /colleges
  ✅ Returns 200
  ✅ Body has colleges array
  ✅ At least one college returned
  ✅ College has id field
  ✅ College has name field

👥  [4/5] GET /cadets/:id and /parades/:id
  ✅ Cadets: 200
  ✅ Cadets: array returned
  ✅ Parades: 200
  ✅ Parades: array returned
  ✅ Cadet has attendance_pct field

✅  [5/5] POST /attendance
  ✅ Returns 201
  ✅ Body has count

═══════════════════════════════════════════════
  Results: 17 passed, 0 failed
═══════════════════════════════════════════════
```

---

## PART 6 – Common Errors & Fixes

### `CORS error: blocked by CORS policy`

| Cause | Fix |
|---|---|
| `ALLOWED_ORIGINS` not set on Render | Add the env var and redeploy |
| Trailing slash in origin | Remove it: `https://app.vercel.app` not `https://app.vercel.app/` |
| Vercel preview deploy URL not whitelisted | The regex in `server.js` covers `*.vercel.app` automatically |
| Custom domain not in list | Append it to `ALLOWED_ORIGINS` with a comma |

### `REACT_APP_API_URL is undefined` (calls go to localhost)

- Check that the env var is set in **Vercel → Project Settings → Environment Variables**
- After setting it, trigger a **Redeploy** (Vercel doesn't auto-rebuild on env changes)
- Confirm the variable name starts with `REACT_APP_`

### `ssl: ECONNREFUSED` or `SSL connection required`

- Ensure `DATABASE_URL` ends with `?sslmode=require`
- Confirm `ssl: { rejectUnauthorized: false }` is set in the Pool config (it is, in `server.js`)

### Render service URL returns 502 on first request

- Free tier cold start — wait 30 seconds and retry
- Check Render logs for crash reason

### `relation "colleges" does not exist`

- Migration hasn't been run yet
- Run: `DATABASE_URL="<your-url>" node scripts/migrate.js`

---

## PART 7 – Deployment Architecture Summary

```
┌──────────────────────────────────────────────────────────────┐
│                        PRODUCTION                            │
│                                                              │
│  ┌─────────────────┐    HTTPS     ┌────────────────────┐    │
│  │   Vercel CDN     │ ──────────▶ │   Render.com       │    │
│  │                 │              │   Web Service      │    │
│  │  React SPA      │  CORS OK ◀── │   (Node/Express)   │    │
│  │  (static files) │              │   server.js        │    │
│  │                 │              │                    │    │
│  │  Env:           │              │   Env:             │    │
│  │  REACT_APP_     │              │   DATABASE_URL      │    │
│  │  API_URL=       │              │   ALLOWED_ORIGINS  │    │
│  │  render URL     │              │   NODE_ENV=prod    │    │
│  └─────────────────┘              └──────────┬─────────┘    │
│                                              │ pg TLS        │
│                                   ┌──────────▼─────────┐    │
│                                   │   Neon / Supabase  │    │
│                                   │   PostgreSQL        │    │
│                                   │   (5 tables)        │    │
│                                   └────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

---

## File Reference

| File | Purpose |
|---|---|
| `backend/server.js` | Express app with CORS, all 5 routes, error handling |
| `backend/package.json` | Dependencies + engine constraints |
| `backend/scripts/migrate.js` | One-time DB schema creation |
| `backend/.env.example` | Template for local development |
| `frontend/vercel.json` | SPA rewrite rules + security headers |
| `scripts/verify-production.js` | End-to-end sanity check script |
