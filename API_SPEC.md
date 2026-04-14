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

> All date fields in responses are returned in `dd/mm/yyyy` format (e.g. `"07/04/2026"`).

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
      "createdAt": "07/04/2026"
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
      "createdAt": "07/04/2026"
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

**Rate limit:** 5 req / 15 min per IP

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

Resets the user's password using the token from the reset email. Invalidates all existing refresh tokens on success.

**Rate limit:** 5 req / 15 min per IP

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
      "createdAt": "07/04/2026",
      "updatedAt": "07/04/2026"
    }
  }
}
```

**Errors:** `401` missing/invalid token · `404` user not found

---

## 2. Transactions

All transaction endpoints require `Authorization: Bearer <accessToken>`.

> `type` accepts any case (`expense`, `EXPENSE`, `Expense`) — normalized to uppercase.  
> `category` accepts any case — normalized to lowercase.  
> `date` accepts `dd/mm/yyyy` or ISO datetime format.

---

### GET /transactions

Returns a paginated list of the user's transactions with optional filters.

**Query Parameters:**
| Param | Type | Required | Default | Notes |
|---|---|---|---|---|
| page | number | no | 1 | |
| limit | number | no | 20 | max 100 |
| type | string | no | — | case-insensitive: `income` or `expense` |
| category | string | no | — | partial match, case-insensitive |
| startDate | string | no | — | `dd/mm/yyyy` or ISO |
| endDate | string | no | — | `dd/mm/yyyy` or ISO |
| sortBy | string | no | `date` | `date`, `amount`, `createdAt` |
| sortOrder | string | no | `desc` | `asc` or `desc` |

**Sample Request:**
```
GET /api/v1/transactions?type=expense&category=food&page=1&limit=10
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
        "category": "food",
        "description": "Groceries",
        "date": "07/04/2026",
        "createdAt": "07/04/2026",
        "updatedAt": "07/04/2026"
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
| type | string | yes | case-insensitive: `income` or `expense` |
| amount | number | yes | positive, max 2 decimal places |
| category | string | yes | max 50 chars, any case |
| description | string | no | max 255 chars |
| date | string | no | `dd/mm/yyyy` or ISO — defaults to today |

**Sample Request:**
```json
{
  "type": "expense",
  "amount": 350.00,
  "category": "Food",
  "description": "Weekly groceries",
  "date": "07/04/2026"
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
      "category": "food",
      "description": "Weekly groceries",
      "date": "07/04/2026",
      "createdAt": "07/04/2026",
      "updatedAt": "07/04/2026"
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
      "category": "food",
      "description": "Weekly groceries",
      "date": "07/04/2026",
      "createdAt": "07/04/2026",
      "updatedAt": "07/04/2026"
    }
  }
}
```

**Errors:** `404` transaction not found

---

### PATCH /transactions/:id

Partially updates a transaction. All fields optional.

