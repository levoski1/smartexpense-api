// src/controllers/ai.controller.js
import { AIService } from '../services/ai.service.js';
import { sendSuccess } from '../utils/response.js';
import { BadRequest } from '../utils/AppError.js';

export const AIController = {
  async getInsights(req, res, next) {
    try {
      const insights = await AIService.getInsights(req.user.id);
      sendSuccess(res, insights, 'AI insights generated');
    } catch (err) { next(err); }
  },

  async chat(req, res, next) {
    try {
      const { message } = req.body;
      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        throw BadRequest('Message is required');
      }
      if (message.length > 500) {
        throw BadRequest('Message must not exceed 500 characters');
      }

      const result = await AIService.chat(req.user.id, message.trim());
      sendSuccess(res, result, 'AI response generated');
    } catch (err) { next(err); }
  },
};
