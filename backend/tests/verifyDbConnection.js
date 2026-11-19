import { config } from '../src/config/index.js';
import { query, pool } from '../src/config/db.js';

async function verifyConnection() {
  console.log('--- 1. DATABASE CONNECTION VERIFICATION ---');

  if (!config.databaseUrl) {
    console.error('❌ DATABASE_URL is not set in backend/.env');
    process.exit(1);
  }

  // Sanitize connection string for display
  try {
    const parsed = new URL(config.databaseUrl);
    const maskedUrl = `${parsed.protocol}//${parsed.username}:********@${parsed.host}${parsed.pathname}`;
    console.log(`📡 Configured Connection URL: ${maskedUrl}`);
    console.log(`🌐 Host: ${parsed.hostname}, Port: ${parsed.port}, Database: ${parsed.pathname.replace('/', '')}`);
    console.log(`🔒 SSL Enabled: ${config.databaseUrl.includes('supabase') || config.isProduction}`);
  } catch (err) {
    console.log('📡 Connection URL loaded from backend/.env (masked)');
  }

  const startTime = Date.now();
  try {
    const res = await query(
      'SELECT current_database() as db, current_user as user, version() as pg_version, now() as server_time'
    );
    const latency = Date.now() - startTime;

    console.log('✅ Connection to live PostgreSQL successful!');
    console.log(`⏱️ Roundtrip latency: ${latency}ms`);
    console.log(`📦 Database: ${res.rows[0].db}`);
    console.log(`👤 Connected User: ${res.rows[0].user}`);
    console.log(`🕒 Server Time: ${res.rows[0].server_time}`);
    console.log(`ℹ️ PostgreSQL Version: ${res.rows[0].pg_version.split(' ')[0]} ${res.rows[0].pg_version.split(' ')[1]}`);
    
    if (pool) {
      await pool.end();
    }
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    if (pool) {
      await pool.end();
    }
    process.exit(1);
  }
}

verifyConnection();
