// test-delete.js – quick script to verify the DELETE /api/v1/admin/users/:id endpoint
// 1. Update the constants below with your admin email, password, and a user-id you want to delete.
// 2. Run: node test-delete.js   (from the backend folder)

import fetch from 'node-fetch'; // node-fetch is bundled with Node 18+ as a global fetch, but we import for clarity

const BASE_URL = process.env.API_URL || 'http://localhost:3000'; // change if your server runs on a different port
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;   // set in .env
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;   // set in .env
const USER_ID_TO_DELETE = process.env.USER_ID_TO_DELETE; // set in .env

async function main() {
  // ---- Login ----
  const loginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });

  if (!loginRes.ok) {
    console.error('❌ Login failed – status', loginRes.status);
    const txt = await loginRes.text();
    console.error(txt);
    process.exit(1);
  }

  const loginData = await loginRes.json();
  const token = loginData?.accessToken;
  if (!token) {
    console.error('❌ No accessToken received from login');
    process.exit(1);
  }
  console.log('✅ Logged in – got token');

  // ---- Delete user ----
  const delRes = await fetch(`${BASE_URL}/api/v1/admin/users/${USER_ID_TO_DELETE}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  const result = await delRes.json();
  console.log('\n--- Delete response ---');
  console.log('Status:', delRes.status);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((e) => {
  console.error('❌ Unexpected error', e);
  process.exit(1);
});
