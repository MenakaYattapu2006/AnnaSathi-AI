import { Router } from 'express';
import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead
} from '../controllers/notificationController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/:id/read', markNotificationRead);
router.post('/mark-all-read', markAllNotificationsRead);

export default router;
