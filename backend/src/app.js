import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

import { config } from './config/index.js';
import apiRouter from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

// CORS configuration for cross-origin SPA requests with credentials
const allowedOrigins = [
  config.frontendUrl,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000'
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Dev-friendly fallback
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
  })
);

// Parsers
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate Limiters
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per 15 mins
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, // 30 auth attempts per 15 minutes per IP
  message: { success: false, error: 'Too many authentication attempts. Please wait 15 minutes.' }
});

app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/verify-otp', authLimiter);
app.use('/api/v1/auth/verify-login-otp', authLimiter);
app.use('/api/v1/', globalLimiter);

// Local uploaded file serving
app.use('/api/v1/files', express.static(path.join(__dirname, '../uploads')));

// Root route
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'AnnaSathi AI Backend API',
    status: 'online',
    version: '1.0.0',
    documentation: '/api/v1/health'
  });
});

// API Routes
app.use('/api/v1', apiRouter);

// Catch-all 404 & Error Handler
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
