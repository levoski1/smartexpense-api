// src/services/transaction.service.js
import { TransactionRepository } from '../repositories/transaction.repository.js';
import { BudgetRepository }      from '../repositories/budget.repository.js';
import { NotFound }              from '../utils/AppError.js';
import { paginate }              from '../utils/response.js';

export const TransactionService = {
  async create(userId, data) {
    const transaction = await TransactionRepository.create({ userId, ...data });

    // If it's an expense, sync budget spending in the background
    if (data.type === 'EXPENSE') {
      BudgetRepository.syncSpent(userId).catch(err =>
        console.error('Budget sync error:', err.message)
      );
    }

    return transaction;
  },

  async getAll(userId, query) {
    const { items, total } = await TransactionRepository.findAll(userId, query);
    return paginate(items, total, query.page, query.limit);
  },

  async getById(id, userId) {
    const transaction = await TransactionRepository.findById(id, userId);
    if (!transaction) throw NotFound('Transaction not found');
    return transaction;
  },

  async update(id, userId, data) {
    await TransactionService.getById(id, userId); // throws if not found / not owner
    await TransactionRepository.update(id, userId, data);

    // Re-sync budgets after any transaction change
    BudgetRepository.syncSpent(userId).catch(err =>
      console.error('Budget sync error:', err.message)
    );

    return TransactionRepository.findById(id, userId);
  },

  async delete(id, userId) {
    await TransactionService.getById(id, userId);
    await TransactionRepository.delete(id, userId);

    BudgetRepository.syncSpent(userId).catch(err =>
      console.error('Budget sync error:', err.message)
    );
  },

  async getSummary(userId, query) {
    return TransactionRepository.getSummary(userId, query);
  },

  async getCategoryBreakdown(userId, type = 'EXPENSE', query = {}) {
    const rows = await TransactionRepository.getCategoryBreakdown(userId, type, query);
    const total = rows.reduce((sum, r) => sum + Number(r._sum.amount || 0), 0);

    return rows.map(r => ({
      category:   r.category,
      total:      Number(r._sum.amount || 0),
      count:      r._count,
      percentage: total > 0 ? Math.round((Number(r._sum.amount || 0) / total) * 100) : 0,
    }));
  },

  async getMonthlyTrend(userId, months = 6) {
    const raw = await TransactionRepository.getMonthlyTrend(userId, months);

    // Group by month
    const map = {};
    for (const row of raw) {
      const key = new Date(row.month).toISOString().slice(0, 7);
      if (!map[key]) map[key] = { month: key, income: 0, expense: 0 };
      if (row.type === 'INCOME')  map[key].income  = Number(row.total);
      if (row.type === 'EXPENSE') map[key].expense = Number(row.total);
    }

    return Object.values(map).map(m => ({
      ...m,
      net: m.income - m.expense,
    }));
  },
};
