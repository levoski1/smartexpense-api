// src/controllers/transaction.controller.js
import { TransactionService } from '../services/transaction.service.js';
import { sendSuccess, sendCreated } from '../utils/response.js';

export const TransactionController = {
  async create(req, res, next) {
    try {
      const transaction = await TransactionService.create(req.user.id, req.body);
      sendCreated(res, { transaction }, 'Transaction created');
    } catch (err) { next(err); }
  },

  async getAll(req, res, next) {
    try {
      const result = await TransactionService.getAll(req.user.id, req.query);
      sendSuccess(res, result);
    } catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try {
      const transaction = await TransactionService.getById(req.params.id, req.user.id);
      sendSuccess(res, { transaction });
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      const transaction = await TransactionService.update(req.params.id, req.user.id, req.body);
      sendSuccess(res, { transaction }, 'Transaction updated');
    } catch (err) { next(err); }
  },

  async delete(req, res, next) {
    try {
      await TransactionService.delete(req.params.id, req.user.id);
      sendSuccess(res, null, 'Transaction deleted');
    } catch (err) { next(err); }
  },

  async getSummary(req, res, next) {
    try {
      const summary = await TransactionService.getSummary(req.user.id, req.query);
      sendSuccess(res, { summary });
    } catch (err) { next(err); }
  },

  async getCategoryBreakdown(req, res, next) {
    try {
      const { type = 'EXPENSE' } = req.query;
      const breakdown = await TransactionService.getCategoryBreakdown(req.user.id, type, req.query);
      sendSuccess(res, { breakdown, type });
    } catch (err) { next(err); }
  },

  async getMonthlyTrend(req, res, next) {
    try {
      const months = parseInt(req.query.months) || 6;
      const trend = await TransactionService.getMonthlyTrend(req.user.id, months);
      sendSuccess(res, { trend });
    } catch (err) { next(err); }
  },
};
