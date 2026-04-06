// src/utils/jwt.js
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { Unauthorized } from './AppError.js';

export const signAccessToken = (payload) =>
  jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });

export const signRefreshToken = (payload) =>
  jwt.sign(payload, config.jwt.refreshSecret, { expiresIn: config.jwt.refreshExpiresIn });

export const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch (err) {
    if (err.name === 'TokenExpiredError') throw Unauthorized('Access token expired');
    throw Unauthorized('Invalid access token');
  }
};

export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.refreshSecret);
  } catch (err) {
    if (err.name === 'TokenExpiredError') throw Unauthorized('Refresh token expired');
    throw Unauthorized('Invalid refresh token');
  }
};
