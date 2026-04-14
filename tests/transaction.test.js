// tests/transaction.test.js
import request from 'supertest';
import app     from '../src/app.js';
import prisma  from '../src/config/database.js';

const BASE = '/api/v1/transactions';

let accessToken = '';
let userId      = '';
let txId        = '';

// Setup: register + login a test user
beforeAll(async () => {
  const email = `tx_test_${Date.now()}@example.com`;
  const reg = await request(app).post('/api/v1/auth/register').send({
    name: 'TX Tester', email, password: 'Test@123456',
  });
  accessToken = reg.body.data.accessToken;
  userId      = reg.body.data.user.id;
});

afterAll(async () => {
  await prisma.transaction.deleteMany({ where: { userId } });
  await prisma.user.deleteMany({ where: { id: userId } });
  await prisma.$disconnect();
});

const auth = () => ({ Authorization: `Bearer ${accessToken}` });

// ─── CREATE ──────────────────────────────────────────────────
describe('POST /transactions', () => {
  it('should create an expense transaction', async () => {
    const res = await request(app)
      .post(BASE)
      .set(auth())
      .send({ type: 'EXPENSE', amount: 5000, category: 'Food', description: 'Lunch' });

    expect(res.status).toBe(201);
    expect(res.body.data.transaction.category).toBe('food'); // normalized to lowercase
    txId = res.body.data.transaction.id;
  });

  it('should create an income transaction', async () => {
    const res = await request(app)
      .post(BASE)
      .set(auth())
      .send({ type: 'income', amount: 100000, category: 'Salary' }); // lowercase type accepted
    expect(res.status).toBe(201);
    expect(res.body.data.transaction.type).toBe('INCOME'); // normalized to uppercase
  });

  it('should reject negative amount', async () => {
    const res = await request(app)
      .post(BASE).set(auth())
      .send({ type: 'EXPENSE', amount: -100, category: 'Food' });
    expect(res.status).toBe(400);
  });

  it('should reject missing required fields', async () => {
    const res = await request(app)
      .post(BASE).set(auth())
      .send({ amount: 100 });
    expect(res.status).toBe(400);
  });
});

// ─── READ ────────────────────────────────────────────────────
describe('GET /transactions', () => {
  it('should return paginated transactions', async () => {
    const res = await request(app).get(BASE).set(auth());
    expect(res.status).toBe(200);
    expect(res.body.data.items).toBeDefined();
    expect(res.body.data.pagination).toBeDefined();
  });

  it('should filter by type', async () => {
    const res = await request(app).get(`${BASE}?type=expense`).set(auth()); // lowercase accepted
    expect(res.status).toBe(200);
    res.body.data.items.forEach(t => expect(t.type).toBe('EXPENSE'));
  });

  it('should return a single transaction by ID', async () => {
    const res = await request(app).get(`${BASE}/${txId}`).set(auth());
    expect(res.status).toBe(200);
    expect(res.body.data.transaction.id).toBe(txId);
  });

  it('should return 404 for non-existent transaction', async () => {
    const res = await request(app)
      .get(`${BASE}/00000000-0000-0000-0000-000000000000`)
      .set(auth());
    expect(res.status).toBe(404);
  });
});

// ─── ANALYTICS ───────────────────────────────────────────────
describe('GET /transactions/summary', () => {
  it('should return financial summary', async () => {
    const res = await request(app).get(`${BASE}/summary`).set(auth());
    expect(res.status).toBe(200);
    expect(res.body.data.summary.totalIncome).toBeDefined();
    expect(res.body.data.summary.totalExpense).toBeDefined();
    expect(res.body.data.summary.balance).toBeDefined();
  });
});

describe('GET /transactions/breakdown', () => {
  it('should return category breakdown', async () => {
    const res = await request(app).get(`${BASE}/breakdown`).set(auth());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.breakdown)).toBe(true);
  });
});

// ─── UPDATE ──────────────────────────────────────────────────
describe('PATCH /transactions/:id', () => {
  it('should update a transaction', async () => {
    const res = await request(app)
      .patch(`${BASE}/${txId}`)
      .set(auth())
      .send({ amount: 7500, description: 'Updated lunch' });
    expect(res.status).toBe(200);
    expect(Number(res.body.data.transaction.amount)).toBe(7500);
  });
});

// ─── DELETE ──────────────────────────────────────────────────
describe('DELETE /transactions/:id', () => {
  it('should delete a transaction', async () => {
    const res = await request(app).delete(`${BASE}/${txId}`).set(auth());
    expect(res.status).toBe(200);
  });

  it('should return 404 after deletion', async () => {
    const res = await request(app).get(`${BASE}/${txId}`).set(auth());
    expect(res.status).toBe(404);
  });
});