**Path Params:** `id` — transaction UUID

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
      "category": "food",
      "description": "Groceries + household items",
      "date": "07/04/2026",
      "createdAt": "07/04/2026",
      "updatedAt": "07/04/2026"
    }
  }
}
```

**Errors:** `400` validation failed · `404` not found

---

### DELETE /transactions/:id

Deletes a transaction.

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

Returns income/expense totals and balance.

**Query Parameters:** `startDate`, `endDate` (optional, `dd/mm/yyyy` or ISO)

**Sample Response (200):**
```json
{
  "status": "success",
  "message": "Success",
  "data": {
    "summary": {
      "totalIncome": 5750,
      "totalExpense": 3050,
      "balance": 2700,
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
| type | string | `EXPENSE` | case-insensitive |
| startDate | string | — | optional |
| endDate | string | — | optional |

**Sample Response (200):**
```json
{
  "status": "success",
  "message": "Success",
  "data": {
    "breakdown": [
      { "category": "food", "total": 570.00, "count": 2, "percentage": 19 },
      { "category": "rent", "total": 1200.00, "count": 1, "percentage": 39 }
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

Returns all budgets for the user.

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
        "limit": 800,
        "spent": 570,
        "remaining": 230,
        "percentageUsed": 71,
        "isExceeded": false,
        "status": "warning",
        "daysLeft": 23,
        "period": "MONTHLY",
        "startDate": "01/04/2026",
        "endDate": "30/04/2026",
        "createdAt": "07/04/2026"
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
| startDate | string | yes | `dd/mm/yyyy` or ISO |
| endDate | string | yes | must be after startDate |

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
      "category": "Food",
      "limit": 800,
      "spent": 0,
      "remaining": 800,
      "percentageUsed": 0,
      "isExceeded": false,
      "status": "healthy",
      "daysLeft": 23,
      "period": "MONTHLY",
      "startDate": "01/04/2026",
      "endDate": "30/04/2026",
      "createdAt": "07/04/2026"
    }
  }
}
```

**Errors:** `400` validation failed · `409` overlapping budget exists

---

### GET /budgets/active

Returns only currently active budgets (today falls within startDate–endDate).

**Sample Response (200):** same shape as `GET /budgets`

---

### GET /budgets/dashboard

Returns enriched active budgets with full progress metrics and summary.

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
        "limit": 800,
        "spent": 570,
        "remaining": 230,
        "percentageUsed": 71,
        "isExceeded": false,
        "status": "warning",
        "daysLeft": 23,
        "dailyBurnRate": 28.5,
        "projectedDaysToExhaust": 8,
        "period": "MONTHLY",
        "startDate": "01/04/2026",
        "endDate": "30/04/2026"
      }
    ],
    "summary": {
      "totalBudgets": 6,
      "totalAlerts": 2,
      "totalExceeded": 1,
      "healthScore": 67
    },
    "alerts": [ ],
    "exceeded": [ ]
  }
}
```

> `status` values: `healthy` (< 75%) · `warning` (75–89%) · `critical` (90–99%) · `exceeded` (≥ 100%)

---

### GET /budgets/:id

Returns a single enriched budget by ID.

**Errors:** `404` budget not found

---

### PATCH /budgets/:id

Partially updates a budget. All fields optional.

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
      "limit": 1000,
      "spent": 570,
      "remaining": 430,
      "percentageUsed": 57,
      "status": "healthy"
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

## 4. AI (Powered by Groq)

All AI endpoints require `Authorization: Bearer <accessToken>`.  
Rate limit: **20 requests / hour per IP**.  
Model: `llama-3.3-70b-versatile` via Groq.

---

### GET /ai/insights

Analyzes the user's financial data and returns AI-generated insights and recommendations.

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
    "topSpendingCategory": "rent",
    "savingsRate": 47,
    "projections": {
      "endOfMonthBalance": 2400.00,
      "budgetsAtRisk": ["food", "entertainment"]
    },
    "generatedAt": "07/04/2026",
    "tokensUsed": 843
  }
}
```

**Errors:** `401` unauthorized · `429` rate limit · `502` AI service error

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
    "reply": "Based on your data, you've spent ₦570 on food so far this month against a ₦800 budget — that's 71%. With 23 days left, you're on track but close to the limit.",
    "tokensUsed": 312,
    "generatedAt": "07/04/2026"
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

**3. Forgot password**
```json
POST {{baseUrl}}/auth/forgot-password
{
  "email": "demo@smartexpense.com"
}
```

**4. Reset password**
```json
POST {{baseUrl}}/auth/reset-password
{
  "token": "<token-from-email>",
  "password": "NewSecret@456"
}
```

**5. Create transaction (dd/mm/yyyy date)**
```json
POST {{baseUrl}}/transactions
Authorization: Bearer {{accessToken}}
{
  "type": "expense",
  "amount": 150.00,
  "category": "Transport",
  "description": "Uber to work",
  "date": "07/04/2026"
}
```

**6. Create budget**
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

**7. Get dashboard**
```
GET {{baseUrl}}/budgets/dashboard
Authorization: Bearer {{accessToken}}
```

**8. AI insights**
```
GET {{baseUrl}}/ai/insights
Authorization: Bearer {{accessToken}}
```

**9. AI chat**
```json
POST {{baseUrl}}/ai/chat
Authorization: Bearer {{accessToken}}
{
  "message": "How can I reduce my expenses this month?"
}
```

**10. Refresh token**
```json
POST {{baseUrl}}/auth/refresh
{
  "refreshToken": "{{refreshToken}}"
}
```

**11. Logout**
```json
POST {{baseUrl}}/auth/logout
{
  "refreshToken": "{{refreshToken}}"
}
```
