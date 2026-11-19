// Database Migration Runner
// Executes SQL migrations sequentially and tracks applied versions.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config();

const { Pool } = pg;

export async function runMigrations(customConnectionString) {
  const connectionString = customConnectionString || process.env.DATABASE_URL;

  if (!connectionString) {
    console.warn('⚠️  DATABASE_URL is not set. Skipping live database migration.');
    console.warn('ℹ️  SQL migration files are located in backend/database/migrations/');
    return { success: false, reason: 'NO_DATABASE_URL' };
  }

  const isSupabase = connectionString.includes('supabase');
  const pool = new Pool({
    connectionString,
    ssl: isSupabase || process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  const client = await pool.connect();

  try {
    console.log('🔄 Connected to PostgreSQL. Initializing schema_migrations table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    const appliedRes = await client.query('SELECT version FROM schema_migrations');
    const appliedVersions = new Set(appliedRes.rows.map((r) => r.version));

    const migrationsDir = path.join(__dirname, 'migrations');
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    for (const file of migrationFiles) {
      if (!appliedVersions.has(file)) {
        console.log(`➡️  Applying migration: ${file}...`);
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

        await client.query('BEGIN');
        try {
          await client.query(sql);
          await client.query('INSERT INTO schema_migrations (version) VALUES ($1)', [file]);
          await client.query('COMMIT');
          console.log(`✅ Applied migration: ${file}`);
        } catch (err) {
          await client.query('ROLLBACK');
          console.error(`❌ Migration failed for ${file}:`, err);
          throw err;
        }
      } else {
        console.log(`⏭️  Already applied: ${file}`);
      }
    }

    console.log('🎉 All database migrations are up to date!');
    return { success: true };
  } finally {
    client.release();
    await pool.end();
  }
}

// Allow direct CLI execution: node database/migrate.js
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations().catch((err) => {
    console.error('Migration runner failed:', err);
    process.exit(1);
  });
}
