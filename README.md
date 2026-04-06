# 💡 AmakTech SmartExpense AI — Backend API

A production-ready fintech SaaS backend built with Node.js, Express, PostgreSQL, Prisma ORM, JWT Authentication, and OpenAI-powered financial insights.

---

## 🏗️ Architecture

```
Client (Frontend / Postman)
         ↓
  Express API Server
         ↓
  Controller Layer      ← handles HTTP req/res
         ↓
  Service Layer         ← business logic
         ↓
  Repository Layer      ← database queries
         ↓
  PostgreSQL + Prisma   ← data persistence
         ↓
  OpenAI API            ← AI insights engine
```

---

## ⚙️ Tech Stack

| Layer         | Technology                  |
|---------------|-----------------------------|
| Runtime       | Node.js 18+ (ESM)           |
| Framework     | Express.js 4                |
| Database      | PostgreSQL                  |
| ORM           | Prisma 5                    |
| Auth          | JWT (access + refresh tokens)|
| Hashing       | bcryptjs                    |
| Validation    | Zod                         |
| AI Engine     | OpenAI GPT-4o-mini          |
| Rate Limiting | express-rate-limit          |
| Security      | Helmet, CORS                |
| Testing       | Jest + Supertest            |

---

## 📁 Folder Structure

```
smartexpense-api/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.js                # Development seed data
├── src/
│   ├── config/
│   │   ├── env.js             # Centralized env config + validation
│   │   └── database.js        # Prisma client singleton
│   ├── controllers/           # HTTP request handlers
│   │   ├── auth.controller.js
│   │   ├── transaction.controller.js
│   │   ├── budget.controller.js
│   │   └── ai.controller.js
│   ├── services/              # Business logic
│   │   ├── auth.service.js
│   │   ├── transaction.service.js
│   │   ├── budget.service.js
│   │   └── ai.service.js
│   ├── repositories/          # Database access layer
│   │   ├── auth.repository.js
│   │   ├── transaction.repository.js
│   │   └── budget.repository.js
│   ├── middleware/
│   │   ├── auth.js            # JWT authentication
│   │   ├── validate.js        # Zod validation factory
│   │   ├── rateLimiter.js     # Rate limiting (API / Auth / AI)
│   │   └── errorHandler.js    # Global error handler
│   ├── routes/
│   │   ├── index.js           # Central router
│   │   ├── auth.routes.js
│   │   ├── transaction.routes.js
│   │   ├── budget.routes.js
│   │   └── ai.routes.js
│   ├── validators/
│   │   └── schemas.js         # All Zod schemas
│   ├── utils/
│   │   ├── AppError.js        # Custom error classes
│   │   ├── response.js        # Consistent response helpers
│   │   └── jwt.js             # JWT sign/verify helpers
│   └── app.js                 # Express app configuration
├── tests/
│   ├── auth.test.js
│   ├── transaction.test.js
│   └── budget.test.js
├── server.js                  # Entry point + graceful shutdown
├── jest.config.js
├── SmartExpense.postman_collection.json
├── .env.example
├── .gitignore
└── package.json
```

---

## 🚀 Quick Start

### 1. Prerequisites

- Node.js 18 or higher
- PostgreSQL 14 or higher (running locally or hosted)
- An OpenAI API key (for AI features)

### 2. Clone & Install

```bash
git clone <your-repo-url>
cd smartexpense-api
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Open `.env` and fill in your values:

```env
NODE_ENV=development
PORT=5000

# Your PostgreSQL connection string
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/smartexpense_db

# Generate strong secrets (minimum 32 characters)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-chars
JWT_REFRESH_SECRET=another-super-secret-refresh-key-32-chars

# Optional: your OpenAI API key
OPENAI_API_KEY=sk-your-openai-key
```

### 4. Set Up the Database

```bash
# Run Prisma migrations (creates tables)
npm run db:migrate

# Generate Prisma client
npm run db:generate

# (Optional) Seed with demo data
npm run db:seed
```

### 5. Start the Server

```bash
# Development (auto-restart on changes)
npm run dev

# Production
npm start
```

You should see:
```
  ╔══════════════════════════════════════════════════╗
  ║     💡 AmakTech SmartExpense AI API              ║
  ╠══════════════════════════════════════════════════╣
  ║  Status  : Running ✅                            ║
  ║  Port    : 5000                                  ║
  ║  Env     : development                           ║
  ╚══════════════════════════════════════════════════╝
