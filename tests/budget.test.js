// tests/budget.test.js
import request from 'supertest';
import app     from '../src/app.js';
import prisma  from '../src/config/database.js';

const BASE = '/api/v1/budgets';

let accessToken = '';
let userId      = '';
let budgetId    = '';

const now   = new Date();
const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

beforeAll(async () => {
  const email = `budget_test_${Date.now()}@example.com`;
  const reg = await request(app).post('/api/v1/auth/register').send({
    name: 'Budget Tester', email, password: 'Test@123456',
  });
  accessToken = reg.body.data.accessToken;
  userId      = reg.body.data.user.id;
});

afterAll(async () => {
  await prisma.budget.deleteMany({ where: { userId } });
  await prisma.user.deleteMany({ where: { id: userId } });
  await prisma.$disconnect();
});

const auth = () => ({ Authorization: `Bearer ${accessToken}` });

describe('POST /budgets', () => {
  it('should create a budget', async () => {
    const res = await request(app)
      .post(BASE).set(auth())
      .send({ category: 'Food', limit: 50000, period: 'MONTHLY', startDate: start, endDate: end });
    expect(res.status).toBe(201);
    expect(res.body.data.budget.category).toBe('Food');
    budgetId = res.body.data.budget.id;
  });

  it('should reject budget with end date before start date', async () => {
    const res = await request(app)
      .post(BASE).set(auth())
      .send({ category: 'Transport', limit: 10000, period: 'MONTHLY', startDate: end, endDate: start });
    expect(res.status).toBe(400);
  });
});

describe('GET /budgets', () => {
  it('should return all budgets', async () => {
    const res = await request(app).get(BASE).set(auth());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.budgets)).toBe(true);
  });

  it('should return budget dashboard', async () => {
    const res = await request(app).get(`${BASE}/dashboard`).set(auth());
    expect(res.status).toBe(200);
    expect(res.body.data.summary).toBeDefined();
    expect(res.body.data.budgets).toBeDefined();
  });

  it('should return a single budget', async () => {
    const res = await request(app).get(`${BASE}/${budgetId}`).set(auth());
    expect(res.status).toBe(200);
    expect(res.body.data.budget.id).toBe(budgetId);
    // Enriched fields
    expect(res.body.data.budget.percentageUsed).toBeDefined();
    expect(res.body.data.budget.status).toBeDefined();
  });
});

describe('PATCH /budgets/:id', () => {
  it('should update budget limit', async () => {
    const res = await request(app)
      .patch(`${BASE}/${budgetId}`)
      .set(auth())
      .send({ limit: 75000 });
    expect(res.status).toBe(200);
    expect(Number(res.body.data.budget.limit)).toBe(75000);
  });
});

describe('DELETE /budgets/:id', () => {
  it('should delete a budget', async () => {
    const res = await request(app).delete(`${BASE}/${budgetId}`).set(auth());
    expect(res.status).toBe(200);
  });
});
