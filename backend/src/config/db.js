// Database Connection & Query Interface
import pg from 'pg';
import { config } from './index.js';

const { Pool } = pg;

let pool = null;

if (config.databaseUrl) {
  const isSupabase = config.databaseUrl.includes('supabase');
  pool = new Pool({
    connectionString: config.databaseUrl,
    ssl: isSupabase || config.isProduction ? { rejectUnauthorized: false } : false,
    max: 20,
    min: 2, // Keep minimum 2 connections pre-warmed to eliminate cold-start TLS latency
    idleTimeoutMillis: 120000,
    connectionTimeoutMillis: 10000,
    keepAlive: true,
  });

  pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client:', err);
  });
} else {
  console.warn('⚠️  DATABASE_URL is not configured. Database queries will fall back to local in-memory storage for development.');
}

/**
 * Pre-warms the database connection pool so first user queries are instantaneous.
 */
export async function initDbPool() {
  if (pool) {
    try {
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      console.log('⚡ PostgreSQL pool pre-warmed and ready.');
    } catch (err) {
      console.warn('⚠️ Note: Initial DB pool warm-up:', err.message);
    }
  }
}

// In-Memory Fallback Store (for zero-setup local dev & unit tests without an active PostgreSQL instance)
export const memoryStore = {
  users: new Map(),
  user_sessions: new Map(),
  email_otp_challenges: new Map(),
  password_reset_requests: new Map(),
  ngos: new Map(),
  ngo_documents: new Map(),
  ngo_requirements: new Map(),
  ngo_capacity: new Map(),
  donations: new Map(),
  donation_images: new Map(),
  donation_status_history: new Map(),
  volunteers: new Map(),
  assignments: new Map(),
  delivery_status_history: new Map(),
  volunteer_location_updates: new Map(),
  notifications: new Map(),
  notification_preferences: new Map(),
  admin_activity_logs: new Map(),
  chatbot_conversations: new Map(),
  chatbot_messages: new Map(),
  demand_predictions: new Map(),
  ai_match_results: new Map(),
};

/**
 * Execute a parameterized query against PostgreSQL, or fallback to mock dev store.
 * @param {string} text - SQL statement with $1, $2 placeholders
 * @param {Array} params - Query arguments
 */
export async function query(text, params = []) {
  if (pool) {
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (config.env === 'development' && duration > 500) {
      console.warn(`Slow query (${duration}ms): ${text}`);
    }
    return res;
  }

  // Fallback dev mode simulator when no database string is supplied
  return { rows: [], rowCount: 0 };
}

/**
 * Obtain a dedicated client from pool for transactions.
 */
export async function getClient() {
  if (!pool) {
    return {
      query: async (text, params) => ({ rows: [], rowCount: 0 }),
      release: () => {},
    };
  }
  const client = await pool.connect();
  return client;
}

/**
 * Execute a callback within an isolated database transaction.
 * Automatically executes BEGIN, COMMIT, or ROLLBACK on error.
 */
export async function withTransaction(callback) {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export function isDbConnected() {
  return pool !== null;
}

export { pool };
