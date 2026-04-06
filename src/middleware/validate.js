// src/middleware/validate.js
import { BadRequest } from '../utils/AppError.js';

/**
 * Middleware factory that validates request body/query against a Zod schema.
 * @param {ZodSchema} schema
 * @param {'body'|'query'|'params'} source
 */
export const validate = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source]);

  if (!result.success) {
    const errors = result.error.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return next(BadRequest('Validation failed', errors));
  }

  // Replace with parsed (coerced, defaulted) values
  req[source] = result.data;
  next();
};
