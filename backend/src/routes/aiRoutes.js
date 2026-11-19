import { Router } from 'express';
import {
  predictUrgency,
  matchNGOsForDonation,
  predictDemand,
  chatWithAI
} from '../controllers/aiController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Chatbot can be accessed by authenticated users or visitors
router.post('/chat', chatWithAI);

// AI Urgency calculation
router.post('/urgency/predict', predictUrgency);

// NGO Matching for donation
router.get('/match/:donationId', requireAuth, matchNGOsForDonation);

// Demand prediction proxy
router.post('/demand/predict', predictDemand);

export default router;
