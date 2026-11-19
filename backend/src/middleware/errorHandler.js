// Centralized Safe Error Handling Middleware
import { config } from '../config/index.js';

export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || err.status || 500;
  const isServerFault = statusCode >= 500;

  if (isServerFault) {
    console.error(`[SERVER ERROR] ${req.method} ${req.url}:`, err);
  }

  // Sanitize message in production to prevent leaking database structure or internal details
  const clientMessage =
    config.isProduction && isServerFault
      ? 'An unexpected internal platform error occurred. Please try again shortly.'
      : err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: clientMessage,
    ...(config.env === 'development' && {
      stack: err.stack,
      details: err.details,
    }),
  });
}

export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: `Resource not found: ${req.method} ${req.originalUrl}`,
  });
}
