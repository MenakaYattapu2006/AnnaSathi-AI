import { Router } from 'express';
import {
  getSystemStats,
  listUsers,
  updateUserStatus,
  updateUserDetails,
  deleteUser,
  listNGOs,
  reviewNGOVerification,
  listAllDonations,
  getActiveDeliveriesTelemetry,
  getAuditLogs,
  getDistinctCities
} from '../controllers/adminController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);
router.use(requireRole(['admin']));

router.get('/stats', getSystemStats);
router.get('/users', listUsers);
router.patch('/users/:id/status', updateUserStatus);
router.put('/users/:id', updateUserDetails);
router.delete('/users/:id', deleteUser);
router.get('/ngos', listNGOs);
router.patch('/ngos/:id/verify', reviewNGOVerification);
router.get('/donations', listAllDonations);
router.get('/telemetry', getActiveDeliveriesTelemetry);
router.get('/audit-logs', getAuditLogs);
router.get('/cities', getDistinctCities);

export default router;
