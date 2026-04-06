// src/controllers/budget.controller.js
import { BudgetService } from '../services/budget.service.js';
import { sendSuccess, sendCreated } from '../utils/response.js';

export const BudgetController = {
  async create(req, res, next) {
    try {
      const budget = await BudgetService.create(req.user.id, req.body);
      sendCreated(res, { budget }, 'Budget created');
    } catch (err) { next(err); }
  },

  async getAll(req, res, next) {
    try {
      const budgets = await BudgetService.getAll(req.user.id);
      sendSuccess(res, { budgets });
    } catch (err) { next(err); }
  },

  async getActive(req, res, next) {
    try {
      const budgets = await BudgetService.getActive(req.user.id);
      sendSuccess(res, { budgets });
    } catch (err) { next(err); }
  },

  async getDashboard(req, res, next) {
    try {
      const dashboard = await BudgetService.getDashboard(req.user.id);
      sendSuccess(res, dashboard);
    } catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try {
      const budget = await BudgetService.getById(req.params.id, req.user.id);
      sendSuccess(res, { budget });
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      const budget = await BudgetService.update(req.params.id, req.user.id, req.body);
      sendSuccess(res, { budget }, 'Budget updated');
    } catch (err) { next(err); }
  },

  async delete(req, res, next) {
    try {
      await BudgetService.delete(req.params.id, req.user.id);
      sendSuccess(res, null, 'Budget deleted');
    } catch (err) { next(err); }
  },
};
