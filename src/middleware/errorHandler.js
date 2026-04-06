// src/middleware/errorHandler.js
import { config } from '../config/env.js';

export const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  let { statusCode = 500, message, errors, isOperational } = err;

  // Handle Prisma specific errors
  if (err.code === 'P2002') {
    statusCode = 409;
    message = `A record with this ${err.meta?.target?.join(', ')} already exists`;
    isOperational = true;
  } else if (err.code === 'P2025') {
    statusCode = 404;
    message = 'Record not found';
    isOperational = true;
  } else if (err.code === 'P2003') {
    statusCode = 400;
    message = 'Invalid reference: related record does not exist';
    isOperational = true;
  }

  // Log non-operational (programming) errors fully
  if (!isOperational) {
    console.error('🔥 UNHANDLED ERROR:', {
      method: req.method,
      url: req.originalUrl,
      error: err.message,
      stack: err.stack,
    });
    message = 'Internal server error';
  }

  const response = {
    status: 'error',
    message,
    ...(errors && { errors }),
    ...(config.isDev && !isOperational && { stack: err.stack }),
  };

  res.status(statusCode).json(response);
};
