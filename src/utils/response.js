// src/utils/response.js

// Format a Date to dd/mm/yyyy
const formatDate = (val) => {
  if (!val) return val;
  const d = new Date(val);
  if (isNaN(d.getTime())) return val;
  const dd   = String(d.getUTCDate()).padStart(2, '0');
  const mm   = String(d.getUTCMonth() + 1).padStart(2, '0');
  const yyyy = d.getUTCFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

// Recursively format all date fields in an object
const formatDates = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(formatDates);
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => {
      if (['date', 'createdAt', 'updatedAt', 'startDate', 'endDate', 'expiresAt'].includes(k)) {
        return [k, formatDate(v)];
      }
      return [k, typeof v === 'object' ? formatDates(v) : v];
    })
  );
};

export const sendSuccess = (res, data = null, message = 'Success', statusCode = 200) => {
  const payload = { status: 'success', message };
  if (data !== null) payload.data = formatDates(data);
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
