import { query, pool } from '../src/config/db.js';
import { runMigrations } from '../database/migrate.js';

const EXPECTED_TABLES = [
  'users',
  'user_sessions',
  'email_otp_challenges',
  'password_reset_requests',
  'ngos',
  'ngo_documents',
  'ngo_requirements',
  'ngo_capacity',
  'donations',
  'donation_images',
  'donation_status_history',
  'volunteers',
  'assignments',
  'delivery_status_history',
  'volunteer_location_updates',
  'notifications',
  'notification_preferences',
  'admin_activity_logs',
  'chatbot_conversations',
  'chatbot_messages',
  'demand_predictions',
  'ai_match_results',
];

async function verifyMigrationsAndSchema() {
  console.log('--- 2. DATABASE MIGRATIONS & SCHEMA VERIFICATION ---');

  // A. Check migration runner idempotency
  console.log('🔄 Testing migration idempotency (running migrate again)...');
  const migrationResult = await runMigrations();
  console.log(`Migration result: ${JSON.stringify(migrationResult)}`);

  // B. Check schema_migrations table
  const migrationHistory = await query(
    'SELECT version, applied_at FROM schema_migrations ORDER BY applied_at ASC'
  );
  console.log(`✅ Applied migrations count: ${migrationHistory.rows.length}`);
  migrationHistory.rows.forEach((m) => {
    console.log(`   - [${m.version}] (Applied at: ${m.applied_at})`);
  });

  // C. Verify all 22 tables in public schema
  const tablesRes = await query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name ASC
  `);

  const existingTables = new Set(tablesRes.rows.map((r) => r.table_name));
  console.log(`\n📋 Total public tables found: ${existingTables.size}`);

  let missingTables = [];
  EXPECTED_TABLES.forEach((table) => {
    if (existingTables.has(table)) {
      console.log(`   ✅ Table: ${table}`);
    } else {
      console.log(`   ❌ MISSING Table: ${table}`);
      missingTables.push(table);
    }
  });

  if (missingTables.length > 0) {
    console.error(`❌ Migration verification failed! Missing tables: ${missingTables.join(', ')}`);
  } else {
    console.log('🎉 All 22 expected tables verified present in Supabase!');
  }

  // D. Verify Foreign Key Constraints
  const fkRes = await query(`
    SELECT
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
    ORDER BY tc.table_name, kcu.column_name
  `);
  console.log(`\n🔗 Foreign Keys verified: ${fkRes.rows.length} relationships`);
  fkRes.rows.slice(0, 10).forEach((fk) => {
    console.log(`   - ${fk.table_name}.${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
  });
  if (fkRes.rows.length > 10) {
    console.log(`   ... and ${fkRes.rows.length - 10} more foreign key constraints.`);
  }

  // E. Verify Indexes
  const idxRes = await query(`
    SELECT tablename, indexname, indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
    ORDER BY tablename, indexname
  `);
  console.log(`\n⚡ B-Tree Indexes verified: ${idxRes.rows.length} indexes`);
  idxRes.rows.slice(0, 8).forEach((idx) => {
    console.log(`   - ${idx.tablename} (${idx.indexname})`);
  });
  if (idxRes.rows.length > 8) {
    console.log(`   ... and ${idxRes.rows.length - 8} more performance indexes.`);
  }

  if (pool) await pool.end();
}

verifyMigrationsAndSchema().catch((err) => {
  console.error('Error during schema verification:', err);
  process.exit(1);
});
