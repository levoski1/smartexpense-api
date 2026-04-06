// src/services/budget.service.js
import { BudgetRepository }      from '../repositories/budget.repository.js';
import { TransactionRepository } from '../repositories/transaction.repository.js';
import { NotFound, Conflict }    from '../utils/AppError.js';

export const BudgetService = {
  async create(userId, data) {
    return BudgetRepository.create({ userId, ...data });
  },

  async getAll(userId) {
    const budgets = await BudgetRepository.findAll(userId);
    return budgets.map(BudgetService._enrich);
  },

  async getActive(userId) {
    await BudgetRepository.syncSpent(userId);
    const budgets = await BudgetRepository.findActive(userId);
    return budgets.map(BudgetService._enrich);
  },

  async getById(id, userId) {
    const budget = await BudgetRepository.findById(id, userId);
    if (!budget) throw NotFound('Budget not found');
    return BudgetService._enrich(budget);
  },

  async update(id, userId, data) {
    await BudgetService.getById(id, userId);
    await BudgetRepository.update(id, userId, data);
    return BudgetService.getById(id, userId);
  },

  async delete(id, userId) {
    await BudgetService.getById(id, userId);
    return BudgetRepository.delete(id, userId);
  },

  async getDashboard(userId) {
    await BudgetRepository.syncSpent(userId);
    const budgets = await BudgetRepository.findActive(userId);
    const enriched = budgets.map(BudgetService._enrich);

    const alerts = enriched.filter(b => b.percentageUsed >= 80);
    const exceeded = enriched.filter(b => b.isExceeded);

    return {
      budgets: enriched,
      summary: {
        totalBudgets:   enriched.length,
        totalAlerts:    alerts.length,
        totalExceeded:  exceeded.length,
        healthScore:    BudgetService._healthScore(enriched),
      },
      alerts,
      exceeded,
    };
  },

  // Private: add derived fields to a budget
  _enrich(budget) {
    const limit          = Number(budget.limit);
    const spent          = Number(budget.spent);
    const remaining      = Math.max(0, limit - spent);
    const percentageUsed = limit > 0 ? Math.round((spent / limit) * 100) : 0;
    const isExceeded     = spent > limit;

    // Days remaining in budget period
    const now        = new Date();
    const end        = new Date(budget.endDate);
    const daysLeft   = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));

    // Burn rate: how many days until budget exhausted at current spend rate
    const start      = new Date(budget.startDate);
    const daysElapsed = Math.max(1, Math.ceil((now - start) / (1000 * 60 * 60 * 24)));
    const dailyRate  = spent / daysElapsed;
    const daysToExhaust = dailyRate > 0 ? Math.floor(remaining / dailyRate) : null;

    return {
      ...budget,
      limit,
      spent,
      remaining,
      percentageUsed,
      isExceeded,
      daysLeft,
      dailyBurnRate: Math.round(dailyRate * 100) / 100,
      projectedDaysToExhaust: daysToExhaust,
      status: isExceeded ? 'exceeded'
            : percentageUsed >= 90 ? 'critical'
            : percentageUsed >= 75 ? 'warning'
            : 'healthy',
    };
  },

  _healthScore(budgets) {
    if (budgets.length === 0) return 100;
    const healthy = budgets.filter(b => b.status === 'healthy').length;
    return Math.round((healthy / budgets.length) * 100);
  },
};
