import { Router } from 'express';
import {
  predictUrgency,
  matchNGOsForDonation,
  predictDemand,
  chatWithAI,
  getAIProviderStatus,
  updateAIProvider,
} from '../controllers/aiController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// Provider status and switching
router.get('/provider', getAIProviderStatus);
router.put('/provider', requireAuth, requireRole('admin'), updateAIProvider);

// Chatbot can be accessed by authenticated users or visitors
router.post('/chat', chatWithAI);

// AI Urgency calculation
router.post('/urgency/predict', predictUrgency);

// NGO Matching for donation
router.get('/match/:donationId', requireAuth, matchNGOsForDonation);

// Demand prediction proxy
router.post('/demand/predict', predictDemand);

export default router;
