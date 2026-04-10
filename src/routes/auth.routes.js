// src/routes/auth.routes.js
import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { validate }       from '../middleware/validate.js';
import { authenticate }   from '../middleware/auth.js';
import { authLimiter, passwordLimiter } from '../middleware/rateLimiter.js';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validators/schemas.js';

const router = Router();

// Public routes (rate-limited)
router.post('/register',        authLimiter,     validate(registerSchema),       AuthController.register);
router.post('/login',           authLimiter,     validate(loginSchema),          AuthController.login);
router.post('/refresh',         authLimiter,     validate(refreshTokenSchema),   AuthController.refresh);
router.post('/logout',                           validate(refreshTokenSchema),   AuthController.logout);
router.post('/forgot-password', passwordLimiter, validate(forgotPasswordSchema), AuthController.forgotPassword);
router.post('/reset-password',  passwordLimiter, validate(resetPasswordSchema),  AuthController.resetPassword);

// Protected routes
router.post('/logout-all', authenticate, AuthController.logoutAll);
router.get('/profile',     authenticate, AuthController.getProfile);

export default router;
