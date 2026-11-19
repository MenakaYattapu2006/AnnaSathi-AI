// Cryptographic Utilities: Argon2id, Secure OTP HMAC, Session Tokens
import crypto from 'crypto';
import argon2 from 'argon2';
import { config } from '../config/index.js';

/**
 * Hash a plaintext password using Argon2id with memory-hard parameters.
 */
export async function hashPassword(plaintext) {
  return argon2.hash(plaintext, {
    type: argon2.argon2id,
    memoryCost: 65536, // 64 MB
    timeCost: 3,
    parallelism: 4,
  });
}

/**
 * Verify a plaintext password against an Argon2id hash.
 */
export async function verifyPassword(hash, plaintext) {
  try {
    return await argon2.verify(hash, plaintext);
  } catch (err) {
    return false;
  }
}

/**
 * Generate a cryptographically secure 6-digit numeric OTP.
 */
export function generateOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

/**
 * Compute keyed HMAC of an OTP challenge tied to recipient email.
 * Plaintext OTP is NEVER stored in database.
 */
export function hashOtp(email, otp) {
  const normalizedEmail = email.trim().toLowerCase();
  return crypto
    .createHmac('sha256', config.secrets.otpHmac)
    .update(`${normalizedEmail}:${otp.trim()}`)
    .digest('hex');
}

/**
 * Verify submitted OTP using constant-time HMAC comparison.
 */
export function verifyOtpHmac(email, submittedOtp, storedHmac) {
  const calculatedHmac = hashOtp(email, submittedOtp);
  try {
    const a = Buffer.from(calculatedHmac, 'hex');
    const b = Buffer.from(storedHmac, 'hex');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Generate a cryptographically secure 256-bit random session token.
 */
export function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash session token for secure database storage.
 */
export function hashSessionToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Generate a random CSRF token.
 */
export function generateCsrfToken() {
  return crypto.randomBytes(24).toString('hex');
}
