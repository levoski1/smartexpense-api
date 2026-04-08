// src/app.js
import express from 'express';
import cors    from 'cors';
import helmet  from 'helmet';

import { config }       from './config/env.js';
import { apiLimiter }   from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import routes           from './routes/index.js';

const app = express();

// ─── Security ─────────────────────────────────────────────────
app.use(helmet());
const allowedOrigins = config.clientUrl === '*'
  ? '*'
  : config.clientUrl.split(',').map(o => o.trim());

app.use(cors({
  origin: config.isProd ? allowedOrigins : '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// ─── Body Parsing ─────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ─── Rate Limiting ────────────────────────────────────────────
app.use('/api', apiLimiter);

// ─── Health Check ─────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'AmakTech SmartExpense AI API',
    version: '1.0.0',
    environment: config.env,
    timestamp: new Date().toISOString(),
  });
});

app.get('/', (req, res) => {
  res.status(200).json({
    message: '💡 AmakTech SmartExpense AI API',
    version: '1.0.0',
    endpoints: {
      health:       'GET  /health',
      auth:         'POST /api/v1/auth/register | /login | /refresh | /logout',
      profile:      'GET  /api/v1/auth/profile',
      transactions: 'CRUD /api/v1/transactions',
      analytics:    'GET  /api/v1/transactions/summary | /breakdown | /trend',
      budgets:      'CRUD /api/v1/budgets',
      budgetDash:   'GET  /api/v1/budgets/dashboard',
      aiInsights:   'GET  /api/v1/ai/insights',
      aiChat:       'POST /api/v1/ai/chat',
    },
  });
});

// ─── API Routes ───────────────────────────────────────────────
app.use('/api/v1', routes);

// ─── 404 Handler ──────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// ─── Global Error Handler ─────────────────────────────────────
app.use(errorHandler);

export default app;
