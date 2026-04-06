// src/middleware/auth.js
import { verifyAccessToken } from '../utils/jwt.js';
import { Unauthorized } from '../utils/AppError.js';
import prisma from '../config/database.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw Unauthorized('No token provided. Use Authorization: Bearer <token>');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    // Verify user still exists in DB (handles deleted accounts)
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true },
    });

    if (!user) throw Unauthorized('User no longer exists');

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};
