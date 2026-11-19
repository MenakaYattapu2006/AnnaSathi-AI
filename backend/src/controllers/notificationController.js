import { query } from '../config/db.js';

/**
 * Notification Controller for AnnaSathi AI
 * Matches database schema: recipient_id, status ('unread' | 'read'), read_at
 */

// GET /api/v1/notifications
export const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { unread_only, limit = 20, page = 1 } = req.query;
    const offset = (page - 1) * limit;

    let filter = `WHERE recipient_id = $1`;
    const params = [userId];

    if (unread_only === 'true') {
      filter += ` AND status = 'unread'`;
    }

    const result = await query(
      `SELECT * FROM notifications
       ${filter}
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [...params, limit, offset]
    );

    const countRes = await query(
      `SELECT count(*)::int as total FROM notifications ${filter}`,
      params
    );

    res.status(200).json({
      success: true,
      notifications: result.rows,
      data: {
        notifications: result.rows,
        pagination: {
          total: countRes.rows[0]?.total || 0,
          page: Number(page),
          limit: Number(limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v1/notifications/unread-count
export const getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await query(
      `SELECT count(*)::int as unread_count FROM notifications WHERE recipient_id = $1 AND status = 'unread'`,
      [userId]
    );

    res.status(200).json({
      success: true,
      unreadCount: result.rows[0]?.unread_count || 0,
      data: {
        unreadCount: result.rows[0]?.unread_count || 0
      }
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/v1/notifications/:id/read
export const markNotificationRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await query(
      `UPDATE notifications SET status = 'read', read_at = NOW() WHERE id = $1 AND recipient_id = $2 RETURNING *`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Notification not found' });
    }

    res.status(200).json({
      success: true,
      notification: result.rows[0],
      data: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/notifications/mark-all-read
export const markAllNotificationsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;

    await query(
      `UPDATE notifications SET status = 'read', read_at = NOW() WHERE recipient_id = $1 AND status = 'unread'`,
      [userId]
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
};