```

---

## 📡 API Reference

### Base URL
```
http://localhost:5000/api/v1
```

### Authentication
All protected routes require a Bearer token in the `Authorization` header:
```
Authorization: Bearer <your_access_token>
```

---

### 🔐 Auth Endpoints

| Method | Endpoint              | Auth | Description              |
|--------|-----------------------|------|--------------------------|
| POST   | `/auth/register`      | ❌   | Create new account       |
| POST   | `/auth/login`         | ❌   | Login, receive tokens    |
| POST   | `/auth/refresh`       | ❌   | Refresh access token     |
| POST   | `/auth/logout`        | ❌   | Invalidate refresh token |
| POST   | `/auth/logout-all`    | ✅   | Logout all devices       |
| GET    | `/auth/profile`       | ✅   | Get current user profile |

#### Register
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass@123"
}
```
**Password rules:** min 8 chars, 1 uppercase, 1 number, 1 special character.

**Response:**
```json
{
  "status": "success",
  "message": "Account created successfully",
  "data": {
    "user": { "id": "uuid", "email": "john@example.com", "name": "John Doe" },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "expiresIn": "15m"
  }
}
```

---

### 💰 Transaction Endpoints

| Method | Endpoint                         | Description                  |
|--------|----------------------------------|------------------------------|
| POST   | `/transactions`                  | Create transaction           |
| GET    | `/transactions`                  | List with filters/pagination |
| GET    | `/transactions/:id`              | Get single transaction       |
| PATCH  | `/transactions/:id`              | Update transaction           |
| DELETE | `/transactions/:id`              | Delete transaction           |
| GET    | `/transactions/summary`          | Income/expense/balance totals|
| GET    | `/transactions/breakdown`        | Per-category spending        |
| GET    | `/transactions/trend`            | Monthly income vs expense    |

#### Create Transaction
```http
POST /api/v1/transactions
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "EXPENSE",
  "amount": 35000,
  "category": "Food",
  "description": "Weekly groceries",
  "date": "2025-01-15T00:00:00.000Z"
}
```

#### Query Parameters (GET /transactions)
| Param      | Type   | Example              | Description                    |
|------------|--------|----------------------|--------------------------------|
| page       | number | `1`                  | Page number (default: 1)       |
| limit      | number | `20`                 | Items per page (max: 100)      |
| type       | string | `INCOME` or `EXPENSE`| Filter by type                 |
| category   | string | `Food`               | Filter by category (partial)   |
| startDate  | ISO    | `2025-01-01T...`     | Filter from date               |
| endDate    | ISO    | `2025-01-31T...`     | Filter to date                 |
| sortBy     | string | `date` / `amount`    | Sort field                     |
| sortOrder  | string | `asc` / `desc`       | Sort direction                 |

---

### 🎯 Budget Endpoints

| Method | Endpoint               | Description               |
|--------|------------------------|---------------------------|
| POST   | `/budgets`             | Create budget             |
| GET    | `/budgets`             | Get all budgets           |
| GET    | `/budgets/active`      | Get current active budgets|
| GET    | `/budgets/dashboard`   | Budget health dashboard   |
| GET    | `/budgets/:id`         | Get single budget         |
| PATCH  | `/budgets/:id`         | Update budget             |
| DELETE | `/budgets/:id`         | Delete budget             |

#### Create Budget
```http
POST /api/v1/budgets
Authorization: Bearer <token>
Content-Type: application/json

{
  "category": "Food",
  "limit": 80000,
  "period": "MONTHLY",
  "startDate": "2025-01-01T00:00:00.000Z",
  "endDate": "2025-01-31T23:59:59.000Z"
}
```

#### Budget Dashboard Response
```json
{
  "data": {
    "budgets": [
      {
        "category": "Food",
        "limit": 80000,
        "spent": 55000,
        "remaining": 25000,
        "percentageUsed": 69,
        "status": "healthy",
        "daysLeft": 10,
        "dailyBurnRate": 1833.33,
        "isExceeded": false
      }
    ],
    "summary": {
      "totalBudgets": 5,
      "totalAlerts": 1,
      "totalExceeded": 0,
      "healthScore": 80
    },
    "alerts": [...],
    "exceeded": []
  }
}
```

---

### 🤖 AI Endpoints

| Method | Endpoint          | Description                   |
|--------|-------------------|-------------------------------|
| GET    | `/ai/insights`    | Generate AI financial analysis|
| POST   | `/ai/chat`        | Ask AI a financial question   |

#### Get AI Insights
```http
GET /api/v1/ai/insights
Authorization: Bearer <token>
```

