// src/utils/AppError.js

/**
 * Custom error class for operational errors.
 * Operational errors = expected errors we can handle gracefully
 * (e.g., wrong password, not found, validation failure).
 *
 * Programming errors (bugs) = unexpected errors — let them crash and log.
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errors = errors; // for Zod field-level validation errors

    Error.captureStackTrace(this, this.constructor);
  }
}

// Convenience factories
export const BadRequest    = (msg, errors) => new AppError(msg, 400, errors);
export const Unauthorized  = (msg = 'Unauthorized')          => new AppError(msg, 401);
export const Forbidden     = (msg = 'Access denied')         => new AppError(msg, 403);
export const NotFound      = (msg = 'Resource not found')    => new AppError(msg, 404);
export const Conflict      = (msg = 'Resource already exists') => new AppError(msg, 409);
export const InternalError = (msg = 'Internal server error') => new AppError(msg, 500);
