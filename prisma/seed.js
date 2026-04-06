// prisma/seed.js
// Run with: npm run db:seed

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.transaction.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  // Create demo user
  const passwordHash = await bcrypt.hash('Demo@123456', 12);

  const user = await prisma.user.create({
    data: {
      email: 'demo@smartexpense.com',
      name: 'Demo User',
      passwordHash,
    },
  });

  console.log(`✅ Created user: ${user.email}`);

  // Create sample transactions
  const now = new Date();
  const transactions = [
    { type: 'INCOME',  amount: 500000, category: 'Salary',        description: 'Monthly salary',         date: new Date(now.getFullYear(), now.getMonth(), 1) },
    { type: 'INCOME',  amount: 50000,  category: 'Freelance',     description: 'Web design project',     date: new Date(now.getFullYear(), now.getMonth(), 5) },
    { type: 'EXPENSE', amount: 120000, category: 'Rent',          description: 'Monthly rent',           date: new Date(now.getFullYear(), now.getMonth(), 2) },
    { type: 'EXPENSE', amount: 35000,  category: 'Food',          description: 'Groceries',              date: new Date(now.getFullYear(), now.getMonth(), 7) },
    { type: 'EXPENSE', amount: 15000,  category: 'Transport',     description: 'Fuel and bus fare',      date: new Date(now.getFullYear(), now.getMonth(), 8) },
    { type: 'EXPENSE', amount: 22000,  category: 'Food',          description: 'Restaurant meals',       date: new Date(now.getFullYear(), now.getMonth(), 10) },
    { type: 'EXPENSE', amount: 8000,   category: 'Entertainment', description: 'Streaming services',     date: new Date(now.getFullYear(), now.getMonth(), 12) },
    { type: 'EXPENSE', amount: 45000,  category: 'Utilities',     description: 'Electricity and water',  date: new Date(now.getFullYear(), now.getMonth(), 14) },
    { type: 'INCOME',  amount: 25000,  category: 'Investment',    description: 'Dividend payment',       date: new Date(now.getFullYear(), now.getMonth(), 15) },
    { type: 'EXPENSE', amount: 18000,  category: 'Healthcare',    description: 'Pharmacy and checkup',   date: new Date(now.getFullYear(), now.getMonth(), 16) },
    { type: 'EXPENSE', amount: 12000,  category: 'Transport',     description: 'Uber rides',             date: new Date(now.getFullYear(), now.getMonth(), 18) },
    { type: 'EXPENSE', amount: 30000,  category: 'Shopping',      description: 'Clothing',               date: new Date(now.getFullYear(), now.getMonth(), 20) },
  ];

  await prisma.transaction.createMany({
    data: transactions.map(t => ({
      ...t,
      userId: user.id,
      amount: t.amount / 100, // Convert kobo to Naira for demo
    })),
  });

  console.log(`✅ Created ${transactions.length} transactions`);

  // Create budgets
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth   = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const budgets = [
    { category: 'Food',          limit: 800 },
    { category: 'Transport',     limit: 300 },
    { category: 'Entertainment', limit: 200 },
    { category: 'Shopping',      limit: 500 },
    { category: 'Utilities',     limit: 600 },
    { category: 'Healthcare',    limit: 400 },
  ];

  await prisma.budget.createMany({
    data: budgets.map(b => ({
      ...b,
      userId: user.id,
      period: 'MONTHLY',
      startDate: startOfMonth,
      endDate: endOfMonth,
    })),
  });

  console.log(`✅ Created ${budgets.length} budgets`);
  console.log('\n🎉 Seed complete!');
  console.log('📧 Demo login: demo@smartexpense.com');
  console.log('🔑 Demo password: Demo@123456');
}

main()
  .catch(e => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
