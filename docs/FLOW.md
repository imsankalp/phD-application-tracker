# Frontend ↔ Backend Flow Diagram and API Sequence

This document visualizes how the mobile frontend interacts with the backend APIs, Google OAuth, Gmail, and MongoDB. It also enumerates the request/response of each step for quick reference while building the UI.

- Backend app entry: `server.js`
- Routes:
  - Auth: `src/routes/auth.js`
  - Applications: `src/routes/api.js`
- Controllers:
  - `src/controllers/userController.js`
  - `src/controllers/applicationController.js`

---

## 1) Local Auth (Register/Login) + Profile

```mermaid
sequenceDiagram
    autonumber
    participant FE as Mobile App (Frontend)
    participant BE as Backend (Express)
    participant DB as MongoDB

    rect rgb(230, 255, 230)
    note over FE,BE: Register
    FE->>BE: POST /auth/register { username, email, password }
    BE->>DB: Create User (hash password)
    DB-->>BE: User created
    BE-->>FE: 201 { token, user }
    end

    rect rgb(230, 240, 255)
    note over FE,BE: Login
    FE->>BE: POST /auth/login { email, password }
    BE->>DB: Find User + compare password
    DB-->>BE: User
    BE-->>FE: 200 { token, user }
    end

    rect rgb(255, 245, 230)
    note over FE,BE: Profile
    FE->>BE: GET /auth/me (Authorization: Bearer <jwt>)
    BE->>DB: findById(userId)
    DB-->>BE: User (no secrets)
    BE-->>FE: 200 { user }

    FE->>BE: PUT /auth/me { username? password? } + JWT
    BE->>DB: update user (hash password if provided)
    DB-->>BE: Updated user
    BE-->>FE: 200 { user }
    end
```

### Requests / Responses
- POST `/auth/register`
  - Req: `{ username, email, password }`
  - Res: `201 { token, user }`
- POST `/auth/login`
  - Req: `{ email, password }`
  - Res: `200 { token, user }`
- GET `/auth/me` (JWT)
  - Res: `200 { user }`
- PUT `/auth/me` (JWT)
  - Req: `{ username? password? }`
  - Res: `200 { user }`

---

## 2) Google OAuth Link (Gmail Read-Only Consent)

```mermaid
sequenceDiagram
    autonumber
    participant FE as Mobile App (Frontend)
    participant BE as Backend (Express)
    participant GOOG as Google OAuth
    participant DB as MongoDB

    note over FE,BE: Get OAuth URL
    FE->>BE: GET /auth/google/initiate
    BE-->>FE: 200 { url }

    note over FE,GOOG: User Consents in Browser
    FE->>GOOG: Open url in browser, user logs in & consents
    GOOG-->>BE: GET /auth/google/callback?code=...

    note over BE,DB: Server exchanges code for tokens
    BE->>GOOG: Exchange code → tokens (access, refresh)
    GOOG-->>BE: tokens
    BE->>DB: Upsert user.googleTokens + googleId
    DB-->>BE: ok
    BE-->>FE: 200 { token, user }
```

### Requests / Responses
- GET `/auth/google/initiate`
  - Res: `200 { url }` (open in browser)
- GET `/auth/google/callback?code=...`
  - Res: `200 { token, user }`

---

## 3) Applications – CRUD

```mermaid
sequenceDiagram
    autonumber
    participant FE as Mobile App
    participant BE as Backend
    participant DB as MongoDB

    note over FE,BE: List
    FE->>BE: GET /api/applications (JWT)
    BE->>DB: find({ user: jwt.userId })
    DB-->>BE: [applications]
    BE-->>FE: 200 [applications]

    note over FE,BE: Create
    FE->>BE: POST /api/applications { fields } (JWT)
    BE->>DB: create({ ...fields, user: jwt.userId })
    DB-->>BE: application
    BE-->>FE: 201 { application }

    note over FE,BE: Get by id
    FE->>BE: GET /api/applications/:id (JWT)
    BE->>DB: findOne({ _id, user: jwt.userId })
    DB-->>BE: application | null
    BE-->>FE: 200 { application } | 404

    note over FE,BE: Update
    FE->>BE: PUT /api/applications/:id { fields } (JWT)
    BE->>DB: findOneAndUpdate({ _id, user }, { fields })
    DB-->>BE: updated application | null
    BE-->>FE: 200 { application } | 404

    note over FE,BE: Delete
    FE->>BE: DELETE /api/applications/:id (JWT)
    BE->>DB: findOneAndDelete({ _id, user })
    DB-->>BE: deleted | null
    BE-->>FE: 200 { success: true } | 404
```

### Requests / Responses
- GET `/api/applications` (JWT) → `200 [ { ...app } ]`
- POST `/api/applications` (JWT) → `201 { ...app }`
- GET `/api/applications/:id` (JWT) → `200 { ...app } | 404`
- PUT `/api/applications/:id` (JWT) → `200 { ...app } | 404`
- DELETE `/api/applications/:id` (JWT) → `200 { success: true } | 404`

---

## 4) Gmail Sync – Import Applications from Emails

```mermaid
sequenceDiagram
    autonumber
    participant FE as Mobile App
    participant BE as Backend
    participant GOOG as Gmail API
    participant DB as MongoDB

    rect rgb(245,245,255)
    note over FE,BE: Trigger Sync
    FE->>BE: POST /api/applications/sync (JWT)
    end

    note over BE,GOOG: Use stored refresh token to access Gmail
    BE->>GOOG: List messages (query: subject:PhD)
    GOOG-->>BE: [message ids]
    BE->>GOOG: Get each message (full)
    GOOG-->>BE: message payloads

    note over BE,DB: Parse & Upsert
    BE->>BE: Parse bodies → { applicationId, status, interviewDate }
    BE->>DB: Upsert by { user, sourceEmailId }
    DB-->>BE: upserted/updated docs

    BE-->>FE: 200 { synced: <count> }
```

### Request / Response
- POST `/api/applications/sync` (JWT)
  - Res: `200 { synced: number }`
  - Errors: `400` if Google not linked; `401` if missing JWT

---

## 5) High-Level User Journeys

- Onboarding (Local Auth)
  1. Register/Login → save JWT
  2. Fetch profile `/auth/me`
  3. Manually create or list applications

- Gmail-based Import
  1. Initiate OAuth `/auth/google/initiate` → open URL
  2. Handle callback `/auth/google/callback` → store returned JWT
  3. Trigger sync `/api/applications/sync`
  4. Show updated list `/api/applications`

---

## Error Handling & Security
- All protected routes require `Authorization: Bearer <jwt>`.
- Common errors: `401 Unauthorized`, `404 Not Found`, `500 Internal Server Error`.
- Global error handler: `src/middleware/errorHandler.js`.
- Tokens valid for 7 days, issued on register/login/google-callback.

---

## Notes for Frontend Implementation
- Keep `jwt` in secure storage (Keychain/Keystore/Secure Storage).
- Always set `Content-Type: application/json` for JSON bodies.
- Handle 401 by redirecting to login and clearing stored token.
- During Google OAuth, you’ll open a browser (custom tab/SafariViewController) to complete consent.
