import 'dotenv/config';
import app from './app.js';
import prisma from './lib/prisma.js';

const PORT = Number(process.env.PORT) || 5000;

const server = app.listen(PORT, async () => {
  console.log(`=================================`);
  console.log(` GeoBite Backend Server Running`);
  console.log(` Port: ${PORT}`);
  console.log(` Health check: http://localhost:${PORT}/api/health`);
  console.log(` Places API:   http://localhost:${PORT}/api/places`);
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`=================================`);

  // Verify database connectivity on startup (non-fatal — server still starts)
  try {
    await prisma.$connect();
    console.log(' ✅  Database connection established.');
  } catch (err) {
    console.error(` ⚠️   Database unavailable: ${err.message}`);
    console.error(`     Start PostgreSQL and run: npm run db:migrate && npm run db:seed`);
  }
});

// Graceful shutdown handling
const handleShutdown = (signal) => {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    console.log('HTTP server closed.');
    await prisma.$disconnect();
    process.exit(0);
  });

  // Force shutdown if taking too long
  setTimeout(() => {
    console.error('Forcing shutdown after timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

export default server;

