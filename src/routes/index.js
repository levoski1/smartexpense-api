// src/routes/index.js
import { Router }           from 'express';
import authRoutes           from './auth.routes.js';
import transactionRoutes    from './transaction.routes.js';
import budgetRoutes         from './budget.routes.js';
import aiRoutes             from './ai.routes.js';

const router = Router();

router.use('/auth',         authRoutes);
router.use('/transactions', transactionRoutes);
router.use('/budgets',      budgetRoutes);
router.use('/ai',           aiRoutes);

export default router;
