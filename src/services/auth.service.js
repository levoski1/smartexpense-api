// src/services/auth.service.js
import crypto   from 'crypto';
import bcrypt   from 'bcryptjs';
import { AuthRepository } from '../repositories/auth.repository.js';
import { EmailService }   from './email.service.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import { BadRequest, Conflict, Unauthorized, NotFound } from '../utils/AppError.js';
import { config } from '../config/env.js';

export const AuthService = {
  async register({ name, email, password }) {
    const existing = await AuthRepository.findUserByEmail(email);
    if (existing) throw Conflict('An account with this email already exists');

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await AuthRepository.createUser({ name, email, passwordHash });

    const tokens = await AuthService._issueTokens(user.id, user.email);
    return { user, ...tokens };
  },

  async login({ email, password }) {
    const user = await AuthRepository.findUserByEmail(email);
    if (!user) throw Unauthorized('Invalid email or password');

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) throw Unauthorized('Invalid email or password');

    const { passwordHash, ...safeUser } = user;
    const tokens = await AuthService._issueTokens(user.id, user.email);
    return { user: safeUser, ...tokens };
  },

  async refresh(token) {
    const stored = await AuthRepository.findRefreshToken(token);
    if (!stored) throw Unauthorized('Invalid refresh token');

    if (new Date() > stored.expiresAt) {
      await AuthRepository.deleteRefreshToken(token);
      throw Unauthorized('Refresh token expired. Please log in again.');
    }

    // Verify signature
    verifyRefreshToken(token);

    // Rotate: delete old token, issue new pair
    await AuthRepository.deleteRefreshToken(token);
    const tokens = await AuthService._issueTokens(stored.user.id, stored.user.email);
    return { user: stored.user, ...tokens };
  },

  async logout(token) {
    await AuthRepository.deleteRefreshToken(token);
  },

  async logoutAll(userId) {
    await AuthRepository.deleteAllUserRefreshTokens(userId);
  },

  async getProfile(userId) {
    const user = await AuthRepository.findUserById(userId);
    if (!user) throw NotFound('User not found');
    return user;
  },

  async forgotPassword(email) {
    // Always return success to prevent user enumeration
    const user = await AuthRepository.findUserByEmail(email);
    if (!user) return;

    const plainToken = crypto.randomBytes(32).toString('hex');
    const tokenHash  = crypto.createHash('sha256').update(plainToken).digest('hex');
    const expiresAt  = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await AuthRepository.savePasswordResetToken({ userId: user.id, tokenHash, expiresAt });
    await EmailService.sendPasswordReset(user.email, user.name, plainToken);
  },

  async resetPassword(plainToken, newPassword) {
    const tokenHash = crypto.createHash('sha256').update(plainToken).digest('hex');
    const record    = await AuthRepository.findPasswordResetToken(tokenHash);

    if (!record || record.used || new Date() > record.expiresAt) {
      throw BadRequest('Invalid or expired password reset token');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await AuthRepository.updateUserPassword(record.userId, passwordHash);
    await AuthRepository.markPasswordResetTokenUsed(tokenHash);
    await AuthRepository.deleteAllUserRefreshTokens(record.userId);
  },

  // Private helper — issues both tokens, saves refresh token to DB
  async _issueTokens(userId, email) {
    const accessToken  = signAccessToken({ userId, email });
    const refreshToken = signRefreshToken({ userId, email });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await AuthRepository.saveRefreshToken({ userId, token: refreshToken, expiresAt });

    return {
      accessToken,
      refreshToken,
      expiresIn: config.jwt.expiresIn,
    };
  },
};
