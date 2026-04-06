// server.js
import { config }          from './src/config/env.js';
import { connectDatabase } from './src/config/database.js';
import prisma              from './src/config/database.js';
import app                 from './src/app.js';

async function bootstrap() {
  await connectDatabase();

  const server = app.listen(config.port, () => {
    console.log(`
  ╔══════════════════════════════════════════════════╗
  ║     💡 AmakTech SmartExpense AI API              ║
  ╠══════════════════════════════════════════════════╣
  ║  Status  : Running ✅                            ║
  ║  Port    : ${String(config.port).padEnd(38)}║
  ║  Env     : ${config.env.padEnd(38)}║
  ║  URL     : http://localhost:${String(config.port).padEnd(21)}║
  ║  API     : http://localhost:${config.port}/api/v1       ║
  ╚══════════════════════════════════════════════════╝
    `);
  });

  // ─── Graceful Shutdown ──────────────────────────────────────
  const shutdown = async (signal) => {
    console.log(`\n⚠️  ${signal} received. Gracefully shutting down...`);
    server.close(async () => {
      await prisma.$disconnect();
      console.log('✅ DB disconnected. Server closed.');
      process.exit(0);
    });
    // Force close after 10 seconds
    setTimeout(() => {
      console.error('❌ Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    console.error('🔥 Unhandled Rejection:', reason);
    shutdown('unhandledRejection');
  });

  process.on('uncaughtException', (err) => {
    console.error('🔥 Uncaught Exception:', err);
    shutdown('uncaughtException');
  });
}

bootstrap();
