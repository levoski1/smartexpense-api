// src/validators/schemas.js
import { z } from 'zod';

// ─── AUTH ─────────────────────────────────────────────────────
export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const resetPasswordSchema = z.object({
  token:    z.string().min(1, 'Reset token is required'),
  password: passwordSchema,
});

// ─── TRANSACTIONS ─────────────────────────────────────────────
export const createTransactionSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE'], { message: 'Type must be INCOME or EXPENSE' }),
  amount: z.number().positive('Amount must be positive').multipleOf(0.01),
  category: z.string().min(1).max(50),
  description: z.string().max(255).optional(),
  date: z.string().datetime().optional(),
});

export const updateTransactionSchema = createTransactionSchema.partial();

export const transactionQuerySchema = z.object({
  page:     z.coerce.number().int().positive().default(1),
  limit:    z.coerce.number().int().min(1).max(100).default(20),
  type:     z.enum(['INCOME', 'EXPENSE']).optional(),
  category: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate:   z.string().datetime().optional(),
  sortBy:    z.enum(['date', 'amount', 'createdAt']).default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ─── BUDGETS ──────────────────────────────────────────────────
const budgetBaseSchema = z.object({
  category:  z.string().min(1).max(50),
  limit:     z.number().positive('Limit must be positive'),
  period:    z.enum(['WEEKLY', 'MONTHLY', 'YEARLY']).default('MONTHLY'),
  startDate: z.string().datetime(),
  endDate:   z.string().datetime(),
});

export const createBudgetSchema = budgetBaseSchema.refine(
  data => new Date(data.endDate) > new Date(data.startDate),
  { message: 'End date must be after start date', path: ['endDate'] }
);

export const updateBudgetSchema = budgetBaseSchema.partial().refine(
  data => !data.startDate || !data.endDate || new Date(data.endDate) > new Date(data.startDate),
  { message: 'End date must be after start date', path: ['endDate'] }
);
