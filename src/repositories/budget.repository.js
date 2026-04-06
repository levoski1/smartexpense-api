// src/repositories/budget.repository.js
import prisma from '../config/database.js';

export const BudgetRepository = {
  async create({ userId, category, limit, period, startDate, endDate }) {
    return prisma.budget.create({
      data: {
        userId,
        category,
        limit,
        period,
        startDate: new Date(startDate),
        endDate:   new Date(endDate),
      },
    });
  },

  async findById(id, userId) {
    return prisma.budget.findFirst({ where: { id, userId } });
  },

  async findAll(userId) {
    return prisma.budget.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  },

  async findActive(userId) {
    const now = new Date();
    return prisma.budget.findMany({
      where: {
        userId,
        startDate: { lte: now },
        endDate:   { gte: now },
      },
    });
  },

  async update(id, userId, data) {
    return prisma.budget.updateMany({
      where: { id, userId },
      data: {
        ...data,
        ...(data.startDate && { startDate: new Date(data.startDate) }),
        ...(data.endDate   && { endDate:   new Date(data.endDate) }),
      },
    });
  },

  async delete(id, userId) {
    return prisma.budget.deleteMany({ where: { id, userId } });
  },

  // Sync spent amount from actual transaction data
  async syncSpent(userId) {
    const budgets = await this.findActive(userId);

    const updates = budgets.map(async (budget) => {
      const result = await prisma.transaction.aggregate({
        where: {
          userId,
          type:     'EXPENSE',
          category: budget.category,
          date: { gte: budget.startDate, lte: budget.endDate },
        },
        _sum: { amount: true },
      });

      const spent = Number(result._sum.amount || 0);
      return prisma.budget.update({
        where: { id: budget.id },
        data:  { spent },
      });
    });

    return Promise.all(updates);
  },

  async getForAI(userId) {
    const now = new Date();
    return prisma.budget.findMany({
      where: { userId, startDate: { lte: now }, endDate: { gte: now } },
      select: { category: true, limit: true, spent: true, endDate: true },
    });
  },
};
