import { Router } from 'express';
import { createReward, deleteReward, listMyRedemptions, listRewards, redeemReward, updateReward } from '../controllers/reward.controller.js';
import { allowRoles, requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();
router.use(requireAuth);
router.get('/', listRewards);
router.get('/redemptions/mine', allowRoles('student'), listMyRedemptions);
router.post('/:id/redeem', allowRoles('student'), redeemReward);
router.post('/', allowRoles('admin'), createReward);
router.patch('/:id', allowRoles('admin'), updateReward);
router.delete('/:id', allowRoles('admin'), deleteReward);
export default router;
