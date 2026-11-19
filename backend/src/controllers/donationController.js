// Donation Management Controller: Lifecycle, Tracking, and Concurrency-Safe State Transitions
import { query, withTransaction } from '../config/db.js';
import { validateDonationInput } from '../validators/index.js';
import { calculateFoodUrgency, matchNGOsForDonation } from '../services/aiService.js';

export const donationController = {
  /**
   * Create a new surplus food donation (Donor role)
   */
  async createDonation(req, res) {
    const validation = validateDonationInput(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ success: false, errors: validation.errors });
    }

    const {
      foodName,
      category,
      quantity,
      unit,
      numberOfServings,
      dietaryType,
      preparationTime,
      expiryTime,
      pickupAddress,
      specialInstructions,
      imageUrl,
    } = req.body;

    // AI Urgency Calculation
    const urgency = calculateFoodUrgency({
      category,
      preparationTime,
      expiryTime,
      quantity,
      unit,
    });

    const donation = await withTransaction(async (client) => {
      const donRes = await client.query(
        `INSERT INTO donations (
           donor_id, food_name, category, quantity, unit, number_of_servings, dietary_type,
           preparation_time, expiry_time, street, city, state, pincode, latitude, longitude,
           landmark, urgency_score, urgency_level, status, special_instructions, image_url
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, 'CREATED', $19, $20)
         RETURNING *`,
        [
          req.user.id,
          foodName.trim(),
          category,
          quantity,
          unit,
          numberOfServings || null,
          dietaryType || 'veg',
          preparationTime,
          expiryTime,
          pickupAddress.street,
          pickupAddress.city,
          pickupAddress.state || 'Telangana',
          pickupAddress.pincode || '500001',
          pickupAddress.latitude || 17.3850,
          pickupAddress.longitude || 78.4867,
          pickupAddress.landmark || null,
          urgency.urgencyScore,
          urgency.urgencyLevel,
          specialInstructions || null,
          imageUrl || null,
        ]
      );

      const created = donRes.rows[0];

      // Audit status history
      await client.query(
        `INSERT INTO donation_status_history (donation_id, from_status, to_status, changed_by_user_id, notes)
         VALUES ($1, NULL, 'CREATED', $2, 'Donation created by donor')`,
        [created.id, req.user.id]
      );

      return created;
    });

    // Compute matching verified NGOs asynchronously
    const matches = await matchNGOsForDonation(donation);

    return res.status(201).json({
      success: true,
      message: 'Surplus food donation registered successfully.',
      donation,
      urgency,
      recommendedNGOs: matches.slice(0, 3),
    });
  },

  /**
   * Retrieve donations for the authenticated donor
   */
  async getDonations(req, res) {
    const { status, category, search } = req.query;

    let sql = `SELECT d.*, n.organization_name as matched_ngo_name,
                      a.status as assignment_status, a.id as assignment_id,
                      v.name as volunteer_name, v.phone as volunteer_phone
               FROM donations d
               LEFT JOIN ngos n ON d.matched_ngo_id = n.id
               LEFT JOIN assignments a ON d.id = a.donation_id
               LEFT JOIN volunteers v ON a.volunteer_id = v.id
               WHERE d.donor_id = $1`;
    const params = [req.user.id];

    if (status) {
      params.push(status);
      sql += ` AND d.status = $${params.length}`;
    }

    if (category) {
      params.push(category);
      sql += ` AND d.category = $${params.length}`;
    }

    if (search) {
      params.push(`%${search.trim().toLowerCase()}%`);
      sql += ` AND (LOWER(d.food_name) LIKE $${params.length} OR LOWER(d.city) LIKE $${params.length})`;
    }

    sql += ' ORDER BY d.created_at DESC';

    const donationsRes = await query(sql, params);
    return res.status(200).json({ success: true, donations: donationsRes.rows });
  },

  /**
   * Get single donation details with authorization checks
   */
  async getDonationById(req, res) {
    const { id } = req.params;

    const donRes = await query(
      `SELECT d.*, u.name as donor_name, u.phone as donor_phone, u.organization_name as donor_org,
              n.organization_name as matched_ngo_name, n.contact_phone as ngo_phone,
              a.id as assignment_id, a.status as assignment_status, a.verification_otp,
              v.name as volunteer_name, v.phone as volunteer_phone
       FROM donations d
       JOIN users u ON d.donor_id = u.id
       LEFT JOIN ngos n ON d.matched_ngo_id = n.id
       LEFT JOIN assignments a ON d.id = a.donation_id
       LEFT JOIN volunteers v ON a.volunteer_id = v.id
       WHERE d.id = $1`,
      [id]
    );

    if (donRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Donation not found.' });
    }

    const donation = donRes.rows[0];

    // Data Isolation Check: Non-admins can only view donations they are party to
    if (req.user.role === 'donor' && donation.donor_id !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Unauthorized: You do not own this donation record.' });
    }

    return res.status(200).json({ success: true, donation });
  },

  /**
   * Update donation (Only permitted before NGO acceptance)
   */
  async updateDonation(req, res) {
    const { id } = req.params;
    const { foodName, quantity, specialInstructions } = req.body;

    const donRes = await query('SELECT * FROM donations WHERE id = $1', [id]);
    if (donRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Donation not found.' });
    }

    const donation = donRes.rows[0];

    if (donation.donor_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Unauthorized: You cannot edit another donor listing.' });
    }

    if (donation.status !== 'CREATED' && donation.status !== 'NGO_MATCHED') {
      return res.status(400).json({
        success: false,
        error: `Cannot modify donation: It has already progressed to ${donation.status}.`,
      });
    }

    const updated = await query(
      `UPDATE donations
       SET food_name = COALESCE($1, food_name),
           quantity = COALESCE($2, quantity),
           special_instructions = COALESCE($3, special_instructions),
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [foodName, quantity, specialInstructions, id]
    );

    return res.status(200).json({ success: true, message: 'Donation updated.', donation: updated.rows[0] });
  },

  /**
   * Cancel an active donation (Donor action)
   * Allowed ONLY before food is picked up.
   */
  async cancelDonation(req, res) {
    const { id } = req.params;

    const result = await withTransaction(async (client) => {
      const donLock = await client.query('SELECT * FROM donations WHERE id = $1 FOR UPDATE', [id]);
      if (donLock.rows.length === 0) {
        throw { statusCode: 404, message: 'Donation record not found.' };
      }

      const donation = donLock.rows[0];

      if (donation.donor_id !== req.user.id && req.user.role !== 'admin') {
        throw { statusCode: 403, message: 'Unauthorized: You cannot cancel another donor listing.' };
      }

      if (donation.status === 'CANCELLED') {
        throw { statusCode: 400, message: 'This donation is already cancelled.' };
      }

      const unCancellable = ['PICKED_UP', 'DELIVERED', 'RECEIPT_CONFIRMED'];
      if (unCancellable.includes(donation.status)) {
        throw {
          statusCode: 400,
          message: `Cannot cancel donation: Food is already ${donation.status.replace(/_/g, ' ').toLowerCase()}. Food is already collected or delivered.`,
        };
      }

      // Update donation status
      const updated = await client.query(
        `UPDATE donations
         SET status = 'CANCELLED', updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [id]
      );

      // Cancel associated assignment if one exists
      await client.query(
        `UPDATE assignments
         SET status = 'cancelled', updated_at = NOW()
         WHERE donation_id = $1 AND status != 'delivered'`,
        [id]
      );

      await client.query(
        `INSERT INTO donation_status_history (donation_id, from_status, to_status, changed_by_user_id, notes)
         VALUES ($1, $2, 'CANCELLED', $3, 'Donation cancelled by donor')`,
        [id, donation.status, req.user.id]
      );

      return updated.rows[0];
    });

    return res.status(200).json({ success: true, message: 'Donation cancelled successfully.', donation: result });
  },

  /**
   * Get full lifecycle tracking timeline
   */
  async getTracking(req, res) {
    const { id } = req.params;

    const donRes = await query('SELECT * FROM donations WHERE id = $1', [id]);
    if (donRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Donation not found.' });
    }

    const donation = donRes.rows[0];
    const historyRes = await query(
      'SELECT * FROM donation_status_history WHERE donation_id = $1 ORDER BY created_at ASC',
      [id]
    );

    const asgnRes = await query(
      `SELECT a.*, v.name as volunteer_name, v.phone as volunteer_phone, v.rating as volunteer_rating
       FROM assignments a
       LEFT JOIN volunteers v ON a.volunteer_id = v.id
       WHERE a.donation_id = $1`,
      [id]
    );

    return res.status(200).json({
      success: true,
      donation,
      timeline: historyRes.rows,
      assignment: asgnRes.rows[0] || null,
    });
  },

  /**
   * Get recommended verified NGOs for this donation
   */
  async getMatches(req, res) {
    const { id } = req.params;

    const donRes = await query('SELECT * FROM donations WHERE id = $1', [id]);
    if (donRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Donation not found.' });
    }

    const matches = await matchNGOsForDonation(donRes.rows[0]);
    return res.status(200).json({ success: true, matches });
  },
};
