// Application Configuration
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: parseInt(process.env.PORT || '5000', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

  // Database
  databaseUrl: process.env.DATABASE_URL || '',

  // Supabase Platform (Storage & Realtime)
  supabase: {
    url: process.env.SUPABASE_URL || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    storageBucket: process.env.SUPABASE_STORAGE_BUCKET || 'annasathi-media',
  },

  // Brevo Transactional Email
  brevo: {
    apiKey: process.env.BREVO_API_KEY || '',
    senderEmail: process.env.BREVO_SENDER_EMAIL || 'verify@annasathi.org',
    senderName: process.env.BREVO_SENDER_NAME || 'AnnaSathi AI Security',
  },

  // Security Secrets
  secrets: {
    session: process.env.SESSION_SECRET || 'dev-session-secret-key-must-be-changed-in-production-32chars',
    otpHmac: process.env.OTP_HMAC_SECRET || 'dev-otp-hmac-secret-key-must-be-changed-in-production-32chars',
    csrf: process.env.CSRF_SECRET || 'dev-csrf-secret-key-must-be-changed-in-production-32chars',
  },

  // AI Microservice & Chatbot Providers
  ai: {
    serviceUrl: process.env.AI_SERVICE_URL || 'http://localhost:8000',
    serviceSecret: process.env.AI_SERVICE_SECRET || 'internal-ai-service-shared-secret-key',
    provider: process.env.AI_PROVIDER || 'gemini',
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    geminiModel: process.env.GEMINI_MODEL || 'gemini-flash-lite-latest',
    nvidiaNimApiKey: process.env.NVIDIA_NIM_API_KEY || '',
    nvidiaNimBaseUrl: process.env.NVIDIA_NIM_BASE_URL || 'https://integrate.api.nvidia.com/v1',
    nvidiaNimModel: process.env.NVIDIA_NIM_MODEL || 'nvidia/nemotron-3.5-lightning-30b-a3b',
  },

  // Cookie Settings
  cookie: {
    domain: process.env.COOKIE_DOMAIN || undefined,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.COOKIE_SAMESITE || 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  },
};

// Validate critical configurations in production
if (config.isProduction) {
  if (!config.databaseUrl) {
    console.error('CRITICAL: DATABASE_URL is required in production environment.');
  }
  if (config.secrets.session.includes('dev-session-secret')) {
    console.error('CRITICAL: SESSION_SECRET must be configured with a random secure string in production.');
  }
}
