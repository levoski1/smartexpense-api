// src/repositories/transaction.repository.js
import prisma from '../config/database.js';

export const TransactionRepository = {
  async create({ userId, type, amount, category, description, date }) {
    return prisma.transaction.create({
      data: { userId, type, amount, category, description, date: date ?? undefined },
    });
  },

  async findById(id, userId) {
    return prisma.transaction.findFirst({ where: { id, userId } });
  },

  async findAll(userId, { page, limit, type, category, startDate, endDate, sortBy, sortOrder }) {
    const where = {
      userId,
      ...(type && { type }),
      ...(category && { category: { contains: category, mode: 'insensitive' } }),
      ...(startDate || endDate ? {
        date: {
          ...(startDate && { gte: new Date(startDate) }),
          ...(endDate   && { lte: new Date(endDate) }),
        },
      } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.transaction.count({ where }),
    ]);

    return { items, total };
  },

  async update(id, userId, data) {
    return prisma.transaction.updateMany({
      where: { id, userId },
      data: {
        ...data,
        ...(data.date && { date: data.date }), // already a Date from validator
      },
    });
  },

  async delete(id, userId) {
    return prisma.transaction.deleteMany({ where: { id, userId } });
  },

  // ─── Analytics queries ───────────────────────────────────────

  async getSummary(userId, { startDate, endDate } = {}) {
    const dateFilter = startDate || endDate
      ? { date: { ...(startDate && { gte: new Date(startDate) }), ...(endDate && { lte: new Date(endDate) }) } }
      : {};

    const [incomeResult, expenseResult] = await Promise.all([
      prisma.transaction.aggregate({
        where: { userId, type: 'INCOME', ...dateFilter },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.transaction.aggregate({
        where: { userId, type: 'EXPENSE', ...dateFilter },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    const totalIncome  = Number(incomeResult._sum.amount  || 0);
    const totalExpense = Number(expenseResult._sum.amount || 0);

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      incomeCount:  incomeResult._count,
      expenseCount: expenseResult._count,
    };
  },

  async getCategoryBreakdown(userId, type, { startDate, endDate } = {}) {
    const dateFilter = startDate || endDate
      ? { date: { ...(startDate && { gte: new Date(startDate) }), ...(endDate && { lte: new Date(endDate) }) } }
      : {};

    return prisma.transaction.groupBy({
      by: ['category'],
      where: { userId, type, ...dateFilter },
      _sum: { amount: true },
      _count: true,
      orderBy: { _sum: { amount: 'desc' } },
    });
  },

  async getMonthlyTrend(userId, months = 6) {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);

    return prisma.$queryRaw`
      SELECT
        DATE_TRUNC('month', date) AS month,
        type,
        SUM(amount) AS total,
        COUNT(*)    AS count
      FROM transactions
      WHERE user_id = ${userId}
        AND date >= ${startDate}
      GROUP BY DATE_TRUNC('month', date), type
      ORDER BY month ASC
    `;
  },

  async getRecentForAI(userId, limit = 30) {
    return prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: limit,
      select: { type: true, amount: true, category: true, description: true, date: true },
    });
  },
};
