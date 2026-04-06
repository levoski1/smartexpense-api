// src/config/env.js
import dotenv from 'dotenv';
dotenv.config();

const required = [
  'NODE_ENV',
  'PORT',
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
];

for (const key of required) {
  if (!process.env[key]) {
    console.error(`❌ Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

export const config = {
  env:         process.env.NODE_ENV,
  port:        parseInt(process.env.PORT, 10) || 5000,
  isDev:       process.env.NODE_ENV === 'development',
  isProd:      process.env.NODE_ENV === 'production',
  clientUrl:   process.env.CLIENT_URL || '*',

  db: {
    url: process.env.DATABASE_URL,
  },

  jwt: {
    secret:             process.env.JWT_SECRET,
    expiresIn:          process.env.JWT_EXPIRES_IN      || '15m',
    refreshSecret:      process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn:   process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model:  process.env.OPENAI_MODEL   || 'gpt-4o-mini',
  },

  rateLimit: {
    windowMs:    parseInt(process.env.RATE_LIMIT_WINDOW_MS,    10) || 15 * 60 * 1000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  },
};
