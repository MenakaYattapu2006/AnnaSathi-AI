import { Router } from 'express';
import { ngoController } from '../controllers/ngoController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { upload } from '../services/storageService.js';

const router = Router();

router.use(requireAuth);

router.get('/me', requireRole(['ngo', 'admin']), ngoController.getMe);
router.put('/me', requireRole(['ngo', 'admin']), ngoController.updateMe);
router.post('/documents', requireRole(['ngo', 'admin']), upload.single('document'), ngoController.uploadDocument);
router.get('/verification', requireRole(['ngo', 'admin']), ngoController.getVerificationStatus);

router.get('/available-donations', requireRole(['ngo', 'admin']), ngoController.getAvailableDonations);
router.get('/accepted-donations', requireRole(['ngo', 'admin']), ngoController.getAcceptedDonations);

router.post('/accept/:id', requireRole(['ngo', 'admin']), ngoController.acceptDonation);
router.post('/accept-donation/:id', requireRole(['ngo', 'admin']), ngoController.acceptDonation);

router.post('/reject/:id', requireRole(['ngo', 'admin']), ngoController.rejectDonation);
router.post('/reject-donation/:id', requireRole(['ngo', 'admin']), ngoController.rejectDonation);

router.post('/confirm-receipt/:id', requireRole(['ngo', 'admin']), ngoController.confirmReceipt);

export default router;