**Response:**
```json
{
  "data": {
    "overallHealthScore": 72,
    "healthLabel": "Good",
    "summary": "Your finances are generally healthy. You saved 18% of your income this month, though food spending is trending 23% higher than last month.",
    "insights": [
      {
        "type": "spending",
        "title": "Food Spending Spike",
        "description": "You spent ₦57,000 on Food this month — 23% more than last month's ₦46,000.",
        "severity": "warning"
      }
    ],
    "recommendations": [
      "Reduce Food spending by ₦17,000 to stay within your ₦80,000 budget.",
      "Consider allocating 20% of your salary (₦100,000) to savings automatically."
    ],
    "savingsRate": 18,
    "topSpendingCategory": "Rent",
    "projections": {
      "endOfMonthBalance": 243000,
      "budgetsAtRisk": ["Food", "Entertainment"]
    },
    "generatedAt": "2025-01-20T14:23:11.000Z"
  }
}
```

#### AI Chat
```http
POST /api/v1/ai/chat
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "Am I on track to save money this month?"
}
```

---

## 🛡️ Security Features

- **Helmet.js** — Sets 15+ security HTTP headers
- **CORS** — Configurable per environment
- **Rate Limiting:**
  - API endpoints: 100 req / 15 min
  - Auth endpoints: 10 req / 15 min (brute-force protection)
  - AI endpoints: 20 req / hour (cost protection)
- **JWT Rotation** — Refresh tokens are single-use and stored in DB
- **Password Hashing** — bcrypt with 12 salt rounds
- **Input Validation** — Zod schemas on all inputs
- **Payload Size Limit** — 10kb max body size (DoS protection)

---

## 🧪 Running Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch
```

Tests cover:
- Auth: register, login, token refresh, profile
- Transactions: CRUD + filtering + analytics
- Budgets: CRUD + dashboard

> **Note:** Tests require a live PostgreSQL connection. The test suite creates isolated users per run and cleans up after itself.

---

## 🗄️ Database Management

```bash
# Open visual DB browser
npm run db:studio

# Create a new migration after schema changes
npm run db:migrate

# Reset database (drops + recreates all tables)
npm run db:reset

# Seed with demo data
npm run db:seed
```

---

## 🚢 Deployment (Render / Railway)

### 1. Environment Variables
Set all variables from `.env.example` in your platform's dashboard.

### 2. Build Command
```bash
npm install && npx prisma generate && npx prisma migrate deploy
```

### 3. Start Command
```bash
npm start
```

### 4. Database
Use a managed PostgreSQL service (Railway Postgres, Render Postgres, Supabase, Neon).

---

## 📮 Postman Collection

Import `SmartExpense.postman_collection.json` into Postman.

The collection:
- Auto-saves `accessToken` and `refreshToken` on login/register
- Has all endpoints pre-configured with example payloads
- Grouped by feature (Auth, Transactions, Budgets, AI)

---

## 🗺️ Data Models

### User
| Field        | Type     | Description              |
|--------------|----------|--------------------------|
| id           | UUID     | Primary key              |
| email        | String   | Unique                   |
| name         | String   |                          |
| passwordHash | String   | bcrypt, never returned   |
| createdAt    | DateTime |                          |

### Transaction
| Field       | Type            | Description                |
|-------------|-----------------|----------------------------|
| id          | UUID            | Primary key                |
| userId      | UUID            | Foreign key → User         |
| type        | INCOME/EXPENSE  |                            |
| amount      | Decimal(12,2)   |                            |
| category    | String          | e.g. Food, Rent, Salary    |
| description | String?         | Optional                   |
| date        | DateTime        | Transaction date           |

### Budget
| Field     | Type             | Description                |
|-----------|------------------|----------------------------|
| id        | UUID             | Primary key                |
| userId    | UUID             | Foreign key → User         |
| category  | String           | Must match transaction cat |
| limit     | Decimal(12,2)    | Spending cap               |
| spent     | Decimal(12,2)    | Auto-synced from txns      |
| period    | WEEKLY/MONTHLY/YEARLY |                       |
| startDate | DateTime         |                            |
| endDate   | DateTime         |                            |

---

## 📝 Git Commit History

```
feat(init): initialize project with Express, Helmet, CORS, graceful shutdown
feat(db): add Prisma schema for User, Transaction, Budget, RefreshToken
feat(auth): implement register, login, JWT access+refresh token system
feat(transactions): implement CRUD with pagination, filtering, sorting
feat(analytics): add summary, category breakdown, monthly trend endpoints
feat(budgets): implement CRUD with real-time spend syncing and health scoring
feat(ai): integrate OpenAI for financial insights and chat endpoints
feat(security): add rate limiting for API, auth, and AI routes
feat(tests): add Jest + Supertest test suites for auth, transactions, budgets
feat(docs): add README, Postman collection, .env.example
```

---

## 👨‍💻 Author

**AmakTech** — Built with ❤️ as a production-grade fintech SaaS backend.
