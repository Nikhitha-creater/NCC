// backend/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// 1. Root-level fallback route to fix the blank white page
app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "NCC Portal API Server is running live. 🎖️",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "production"
  });
});

// 2. Sample API status endpoint for debugging connections
app.get("/api/v1/health", (req, res) => {
  const dbConnected = process.env.DATABASE_URL ? "Configured" : "Missing DATABASE_URL";
  res.status(200).json({
    status: "healthy",
    database: dbConnected,
    endpoints: {
      auth: "/api/v1/auth",
      cadets: "/api/v1/cadets",
      attendance: "/api/v1/attendance"
    }
  });
});

// Import and link your existing routes here
// const router = require('./routes/index');
// app.use("/api/v1", router);

// 3. Conditional listener guard to safely handle Vercel's serverless runtime
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`[LOCAL] Server running on http://localhost:${PORT}`);
  });
}

// Crucial: Vercel requires standard CommonJS module.exports
module.exports = app;