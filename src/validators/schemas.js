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

// Accepts dd/mm/yyyy or ISO datetime, converts to JS Date
const parseDateInput = (val) => {
  if (!val) return undefined;
  // dd/mm/yyyy
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(val)) {
    const [dd, mm, yyyy] = val.split('/');
    return new Date(`${yyyy}-${mm}-${dd}T00:00:00.000Z`);
  }
  // ISO string fallback
  const d = new Date(val);
  if (isNaN(d.getTime())) throw new Error('Invalid date format. Use dd/mm/yyyy');
  return d;
};

const dateField = z.string().optional().transform((val, ctx) => {
  if (!val) return undefined;
  try { return parseDateInput(val); }
  catch { ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid date. Use dd/mm/yyyy' }); return z.NEVER; }
});

export const createTransactionSchema = z.object({
  type:        z.string().min(1).transform(v => v.toUpperCase()),
  amount:      z.number().positive('Amount must be positive').multipleOf(0.01),
  category:    z.string().min(1).max(50).transform(v => v.toLowerCase()),
  description: z.string().max(255).optional(),
  date:        dateField,
});

export const updateTransactionSchema = z.object({
  type:        z.string().min(1).transform(v => v.toUpperCase()).optional(),
  amount:      z.number().positive('Amount must be positive').multipleOf(0.01).optional(),
  category:    z.string().min(1).max(50).transform(v => v.toLowerCase()).optional(),
  description: z.string().max(255).optional(),
  date:        dateField,
});

export const transactionQuerySchema = z.object({
  page:      z.coerce.number().int().positive().default(1),
  limit:     z.coerce.number().int().min(1).max(100).default(20),
  type:      z.string().transform(v => v.toUpperCase()).optional(),
  category:  z.string().optional(),
  startDate: z.string().optional(),
  endDate:   z.string().optional(),
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
