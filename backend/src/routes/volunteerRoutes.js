import { Router } from 'express';
import { volunteerController } from '../controllers/volunteerController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.use(requireRole(['volunteer', 'admin']));

router.get('/me', volunteerController.getMe);
router.put('/me', volunteerController.updateMe);
router.patch('/availability', volunteerController.updateAvailability);

router.get('/available-tasks', volunteerController.getAvailableTasks);
router.get('/assigned-tasks', volunteerController.getAssignedTasks);

router.post('/accept/:assignmentId', volunteerController.acceptAssignment);
router.post('/pickup/:assignmentId', volunteerController.pickupAssignment);
router.post('/deliver/:assignmentId', volunteerController.deliverAssignment);

router.get('/history', volunteerController.getHistory);
router.post('/location', volunteerController.updateLocation);

export default router;
