const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');

const authRoutes = require('./routes/auth');
const kycRoutes = require('./routes/kyc');
const accountRoutes = require('./routes/accounts');
const transactionRoutes = require('./routes/transactions');
const creditRoutes = require('./routes/credits');
const adminRoutes = require('./routes/admin');
const openRoutes = require('./routes/open');
const docsRoutes = require('./routes/docs');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174'], credentials: true }));
app.use(express.json({ limit: '10mb' }));

// ── Routes ───────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/credits', creditRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/open', cors(), openRoutes);
app.use('/api/docs', docsRoutes);
app.use('/docs', docsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Serve Frontend (Production Mode) ─────────────────────────
const path = require('path');
const frontendDistPath = path.join(__dirname, '../frontend/dist');
app.use(express.static(frontendDistPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

// ── Start ────────────────────────────────────────────────────
async function start() {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected');

    // Sync all models (force: false to preserve data)
    await sequelize.sync({ force: false });
    console.log('✅ Database synced');

    app.listen(PORT, () => {
      console.log(`🚀 RiskVision API running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

start();
