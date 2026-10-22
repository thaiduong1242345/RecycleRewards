import { Router } from 'express';
import authRoutes from './auth.routes.js';
import wasteRoutes from './waste.routes.js';
import adminRoutes from './admin.routes.js';
import userRoutes from './user.routes.js';
import rewardRoutes from './reward.routes.js';

const router = Router();
router.use('/auth', authRoutes);
router.use('/submissions', wasteRoutes);
router.use('/waste', wasteRoutes);
router.use('/admin', adminRoutes);
router.use('/users', userRoutes);
router.use('/rewards', rewardRoutes);
export default router;
