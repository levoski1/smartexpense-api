# SmartExpense API Specification

**Base URL:** `http://localhost:5000/api/v1`  
**Content-Type:** `application/json`  
**Authentication:** Bearer token via `Authorization: Bearer <accessToken>` header

---

## Response Envelope

All responses follow this structure:

**Success**
```json
{
  "status": "success",
  "message": "Human-readable message",
  "data": { }
}
```

**Error**
```json
{
  "status": "error",
  "message": "Human-readable error message",
  "errors": [ ]
}
```

**Validation Error (400)**
```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": [
    { "field": "email", "message": "Invalid email address" }
  ]
}
```

---

## Rate Limits

| Route Group | Limit |
|---|---|
| `POST /auth/register`, `/auth/login`, `/auth/refresh` | 10 req / 15 min per IP |
| `POST /auth/forgot-password`, `/auth/reset-password` | 5 req / 15 min per IP |
| `GET /ai/*`, `POST /ai/*` | 20 req / hour per IP |
| All other routes | 100 req / 15 min per IP |

---

## 1. Authentication

### POST /auth/register

Creates a new user account and returns tokens.

**Headers:** none required

**Body:**
| Field | Type | Required | Rules |
|---|---|---|---|
| name | string | yes | min 2, max 100 chars |
| email | string | yes | valid email |
| password | string | yes | min 8 chars, 1 uppercase, 1 number, 1 special char |

**Sample Request:**
```json
{
  "name": "Levi Bliz",
  "email": "levi@example.com",
  "password": "Secret@123"
}
```

**Sample Response (201):**
```json
{
  "status": "success",
  "message": "Account created successfully",
  "data": {
    "user": {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "name": "Levi Bliz",
      "email": "levi@example.com",
      "createdAt": "2026-04-07T14:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "15m"
  }
}
```

**Errors:** `400` validation failed · `409` email already exists

---

### POST /auth/login

Authenticates a user and returns tokens.

**Body:**
| Field | Type | Required |
|---|---|---|
| email | string | yes |
| password | string | yes |

**Sample Request:**
```json
{
  "email": "demo@smartexpense.com",
  "password": "Demo@123456"
}
```

**Sample Response (200):**
```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "user": {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "name": "Demo User",
      "email": "demo@smartexpense.com",
      "createdAt": "2026-04-07T14:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "15m"
  }
}
```

**Errors:** `400` validation failed · `401` invalid credentials

---

### POST /auth/refresh

Issues a new access/refresh token pair using a valid refresh token.

**Body:**
| Field | Type | Required |
|---|---|---|
| refreshToken | string | yes |

**Sample Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Sample Response (200):**
```json
{
  "status": "success",
  "message": "Token refreshed",
  "data": {
    "user": {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "email": "demo@smartexpense.com"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "15m"
  }
}
```

**Errors:** `401` invalid or expired refresh token

---

### POST /auth/logout

Invalidates a single refresh token.

**Body:**
| Field | Type | Required |
|---|---|---|
| refreshToken | string | yes |

**Sample Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Sample Response (200):**
```json
{
  "status": "success",
  "message": "Logged out successfully"
}
```

---

### POST /auth/forgot-password

Sends a password reset link to the user's email. Always returns 200 regardless of whether the email exists (prevents user enumeration).

**Headers:** none required

**Rate limit:** 5 requests / 15 min per IP

**Body:**
| Field | Type | Required |
|---|---|---|
| email | string | yes |

**Sample Request:**
```json
{
  "email": "demo@smartexpense.com"
}
```

**Sample Response (200):**
```json
{
  "status": "success",
  "message": "If an account with that email exists, a password reset link has been sent."
}
```

**Errors:** `400` invalid email format · `429` rate limit exceeded

---

### POST /auth/reset-password

Resets the user's password using the token received in the reset email. Invalidates all existing refresh tokens on success.

**Headers:** none required

**Rate limit:** 5 requests / 15 min per IP

**Body:**
| Field | Type | Required | Notes |
|---|---|---|---|
| token | string | yes | plaintext token from the reset link |
| password | string | yes | min 8 chars, 1 uppercase, 1 number, 1 special char |

