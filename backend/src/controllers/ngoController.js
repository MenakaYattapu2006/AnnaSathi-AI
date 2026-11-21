// NGO Controller: Verification, Document Uploads, Requirements, and Concurrency-Safe Claiming
import { query, withTransaction } from '../config/db.js';
import { uploadFile, getSignedUrl } from '../services/storageService.js';
import { sendNotificationEmail } from '../services/emailService.js';

export const ngoController = {
  /**
   * Get NGO profile for authenticated user
   */
  async getMe(req, res) {
    const ngoRes = await query(
      `SELECT n.*, c.max_daily_meals, c.current_available_capacity, c.has_cold_storage
       FROM ngos n
       LEFT JOIN ngo_capacity c ON n.id = c.ngo_id
       WHERE n.user_id = $1`,
      [req.user.id]
    );

    if (ngoRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'No NGO profile found for this account.' });
    }

    const ngo = ngoRes.rows[0];

    const reqsRes = await query('SELECT * FROM ngo_requirements WHERE ngo_id = $1', [ngo.id]).catch(() => ({ rows: [] }));
    const docsRes = await query('SELECT id, document_type, document_name, storage_path, verification_status, uploaded_at FROM ngo_documents WHERE ngo_id = $1', [ngo.id]).catch(() => ({ rows: [] }));

    return res.status(200).json({
      success: true,
      ngo: {
        ...ngo,
        requirements: reqsRes.rows,
        documents: docsRes.rows,
      },
    });
  },

  /**
   * Update NGO Profile (Sanitizes against self-verification tampering)
   */
  async updateMe(req, res) {
    const { organizationName, contactPerson, contactPhone, contactEmail, description, street, city, state, pincode, serviceAreas, maxDailyMeals, hasColdStorage } = req.body;

    const ngoRes = await query('SELECT id FROM ngos WHERE user_id = $1', [req.user.id]);
    if (ngoRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'NGO profile not found.' });
    }

    const ngoId = ngoRes.rows[0].id;

    await withTransaction(async (client) => {
      await client.query(
        `UPDATE ngos
         SET organization_name = COALESCE($1, organization_name),
             contact_person = COALESCE($2, contact_person),
             contact_phone = COALESCE($3, contact_phone),
             contact_email = COALESCE($4, contact_email),
             description = COALESCE($5, description),
             street = COALESCE($6, street),
             city = COALESCE($7, city),
             state = COALESCE($8, state),
             pincode = COALESCE($9, pincode),
             service_areas = COALESCE($10, service_areas),
             updated_at = NOW()
         WHERE id = $11`,
        [organizationName, contactPerson, contactPhone, contactEmail, description, street, city, state, pincode, serviceAreas, ngoId]
      );

      if (maxDailyMeals !== undefined || hasColdStorage !== undefined) {
        await client.query(
          `INSERT INTO ngo_capacity (ngo_id, max_daily_meals, current_available_capacity, has_cold_storage, updated_at)
           VALUES ($1, COALESCE($2, 100), COALESCE($2, 100), COALESCE($3, FALSE), NOW())
           ON CONFLICT (ngo_id) DO UPDATE
           SET max_daily_meals = COALESCE($2, ngo_capacity.max_daily_meals),
               has_cold_storage = COALESCE($3, ngo_capacity.has_cold_storage),
               updated_at = NOW()`,
          [ngoId, maxDailyMeals, hasColdStorage]
        );
      }
    });

    return res.status(200).json({ success: true, message: 'Organization profile updated successfully.' });
  },

  /**
   * Upload NGO verification document (80G, 12A, Registration Certificate)
   */
  async uploadDocument(req, res) {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Document file is required.' });
    }

    const ngoRes = await query('SELECT id FROM ngos WHERE user_id = $1', [req.user.id]);
    if (ngoRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'NGO record not found.' });
    }

    const ngoId = ngoRes.rows[0].id;
    const documentType = req.body.documentType || 'government_registration';

    const uploadRes = await uploadFile(req.file, 'ngo_documents', ngoId);

    const docRes = await query(
      `INSERT INTO ngo_documents (ngo_id, document_type, document_name, storage_path, file_size, mime_type)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, document_type, document_name, storage_path, verification_status, uploaded_at`,
      [ngoId, documentType, req.file.originalname, uploadRes.storagePath, uploadRes.size, uploadRes.mimetype]
    );

    return res.status(201).json({
      success: true,
      message: 'Verification document uploaded successfully.',
      document: docRes.rows[0],
    });
  },

  /**
   * Get NGO Verification Status
   */
  async getVerificationStatus(req, res) {
    const ngoRes = await query(
      'SELECT id, organization_name, verification_status, verified_at, rejection_reason FROM ngos WHERE user_id = $1',
      [req.user.id]
    );

    if (ngoRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'NGO record not found.' });
    }

    return res.status(200).json({ success: true, status: ngoRes.rows[0] });
  },

  /**
   * Discover Available Surplus Donations (For Verified NGOs)
   */
  async getAvailableDonations(req, res) {
    const ngoRes = await query('SELECT id, verification_status FROM ngos WHERE user_id = $1', [req.user.id]);
    if (ngoRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'NGO profile not found.' });
    }

    const ngo = ngoRes.rows[0];

    // Query uncancelled, unexpired food in CREATED or NGO_MATCHED status
    const donationsRes = await query(
      `SELECT d.*, u.name as donor_name, u.phone as donor_phone, u.organization_name as donor_org
       FROM donations d
       JOIN users u ON d.donor_id = u.id
       WHERE (d.status = 'CREATED' OR (d.status = 'NGO_MATCHED' AND (d.matched_ngo_id = $1 OR d.matched_ngo_id IS NULL)))
         AND d.expiry_time > NOW()
       ORDER BY d.urgency_score DESC, d.created_at DESC`,
      [ngo.id]
    );

    return res.status(200).json({
      success: true,
      isVerified: ngo.verification_status === 'verified',
      donations: donationsRes.rows,
    });
  },

  /**
   * Get Donations Accepted by this NGO
   */
  async getAcceptedDonations(req, res) {
    const ngoRes = await query('SELECT id FROM ngos WHERE user_id = $1', [req.user.id]);
    if (ngoRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'NGO profile not found.' });
    }

    const ngoId = ngoRes.rows[0].id;

    const donationsRes = await query(
      `SELECT d.*, u.name as donor_name, u.phone as donor_phone, u.organization_name as donor_org,
              a.id as assignment_id, a.status as assignment_status, a.volunteer_id,
              v.name as volunteer_name, v.phone as volunteer_phone
       FROM donations d
       JOIN users u ON d.donor_id = u.id
       LEFT JOIN assignments a ON d.id = a.donation_id
       LEFT JOIN volunteers v ON a.volunteer_id = v.id
       WHERE d.matched_ngo_id = $1
         AND d.status IN ('NGO_ACCEPTED', 'VOLUNTEER_ASSIGNED', 'PICKED_UP', 'DELIVERED', 'RECEIPT_CONFIRMED')
       ORDER BY d.updated_at DESC`,
      [ngoId]
    );

    return res.status(200).json({ success: true, donations: donationsRes.rows });
  },

  /**
   * Concurrency-Safe Transactional Donation Acceptance
   * Uses Row-Level Locking (SELECT ... FOR UPDATE) to prevent race conditions.
   */
  async acceptDonation(req, res) {
    const { id } = req.params;

    const ngoRes = await query('SELECT * FROM ngos WHERE user_id = $1', [req.user.id]);
    if (ngoRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'NGO profile not found.' });
    }

    const ngo = ngoRes.rows[0];

    // Verification Enforcement
    if (ngo.verification_status !== 'verified') {
      return res.status(403).json({
        success: false,
        error: `Action Denied: Only verified NGOs can accept donations. Current verification status is "${ngo.verification_status}".`,
      });
    }

    const result = await withTransaction(async (client) => {
      // Row-Level Lock: Acquired exclusively for this donation record
      const donLockRes = await client.query('SELECT * FROM donations WHERE id = $1 FOR UPDATE', [id]);

      if (donLockRes.rows.length === 0) {
        throw { statusCode: 404, message: 'Donation listing not found.' };
      }

      const donation = donLockRes.rows[0];

      if (donation.status === 'CANCELLED') {
        throw { statusCode: 400, message: 'This donation has been cancelled by the donor.' };
      }

      // Check if already claimed by another NGO
      if (donation.status !== 'CREATED' && donation.status !== 'NGO_MATCHED') {
        throw {
          statusCode: 409,
          message: `This donation has already been accepted by another organization (current status: ${donation.status}).`,
        };
      }

      if (donation.status === 'NGO_MATCHED' && donation.matched_ngo_id && donation.matched_ngo_id !== ngo.id) {
        throw {
          statusCode: 403,
          message: 'This donation is matched to a different organization.',
        };
      }

      // 1. Advance status to NGO_ACCEPTED
      const updatedDonationRes = await client.query(
        `UPDATE donations
         SET status = 'NGO_ACCEPTED',
             matched_ngo_id = $1,
             updated_at = NOW()
         WHERE id = $2
         RETURNING *`,
        [ngo.id, donation.id]
      );

      // 2. Record status history
      await client.query(
        `INSERT INTO donation_status_history (donation_id, from_status, to_status, changed_by_user_id, notes)
         VALUES ($1, $2, 'NGO_ACCEPTED', $3, 'Accepted by NGO: ' || $4)`,
        [donation.id, donation.status, req.user.id, ngo.organization_name]
      );

      // 3. Create or initialize delivery assignment for volunteers
      const donorRes = await client.query('SELECT name, phone FROM users WHERE id = $1', [donation.donor_id]);
      const donor = donorRes.rows[0];

      await client.query(
        `INSERT INTO assignments (
           donation_id, ngo_id, status, pickup_address, pickup_contact_person, pickup_contact_phone,
           estimated_pickup_time, verification_otp, delivery_ngo_name, delivery_address,
           delivery_contact_person, delivery_contact_phone, estimated_delivery_time
         ) VALUES ($1, $2, 'available', $3, $4, $5, $6, '5821', $7, $8, $9, $10, $11)
         ON CONFLICT (donation_id) DO UPDATE
         SET ngo_id = $2, status = 'available', updated_at = NOW()`,
        [
          donation.id,
          ngo.id,
          `${donation.street}, ${donation.city}`,
          donor?.name || 'Food Donor',
          donor?.phone || '+91 98765 43210',
          donation.preparation_time,
          ngo.organization_name,
          `${ngo.street}, ${ngo.city}`,
          ngo.contact_person,
          ngo.contact_phone,
          donation.expiry_time,
        ]
      );

      return updatedDonationRes.rows[0];
    });

    return res.status(200).json({
      success: true,
      message: 'Donation accepted successfully. It is now open for volunteer transport collection.',
      donation: result,
    });
  },

  /**
   * Decline / Reject an Available Donation
   */
  async rejectDonation(req, res) {
    const { id } = req.params;
    const { reason } = req.body;

    const ngoRes = await query('SELECT id, organization_name, verification_status FROM ngos WHERE user_id = $1', [req.user.id]);
    if (ngoRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'NGO profile not found.' });
    }

    const ngo = ngoRes.rows[0];

    await withTransaction(async (client) => {
      const donLock = await client.query('SELECT * FROM donations WHERE id = $1 FOR UPDATE', [id]);
      if (donLock.rows.length === 0) {
        throw { statusCode: 404, message: 'Donation record not found.' };
      }

      const donation = donLock.rows[0];

      if (donation.matched_ngo_id && donation.matched_ngo_id !== ngo.id && donation.status !== 'NGO_MATCHED') {
        throw { statusCode: 403, message: 'Cannot decline a donation accepted by another organization.' };
      }

      // If matched specifically to this NGO, release back to open CREATED state
      if (donation.status === 'NGO_MATCHED' && donation.matched_ngo_id === ngo.id) {
        await client.query(
          `UPDATE donations
           SET status = 'CREATED',
               matched_ngo_id = NULL,
               updated_at = NOW()
           WHERE id = $1`,
          [donation.id]
        );
      }

      await client.query(
        `INSERT INTO donation_status_history (donation_id, from_status, to_status, changed_by_user_id, notes)
         VALUES ($1, $2, $2, $3, $4)`,
        [donation.id, donation.status, req.user.id, `Declined by ${ngo.organization_name}: ${reason || 'Capacity limit'}`]
      );
    });

    return res.status(200).json({ success: true, message: 'Donation declined and released back to open pool.' });
  },

  /**
   * Confirm Official Food Receipt (Only after DELIVERED status)
   */
  async confirmReceipt(req, res) {
    const { id } = req.params;
    const { notes } = req.body;

    const ngoRes = await query('SELECT id, organization_name FROM ngos WHERE user_id = $1', [req.user.id]);
    if (ngoRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'NGO profile not found.' });
    }

    const ngo = ngoRes.rows[0];

    const updated = await withTransaction(async (client) => {
      const donLock = await client.query('SELECT * FROM donations WHERE id = $1 FOR UPDATE', [id]);
      if (donLock.rows.length === 0) {
        throw { statusCode: 404, message: 'Donation not found.' };
      }

      const donation = donLock.rows[0];

      if (donation.matched_ngo_id !== ngo.id) {
        throw { statusCode: 403, message: 'Unauthorized: This donation is matched to a different organization.' };
      }

      if (donation.status === 'RECEIPT_CONFIRMED') {
        throw { statusCode: 400, message: 'Receipt has already been confirmed for this donation.' };
      }

      // Strict lifecycle transition: Food must be marked as DELIVERED by volunteer first!
      if (donation.status !== 'DELIVERED') {
        throw {
          statusCode: 400,
          message: `Cannot confirm receipt: Food has not been marked as delivered by the volunteer yet (current status: ${donation.status}).`,
        };
      }

      const resDon = await client.query(
        `UPDATE donations
         SET status = 'RECEIPT_CONFIRMED',
             special_instructions = CASE WHEN $1::text IS NOT NULL THEN special_instructions || ' | NGO Receipt Note: ' || $1 ELSE special_instructions END,
             updated_at = NOW()
         WHERE id = $2
         RETURNING *`,
        [notes || null, donation.id]
      );

      await client.query(
        `INSERT INTO donation_status_history (donation_id, from_status, to_status, changed_by_user_id, notes)
         VALUES ($1, 'DELIVERED', 'RECEIPT_CONFIRMED', $2, 'Receipt officially confirmed by NGO')`,
        [donation.id, req.user.id]
      );

      return resDon.rows[0];
    });

    return res.status(200).json({
      success: true,
      message: 'Donation receipt officially confirmed. Completed donation lifecycle recorded.',
      donation: updated,
    });
  },
};
