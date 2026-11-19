// cleanDatabase.js
// Script to safely purge all demo records (donors, NGOs, volunteers, donations,
// assignments, notifications, chatbot history, audit logs) while preserving
// the database schema, all 22 tables, and keeping only a clean Admin account.

import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import argon2 from 'argon2';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config();

const { Pool } = pg;

export async function cleanDatabase() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ DATABASE_URL is not set in backend/.env');
    process.exit(1);
  }

  const isSupabase = connectionString.includes('supabase');
  const pool = new Pool({
    connectionString,
    ssl: isSupabase || process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  const client = await pool.connect();

  const tables = [
    'volunteer_location_updates',
    'delivery_status_history',
    'assignments',
    'donation_status_history',
    'donation_images',
    'ai_match_results',
    'donations',
    'ngo_documents',
    'ngo_requirements',
    'ngo_capacity',
    'ngos',
    'volunteers',
    'notifications',
    'notification_preferences',
    'admin_activity_logs',
    'chatbot_messages',
    'chatbot_conversations',
    'demand_predictions',
    'email_otp_challenges',
    'password_reset_requests',
    'user_sessions',
    'users'
  ];

  try {
    console.log('🔄 Connected to database. Reading current table counts before cleanup...');
    const countsBefore = {};
    for (const table of tables) {
      const res = await client.query(`SELECT count(*)::int as count FROM ${table}`);
      countsBefore[table] = res.rows[0].count;
    }
    console.table(countsBefore);

    console.log('\n🧹 Beginning cleanup transaction...');
    await client.query('BEGIN');

    // 1. Clear logistics & location updates
    await client.query('DELETE FROM volunteer_location_updates');
    await client.query('DELETE FROM delivery_status_history');
    await client.query('DELETE FROM assignments');

    // 2. Clear donations and dependent records
    await client.query('DELETE FROM donation_status_history');
    await client.query('DELETE FROM donation_images');
    await client.query('DELETE FROM ai_match_results');
    await client.query('DELETE FROM donations');

    // 3. Clear NGO profiles and details
    await client.query('DELETE FROM ngo_documents');
    await client.query('DELETE FROM ngo_requirements');
    await client.query('DELETE FROM ngo_capacity');
    await client.query('DELETE FROM ngos');

    // 4. Clear Volunteers
    await client.query('DELETE FROM volunteers');

    // 5. Clear Communications, logs, chats & predictions
    await client.query('DELETE FROM notifications');
    await client.query('DELETE FROM notification_preferences');
    await client.query('DELETE FROM admin_activity_logs');
    await client.query('DELETE FROM chatbot_messages');
    await client.query('DELETE FROM chatbot_conversations');
    await client.query('DELETE FROM demand_predictions');
    await client.query('DELETE FROM email_otp_challenges');
    await client.query('DELETE FROM password_reset_requests');
    await client.query('DELETE FROM user_sessions');

    // 6. Delete all demo users (all donors, NGOs, volunteers)
    await client.query("DELETE FROM users WHERE role != 'admin'");

    // 7. Reset or ensure clean admin user exists
    const adminHash = await argon2.hash('demo@admin123', { type: argon2.argon2id });
    const adminCheck = await client.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");

    if (adminCheck.rows.length === 0) {
      console.log('👤 Creating fresh Administrator account (admin@annasathi.org)...');
      await client.query(`
        INSERT INTO users (
          id, name, email, phone, password_hash, role, status,
          organization_name, city, state, pincode, email_verified_at
        ) VALUES (
          'a0000000-0000-0000-0000-000000000401',
          'System Administrator',
          'admin@annasathi.org',
          '+91 98765 43210',
          $1,
          'admin',
          'active',
          'AnnaSathi AI Central Office',
          'Hyderabad',
          'Telangana',
          '500081',
          NOW()
        )
      `, [adminHash]);
    } else {
      console.log('👤 Resetting existing Administrator account credentials...');
      await client.query(`
        UPDATE users
        SET password_hash = $1,
            name = 'System Administrator',
            email = 'admin@annasathi.org',
            phone = '+91 98765 43210',
            status = 'active',
            organization_name = 'AnnaSathi AI Central Office',
            city = 'Hyderabad',
            state = 'Telangana',
            pincode = '500081',
            email_verified_at = NOW(),
            updated_at = NOW()
        WHERE id = $2
      `, [adminHash, adminCheck.rows[0].id]);
    }

    await client.query('COMMIT');
    console.log('✅ Cleanup transaction committed successfully!\n');

    console.log('📊 Verifying counts after cleanup:');
    const countsAfter = {};
    for (const table of tables) {
      const res = await client.query(`SELECT count(*)::int as count FROM ${table}`);
      countsAfter[table] = res.rows[0].count;
    }
    console.table(countsAfter);

    return { countsBefore, countsAfter };
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Cleanup failed, rolled back changes:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  cleanDatabase()
    .then(() => {
      console.log('🎉 Database successfully cleaned! Ready for fresh registrations.');
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
