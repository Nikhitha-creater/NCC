const express = require('express');
const cors = require('cors');
const app = express();

app.use(express.json());

// ── CORRECTED CORS SECURITY MATRIX ──────────────────────────────────────────
const allowedOrigins = [
  'https://lucent-manatee-d0af5b.netlify.app',
  'http://localhost:3000',
  'http://localhost:5173'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow server-to-server or postman requests with no origin header
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error(`CORS policy violation: Origin ${origin} not permitted.`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Express explicit options handling for cross-origin preflights
app.options('*', cors());

// Your remaining routes (e.g., app.use('/api/v1/auth', authRouter)...)

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ NCC Portal API running securely on port ${PORT}`);
});
