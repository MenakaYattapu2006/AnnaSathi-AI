// User Profile Controller
import { query } from '../config/db.js';

export const userController = {
  /**
   * Get current authenticated user profile
   */
  async getMe(req, res) {
    const userRes = await query(
      `SELECT id, name, email, phone, role, status, profile_image, bio, organization_name, address, city, state, pincode, created_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User record not found.' });
    }

    return res.status(200).json({ success: true, user: userRes.rows[0] });
  },

  /**
   * Update own user profile
   */
  async updateMe(req, res) {
    const { name, phone, bio, organizationName, address, city, state, pincode, profileImage } = req.body;

    const userRes = await query(
      `UPDATE users
       SET name = COALESCE($1, name),
           phone = COALESCE($2, phone),
           bio = COALESCE($3, bio),
           organization_name = COALESCE($4, organization_name),
           address = COALESCE($5, address),
           city = COALESCE($6, city),
           state = COALESCE($7, state),
           pincode = COALESCE($8, pincode),
           profile_image = COALESCE($9, profile_image),
           updated_at = NOW()
       WHERE id = $10
       RETURNING id, name, email, phone, role, status, profile_image, bio, organization_name, address, city, state, pincode, created_at, updated_at`,
      [name, phone, bio, organizationName, address, city, state, pincode, profileImage, req.user.id]
    );

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: userRes.rows[0],
    });
  },

  /**
   * Get sanitized public profile of a user
   */
  async getUserById(req, res) {
    const { id } = req.params;

    const userRes = await query(
      `SELECT id, name, role, status, profile_image, organization_name, city, state, created_at
       FROM users WHERE id = $1`,
      [id]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    return res.status(200).json({ success: true, user: userRes.rows[0] });
  },
};
