// tests/auth.test.js
import request from 'supertest';
import app     from '../src/app.js';
import prisma  from '../src/config/database.js';

const BASE = '/api/v1/auth';

// Test user credentials
const testUser = {
  name:     'Test User',
  email:    `test_${Date.now()}@example.com`,
  password: 'Test@123456',
};

let accessToken  = '';
let refreshToken = '';

afterAll(async () => {
  // Cleanup test user
  await prisma.user.deleteMany({ where: { email: testUser.email } });
  await prisma.$disconnect();
});

// ─── REGISTER ────────────────────────────────────────────────
describe('POST /auth/register', () => {
  it('should register a new user and return tokens', async () => {
    const res = await request(app).post(`${BASE}/register`).send(testUser);
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data.user.email).toBe(testUser.email);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    refreshToken = res.body.data.refreshToken;
  });

  it('should reject duplicate email', async () => {
    const res = await request(app).post(`${BASE}/register`).send(testUser);
    expect(res.status).toBe(409);
  });

  it('should reject weak password', async () => {
    const res = await request(app).post(`${BASE}/register`).send({
      ...testUser,
      email: 'other@test.com',
      password: 'weak',
    });
    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it('should reject invalid email', async () => {
    const res = await request(app).post(`${BASE}/register`).send({
      ...testUser,
      email: 'not-an-email',
    });
    expect(res.status).toBe(400);
  });
});

// ─── LOGIN ───────────────────────────────────────────────────
describe('POST /auth/login', () => {
  it('should login with correct credentials', async () => {
    const res = await request(app).post(`${BASE}/login`).send({
      email:    testUser.email,
      password: testUser.password,
    });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    accessToken  = res.body.data.accessToken;
    refreshToken = res.body.data.refreshToken;
  });

  it('should reject wrong password', async () => {
    const res = await request(app).post(`${BASE}/login`).send({
      email:    testUser.email,
      password: 'WrongPass@999',
    });
    expect(res.status).toBe(401);
  });

  it('should reject non-existent email', async () => {
    const res = await request(app).post(`${BASE}/login`).send({
      email:    'nobody@example.com',
      password: 'Test@123456',
    });
    expect(res.status).toBe(401);
  });
});

// ─── PROFILE ─────────────────────────────────────────────────
describe('GET /auth/profile', () => {
  it('should return user profile with valid token', async () => {
    const res = await request(app)
      .get(`${BASE}/profile`)
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(testUser.email);
  });

  it('should reject request without token', async () => {
    const res = await request(app).get(`${BASE}/profile`);
    expect(res.status).toBe(401);
  });
});

// ─── REFRESH ─────────────────────────────────────────────────
describe('POST /auth/refresh', () => {
  it('should issue new tokens with valid refresh token', async () => {
    const res = await request(app)
      .post(`${BASE}/refresh`)
      .send({ refreshToken });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('should reject invalid refresh token', async () => {
    const res = await request(app)
      .post(`${BASE}/refresh`)
      .send({ refreshToken: 'invalid.token.here' });
    expect(res.status).toBe(401);
  });
});
