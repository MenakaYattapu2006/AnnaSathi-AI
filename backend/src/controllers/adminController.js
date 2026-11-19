import { query, withTransaction } from '../config/db.js';

/**
 * Admin Controller for AnnaSathi AI Platform Management
 */

// GET /api/v1/admin/stats
export const getSystemStats = async (req, res, next) => {
  try {
    const userStats = await query(
      `SELECT role, count(*)::int as count, is_active FROM users GROUP BY role, is_active`
    );

    const donationStats = await query(
      `SELECT status, count(*)::int as count, COALESCE(sum(quantity), 0)::numeric as total_quantity
       FROM donations GROUP BY status`
    );

    const ngoStats = await query(
      `SELECT verification_status, count(*)::int as count FROM ngos GROUP BY verification_status`
    );

    const assignmentStats = await query(
      `SELECT status, count(*)::int as count FROM volunteer_assignments GROUP BY status`
    );

    const totalMealsRescued = await query(
      `SELECT COALESCE(sum(quantity), 0)::numeric as total_rescued
       FROM donations WHERE status IN ('DELIVERED', 'RECEIPT_CONFIRMED')`
    );

    const activeDeliveries = await query(
      `SELECT count(*)::int as count FROM volunteer_assignments WHERE status IN ('ASSIGNED', 'PICKED_UP')`
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
    const { role, is_active, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];

    if (role) {
      params.push(role);
      conditions.push(`role = $${params.length}`);
    }

    if (is_active !== undefined) {
      params.push(is_active === 'true');
      conditions.push(`is_active = $${params.length}`);
    }

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(name ILIKE $${params.length} OR email ILIKE $${params.length} OR phone ILIKE $${params.length})`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const usersResult = await query(
      `SELECT id, email, name, phone, role, is_active, is_verified, created_at, updated_at
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
    const { is_active } = req.body;

    if (typeof is_active !== 'boolean') {
      return res.status(400).json({ success: false, error: 'is_active boolean is required' });
    }

    const result = await query(
      `UPDATE users SET is_active = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email, name, role, is_active`,
      [is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Log admin audit action
    await query(
      `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.user.id, is_active ? 'USER_ACTIVATED' : 'USER_SUSPENDED', 'users', id, JSON.stringify({ is_active })]
    );

    res.status(200).json({
      success: true,
      message: `User status updated to ${is_active ? 'Active' : 'Suspended'}`,
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
      conditions.push(`(n.organization_name ILIKE $${params.length} OR u.email ILIKE $${params.length} OR n.darpan_id ILIKE $${params.length})`);
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
        `UPDATE users SET is_verified = $1, updated_at = NOW() WHERE id = $2`,
        [status === 'VERIFIED', updatedNGO.rows[0].user_id]
      );

      // Audit log
      await client.query(
        `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, metadata)
         VALUES ($1, $2, $3, $4, $5)`,
        [req.user.id, `NGO_${status}`, 'ngos', id, JSON.stringify({ notes })]
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
      `SELECT a.id as assignment_id, a.status as assignment_status, a.created_at,
              d.id as donation_id, d.title as donation_title, d.food_category, d.quantity, d.unit,
              d.pickup_address, d.pickup_latitude, d.pickup_longitude,
              d.delivery_latitude, d.delivery_longitude,
              v.id as volunteer_id, u.name as volunteer_name, u.phone as volunteer_phone,
              vl.latitude as current_latitude, vl.longitude as current_longitude, vl.updated_at as location_updated_at
       FROM volunteer_assignments a
       JOIN donations d ON a.donation_id = d.id
       JOIN volunteers v ON a.volunteer_id = v.id
       JOIN users u ON v.user_id = u.id
       LEFT JOIN volunteer_locations vl ON vl.volunteer_id = v.id
       WHERE a.status IN ('ASSIGNED', 'PICKED_UP')
       ORDER BY a.created_at DESC`
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
       FROM audit_logs l
       LEFT JOIN users u ON l.user_id = u.id
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
