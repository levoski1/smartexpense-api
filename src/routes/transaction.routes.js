// src/routes/transaction.routes.js
import { Router } from 'express';
import { TransactionController } from '../controllers/transaction.controller.js';
import { validate }              from '../middleware/validate.js';
import { authenticate }          from '../middleware/auth.js';
import {
  createTransactionSchema,
  updateTransactionSchema,
  transactionQuerySchema,
} from '../validators/schemas.js';

const router = Router();

// All transaction routes require authentication
router.use(authenticate);

// Analytics (must come before /:id to avoid route conflicts)
router.get('/summary',    TransactionController.getSummary);
router.get('/breakdown',  TransactionController.getCategoryBreakdown);
router.get('/trend',      TransactionController.getMonthlyTrend);

// CRUD
router.get('/',    validate(transactionQuerySchema, 'query'), TransactionController.getAll);
router.post('/',   validate(createTransactionSchema),         TransactionController.create);
router.get('/:id',                                            TransactionController.getById);
router.patch('/:id', validate(updateTransactionSchema),       TransactionController.update);
router.delete('/:id',                                         TransactionController.delete);

export default router;
