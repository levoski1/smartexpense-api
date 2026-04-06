// src/routes/budget.routes.js
import { Router } from 'express';
import { BudgetController } from '../controllers/budget.controller.js';
import { validate }         from '../middleware/validate.js';
import { authenticate }     from '../middleware/auth.js';
import {
  createBudgetSchema,
  updateBudgetSchema,
} from '../validators/schemas.js';

const router = Router();

router.use(authenticate);

router.get('/active',    BudgetController.getActive);
router.get('/dashboard', BudgetController.getDashboard);

router.get('/',    BudgetController.getAll);
router.post('/',   validate(createBudgetSchema), BudgetController.create);
router.get('/:id',                               BudgetController.getById);
router.patch('/:id', validate(updateBudgetSchema), BudgetController.update);
router.delete('/:id',                            BudgetController.delete);

export default router;
