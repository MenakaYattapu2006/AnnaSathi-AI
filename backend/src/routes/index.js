import { Router } from 'express';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import donationRoutes from './donationRoutes.js';
import ngoRoutes from './ngoRoutes.js';
import volunteerRoutes from './volunteerRoutes.js';
import adminRoutes from './adminRoutes.js';
import aiRoutes from './aiRoutes.js';
import notificationRoutes from './notificationRoutes.js';

const apiRouter = Router();

// Health check endpoint
apiRouter.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'AnnaSathi AI Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/donations', donationRoutes);
apiRouter.use('/ngos', ngoRoutes);
apiRouter.use('/ngo', ngoRoutes); // convenience alias
apiRouter.use('/volunteers', volunteerRoutes);
apiRouter.use('/volunteer', volunteerRoutes); // convenience alias
apiRouter.use('/admin', adminRoutes);
apiRouter.use('/ai', aiRoutes);
apiRouter.use('/notifications', notificationRoutes);

export default apiRouter;
