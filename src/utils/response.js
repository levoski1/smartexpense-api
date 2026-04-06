// src/utils/response.js

export const sendSuccess = (res, data = null, message = 'Success', statusCode = 200) => {
  const payload = { status: 'success', message };
  if (data !== null) payload.data = data;
  return res.status(statusCode).json(payload);
};

export const sendCreated = (res, data, message = 'Created successfully') =>
  sendSuccess(res, data, message, 201);

export const sendError = (res, message = 'Error', statusCode = 500, errors = null) => {
  const payload = { status: 'error', message };
  if (errors) payload.errors = errors;
  return res.status(statusCode).json(payload);
};

export const paginate = (data, total, page, limit) => ({
  items: data,
  pagination: {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNext: page * limit < total,
    hasPrev: page > 1,
  },
});
