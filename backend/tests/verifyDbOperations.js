import { query, pool } from '../src/config/db.js';
import { hashPassword, generateSessionToken, hashSessionToken } from '../src/utils/crypto.js';

async function testDatabaseOperations() {
  console.log('--- 3. DATABASE OPERATIONS (CRUD & WORKFLOW) VERIFICATION ---');

  const testSuffix = Date.now().toString().slice(-6);
  const testDonorEmail = `test_donor_${testSuffix}@verification.annasathi.org`;
  const testNgoEmail = `test_ngo_${testSuffix}@verification.annasathi.org`;
  const testVolEmail = `test_vol_${testSuffix}@verification.annasathi.org`;
  const testAdminEmail = `test_admin_${testSuffix}@verification.annasathi.org`;

  let donorUserId = null;
  let ngoUserId = null;
  let ngoId = null;
  let volunteerUserId = null;
  let volunteerId = null;
  let adminUserId = null;
  let donationId = null;
  let assignmentId = null;
  let notificationId = null;

  try {
    // 1. User Registration Operation
    console.log('\n[1/8] Testing User Registration...');
    const hashedPass = await hashPassword('TestVerificationPass123!');
    const donorRes = await query(
      `INSERT INTO users (name, email, phone, password_hash, role, status)
       VALUES ($1, $2, $3, $4, 'donor', 'active')
       RETURNING id, name, email, role, created_at`,
      [`Test Donor ${testSuffix}`, testDonorEmail, '+919999900001', hashedPass]
    );
    donorUserId = donorRes.rows[0].id;
    console.log(`   ✅ Registered Donor User: ID=${donorUserId}, Email=${donorRes.rows[0].email}`);

    // Register test NGO user and Admin user
    const ngoUserRes = await query(
      `INSERT INTO users (name, email, phone, password_hash, role, status)
       VALUES ($1, $2, $3, $4, 'ngo', 'active') RETURNING id`,
      [`Test NGO Rep ${testSuffix}`, testNgoEmail, '+919999900002', hashedPass]
    );
    ngoUserId = ngoUserRes.rows[0].id;

    const adminUserRes = await query(
      `INSERT INTO users (name, email, phone, password_hash, role, status)
       VALUES ($1, $2, $3, $4, 'admin', 'active') RETURNING id`,
      [`Test Admin ${testSuffix}`, testAdminEmail, '+919999900003', hashedPass]
    );
    adminUserId = adminUserRes.rows[0].id;

    // 2. User Login & Session Persistence
    console.log('\n[2/8] Testing User Login & Session Persistence...');
    const rawSessionToken = generateSessionToken();
    const hashedSessionToken = hashSessionToken(rawSessionToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const sessionRes = await query(
      `INSERT INTO user_sessions (user_id, session_token_hash, ip_address, user_agent, expires_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, user_id, session_token_hash, expires_at`,
      [donorUserId, hashedSessionToken, '127.0.0.1', 'Node-Verify-Agent/1.0', expiresAt]
    );
    console.log(`   ✅ Session Created: ID=${sessionRes.rows[0].id}, Expires=${sessionRes.rows[0].expires_at}`);

    // Retrieve active session matching hashed token
    const verifySessionRes = await query(
      `SELECT s.id, s.user_id, u.email, u.role
       FROM user_sessions s
       JOIN users u ON s.user_id = u.id
       WHERE s.session_token_hash = $1 AND s.expires_at > NOW()`,
      [hashedSessionToken]
    );
    if (verifySessionRes.rows.length === 1 && verifySessionRes.rows[0].user_id === donorUserId) {
      console.log(`   ✅ Session Verified and Restored for: ${verifySessionRes.rows[0].email} (${verifySessionRes.rows[0].role})`);
    } else {
      throw new Error('Session lookup failed!');
    }

    // 3. NGO Profile & Verification
    console.log('\n[3/8] Testing NGO Profile Creation and Status Review...');
    const ngoRes = await query(
      `INSERT INTO ngos (user_id, organization_name, registration_number, contact_person, contact_phone, contact_email, street, city, state, pincode, latitude, longitude, verification_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'pending')
       RETURNING id, organization_name, verification_status`,
      [
        ngoUserId,
        `Hope Relief Society ${testSuffix}`,
        `REG-VERIFY-${testSuffix}`,
        `Director ${testSuffix}`,
        '+919999900002',
        testNgoEmail,
        '100 Anna Salai',
        'Chennai',
        'Tamil Nadu',
        '600002',
        13.0827,
        80.2707,
      ]
    );
    ngoId = ngoRes.rows[0].id;
    console.log(`   ✅ NGO Profile Created: ID=${ngoId}, Status=${ngoRes.rows[0].verification_status}`);

    // Update to verified by admin
    const updateNgoRes = await query(
      `UPDATE ngos
       SET verification_status = 'verified', verified_at = NOW(), updated_at = NOW()
       WHERE id = $1 RETURNING id, verification_status, verified_at`,
      [ngoId]
    );
    console.log(`   ✅ NGO Status Updated to: ${updateNgoRes.rows[0].verification_status} at ${updateNgoRes.rows[0].verified_at}`);

    // 4. Food Donation Creation & Retrieval
    console.log('\n[4/8] Testing Food Donation Creation and Retrieval...');
    const now = new Date();
    const prepTime = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const expiryTime = new Date(now.getTime() + 4 * 60 * 60 * 1000);

    const donationRes = await query(
      `INSERT INTO donations (donor_id, food_name, category, quantity, unit, preparation_time, expiry_time, street, city, state, pincode, latitude, longitude, urgency_score, urgency_level, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'CREATED')
       RETURNING id, food_name, category, quantity, urgency_score, urgency_level, status, created_at`,
      [
        donorUserId,
        `Steamed Rice & Dal ${testSuffix}`,
        'cooked_meals',
        40,
        'meals',
        prepTime,
        expiryTime,
        '45 Marina Beach Rd',
        'Chennai',
        'Tamil Nadu',
        '600004',
        13.0500,
        80.2824,
        82,
        'high',
      ]
    );
    donationId = donationRes.rows[0].id;
    console.log(`   ✅ Donation Created: ID=${donationId}, Food="${donationRes.rows[0].food_name}", Urgency=${donationRes.rows[0].urgency_score} (${donationRes.rows[0].urgency_level})`);

    // Retrieval by ID
    const fetchDonation = await query('SELECT id, status, food_name FROM donations WHERE id = $1', [donationId]);
    console.log(`   ✅ Retrieved Donation: ID=${fetchDonation.rows[0].id}, Status=${fetchDonation.rows[0].status}`);

    // 5. Donation Status History
    console.log('\n[5/8] Testing Donation Status Transitions & Status History...');
    await query(
      `INSERT INTO donation_status_history (donation_id, from_status, to_status, changed_by_user_id, notes)
       VALUES ($1, 'CREATED', 'NGO_ACCEPTED', $2, 'Test NGO claimed donation')`,
      [donationId, ngoUserId]
    );
    await query(`UPDATE donations SET status = 'NGO_ACCEPTED', matched_ngo_id = $1 WHERE id = $2`, [ngoId, donationId]);

    const historyRes = await query(
      `SELECT * FROM donation_status_history WHERE donation_id = $1 ORDER BY created_at DESC`,
      [donationId]
    );
    console.log(`   ✅ Status History Recorded: ${historyRes.rows[0].from_status} -> ${historyRes.rows[0].to_status} (Notes: "${historyRes.rows[0].notes}")`);

    // 6. Volunteer Assignment Lifecycle
    console.log('\n[6/8] Testing Volunteer Assignment Creation, Acceptance, and Delivery...');
    // Create test volunteer
    const volUserRes = await query(
      `INSERT INTO users (name, email, phone, password_hash, role, status)
       VALUES ($1, $2, $3, $4, 'volunteer', 'active') RETURNING id`,
      [`Test Rider ${testSuffix}`, testVolEmail, '+919999900004', hashedPass]
    );
    volunteerUserId = volUserRes.rows[0].id;

    const volRes = await query(
      `INSERT INTO volunteers (user_id, name, phone, email, vehicle_type, availability)
       VALUES ($1, $2, $3, $4, 'two_wheeler', 'available') RETURNING id`,
      [volunteerUserId, `Test Rider ${testSuffix}`, '+919999900004', testVolEmail]
    );
    volunteerId = volRes.rows[0].id;

    // Create assignment linked to donation
    const assignRes = await query(
      `INSERT INTO assignments (
        donation_id, ngo_id, volunteer_id, status,
        pickup_address, pickup_contact_person, pickup_contact_phone, estimated_pickup_time,
        delivery_ngo_name, delivery_address, delivery_contact_person, delivery_contact_phone, estimated_delivery_time
      ) VALUES ($1, $2, $3, 'assigned', $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id, status`,
      [
        donationId,
        ngoId,
        volunteerId,
        '45 Marina Beach Rd, Chennai',
        'Donor Staff',
        '+919999900001',
        new Date(now.getTime() + 60 * 60 * 1000),
        `Hope Relief Society ${testSuffix}`,
        '100 Anna Salai, Chennai',
        'NGO Volunteer',
        '+919999900002',
        new Date(now.getTime() + 120 * 60 * 1000),
      ]
    );
    assignmentId = assignRes.rows[0].id;
    console.log(`   ✅ Volunteer Assignment Created: ID=${assignmentId}, Status=${assignRes.rows[0].status}`);

    // Update assignment to picked_up
    await query(`UPDATE assignments SET status = 'picked_up', picked_up_at = NOW() WHERE id = $1`, [assignmentId]);
    // Update assignment to delivered
    const deliverRes = await query(
      `UPDATE assignments SET status = 'delivered', delivered_at = NOW() WHERE id = $1 RETURNING id, status, delivered_at`,
      [assignmentId]
    );
    console.log(`   ✅ Assignment Updated to: ${deliverRes.rows[0].status} at ${deliverRes.rows[0].delivered_at}`);

    // 7. Notifications CRUD
    console.log('\n[7/8] Testing In-App Notification Dispatch & Read Status...');
    const notifRes = await query(
      `INSERT INTO notifications (recipient_id, title, message, type, status, related_entity_id)
       VALUES ($1, 'Delivery Completed', 'Surplus food delivery has reached destination NGO.', 'delivery_completed', 'unread', $2)
       RETURNING id, recipient_id, title, status`,
      [donorUserId, donationId]
    );
    notificationId = notifRes.rows[0].id;
    console.log(`   ✅ Notification Dispatched: ID=${notificationId}, Status=${notifRes.rows[0].status}`);

    // Mark as read
    const readNotifRes = await query(
      `UPDATE notifications SET status = 'read', read_at = NOW() WHERE id = $1 RETURNING id, status, read_at`,
      [notificationId]
    );
    console.log(`   ✅ Notification Marked as Read: Status=${readNotifRes.rows[0].status} at ${readNotifRes.rows[0].read_at}`);

    // 8. Admin Audit Logs
    console.log('\n[8/8] Testing Administrative Audit Logging...');
    const auditRes = await query(
      `INSERT INTO admin_activity_logs (admin_id, action_type, target_id, target_type, description, metadata)
       VALUES ($1, 'VERIFIED_NGO', $2, 'ngo', $3, $4)
       RETURNING id, action_type, target_type, created_at`,
      [
        adminUserId,
        ngoId,
        `Verified credentials for NGO ID ${ngoId}`,
        JSON.stringify({ verified_by: 'automated_test', darpan_status: 'valid' }),
      ]
    );
    console.log(`   ✅ Audit Log Created: ID=${auditRes.rows[0].id}, Action=${auditRes.rows[0].action_type}`);

    console.log('\n🎉 ALL 8 DATABASE OPERATIONS SUCCEEDED ON LIVE SUPABASE POSTGRESQL!');

    // Clean up isolated test records
    console.log('\n🧹 Cleaning up test verification records...');
    if (assignmentId) await query('DELETE FROM assignments WHERE id = $1', [assignmentId]);
    if (donationId) await query('DELETE FROM donations WHERE id = $1', [donationId]);
    if (ngoId) await query('DELETE FROM ngos WHERE id = $1', [ngoId]);
    if (volunteerId) await query('DELETE FROM volunteers WHERE id = $1', [volunteerId]);
    if (donorUserId) await query('DELETE FROM users WHERE id = $1', [donorUserId]);
    if (ngoUserId) await query('DELETE FROM users WHERE id = $1', [ngoUserId]);
    if (volunteerUserId) await query('DELETE FROM users WHERE id = $1', [volunteerUserId]);
    if (adminUserId) await query('DELETE FROM users WHERE id = $1', [adminUserId]);
    console.log('✅ Test records cleaned up successfully. Production and demo data preserved.');

  } catch (error) {
    console.error('❌ Database operations test failed:', error);
    // Attempt cleanup on failure
    try {
      if (assignmentId) await query('DELETE FROM assignments WHERE id = $1', [assignmentId]);
      if (donationId) await query('DELETE FROM donations WHERE id = $1', [donationId]);
      if (ngoId) await query('DELETE FROM ngos WHERE id = $1', [ngoId]);
      if (volunteerId) await query('DELETE FROM volunteers WHERE id = $1', [volunteerId]);
      if (donorUserId) await query('DELETE FROM users WHERE id = $1', [donorUserId]);
      if (ngoUserId) await query('DELETE FROM users WHERE id = $1', [ngoUserId]);
      if (volunteerUserId) await query('DELETE FROM users WHERE id = $1', [volunteerUserId]);
      if (adminUserId) await query('DELETE FROM users WHERE id = $1', [adminUserId]);
    } catch {}
    process.exit(1);
  } finally {
    if (pool) await pool.end();
  }
}

testDatabaseOperations();
