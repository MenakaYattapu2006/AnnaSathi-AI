import test from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword, generateOtp, hashOtp, verifyOtpHmac } from '../src/utils/crypto.js';
import { calculateUrgencyScore, findMatchingNGOs } from '../src/services/aiService.js';
import { requireAuth, requireRole } from '../src/middleware/auth.js';
import { notFoundHandler } from '../src/middleware/errorHandler.js';
import { validateRegistrationInput, validateDonationInput } from '../src/validators/index.js';
import { query, withTransaction } from '../src/config/db.js';

test('1. Cryptography & Security Tests', async (t) => {
  await t.test('Argon2id password hashing and verification', async () => {
    const rawPass = 'StrongSecurePass123!';
    const hash = await hashPassword(rawPass);
    assert.ok(hash.startsWith('$argon2id$'), 'Hash should be Argon2id');
    const valid = await verifyPassword(hash, rawPass);
    assert.equal(valid, true, 'Correct password must verify');
    const invalid = await verifyPassword(hash, 'WrongPassword!');
    assert.equal(invalid, false, 'Incorrect password must fail');
  });

  await t.test('OTP Generation, Expiration and HMAC verification', () => {
    const testEmail = 'donor@example.com';
    const otp = generateOtp();
    assert.equal(otp.length, 6, 'OTP must be 6 digits');
    assert.ok(/^\d{6}$/.test(otp), 'OTP must be numerical');

    const hashedOtp = hashOtp(testEmail, otp);
    assert.equal(verifyOtpHmac(testEmail, otp, hashedOtp), true, 'Valid OTP must match hash');
    assert.equal(verifyOtpHmac(testEmail, '999999', hashedOtp), false, 'Invalid OTP must not match');
    assert.equal(verifyOtpHmac('other@example.com', otp, hashedOtp), false, 'Different email must fail');
  });
});

test('2. AI Urgency Engine Tests', async (t) => {
  await t.test('High perishability cooked meal nearing expiry generates high urgency score', () => {
    const now = new Date();
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString();
    const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString();

    const result = calculateUrgencyScore({
      category: 'cooked_meals',
      preparationTime: fourHoursAgo,
      expiryTime: twoHoursLater,
      storageCondition: 'ambient',
      quantity: 50
    });

    assert.ok(result.urgencyScore >= 70, `Score should be >= 70, got ${result.urgencyScore}`);
    assert.ok(['critical', 'high'].includes(result.urgencyLevel));
    assert.equal(result.isExpired, false);
  });

  await t.test('Packaged food with days remaining generates low urgency score', () => {
    const now = new Date();
    const fiveDaysLater = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString();
    const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString();

    const result = calculateUrgencyScore({
      category: 'packaged_food',
      preparationTime: oneHourAgo,
      expiryTime: fiveDaysLater,
      storageCondition: 'dry',
      quantity: 10
    });

    assert.ok(result.urgencyScore < 45, `Score should be < 45, got ${result.urgencyScore}`);
    assert.equal(result.urgencyLevel, 'low');
    assert.equal(result.isExpired, false);
  });
});

test('3. Auth & RBAC Middleware Unit Tests', async (t) => {
  await t.test('requireAuth blocks unauthenticated requests with 401', async () => {
    let status = 0;
    let jsonBody = null;
    let nextCalled = false;

    const mockReq = { cookies: {}, headers: {} };
    const mockRes = {
      status: (code) => {
        status = code;
        return {
          json: (body) => { jsonBody = body; }
        };
      }
    };
    const mockNext = () => { nextCalled = true; };

    await requireAuth(mockReq, mockRes, mockNext);
    assert.equal(status, 401);
    assert.equal(jsonBody.success, false);
    assert.equal(nextCalled, false);
  });

  await t.test('requireRole blocks unauthorized user role with 403', () => {
    let status = 0;
    let jsonBody = null;
    let nextCalled = false;

    const mockReq = { user: { id: 'u123', role: 'volunteer' } };
    const mockRes = {
      status: (code) => {
        status = code;
        return {
          json: (body) => { jsonBody = body; }
        };
      }
    };
    const mockNext = () => { nextCalled = true; };

    const checkAdmin = requireRole('admin');
    checkAdmin(mockReq, mockRes, mockNext);

    assert.equal(status, 403);
    assert.equal(jsonBody.success, false);
    assert.equal(nextCalled, false);
  });

  await t.test('requireRole allows matching role to pass through', () => {
    let nextCalled = false;
    const mockReq = { user: { id: 'u123', role: 'admin' } };
    const mockRes = {};
    const mockNext = () => { nextCalled = true; };

    const checkAdmin = requireRole(['admin', 'donor']);
    checkAdmin(mockReq, mockRes, mockNext);

    assert.equal(nextCalled, true);
  });
});

test('4. Input Validation & Business Guardrails Tests', async (t) => {
  await t.test('Registration rejects admin role self-signup', () => {
    const res = validateRegistrationInput({
      name: 'Sneaky Admin',
      email: 'admin@attack.com',
      phone: '+919876543210',
      password: 'SuperPassword123!',
      role: 'admin'
    });
    assert.equal(res.isValid, false);
    assert.ok(res.errors.some(e => e.includes('Administrative accounts cannot be self-registered')));
  });

  await t.test('Donation creation strictly rejects already expired food', () => {
    const past = new Date(Date.now() - 3600000).toISOString();
    const wayPast = new Date(Date.now() - 7200000).toISOString();
    const res = validateDonationInput({
      foodName: 'Spoiled Biryani',
      category: 'cooked_meals',
      quantity: 20,
      unit: 'servings',
      preparationTime: wayPast,
      expiryTime: past,
      pickupAddress: { street: 'Main Road', city: 'Mumbai' }
    });
    assert.equal(res.isValid, false);
    assert.ok(res.errors.some(e => e.includes('expired')));
  });

  await t.test('Donation creation rejects expiry preceding preparation timestamp', () => {
    const timeA = new Date(Date.now() + 3600000).toISOString();
    const timeB = new Date(Date.now() + 7200000).toISOString();
    const res = validateDonationInput({
      foodName: 'Time Travel Food',
      category: 'cooked_meals',
      quantity: 10,
      unit: 'kg',
      preparationTime: timeB, // prep in future
      expiryTime: timeA, // expiry earlier than prep
      pickupAddress: { street: 'MG Road', city: 'Bangalore' }
    });
    assert.equal(res.isValid, false);
    assert.ok(res.errors.some(e => e.includes('later than preparation time')));
  });
});

test('5. Database Abstraction & Transaction Safety Tests', async (t) => {
  await t.test('withTransaction executes callback and returns value', async () => {
    const result = await withTransaction(async (client) => {
      assert.ok(client, 'Transaction client must be provided');
      return 'transaction_success';
    });
    assert.equal(result, 'transaction_success');
  });

  await t.test('query handles fallback without throwing unhandled exceptions', async () => {
    const res = await query('SELECT 1 as num');
    assert.ok(res.rows, 'Query must return rows array');
  });
});

test('6. 404 Not Found Handler Test', () => {
  let status = 0;
  let jsonBody = null;

  const mockReq = { method: 'GET', originalUrl: '/api/v1/non-existent-endpoint' };
  const mockRes = {
    status: (code) => {
      status = code;
      return {
        json: (body) => { jsonBody = body; }
      };
    }
  };

  notFoundHandler(mockReq, mockRes);
  assert.equal(status, 404);
  assert.equal(jsonBody.success, false);
  assert.ok(jsonBody.error.includes('non-existent-endpoint'));
});
