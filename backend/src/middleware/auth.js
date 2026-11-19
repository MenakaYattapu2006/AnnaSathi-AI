// Authentication & Role-Based Access Control Middleware
import { query } from '../config/db.js';
import { hashSessionToken } from '../utils/crypto.js';

/**
 * Extracts and verifies the HttpOnly session cookie.
 * Attaches the authenticated user to `req.user` and session to `req.session`.
 */
export async function authenticateSession(req, res, next) {
  const token = req.cookies?.annasathi_session;

  if (!token) {
    req.user = null;
    req.session = null;
    return next();
  }

  try {
    const tokenHash = hashSessionToken(token);

    const sessionRes = await query(
      `SELECT s.*, u.id as user_id, u.name, u.email, u.phone, u.role, u.status, u.organization_name
       FROM user_sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.session_token_hash = $1 AND s.expires_at > NOW()`,
      [tokenHash]
    );

    if (sessionRes.rows.length === 0) {
      // Clear expired or invalid cookie
      res.clearCookie('annasathi_session');
      req.user = null;
      req.session = null;
      return next();
    }

    const row = sessionRes.rows[0];

    // Security check: Suspended accounts cannot perform authenticated actions
    if (row.status === 'suspended') {
      res.clearCookie('annasathi_session');
      return res.status(403).json({
        success: false,
        error: 'Account Suspended: Your access has been restricted by an administrator. Please contact support.',
      });
    }

    req.user = {
      id: row.user_id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      role: row.role,
      status: row.status,
      organizationName: row.organization_name,
    };

    req.session = {
      id: row.id,
      tokenHash,
      expiresAt: row.expires_at,
    };

    // Update last_used_at timestamp asynchronously
    query('UPDATE user_sessions SET last_used_at = NOW() WHERE id = $1', [row.id]).catch(() => {});

    next();
  } catch (err) {
    console.error('Session authentication error:', err);
    req.user = null;
    req.session = null;
    next();
  }
}

/**
 * Middleware: Strictly requires an active authenticated session.
 */
export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication Required: Please log in to access this resource.',
    });
  }
  next();
}

/**
 * Middleware: Enforces Role-Based Access Control (RBAC).
 * @param  {...string} allowedRoles - E.g. 'donor', 'ngo', 'volunteer', 'admin'
 */
export function requireRole(...allowedRoles) {
  const roles = allowedRoles.flat();
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication Required: Please log in to access this resource.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access Denied: Action requires one of the following roles: [${roles.join(', ')}]. Current role: ${req.user.role}.`,
      });
    }

    next();
  };
}

/**
 * CSRF Protection for state-changing requests.
 * Compares X-CSRF-Token header with cookie token.
 */
export function verifyCsrf(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Exempt auth bootstrap endpoints if session is not yet established
  if (req.path.startsWith('/api/v1/auth/login') || req.path.startsWith('/api/v1/auth/register') || req.path.startsWith('/api/v1/auth/verify-otp') || req.path.startsWith('/api/v1/auth/verify-login-otp')) {
    return next();
  }

  const clientToken = req.headers['x-csrf-token'];
  const cookieToken = req.cookies?.annasathi_csrf;

  if (!cookieToken || !clientToken || clientToken !== cookieToken) {
    // In local development, warn but allow if header not supplied
    if (process.env.NODE_ENV !== 'production' && !clientToken) {
      return next();
    }
    return res.status(403).json({
      success: false,
      error: 'Invalid or missing CSRF security token.',
    });
  }

  next();
}
