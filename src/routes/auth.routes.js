// src/routes/auth.routes.js
import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { validate }       from '../middleware/validate.js';
import { authenticate }   from '../middleware/auth.js';
import { authLimiter }    from '../middleware/rateLimiter.js';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
} from '../validators/schemas.js';

const router = Router();

// Public routes (rate-limited)
router.post('/register', authLimiter, validate(registerSchema),      AuthController.register);
router.post('/login',    authLimiter, validate(loginSchema),         AuthController.login);
router.post('/refresh',  authLimiter, validate(refreshTokenSchema),  AuthController.refresh);
router.post('/logout',               validate(refreshTokenSchema),   AuthController.logout);

// Protected routes
router.post('/logout-all', authenticate, AuthController.logoutAll);
router.get('/profile',     authenticate, AuthController.getProfile);

export default router;
