// src/repositories/auth.repository.js
import prisma from '../config/database.js';

export const AuthRepository = {
  async findUserByEmail(email) {
    return prisma.user.findUnique({ where: { email } });
  },

  async findUserById(id) {
    return prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, createdAt: true },
    });
  },

  async createUser({ name, email, passwordHash }) {
    return prisma.user.create({
      data: { name, email, passwordHash },
      select: { id: true, email: true, name: true, createdAt: true },
    });
  },

  async saveRefreshToken({ userId, token, expiresAt }) {
    return prisma.refreshToken.create({
      data: { userId, token, expiresAt },
    });
  },

  async findRefreshToken(token) {
    return prisma.refreshToken.findUnique({
      where: { token },
      include: { user: { select: { id: true, email: true, name: true } } },
    });
  },

  async deleteRefreshToken(token) {
    return prisma.refreshToken.deleteMany({ where: { token } });
  },

  async deleteAllUserRefreshTokens(userId) {
    return prisma.refreshToken.deleteMany({ where: { userId } });
  },

  async deleteExpiredTokens() {
    return prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  },

  // ─── Password Reset Tokens ───────────────────────────────────
  async savePasswordResetToken({ userId, tokenHash, expiresAt }) {
    // Invalidate any existing tokens for this user first
    await prisma.passwordResetToken.updateMany({
      where: { userId, used: false },
      data:  { used: true },
    });
    return prisma.passwordResetToken.create({
      data: { userId, tokenHash, expiresAt },
    });
  },

  async findPasswordResetToken(tokenHash) {
    return prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: { select: { id: true, email: true, name: true } } },
    });
  },

  async markPasswordResetTokenUsed(tokenHash) {
    return prisma.passwordResetToken.update({
      where: { tokenHash },
      data:  { used: true },
    });
  },

  async updateUserPassword(userId, passwordHash) {
    return prisma.user.update({
      where: { id: userId },
      data:  { passwordHash },
    });
  },
};
