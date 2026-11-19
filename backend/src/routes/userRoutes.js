import { Router } from 'express';
import { userController } from '../controllers/userController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/me', userController.getMe);
router.put('/me', userController.updateMe);
router.patch('/me', userController.updateMe);
router.get('/:id', userController.getUserById);

export default router;
