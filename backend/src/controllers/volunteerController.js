// Volunteer Management Controller: Task Claiming, Pickup, Delivery, and Consent-Based Location
import { query, withTransaction } from '../config/db.js';

export const volunteerController = {
  /**
   * Get volunteer profile for authenticated user
   */
  async getMe(req, res) {
    const volRes = await query('SELECT * FROM volunteers WHERE user_id = $1', [req.user.id]);
    if (volRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Volunteer record not found.' });
    }
    return res.status(200).json({ success: true, volunteer: volRes.rows[0] });
  },

  /**
   * Update volunteer profile (Protects rating & total deliveries from modification)
   */
  async updateMe(req, res) {
    const { name, phone, vehicleType, serviceAreas } = req.body;

    const volRes = await query(
      `UPDATE volunteers
       SET name = COALESCE($1, name),
           phone = COALESCE($2, phone),
           vehicle_type = COALESCE($3, vehicle_type),
           service_areas = COALESCE($4, service_areas),
           updated_at = NOW()
       WHERE user_id = $5
       RETURNING *`,
      [name, phone, vehicleType, serviceAreas, req.user.id]
    );

    if (volRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Volunteer profile not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Volunteer profile updated.',
      volunteer: volRes.rows[0],
    });
  },

  /**
   * Update Availability Status (available | busy | offline)
   */
  async updateAvailability(req, res) {
    const { availability } = req.body;
    if (!['available', 'busy', 'offline'].includes(availability)) {
      return res.status(400).json({ success: false, error: 'Invalid availability state.' });
    }

    const volRes = await query(
      'UPDATE volunteers SET availability = $1, updated_at = NOW() WHERE user_id = $2 RETURNING *',
      [availability, req.user.id]
    );

    return res.status(200).json({
      success: true,
      message: `Availability updated to ${availability}.`,
      volunteer: volRes.rows[0],
    });
  },

  /**
   * Get Available Unclaimed Tasks
   */
  async getAvailableTasks(req, res) {
    const tasksRes = await query(
      `SELECT a.*, d.food_name, d.category, d.quantity, d.unit, d.urgency_score, d.urgency_level,
              d.preparation_time, d.expiry_time, d.dietary_type,
              n.organization_name as destination_ngo_name
       FROM assignments a
       JOIN donations d ON a.donation_id = d.id
       JOIN ngos n ON a.ngo_id = n.id
       WHERE a.status = 'available'
         AND (a.volunteer_id IS NULL OR a.volunteer_id = '')
         AND d.status = 'NGO_ACCEPTED'
       ORDER BY d.urgency_score DESC, a.created_at DESC`
    );

    return res.status(200).json({ success: true, tasks: tasksRes.rows });
  },

  /**
   * Get Tasks Assigned to Authenticated Volunteer
   */
  async getAssignedTasks(req, res) {
    const volRes = await query('SELECT id FROM volunteers WHERE user_id = $1', [req.user.id]);
    if (volRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Volunteer profile not found.' });
    }

    const volunteerId = volRes.rows[0].id;

    const tasksRes = await query(
      `SELECT a.*, d.food_name, d.category, d.quantity, d.unit, d.urgency_score, d.urgency_level,
              d.preparation_time, d.expiry_time, d.status as donation_status,
              n.organization_name as destination_ngo_name
       FROM assignments a
       JOIN donations d ON a.donation_id = d.id
       JOIN ngos n ON a.ngo_id = n.id
       WHERE a.volunteer_id = $1
         AND a.status != 'cancelled'
       ORDER BY a.updated_at DESC`,
      [volunteerId]
    );

    return res.status(200).json({ success: true, tasks: tasksRes.rows });
  },

  /**
   * Concurrency-Safe Transactional Task Acceptance
   * Uses Row-Level Locking (SELECT ... FOR UPDATE) to prevent duplicate claims.
   */
  async acceptAssignment(req, res) {
    const { id } = req.params;

    const volRes = await query('SELECT * FROM volunteers WHERE user_id = $1', [req.user.id]);
    if (volRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Volunteer profile not found.' });
    }

    const volunteer = volRes.rows[0];

    if (volunteer.status !== 'active') {
      return res.status(403).json({ success: false, error: 'Inactive volunteer accounts cannot claim tasks.' });
    }

    const result = await withTransaction(async (client) => {
      // Row-Level Lock: Acquired exclusively for this assignment record
      const asgnLock = await client.query('SELECT * FROM assignments WHERE id = $1 FOR UPDATE', [id]);
      if (asgnLock.rows.length === 0) {
        throw { statusCode: 404, message: 'Assignment task record not found.' };
      }

      const assignment = asgnLock.rows[0];

      if (assignment.volunteer_id || assignment.status !== 'available') {
        throw {
          statusCode: 409,
          message: 'Conflict: This delivery task has already been accepted by another volunteer.',
        };
      }

      const donLock = await client.query('SELECT * FROM donations WHERE id = $1 FOR UPDATE', [assignment.donation_id]);
      const donation = donLock.rows[0];

      if (!donation || donation.status === 'CANCELLED') {
        throw { statusCode: 400, message: 'This donation has been cancelled by the donor.' };
      }

      if (donation.status !== 'NGO_ACCEPTED') {
        throw { statusCode: 400, message: `Donation is not in an eligible state for transport (status: ${donation.status}).` };
      }

      // Update assignment
      const updatedAsgn = await client.query(
        `UPDATE assignments
         SET volunteer_id = $1, status = 'assigned', assigned_at = NOW(), updated_at = NOW()
         WHERE id = $2
         RETURNING *`,
        [volunteer.id, assignment.id]
      );

      // Synchronize donation status
      await client.query(
        `UPDATE donations
         SET status = 'VOLUNTEER_ASSIGNED', updated_at = NOW()
         WHERE id = $1`,
        [donation.id]
      );

      // Record audit history
      await client.query(
        `INSERT INTO donation_status_history (donation_id, from_status, to_status, changed_by_user_id, notes)
         VALUES ($1, 'NGO_ACCEPTED', 'VOLUNTEER_ASSIGNED', $2, 'Assigned to volunteer: ' || $3)`,
        [donation.id, req.user.id, volunteer.name]
      );

      return updatedAsgn.rows[0];
    });

    return res.status(200).json({
      success: true,
      message: 'Task accepted successfully. Proceed to donor address for pickup.',
      assignment: result,
    });
  },

  /**
   * Confirm Food Pickup from Donor
   */
  async pickupAssignment(req, res) {
    const { id } = req.params;
    const { notes } = req.body;

    const volRes = await query('SELECT id, name FROM volunteers WHERE user_id = $1', [req.user.id]);
    if (volRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Volunteer profile not found.' });
    }

    const volunteer = volRes.rows[0];

    const result = await withTransaction(async (client) => {
      const asgnLock = await client.query('SELECT * FROM assignments WHERE id = $1 FOR UPDATE', [id]);
      if (asgnLock.rows.length === 0) {
        throw { statusCode: 404, message: 'Assignment not found.' };
      }

      const assignment = asgnLock.rows[0];

      if (assignment.volunteer_id !== volunteer.id) {
        throw { statusCode: 403, message: 'Unauthorized: You can only update tasks assigned to your account.' };
      }

      if (assignment.status === 'picked_up') {
        throw { statusCode: 400, message: 'Food has already been marked as picked up.' };
      }

      if (assignment.status !== 'assigned' && assignment.status !== 'in_transit_to_pickup') {
        throw { statusCode: 400, message: `Cannot mark picked up from status "${assignment.status}".` };
      }

      const updatedAsgn = await client.query(
        `UPDATE assignments
         SET status = 'picked_up',
             actual_pickup_time = NOW(),
             picked_up_at = NOW(),
             notes = CASE WHEN $1::text IS NOT NULL THEN notes || ' | Pickup: ' || $1 ELSE notes END,
             updated_at = NOW()
         WHERE id = $2
         RETURNING *`,
        [notes || null, assignment.id]
      );

      await client.query(
        `UPDATE donations SET status = 'PICKED_UP', updated_at = NOW() WHERE id = $1`,
        [assignment.donation_id]
      );

      await client.query(
        `INSERT INTO donation_status_history (donation_id, from_status, to_status, changed_by_user_id, notes)
         VALUES ($1, 'VOLUNTEER_ASSIGNED', 'PICKED_UP', $2, 'Food collected from donor location')`,
        [assignment.donation_id, req.user.id]
      );

      return updatedAsgn.rows[0];
    });

    return res.status(200).json({
      success: true,
      message: 'Pickup confirmed. Safe transport to shelter initialized.',
      assignment: result,
    });
  },

  /**
   * Confirm Food Delivery at Destination NGO
   * Prerequisite: Delivery cannot occur before pickup!
   */
  async deliverAssignment(req, res) {
    const { id } = req.params;
    const { notes } = req.body;

    const volRes = await query('SELECT id, name FROM volunteers WHERE user_id = $1', [req.user.id]);
    if (volRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Volunteer profile not found.' });
    }

    const volunteer = volRes.rows[0];

    const result = await withTransaction(async (client) => {
      const asgnLock = await client.query('SELECT * FROM assignments WHERE id = $1 FOR UPDATE', [id]);
      if (asgnLock.rows.length === 0) {
        throw { statusCode: 404, message: 'Assignment not found.' };
      }

      const assignment = asgnLock.rows[0];

      if (assignment.volunteer_id !== volunteer.id) {
        throw { statusCode: 403, message: 'Unauthorized: You can only update tasks assigned to your account.' };
      }

      if (assignment.status === 'delivered') {
        throw { statusCode: 400, message: 'Task is already marked as delivered.' };
      }

      // Strict prerequisite check: Delivery cannot occur before pickup!
      if (assignment.status !== 'picked_up' && assignment.status !== 'in_transit_to_drop') {
        throw {
          statusCode: 400,
          message: 'Delivery rejected: Food must be picked up from the donor before it can be marked as delivered.',
        };
      }

      const updatedAsgn = await client.query(
        `UPDATE assignments
         SET status = 'delivered',
             actual_delivery_time = NOW(),
             delivered_at = NOW(),
             notes = CASE WHEN $1::text IS NOT NULL THEN notes || ' | Delivered: ' || $1 ELSE notes END,
             updated_at = NOW()
         WHERE id = $2
         RETURNING *`,
        [notes || null, assignment.id]
      );

      // Donation status transitions strictly to DELIVERED (NGO confirms receipt separately)
      await client.query(
        `UPDATE donations SET status = 'DELIVERED', updated_at = NOW() WHERE id = $1`,
        [assignment.donation_id]
      );

      // Increment volunteer completed deliveries
      await client.query(
        `UPDATE volunteers
         SET total_deliveries_completed = total_deliveries_completed + 1,
             updated_at = NOW()
         WHERE id = $1`,
        [volunteer.id]
      );

      await client.query(
        `INSERT INTO donation_status_history (donation_id, from_status, to_status, changed_by_user_id, notes)
         VALUES ($1, 'PICKED_UP', 'DELIVERED', $2, 'Food delivered to destination shelter')`,
        [assignment.donation_id, req.user.id]
      );

      return updatedAsgn.rows[0];
    });

    return res.status(200).json({
      success: true,
      message: 'Delivery marked as complete. NGO partner has been notified to verify and confirm receipt.',
      assignment: result,
    });
  },

  /**
   * Completed Task Delivery History
   */
  async getHistory(req, res) {
    const volRes = await query('SELECT id FROM volunteers WHERE user_id = $1', [req.user.id]);
    if (volRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Volunteer profile not found.' });
    }

    const historyRes = await query(
      `SELECT a.*, d.food_name, d.quantity, d.unit, d.status as donation_status,
              n.organization_name as destination_ngo_name
       FROM assignments a
       JOIN donations d ON a.donation_id = d.id
       JOIN ngos n ON a.ngo_id = n.id
       WHERE a.volunteer_id = $1 AND a.status = 'delivered'
       ORDER BY a.delivered_at DESC`,
      [volRes.rows[0].id]
    );

    return res.status(200).json({ success: true, history: historyRes.rows });
  },

  /**
   * Consent-Based Volunteer Live Location Updates
   */
  async updateLocation(req, res) {
    const { latitude, longitude, heading, speed, assignmentId } = req.body;

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res.status(400).json({ success: false, error: 'Valid numerical latitude and longitude coordinates are required.' });
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json({ success: false, error: 'Coordinates are out of geographical range.' });
    }

    const volRes = await query('SELECT id FROM volunteers WHERE user_id = $1', [req.user.id]);
    if (volRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Volunteer profile not found.' });
    }

    const volunteerId = volRes.rows[0].id;

    await withTransaction(async (client) => {
      await client.query(
        `UPDATE volunteers
         SET current_latitude = $1, current_longitude = $2, location_updated_at = NOW()
         WHERE id = $3`,
        [latitude, longitude, volunteerId]
      );

      await client.query(
        `INSERT INTO volunteer_location_updates (volunteer_id, assignment_id, latitude, longitude, heading, speed)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [volunteerId, assignmentId || null, latitude, longitude, heading || null, speed || null]
      );
    });

    return res.status(200).json({ success: true, message: 'Location recorded.' });
  },
};
