import { Router } from 'express';
import { firebaseSession, googleLogin, login, passwordReset } from '../controllers/auth.controller.js';
import { rateLimit } from '../middlewares/rate-limit.middleware.js';

const router = Router();
router.post('/login', login);
router.post('/session', firebaseSession);
router.post('/google', googleLogin);
router.post('/password-reset', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  key: (req) => `${req.ip}:${String(req.body?.email || '').trim().toLowerCase()}`,
  message: 'Bạn đã yêu cầu đặt lại mật khẩu quá nhiều lần. Hãy thử lại sau 15 phút.',
}), passwordReset);
export default router;
