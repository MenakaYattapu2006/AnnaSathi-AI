import { Router } from 'express';
import { donationController } from '../controllers/donationController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// Public live feed endpoint (accessible on landing page without login)
router.get('/public-activity', donationController.getPublicRecentActivity);

router.use(requireAuth);

router.get('/', donationController.getDonations);
router.post('/', requireRole(['donor', 'admin']), donationController.createDonation);
router.get('/:id', donationController.getDonationById);
router.put('/:id', requireRole(['donor', 'admin']), donationController.updateDonation);
router.patch('/:id/cancel', donationController.cancelDonation);
router.get('/:id/tracking', donationController.getTracking);
router.get('/:id/matches', donationController.getMatches);

export default router;
