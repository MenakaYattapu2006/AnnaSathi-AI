// Database Seed Runner
// Seeds development records with Argon2id-hashed passwords.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import argon2 from 'argon2';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config();

const { Pool } = pg;

export async function runSeeds(customConnectionString) {
  const connectionString = customConnectionString || process.env.DATABASE_URL;

  if (!connectionString) {
    console.warn('⚠️  DATABASE_URL is not set. Skipping live database seeding.');
    console.warn('ℹ️  SQL seed template is saved at backend/database/seeds/dev_seed.sql');
    return { success: false, reason: 'NO_DATABASE_URL' };
  }

  const isSupabase = connectionString.includes('supabase');
  const pool = new Pool({
    connectionString,
    ssl: isSupabase || process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  const client = await pool.connect();

  try {
    console.log('🔄 Connected to database. Generating Argon2id password hashes for test accounts...');

    // Generate real Argon2id hashes for seed accounts
    const donorHash = await argon2.hash('demo@donor123', { type: argon2.argon2id });
    const ngoHash = await argon2.hash('demo@ngo123', { type: argon2.argon2id });
    const volHash = await argon2.hash('demo@vol123', { type: argon2.argon2id });
    const adminHash = await argon2.hash('demo@admin123', { type: argon2.argon2id });

    console.log('➡️  Executing seed SQL transactions...');
    await client.query('BEGIN');

    // 1. Seed Users
    const usersSql = `
      INSERT INTO users (id, name, email, phone, password_hash, role, status, organization_name, city, state, pincode)
      VALUES
        ('a0000000-0000-0000-0000-000000000101', 'Ravi Kumar', 'ravi@example.com', '+91 98765 43210', $1, 'donor', 'active', 'Grand Palace Banquet Hall', 'Hyderabad', 'Telangana', '500034'),
        ('a0000000-0000-0000-0000-000000000102', 'Anita Desai', 'anita.desai@example.com', '+91 98765 43215', $1, 'donor', 'active', 'Sunrise Caterers', 'Hyderabad', 'Telangana', '500081'),
        ('a0000000-0000-0000-0000-000000000201', 'Meera Iyer', 'contact@annadaan.org', '+91 98765 43211', $2, 'ngo', 'active', 'AnnaDaan Foundation', 'Hyderabad', 'Telangana', '500081'),
        ('a0000000-0000-0000-0000-000000000202', 'Rajesh Patel', 'info@rotibankhyd.org', '+91 98765 43216', $2, 'ngo', 'active', 'Roti Bank Hyderabad', 'Hyderabad', 'Telangana', '500095'),
        ('a0000000-0000-0000-0000-000000000203', 'Kavita Rao', 'contact@karunakitchen.org', '+91 98765 43217', $2, 'ngo', 'active', 'Karuna Community Kitchen', 'Hyderabad', 'Telangana', '500003'),
        ('a0000000-0000-0000-0000-000000000204', 'Father Joseph Thomas', 'help@hopeshelter.org', '+91 98765 43218', $2, 'ngo', 'active', 'Hope Shelter Trust', 'Hyderabad', 'Telangana', '500002'),
        ('a0000000-0000-0000-0000-000000000301', 'Priya Sharma', 'priya.s@example.com', '+91 98765 43212', $3, 'volunteer', 'active', NULL, 'Hyderabad', 'Telangana', '500032'),
        ('a0000000-0000-0000-0000-000000000302', 'Vikram Singh', 'vikram.singh@example.com', '+91 98765 43220', $3, 'volunteer', 'active', NULL, 'Hyderabad', 'Telangana', '500084'),
        ('a0000000-0000-0000-0000-000000000401', 'System Administrator', 'admin@annasathi.org', '+91 98765 43213', $4, 'admin', 'active', 'AnnaSathi AI Central Office', 'Hyderabad', 'Telangana', '500081')
      ON CONFLICT (email) DO NOTHING;
    `;
    await client.query(usersSql, [donorHash, ngoHash, volHash, adminHash]);

    // 2. Seed NGOs
    await client.query(`
      INSERT INTO ngos (id, user_id, organization_name, registration_number, contact_person, contact_phone, contact_email, description, street, city, state, pincode, latitude, longitude, service_areas, verification_status, verified_at)
      VALUES
        ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000201', 'AnnaDaan Foundation', 'REG-TG-2021-0089', 'Meera Iyer', '+91 98765 43211', 'contact@annadaan.org', 'Feeding 2,000+ daily in urban shelters and community nutrition centres.', 'Plot 45, Jubilee Enclave', 'Hyderabad', 'Telangana', '500081', 17.4485, 78.3742, ARRAY['Madhapur', 'Hitec City', 'Kondapur'], 'verified', NOW()),
        ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000202', 'Roti Bank Hyderabad', 'REG-TG-2019-0342', 'Rajesh Patel', '+91 98765 43216', 'info@rotibankhyd.org', 'Community kitchen distributing fresh rotis and dal across hospitals and orphanages.', 'Koti Community Center', 'Hyderabad', 'Telangana', '500095', 17.3850, 78.4867, ARRAY['Koti', 'Abids', 'Sultan Bazar'], 'verified', NOW()),
        ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000203', 'Karuna Community Kitchen', 'REG-TG-2023-0891', 'Kavita Rao', '+91 98765 43217', 'contact@karunakitchen.org', 'Serving nutritious hot meals to daily wage workers and homeless families.', 'Near Secunderabad Station', 'Hyderabad', 'Telangana', '500003', 17.4399, 78.4983, ARRAY['Secunderabad', 'Begumpet', 'Marredpally'], 'pending', NULL),
        ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000204', 'Hope Shelter Trust', 'REG-TG-2018-0115', 'Father Joseph Thomas', '+91 98765 43218', 'help@hopeshelter.org', 'Shelter home supporting 150 elderly residents and destitute individuals.', 'Old City Shelter Home', 'Hyderabad', 'Telangana', '500002', 17.3616, 78.4747, ARRAY['Old City', 'Charminar', 'Falaknuma'], 'verified', NOW())
      ON CONFLICT (registration_number) DO NOTHING;
    `);

    // 3. Seed Volunteers
    await client.query(`
      INSERT INTO volunteers (id, user_id, name, phone, email, vehicle_type, service_areas, availability, status, total_deliveries_completed, rating)
      VALUES
        ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000301', 'Priya Sharma', '+91 98765 43212', 'priya.s@example.com', 'two_wheeler', ARRAY['Gachibowli', 'Madhapur', 'Hitec City'], 'available', 'active', 42, 4.90),
        ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000302', 'Vikram Singh', '+91 98765 43220', 'vikram.singh@example.com', 'two_wheeler', ARRAY['Kondapur', 'Kukatpally', 'Miyapur'], 'available', 'active', 28, 4.80)
      ON CONFLICT (user_id) DO NOTHING;
    `);

    // 4. Seed Donations
    await client.query(`
      INSERT INTO donations (id, donor_id, food_name, category, quantity, unit, number_of_servings, dietary_type, preparation_time, expiry_time, street, city, state, pincode, latitude, longitude, matched_ngo_id, urgency_score, urgency_level, status, special_instructions)
      VALUES
        ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000101', 'Veg Biryani & Salan (50 Servings)', 'cooked_meals', 25.0, 'kg', 50, 'veg', NOW() - INTERVAL '2 hours', NOW() + INTERVAL '4 hours', 'Road No. 12, Banjara Hills', 'Hyderabad', 'Telangana', '500034', 17.4156, 78.4357, 'b0000000-0000-0000-0000-000000000001', 88, 'high', 'NGO_ACCEPTED', 'Freshly prepared for wedding reception. Kept in warm insulated containers.'),
        ('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000101', 'Assorted Dinner Rolls & Breads', 'bakery_items', 15.0, 'kg', 60, 'veg', NOW() - INTERVAL '3 hours', NOW() + INTERVAL '20 hours', 'Road No. 12, Banjara Hills', 'Hyderabad', 'Telangana', '500034', 17.4156, 78.4357, NULL, 45, 'medium', 'CREATED', 'Packed in paper bakery bags. Cool dry storage.'),
        ('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000102', 'Paneer Butter Masala & Roti', 'cooked_meals', 30.0, 'kg', 75, 'veg', NOW() - INTERVAL '1 hour', NOW() + INTERVAL '3 hours', 'Madhapur Main Road', 'Hyderabad', 'Telangana', '500081', 17.4485, 78.3908, 'b0000000-0000-0000-0000-000000000001', 92, 'critical', 'DELIVERED', 'Delivered to AnnaDaan kitchen, awaiting final verification receipt.'),
        ('d0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000102', 'Mixed Fruit Baskets', 'fruits_vegetables', 20.0, 'kg', 40, 'veg', NOW() - INTERVAL '4 hours', NOW() + INTERVAL '48 hours', 'Madhapur Main Road', 'Hyderabad', 'Telangana', '500081', 17.4485, 78.3908, 'b0000000-0000-0000-0000-000000000004', 35, 'low', 'RECEIPT_CONFIRMED', 'Official receipt signed by Father Joseph Thomas.')
      ON CONFLICT (id) DO NOTHING;
    `);

    // 5. Seed Assignments
    await client.query(`
      INSERT INTO assignments (id, donation_id, volunteer_id, ngo_id, status, pickup_address, pickup_contact_person, pickup_contact_phone, estimated_pickup_time, verification_otp, delivery_ngo_name, delivery_address, delivery_contact_person, delivery_contact_phone, estimated_delivery_time)
      VALUES
        ('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'assigned', 'Road No. 12, Banjara Hills, Hyderabad', 'Ravi Kumar', '+91 98765 43210', NOW() + INTERVAL '30 minutes', '5821', 'AnnaDaan Foundation', 'Plot 45, Jubilee Enclave, Hyderabad', 'Meera Iyer', '+91 98765 43211', NOW() + INTERVAL '90 minutes')
      ON CONFLICT (donation_id) DO NOTHING;
    `);

    await client.query('COMMIT');
    console.log('✅ Seed execution completed successfully!');
    return { success: true };
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed execution failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runSeeds().catch((err) => {
    console.error('Seed script error:', err);
    process.exit(1);
  });
}
