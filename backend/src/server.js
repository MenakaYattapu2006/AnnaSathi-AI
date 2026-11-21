import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { config } from './config/index.js';
import { initSockets } from './sockets/index.js';
import { pool, initDbPool } from './config/db.js';

const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: [config.frontendUrl, 'http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST']
  }
});

app.set('io', io);

initSockets(io);

const PORT = config.port || 5000;

server.listen(PORT, async () => {
  console.log(`=======================================================`);
  console.log(`🚀 AnnaSathi AI Backend running on port ${PORT}`);
  console.log(`📡 Environment: ${config.env}`);
  console.log(`🌐 Frontend URL: ${config.frontendUrl}`);
  console.log(`🔒 Security: Argon2id + Brevo OTP + HttpOnly Sessions`);
  console.log(`⚡ Sockets: Real-time telemetry & notification channels active`);
  console.log(`=======================================================`);
  await initDbPool();
});

// Graceful shutdown
const shutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    console.log('HTTP and WebSocket server closed.');
    if (pool) {
      await pool.end();
      console.log('PostgreSQL database pool drained.');
    }
    process.exit(0);
  });

  setTimeout(() => {
    console.error('Forced shutdown due to timeout.');
    process.exit(1);
  }, 10000);
};

// Crash resilience: prevent unhandled promise rejections from killing server
process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ Unhandled Promise Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('⚠️ Uncaught Exception caught by server boundary:', err);
});

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export { server, io };
