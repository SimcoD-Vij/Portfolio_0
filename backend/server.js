require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Initialize DB first (creates tables + seeds)
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 4000;

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json());
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:8080'
  ],
  credentials: true
}));

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',    require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/blog',    require('./routes/blogs'));
app.use('/api/chatbot', require('./routes/chatbot'));
app.use('/api/admin',   require('./routes/admin'));

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── 404 handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Portfolio API running on http://0.0.0.0:${PORT}`);
  console.log(`   Admin login: ${process.env.ADMIN_USERNAME || 'admin'} / ${process.env.ADMIN_PASSWORD || 'admin123'}`);
});