**Sample Request:**
```json
{
  "token": "a3f8c2e1d4b7...",
  "password": "NewSecret@456"
}
```

**Sample Response (200):**
```json
{
  "status": "success",
  "message": "Password reset successfully. Please log in with your new password."
}
```

**Errors:** `400` invalid/expired/used token · `400` password policy violation · `429` rate limit exceeded

---

### POST /auth/logout-all

🔒 **Requires auth.** Invalidates all refresh tokens for the current user (all devices).

**Headers:** `Authorization: Bearer <accessToken>`

**Body:** none

**Sample Response (200):**
```json
{
  "status": "success",
  "message": "Logged out from all devices"
}
```

---

### GET /auth/profile

🔒 **Requires auth.** Returns the authenticated user's profile.

**Headers:** `Authorization: Bearer <accessToken>`

**Sample Response (200):**
```json
{
  "status": "success",
  "message": "Success",
  "data": {
    "user": {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "name": "Demo User",
      "email": "demo@smartexpense.com",
      "createdAt": "2026-04-07T14:00:00.000Z",
      "updatedAt": "2026-04-07T14:00:00.000Z"
    }
  }
}
```

**Errors:** `401` missing/invalid token · `404` user not found

---

## 2. Transactions

All transaction endpoints require `Authorization: Bearer <accessToken>`.

---

### GET /transactions

Returns a paginated list of the user's transactions with optional filters.

**Query Parameters:**
| Param | Type | Required | Default | Notes |
|---|---|---|---|---|
| page | number | no | 1 | |
| limit | number | no | 20 | max 100 |
| type | string | no | — | `INCOME` or `EXPENSE` |
| category | string | no | — | exact match |
| startDate | ISO datetime | no | — | |
| endDate | ISO datetime | no | — | |
| sortBy | string | no | `date` | `date`, `amount`, `createdAt` |
| sortOrder | string | no | `desc` | `asc` or `desc` |

**Sample Request:**
```
GET /api/v1/transactions?type=EXPENSE&category=Food&page=1&limit=10
```

