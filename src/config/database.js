// src/config/database.js
import { PrismaClient } from '@prisma/client';
import { config } from './env.js';

const prisma = new PrismaClient({
  log: config.isDev ? ['query', 'warn', 'error'] : ['error'],
});

// Test connection on startup
export async function connectDatabase() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  }
}

export default prisma;
