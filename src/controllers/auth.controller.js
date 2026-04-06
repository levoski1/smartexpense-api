// src/controllers/auth.controller.js
import { AuthService } from '../services/auth.service.js';
import { sendSuccess, sendCreated } from '../utils/response.js';

export const AuthController = {
  async register(req, res, next) {
    try {
      const result = await AuthService.register(req.body);
      sendCreated(res, result, 'Account created successfully');
    } catch (err) { next(err); }
  },

  async login(req, res, next) {
    try {
      const result = await AuthService.login(req.body);
      sendSuccess(res, result, 'Login successful');
    } catch (err) { next(err); }
  },

  async refresh(req, res, next) {
    try {
      const result = await AuthService.refresh(req.body.refreshToken);
      sendSuccess(res, result, 'Token refreshed');
    } catch (err) { next(err); }
  },

  async logout(req, res, next) {
    try {
      await AuthService.logout(req.body.refreshToken);
      sendSuccess(res, null, 'Logged out successfully');
    } catch (err) { next(err); }
  },

  async logoutAll(req, res, next) {
    try {
      await AuthService.logoutAll(req.user.id);
      sendSuccess(res, null, 'Logged out from all devices');
    } catch (err) { next(err); }
  },

  async getProfile(req, res, next) {
    try {
      const user = await AuthService.getProfile(req.user.id);
      sendSuccess(res, { user });
    } catch (err) { next(err); }
  },
};