**Sample Response (200):**
```json
{
  "status": "success",
  "message": "Success",
  "data": {
    "items": [
      {
        "id": "txn-uuid-001",
        "type": "EXPENSE",
        "amount": "350.00",
        "category": "Food",
        "description": "Groceries",
        "date": "2026-04-07T00:00:00.000Z",
        "createdAt": "2026-04-07T14:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 10,
      "totalPages": 1,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

---

### POST /transactions

Creates a new transaction.

**Body:**
| Field | Type | Required | Notes |
|---|---|---|---|
| type | string | yes | `INCOME` or `EXPENSE` |
| amount | number | yes | positive, max 2 decimal places |
| category | string | yes | max 50 chars |
| description | string | no | max 255 chars |
| date | ISO datetime | no | defaults to now |

**Sample Request:**
```json
{
  "type": "EXPENSE",
  "amount": 350.00,
  "category": "Food",
  "description": "Weekly groceries",
  "date": "2026-04-07T10:00:00.000Z"
}
```

**Sample Response (201):**
```json
{
  "status": "success",
  "message": "Transaction created",
  "data": {
    "transaction": {
      "id": "txn-uuid-001",
      "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "type": "EXPENSE",
      "amount": "350.00",
      "category": "Food",
      "description": "Weekly groceries",
      "date": "2026-04-07T10:00:00.000Z",
      "createdAt": "2026-04-07T14:00:00.000Z",
      "updatedAt": "2026-04-07T14:00:00.000Z"
    }
  }
}
```

**Errors:** `400` validation failed

---

### GET /transactions/:id

Returns a single transaction by ID.

**Path Params:** `id` — transaction UUID

**Sample Response (200):**
```json
{
  "status": "success",
  "message": "Success",
  "data": {
    "transaction": {
      "id": "txn-uuid-001",
      "type": "EXPENSE",
      "amount": "350.00",
      "category": "Food",
      "description": "Weekly groceries",
      "date": "2026-04-07T10:00:00.000Z"
    }
  }
}
```

**Errors:** `404` transaction not found

---

### PATCH /transactions/:id

Partially updates a transaction. All fields are optional.

**Path Params:** `id` — transaction UUID

**Body:** same fields as POST, all optional

**Sample Request:**
```json
{
  "amount": 420.00,
  "description": "Groceries + household items"
}
```

**Sample Response (200):**
```json
{
  "status": "success",
  "message": "Transaction updated",
  "data": {
    "transaction": {
      "id": "txn-uuid-001",
      "type": "EXPENSE",
      "amount": "420.00",
      "category": "Food",
      "description": "Groceries + household items",
      "date": "2026-04-07T10:00:00.000Z"
    }
  }
}
```

**Errors:** `400` validation failed · `404` not found

---

### DELETE /transactions/:id

Deletes a transaction.

**Path Params:** `id` — transaction UUID

**Sample Response (200):**
```json
{
  "status": "success",
  "message": "Transaction deleted"
}
```

**Errors:** `404` not found

---

### GET /transactions/summary

Returns income/expense totals and balance for the user.

**Query Parameters:** `startDate`, `endDate` (optional ISO datetime filters)

**Sample Response (200):**
```json
{
  "status": "success",
  "message": "Success",
  "data": {
    "summary": {
      "totalIncome": "5750.00",
      "totalExpense": "3050.00",
      "balance": "2700.00",
      "incomeCount": 3,
      "expenseCount": 9
    }
  }
}
```

---

### GET /transactions/breakdown

Returns spending breakdown by category.

**Query Parameters:**
| Param | Type | Default | Notes |
|---|---|---|---|
| type | string | `EXPENSE` | `INCOME` or `EXPENSE` |
| startDate | ISO datetime | — | optional |
| endDate | ISO datetime | — | optional |

**Sample Response (200):**
```json
{
  "status": "success",
  "message": "Success",
  "data": {
    "breakdown": [
      { "category": "Food", "total": 570.00, "count": 2, "percentage": 19 },
      { "category": "Rent", "total": 1200.00, "count": 1, "percentage": 39 }
    ],
    "type": "EXPENSE"
  }
}
```

---

### GET /transactions/trend

Returns monthly income vs expense trend.

**Query Parameters:**
| Param | Type | Default |
|---|---|---|
| months | number | 6 |

**Sample Response (200):**
```json
{
  "status": "success",
  "message": "Success",
  "data": {
    "trend": [
      { "month": "2026-04", "income": 5750.00, "expense": 3050.00, "net": 2700.00 },
      { "month": "2026-03", "income": 5000.00, "expense": 2800.00, "net": 2200.00 }
    ]
  }
}
```

---

## 3. Budgets

All budget endpoints require `Authorization: Bearer <accessToken>`.

---

### GET /budgets

Returns all budgets for the user (all periods).

**Sample Response (200):**
```json
{
  "status": "success",
  "message": "Success",
  "data": {
    "budgets": [
      {
        "id": "bgt-uuid-001",
        "category": "Food",
        "limit": "800.00",
        "spent": "570.00",
        "period": "MONTHLY",
        "startDate": "2026-04-01T00:00:00.000Z",
        "endDate": "2026-04-30T00:00:00.000Z"
      }
    ]
  }
}
```

---

### POST /budgets

Creates a new budget.

**Body:**
| Field | Type | Required | Notes |
|---|---|---|---|
| category | string | yes | max 50 chars |
| limit | number | yes | positive |
| period | string | no | `WEEKLY`, `MONTHLY`, `YEARLY` — default `MONTHLY` |
| startDate | ISO datetime | yes | |
| endDate | ISO datetime | yes | must be after startDate |

**Sample Request:**
```json
{
  "category": "Food",
  "limit": 800.00,
  "period": "MONTHLY",
  "startDate": "2026-04-01T00:00:00.000Z",
  "endDate": "2026-04-30T23:59:59.000Z"
}
```

**Sample Response (201):**
```json
{
  "status": "success",
  "message": "Budget created",
  "data": {
    "budget": {
      "id": "bgt-uuid-001",
      "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "category": "Food",
      "limit": "800.00",
      "spent": "0.00",
      "period": "MONTHLY",
      "startDate": "2026-04-01T00:00:00.000Z",
      "endDate": "2026-04-30T23:59:59.000Z",
      "createdAt": "2026-04-07T14:00:00.000Z"
    }
  }
}
```

**Errors:** `400` validation failed · `409` overlapping budget exists

---

### GET /budgets/active

Returns only currently active budgets (where today falls within startDate–endDate).

**Sample Response (200):**
```json
{
  "status": "success",
  "message": "Success",
  "data": {
    "budgets": [
      {
        "id": "bgt-uuid-001",
        "category": "Food",
        "limit": "800.00",
        "spent": "570.00",
        "period": "MONTHLY",
        "startDate": "2026-04-01T00:00:00.000Z",
        "endDate": "2026-04-30T23:59:59.000Z"
      }
    ]
  }
}
```

---

### GET /budgets/dashboard

Returns enriched active budgets with progress metrics.

**Sample Response (200):**
```json
{
  "status": "success",
  "message": "Success",
  "data": {
    "budgets": [
      {
        "id": "bgt-uuid-001",
        "category": "Food",
        "limit": 800.00,
        "spent": 570.00,
        "remaining": 230.00,
        "percentUsed": 71,
        "status": "warning",
        "period": "MONTHLY",
        "startDate": "2026-04-01T00:00:00.000Z",
        "endDate": "2026-04-30T23:59:59.000Z"
      }
    ],
    "summary": {
      "totalBudgets": 6,
      "onTrack": 4,
      "warning": 1,
      "exceeded": 1
    }
  }
}
```

> `status` values: `on_track` (< 80%) · `warning` (80–99%) · `exceeded` (≥ 100%)

---

### GET /budgets/:id

Returns a single budget by ID.

**Path Params:** `id` — budget UUID

**Sample Response (200):**
```json
{
  "status": "success",
  "message": "Success",
  "data": {
    "budget": {
      "id": "bgt-uuid-001",
      "category": "Food",
      "limit": "800.00",
      "spent": "570.00",
      "period": "MONTHLY",
      "startDate": "2026-04-01T00:00:00.000Z",
      "endDate": "2026-04-30T23:59:59.000Z"
    }
  }
}
```

**Errors:** `404` budget not found

---

### PATCH /budgets/:id

Partially updates a budget. All fields optional.

**Path Params:** `id` — budget UUID

**Sample Request:**
```json
{
  "limit": 1000.00
}
```

**Sample Response (200):**
```json
{
  "status": "success",
  "message": "Budget updated",
  "data": {
    "budget": {
      "id": "bgt-uuid-001",
      "category": "Food",
      "limit": "1000.00",
      "spent": "570.00"
    }
  }
}
```

**Errors:** `400` validation failed · `404` not found

---

### DELETE /budgets/:id

Deletes a budget.

**Sample Response (200):**
```json
{
  "status": "success",
  "message": "Budget deleted"
}
```

**Errors:** `404` not found

---

## 4. AI

All AI endpoints require `Authorization: Bearer <accessToken>`.  
Rate limit: **20 requests / hour per IP**.

---

### GET /ai/insights

Analyzes the user's financial data and returns AI-generated insights and recommendations.

**Body:** none

**Sample Response (200):**
```json
{
  "status": "success",
  "message": "AI insights generated",
  "data": {
    "overallHealthScore": 72,
    "healthLabel": "Good",
    "summary": "Your finances are in good shape. You saved 47% of your income this month, though Food spending is approaching its budget limit.",
    "insights": [
      {
        "type": "budget",
        "title": "Food budget at 71%",
        "description": "You've spent ₦570 of your ₦800 Food budget with 23 days remaining.",
        "severity": "warning"
      }
    ],
    "recommendations": [
      "Reduce restaurant spending by ₦100 to stay within your Food budget."
    ],
    "topSpendingCategory": "Rent",
    "savingsRate": 47,
    "projections": {
      "endOfMonthBalance": 2400.00,
      "budgetsAtRisk": ["Food", "Entertainment"]
    },
    "generatedAt": "2026-04-07T14:00:00.000Z",
    "tokensUsed": 843
  }
}
```

**Errors:** `401` unauthorized · `429` rate limit · `502` AI service error · `503` AI misconfigured

---

### POST /ai/chat

Sends a message to the AI financial advisor with the user's financial context.

**Body:**
| Field | Type | Required | Notes |
|---|---|---|---|
| message | string | yes | max 500 chars |

**Sample Request:**
```json
{
  "message": "Am I spending too much on food this month?"
}
```

**Sample Response (200):**
```json
{
  "status": "success",
  "message": "AI response generated",
  "data": {
    "reply": "Based on your data, you've spent ₦570 on Food so far this month against a ₦800 budget — that's 71%. With 23 days left, you're on track but close to the limit. I'd suggest keeping daily food spending under ₦10 for the rest of the month.",
    "tokensUsed": 312,
    "generatedAt": "2026-04-07T14:00:00.000Z"
  }
}
```

**Errors:** `400` missing/invalid message · `401` unauthorized · `429` rate limit · `502` AI service error

---

## 5. Common Error Responses

| Status | Meaning | Example message |
|---|---|---|
| 400 | Bad request / validation failed | `"Validation failed"` |
| 401 | Missing or invalid token | `"Unauthorized"` |
| 403 | Forbidden | `"Access denied"` |
| 404 | Resource not found | `"Transaction not found"` |
| 409 | Conflict | `"An account with this email already exists"` |
| 429 | Rate limit exceeded | `"Too many login attempts. Please try again in 15 minutes."` |
| 502 | AI service error | `"AI service error: ..."` |
| 503 | AI misconfigured | `"AI service configuration error. Please contact support."` |
| 500 | Internal server error | `"Internal server error"` |

---

## 6. Postman Test Data

### Demo credentials (from seed)
```
Email:    demo@smartexpense.com
Password: Demo@123456
```

### Environment variables to set in Postman
```
baseUrl       = http://localhost:5000/api/v1
accessToken   = (paste from login response)
refreshToken  = (paste from login response)
transactionId = (paste from create transaction response)
budgetId      = (paste from create budget response)
```

### Quick test sequence

**1. Register**
```json
POST {{baseUrl}}/auth/register
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "Test@12345"
}
```

**2. Login**
```json
POST {{baseUrl}}/auth/login
{
  "email": "demo@smartexpense.com",
  "password": "Demo@123456"
}
```
→ Save `data.accessToken` and `data.refreshToken` to env vars.

**3. Create transaction**
```json
POST {{baseUrl}}/transactions
Authorization: Bearer {{accessToken}}
{
  "type": "EXPENSE",
  "amount": 150.00,
  "category": "Transport",
  "description": "Uber to work",
  "date": "2026-04-07T08:00:00.000Z"
}
```

**4. Create budget**
```json
POST {{baseUrl}}/budgets
Authorization: Bearer {{accessToken}}
{
  "category": "Transport",
  "limit": 300.00,
  "period": "MONTHLY",
  "startDate": "2026-04-01T00:00:00.000Z",
  "endDate": "2026-04-30T23:59:59.000Z"
}
```

**5. Get dashboard**
```
GET {{baseUrl}}/budgets/dashboard
Authorization: Bearer {{accessToken}}
```

**6. AI insights**
```
GET {{baseUrl}}/ai/insights
Authorization: Bearer {{accessToken}}
```

**7. AI chat**
```json
POST {{baseUrl}}/ai/chat
Authorization: Bearer {{accessToken}}
{
  "message": "How can I reduce my expenses this month?"
}
```

**8. Refresh token**
```json
POST {{baseUrl}}/auth/refresh
{
  "refreshToken": "{{refreshToken}}"
}
```

**9. Logout**
```json
POST {{baseUrl}}/auth/logout
{
  "refreshToken": "{{refreshToken}}"
}
```
