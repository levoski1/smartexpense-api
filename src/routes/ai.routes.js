// src/routes/ai.routes.js
import { Router } from 'express';
import { AIController } from '../controllers/ai.controller.js';
import { authenticate } from '../middleware/auth.js';
import { aiLimiter }    from '../middleware/rateLimiter.js';

const router = Router();

router.use(authenticate, aiLimiter);

router.get('/insights', AIController.getInsights);
router.post('/chat',    AIController.chat);

export default router;
