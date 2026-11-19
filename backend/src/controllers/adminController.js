import { query, withTransaction } from '../config/db.js';

/**
 * Admin Controller for AnnaSathi AI Platform Management
 */

// GET /api/v1/admin/stats
export const getSystemStats = async (req, res, next) => {
  try {
    const userStats = await query(
      `SELECT role, count(*)::int as count, status FROM users GROUP BY role, status`
    );

    const donationStats = await query(
      `SELECT status, count(*)::int as count, COALESCE(sum(quantity), 0)::numeric as total_quantity
       FROM donations GROUP BY status`
    );

    const ngoStats = await query(
      `SELECT verification_status, count(*)::int as count FROM ngos GROUP BY verification_status`
    );

    const assignmentStats = await query(
      `SELECT status, count(*)::int as count FROM assignments GROUP BY status`
    );

    const totalMealsRescued = await query(
      `SELECT COALESCE(sum(quantity), 0)::numeric as total_rescued
       FROM donations WHERE status IN ('DELIVERED', 'RECEIPT_CONFIRMED')`
    );

    const activeDeliveries = await query(
      `SELECT count(*)::int as count FROM assignments WHERE status IN ('assigned', 'in_transit_to_pickup', 'picked_up', 'in_transit_to_drop')`
    );

    res.status(200).json({
      success: true,
      data: {
        users: userStats.rows,
        donations: donationStats.rows,
        ngos: ngoStats.rows,
        assignments: assignmentStats.rows,
        totalMealsRescued: Number(totalMealsRescued.rows[0]?.total_rescued || 0),
        activeDeliveriesCount: Number(activeDeliveries.rows[0]?.count || 0)
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/admin/users
export const listUsers = async (req, res, next) => {
  try {
    const { role, is_active, status: queryStatus, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];

    if (role) {
      params.push(role);
      conditions.push(`role = $${params.length}`);
    }

    if (queryStatus) {
      params.push(queryStatus);
      conditions.push(`status = $${params.length}`);
    } else if (is_active !== undefined) {
      const activeState = is_active === 'true' || is_active === true ? 'active' : 'suspended';
      params.push(activeState);
      conditions.push(`status = $${params.length}`);
    }

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(name ILIKE $${params.length} OR email ILIKE $${params.length} OR phone ILIKE $${params.length})`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const usersResult = await query(
      `SELECT id, email, name, phone, role, status, (status = 'active') as is_active, (email_verified_at IS NOT NULL) as is_verified, created_at, updated_at
       FROM users ${whereClause} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    const countResult = await query(`SELECT count(*)::int as total FROM users ${whereClause}`, params);

    res.status(200).json({
      success: true,
      data: {
        users: usersResult.rows,
        pagination: {
          total: countResult.rows[0].total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(countResult.rows[0].total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/admin/users/:id/status
export const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { is_active, status: reqStatus } = req.body;

    const targetStatus = reqStatus || (is_active === true ? 'active' : is_active === false ? 'suspended' : 'active');

    const result = await query(
      `UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email, name, role, status, (status = 'active') as is_active`,
      [targetStatus, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Log admin audit action
    await query(
      `INSERT INTO admin_activity_logs (admin_id, action_type, target_id, target_type, description, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [req.user.id, targetStatus === 'active' ? 'USER_ACTIVATED' : 'USER_SUSPENDED', id, 'users', `Admin updated user status to ${targetStatus}`, JSON.stringify({ status: targetStatus })]
    );

    res.status(200).json({
      success: true,
      message: `User status updated to ${targetStatus}`,
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/admin/ngos
export const listNGOs = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const conditions = [];
    const params = [];

    if (status) {
      params.push(status);
      conditions.push(`n.verification_status = $${params.length}`);
    }

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(n.organization_name ILIKE $${params.length} OR u.email ILIKE $${params.length} OR n.registration_number ILIKE $${params.length})`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await query(
      `SELECT n.*, u.name as contact_name, u.email as contact_email, u.phone as contact_phone
       FROM ngos n
       JOIN users u ON n.user_id = u.id
       ${whereClause}
       ORDER BY n.created_at DESC`,
      params
    );

    res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/admin/ngos/:id/verify
export const reviewNGOVerification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!['VERIFIED', 'REJECTED'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Status must be either 'VERIFIED' or 'REJECTED'"
      });
    }

    const result = await withTransaction(async (client) => {
      const ngoCheck = await client.query(`SELECT * FROM ngos WHERE id = $1 FOR UPDATE`, [id]);
      if (ngoCheck.rows.length === 0) {
        throw new Error('NGO_NOT_FOUND');
      }

      const updatedNGO = await client.query(
        `UPDATE ngos
         SET verification_status = $1, verified_at = $2, verification_notes = $3, updated_at = NOW()
         WHERE id = $4
         RETURNING *`,
        [status, status === 'VERIFIED' ? new Date() : null, notes || null, id]
      );

      // Also update user's verified status
      await client.query(
        `UPDATE users SET email_verified_at = $1, updated_at = NOW() WHERE id = $2`,
        [status === 'VERIFIED' ? new Date() : null, updatedNGO.rows[0].user_id]
      );

      // Audit log
      await client.query(
        `INSERT INTO admin_activity_logs (admin_id, action_type, target_id, target_type, description, metadata)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [req.user.id, `NGO_${status}`, id, 'ngos', `Admin reviewed NGO verification: ${status}`, JSON.stringify({ notes })]
      );

      return updatedNGO.rows[0];
    });

    res.status(200).json({
      success: true,
      message: `NGO successfully marked as ${status}`,
      data: result
    });
  } catch (error) {
    if (error.message === 'NGO_NOT_FOUND') {
      return res.status(404).json({ success: false, error: 'NGO profile not found' });
    }
    next(error);
  }
};

// GET /api/v1/admin/donations
export const listAllDonations = async (req, res, next) => {
  try {
    const { status, donor_id, limit = 50, page = 1 } = req.query;
    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];

    if (status) {
      params.push(status);
      conditions.push(`d.status = $${params.length}`);
    }

    if (donor_id) {
      params.push(donor_id);
      conditions.push(`d.donor_id = $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await query(
      `SELECT d.*, u.name as donor_name, u.email as donor_email, u.phone as donor_phone,
              n.organization_name as matched_ngo_name
       FROM donations d
       JOIN users u ON d.donor_id = u.id
       LEFT JOIN ngos n ON d.matched_ngo_id = n.id
       ${whereClause}
       ORDER BY d.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    const countResult = await query(`SELECT count(*)::int as total FROM donations d ${whereClause}`, params);

    res.status(200).json({
      success: true,
      data: {
        donations: result.rows,
        pagination: {
          total: countResult.rows[0].total,
          page: Number(page),
          limit: Number(limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/admin/telemetry
export const getActiveDeliveriesTelemetry = async (req, res, next) => {
  try {
    const activeAssignments = await query(
      `SELECT a.id as assignment_id, a.status as assignment_status, a.assigned_at as created_at,
              d.id as donation_id, d.food_name as donation_title, d.category as food_category, d.quantity, d.unit,
              a.pickup_address, d.latitude as pickup_latitude, d.longitude as pickup_longitude,
              n.latitude as delivery_latitude, n.longitude as delivery_longitude,
              v.id as volunteer_id, v.name as volunteer_name, v.phone as volunteer_phone,
              v.current_latitude, v.current_longitude, v.location_updated_at
       FROM assignments a
       JOIN donations d ON a.donation_id = d.id
       JOIN ngos n ON a.ngo_id = n.id
       LEFT JOIN volunteers v ON a.volunteer_id = v.id
       WHERE a.status IN ('assigned', 'in_transit_to_pickup', 'picked_up', 'in_transit_to_drop')
       ORDER BY a.assigned_at DESC`
    );

    res.status(200).json({
      success: true,
      data: activeAssignments.rows
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/admin/audit-logs
export const getAuditLogs = async (req, res, next) => {
  try {
    const { limit = 50, page = 1 } = req.query;
    const offset = (page - 1) * limit;

    const result = await query(
      `SELECT l.*, u.name as user_name, u.email as user_email, u.role as user_role
       FROM admin_activity_logs l
       LEFT JOIN users u ON l.admin_id = u.id
       ORDER BY l.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
};
