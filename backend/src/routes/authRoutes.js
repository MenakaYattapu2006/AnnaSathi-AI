import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/register', authController.register);
router.post('/verify-otp', authController.verifyRegisterOtp);

router.post('/login', authController.login);
router.post('/verify-login-otp', authController.verifyLoginOtp);
router.post('/logout', authController.logout);

router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

router.get('/me', requireAuth, authController.getMe);

export default router;
