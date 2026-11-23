// Authentication Controller (Express + Brevo Email OTP + Argon2id + DB Sessions)
import { query, withTransaction } from '../config/db.js';
import {
  hashPassword,
  verifyPassword,
  generateOtp,
  hashOtp,
  verifyOtpHmac,
  generateSessionToken,
  hashSessionToken,
  generateCsrfToken,
} from '../utils/crypto.js';
import { sendOtpEmail } from '../services/emailService.js';
import { validateRegistrationInput, validateEmail } from '../validators/index.js';
import { config } from '../config/index.js';

// Cookie options helper
function setAuthCookies(res, sessionToken, csrfToken) {
  res.cookie('annasathi_session', sessionToken, {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
    domain: config.cookie.domain,
    maxAge: config.cookie.maxAge,
    path: '/',
  });

  res.cookie('annasathi_csrf', csrfToken, {
    httpOnly: false, // Accessible to client JavaScript for X-CSRF-Token header
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
    domain: config.cookie.domain,
    maxAge: config.cookie.maxAge,
    path: '/',
  });
}

export const authController = {
  /**
   * User Registration - Step 1: Validate input, create challenge & send Brevo OTP email
   */
  async register(req, res) {
    const validation = validateRegistrationInput(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ success: false, error: validation.errors[0], errors: validation.errors });
    }

    const { email } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existing = await query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, error: 'An account with this email address already exists.' });
    }

    // Generate cryptographically secure 6-digit OTP
    const otp = generateOtp();
    const otpHmac = hashOtp(normalizedEmail, otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP challenge
    await query(
      `INSERT INTO email_otp_challenges (email, otp_hmac, purpose, expires_at)
       VALUES ($1, $2, 'register', $3)`,
      [normalizedEmail, otpHmac, expiresAt]
    );

    // Send OTP email via Brevo
    try {
      await sendOtpEmail(normalizedEmail, otp, 'register');
    } catch (emailErr) {
      console.error('Failed to send OTP email via Brevo:', emailErr.message);
      if (config.isProduction) {
        return res.status(500).json({
          success: false,
          error: 'Failed to deliver verification code to your email. Please verify your email address or try again later.',
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: `A 6-digit verification code has been sent to ${normalizedEmail}. Please enter it below to complete registration.`,
      email: normalizedEmail,
      simulatedOtp: config.isProduction ? undefined : otp,
    });
  },

  /**
   * Resend Registration OTP via Brevo
   */
  async resendRegisterOtp(req, res) {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email address is required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if already registered
    const existing = await query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, error: 'This email is already registered.' });
    }

    const otp = generateOtp();
    const otpHmac = hashOtp(normalizedEmail, otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await query(
      `INSERT INTO email_otp_challenges (email, otp_hmac, purpose, expires_at)
       VALUES ($1, $2, 'register', $3)`,
      [normalizedEmail, otpHmac, expiresAt]
    );

    try {
      await sendOtpEmail(normalizedEmail, otp, 'register');
    } catch (emailErr) {
      console.error('Failed to resend OTP via Brevo:', emailErr.message);
      if (config.isProduction) {
        return res.status(500).json({ success: false, error: 'Failed to deliver verification code via Brevo.' });
      }
    }

    return res.status(200).json({
      success: true,
      message: `New verification code sent to ${normalizedEmail}.`,
      simulatedOtp: config.isProduction ? undefined : otp,
    });
  },

  /**
   * Step 2: Verify Registration OTP & Finalize Account Creation
   */
  async verifyRegisterOtp(req, res) {
    const { email, otp, registrationData } = req.body;
    if (!email || !otp || !registrationData) {
      return res.status(400).json({ success: false, error: 'Email, OTP, and registration payload are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find active OTP challenge
    const challengeRes = await query(
      `SELECT * FROM email_otp_challenges
       WHERE email = $1 AND purpose = 'register' AND verified = FALSE AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [normalizedEmail]
    );

    if (challengeRes.rows.length === 0) {
      return res.status(400).json({ success: false, error: 'Verification code has expired or is invalid. Please request a new code.' });
    }

    const challenge = challengeRes.rows[0];

    // Check attempts
    if (challenge.attempts >= 5) {
      return res.status(429).json({ success: false, error: 'Too many incorrect verification attempts. Please register again.' });
    }

    const isValidOtp = verifyOtpHmac(normalizedEmail, otp, challenge.otp_hmac);
    if (!isValidOtp) {
      await query('UPDATE email_otp_challenges SET attempts = attempts + 1 WHERE id = $1', [challenge.id]);
      return res.status(400).json({ success: false, error: 'Invalid verification code. Please check your email and try again.' });
    }

    // Check if user already exists
    const existing = await query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, error: 'An account with this email address already exists.' });
    }

    // Hash password with Argon2id
    const password = registrationData.password;
    if (!password || password.length < 8) {
      return res.status(400).json({ success: false, error: 'Password must be at least 8 characters long.' });
    }
    const passwordHash = await hashPassword(password);

    // Mark OTP as verified
    await query('UPDATE email_otp_challenges SET verified = TRUE WHERE id = $1', [challenge.id]);

    // Create user and role entity within a transactional boundary
    const newUser = await withTransaction(async (client) => {
      const userRes = await client.query(
        `INSERT INTO users (name, email, phone, password_hash, role, status, organization_name, address, city, state, pincode, email_verified_at)
         VALUES ($1, $2, $3, $4, $5, 'active', $6, $7, $8, $9, $10, NOW())
         RETURNING id, name, email, phone, role, status, organization_name, city, state, pincode, created_at`,
        [
          registrationData.name,
          normalizedEmail,
          registrationData.phone || '+91 98765 43210',
          passwordHash,
          registrationData.role,
          registrationData.organizationName || null,
          registrationData.address || null,
          registrationData.city || 'Hyderabad',
          registrationData.state || 'Telangana',
          registrationData.pincode || '500001',
        ]
      );

      const user = userRes.rows[0];

      // Role-specific profile initialization
      if (user.role === 'ngo') {
        const orgName = registrationData.organizationName || `${user.name} Organization`;
        const streetAddr = registrationData.address || 'Facility Address';
        const cityName = registrationData.city || 'Hyderabad';
        const stateName = registrationData.state || 'Telangana';
        const pin = registrationData.pincode || '500001';

        const isSurampalem =
          String(streetAddr + ' ' + cityName).toLowerCase().includes('surampalem') ||
          String(streetAddr + ' ' + cityName).toLowerCase().includes('aditya');
        const ngoLat = registrationData.latitude || (isSurampalem ? 17.0878 : 17.3850);
        const ngoLng = registrationData.longitude || (isSurampalem ? 82.0668 : 78.4867);

        const ngoRes = await client.query(
          `INSERT INTO ngos (user_id, organization_name, registration_number, contact_person, contact_phone, contact_email, street, city, state, pincode, latitude, longitude, verification_status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'pending')
           RETURNING id`,
          [
            user.id,
            orgName,
            `REG-${Date.now().toString().slice(-6)}`,
            user.name,
            user.phone,
            user.email,
            streetAddr,
            cityName,
            stateName,
            pin,
            ngoLat,
            ngoLng,
          ]
        );

        // Seed initial capacity record
        await client.query(
          `INSERT INTO ngo_capacity (ngo_id, max_daily_meals, current_available_capacity, has_cold_storage)
           VALUES ($1, 100, 100, FALSE)`,
          [ngoRes.rows[0].id]
        );

        // Notify all platform administrators about the new pending verification request
        const adminUsers = await client.query(`SELECT id FROM users WHERE role = 'admin'`);
        for (const admin of adminUsers.rows) {
          await client.query(
            `INSERT INTO notifications (recipient_id, title, message, type, related_entity_id)
             VALUES ($1, $2, $3, 'verification_status', $4)`,
            [
              admin.id,
              'New NGO Verification Request',
              `Organization "${orgName}" has registered and requires admin verification approval before collecting surplus food donations.`,
              ngoRes.rows[0].id,
            ]
          );

          await client.query(
            `INSERT INTO admin_activity_logs (admin_id, action_type, target_id, target_type, description, metadata)
             VALUES ($1, 'NGO_REGISTRATION_SUBMITTED', $2, 'ngos', $3, $4)`,
            [
              admin.id,
              ngoRes.rows[0].id,
              `New NGO registration submitted for review: ${orgName}`,
              JSON.stringify({ organizationName: orgName, city: cityName, state: stateName, pincode: pin }),
            ]
          );
        }

        // Notify the newly registered NGO user about their pending verification status
        await client.query(
          `INSERT INTO notifications (recipient_id, title, message, type, related_entity_id)
           VALUES ($1, $2, $3, 'verification_status', $4)`,
          [
            user.id,
            'Verification In Progress',
            'Your organization registration has been submitted for administrator review. You will be notified once verified to begin accepting and collecting surplus food donations.',
            ngoRes.rows[0].id,
          ]
        );
      } else if (user.role === 'volunteer') {
        const vCity = (registrationData.city || user.city || '').trim();
        const vPincode = (registrationData.pincode || user.pincode || '').trim();
        const serviceLoc = [vCity, vPincode].filter(Boolean).join(' - ') || vCity || vPincode || 'Local Service Area';
        const serviceAreas = [serviceLoc];
        const vehicleType = ['two_wheeler', 'four_wheeler', 'van', 'none'].includes(registrationData.vehicleType)
          ? registrationData.vehicleType
          : 'two_wheeler';

        await client.query(
          `INSERT INTO volunteers (user_id, name, phone, email, vehicle_type, service_areas, availability, status)
           VALUES ($1, $2, $3, $4, $5, $6, 'available', 'active')`,
          [user.id, user.name, user.phone, user.email, vehicleType, serviceAreas]
        );
      }

      // Initialize notification preferences
      await client.query(
        `INSERT INTO notification_preferences (user_id, email_notifications, in_app_notifications)
         VALUES ($1, TRUE, TRUE)`,
        [user.id]
      );

      return user;
    });

    return res.status(201).json({
      success: true,
      message: 'Account successfully registered and verified. Please sign in with your credentials to access your dashboard.',
      user: newUser,
    });
  },

  /**
   * User Login
   * Verifies password against Argon2id hash and issues session directly.
   */
  async login(req, res) {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const userRes = await query(
      'SELECT id, name, email, phone, password_hash, role, status, organization_name, city, state, pincode FROM users WHERE email = $1',
      [normalizedEmail]
    );

    if (userRes.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    const user = userRes.rows[0];

    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        error: 'Your account has been suspended. Please contact platform administrators.',
      });
    }

    const passwordMatches = await verifyPassword(user.password_hash, password);
    if (!passwordMatches) {
      return res.status(401).json({ success: false, error: 'Invalid email or password.' });
    }

    // Issue cryptographic session token & CSRF token
    const sessionToken = generateSessionToken();
    const tokenHash = hashSessionToken(sessionToken);
    const csrfToken = generateCsrfToken();
    const expiresAt = new Date(Date.now() + config.cookie.maxAge);

    await query(
      `INSERT INTO user_sessions (user_id, session_token_hash, ip_address, user_agent, expires_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [user.id, tokenHash, req.ip, req.headers['user-agent'] || 'client', expiresAt]
    );

    setAuthCookies(res, sessionToken, csrfToken);

    // Strip password hash from returned user object
    const { password_hash, ...safeUser } = user;

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      user: safeUser,
      csrfToken,
    });
  },

  /**
   * Step 2: Verify Login OTP & Issue Session
   */
  async verifyLoginOtp(req, res) {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, error: 'Email and verification code are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const challengeRes = await query(
      `SELECT * FROM email_otp_challenges
       WHERE email = $1 AND purpose = 'login' AND verified = FALSE AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [normalizedEmail]
    );

    if (challengeRes.rows.length === 0) {
      return res.status(400).json({ success: false, error: 'Verification code has expired. Please log in again.' });
    }

    const challenge = challengeRes.rows[0];

    if (challenge.attempts >= 5) {
      return res.status(429).json({ success: false, error: 'Too many incorrect attempts. Please initiate a new login.' });
    }

    const isValid = verifyOtpHmac(normalizedEmail, otp, challenge.otp_hmac);
    if (!isValid) {
      await query('UPDATE email_otp_challenges SET attempts = attempts + 1 WHERE id = $1', [challenge.id]);
      return res.status(400).json({ success: false, error: 'Invalid verification code.' });
    }

    await query('UPDATE email_otp_challenges SET verified = TRUE WHERE id = $1', [challenge.id]);

    const userRes = await query(
      'SELECT id, name, email, phone, role, status, organization_name, city, state, pincode FROM users WHERE email = $1',
      [normalizedEmail]
    );

    const user = userRes.rows[0];

    // Issue cryptographic session token & CSRF token
    const sessionToken = generateSessionToken();
    const tokenHash = hashSessionToken(sessionToken);
    const csrfToken = generateCsrfToken();
    const expiresAt = new Date(Date.now() + config.cookie.maxAge);

    await query(
      `INSERT INTO user_sessions (user_id, session_token_hash, ip_address, user_agent, expires_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [user.id, tokenHash, req.ip, req.headers['user-agent'] || 'client', expiresAt]
    );

    setAuthCookies(res, sessionToken, csrfToken);

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      user,
      csrfToken,
    });
  },

  /**
   * Log out: Revokes database session and clears cookies
   */
  async logout(req, res) {
    if (req.session) {
      await query('DELETE FROM user_sessions WHERE id = $1', [req.session.id]);
    }

    res.clearCookie('annasathi_session', { path: '/' });
    res.clearCookie('annasathi_csrf', { path: '/' });

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  },

  /**
   * Restore authenticated session
   */
  async getMe(req, res) {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'No active session found.' });
    }

    let extraProfile = {};

    if (req.user.role === 'ngo') {
      const ngoRes = await query('SELECT * FROM ngos WHERE user_id = $1', [req.user.id]);
      if (ngoRes.rows.length > 0) {
        extraProfile.ngo = ngoRes.rows[0];
      }
    } else if (req.user.role === 'volunteer') {
      const volRes = await query('SELECT * FROM volunteers WHERE user_id = $1', [req.user.id]);
      if (volRes.rows.length > 0) {
        extraProfile.volunteer = volRes.rows[0];
      }
    }

    return res.status(200).json({
      success: true,
      user: {
        ...req.user,
        ...extraProfile,
      },
    });
  },

  /**
   * Request password reset OTP
   */
  async forgotPassword(req, res) {
    const { email } = req.body;
    if (!validateEmail(email)) {
      return res.status(400).json({ success: false, error: 'Valid email is required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const userRes = await query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);

    // Constant response to prevent user enumeration
    if (userRes.rows.length > 0) {
      const otp = generateOtp();
      const otpHmac = hashOtp(normalizedEmail, otp);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await query(
        `INSERT INTO email_otp_challenges (email, otp_hmac, purpose, expires_at)
         VALUES ($1, $2, 'reset_password', $3)`,
        [normalizedEmail, otpHmac, expiresAt]
      );

      await sendOtpEmail(normalizedEmail, otp, 'reset_password');
    }

    return res.status(200).json({
      success: true,
      message: 'If an account exists with this email, a password reset code has been sent.',
    });
  },

  /**
   * Reset password with verified OTP
   */
  async resetPassword(req, res) {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, error: 'Email, code, and new password are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const challengeRes = await query(
      `SELECT * FROM email_otp_challenges
       WHERE email = $1 AND purpose = 'reset_password' AND verified = FALSE AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [normalizedEmail]
    );

    if (challengeRes.rows.length === 0) {
      return res.status(400).json({ success: false, error: 'Reset code expired or invalid.' });
    }

    const challenge = challengeRes.rows[0];
    const isValid = verifyOtpHmac(normalizedEmail, otp, challenge.otp_hmac);
    if (!isValid) {
      return res.status(400).json({ success: false, error: 'Invalid verification code.' });
    }

    const newHash = await hashPassword(newPassword);

    await withTransaction(async (client) => {
      await client.query('UPDATE users SET password_hash = $1 WHERE email = $2', [newHash, normalizedEmail]);
      await client.query('UPDATE email_otp_challenges SET verified = TRUE WHERE id = $1', [challenge.id]);
      // Invalidate all existing sessions on password reset for security
      const userRes = await client.query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
      if (userRes.rows.length > 0) {
        await client.query('DELETE FROM user_sessions WHERE user_id = $1', [userRes.rows[0].id]);
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully. Please log in with your new password.',
    });
  },
};
