# PhD Application Tracker – Backend API Documentation

This document describes the REST APIs exposed by the Node.js/Express backend for the mobile application.

Base URL: `http://localhost:<PORT>` (default PORT is `3000`)

Authentication: JSON Web Token (JWT) via `Authorization: Bearer <token>` header for protected routes.

Note: Environment variable names expected by the code:
- `MONGODB_URI`: Mongo connection string
- `GMAIL_CLIENT_ID`: Google OAuth 2.0 Client ID
- `GMAIL_CLIENT_SECRET`: Google OAuth 2.0 Client Secret
- `GMAIL_REDIRECT_URI`: OAuth redirect URI (e.g., `http://localhost:3000/auth/google/callback`)
- `JWT_SECRET`: Secret used to sign JWTs
- `PORT`: Server port (default `3000`)

Routes defined in:
- Auth: `src/routes/auth.js`
- Applications: `src/routes/api.js`

---

## Authentication

### POST /auth/register
Create a new local account.

Request body (JSON):
```
{
  "username": "john",
  "email": "john@example.com",
  "password": "StrongP@ssw0rd"
}
```

Responses:
- 201 Created
```
{
  "token": "<jwt>",
  "user": { "id": "...", "username": "john", "email": "john@example.com" }
}
```
- 400 Bad Request – missing fields
- 409 Conflict – user already exists
- 500 Internal Server Error

### POST /auth/login
Login with local credentials.

Request body (JSON):
```
{ "email": "john@example.com", "password": "StrongP@ssw0rd" }
```

Responses:
- 200 OK
```
{
  "token": "<jwt>",
  "user": { "id": "...", "username": "john", "email": "john@example.com" }
}
```
- 400 Bad Request – missing fields
- 401 Unauthorized – invalid credentials
- 500 Internal Server Error

### POST /auth/logout
Stateless logout (client discards token). No body.

Responses:
- 200 OK `{ "message": "Logged out" }`

### GET /auth/me
Get current user profile. Protected.

Headers:
- `Authorization: Bearer <jwt>`

Responses:
- 200 OK – user object (without password and tokens)
- 401 Unauthorized – missing/invalid token
- 404 Not Found – user not found

### PUT /auth/me
Update profile. Protected.

Headers:
- `Authorization: Bearer <jwt>`

Request body (any of):
```
{ "username": "newname" }
```
```
{ "password": "NewStrongPass" }
```

Responses:
- 200 OK – updated user object
- 401 Unauthorized
- 500 Internal Server Error

### GET /auth/google/initiate
Begin Google OAuth to allow Gmail read-only access.

Response:
- 200 OK
```
{ "url": "https://accounts.google.com/o/oauth2/v2/auth?..." }
```

The client should open this URL in the browser. User consents and Google redirects to the callback.

### GET /auth/google/callback?code=...
Google OAuth callback. The server exchanges `code` for tokens, stores them on the user, and returns a JWT to the client.

Responses:
- 200 OK
```
{
  "token": "<jwt>",
  "user": { "id": "...", "username": "john", "email": "john@example.com" }
}
```
- 400 Bad Request – missing `code`
- 500 Internal Server Error

Note: After linking, Gmail read-only access is available for syncing applications.

---

## Applications
All application routes are protected. Include `Authorization: Bearer <jwt>`.

Application model fields (server-side):
- `user` (ObjectId) – owner (inferred from JWT)
- `applicantName` (string, optional)
- `university` (string, optional)
- `program` (string, optional)
- `applicationId` (string, optional)
- `applicationStatus` (enum: `Submitted|Under Review|Accepted|Rejected`; default `Submitted`)
- `interviewDate` (Date, optional)
- `submissionDate` (Date; default now)
- `notes` (string, optional)
- `sourceEmailId` (string, optional; set by Gmail sync)

### GET /api/applications
List the current user’s applications.

Responses:
- 200 OK `[ { ...application }, ... ]`
- 401 Unauthorized
- 500 Internal Server Error

### POST /api/applications
Create an application manually.

Request body (JSON): any subset of model fields except `user` and `sourceEmailId`.
Example:
```
{
  "applicantName": "John Doe",
  "university": "Stanford University",
  "program": "PhD in CS",
  "applicationStatus": "Under Review",
  "interviewDate": "2025-09-15T10:00:00.000Z",
  "submissionDate": "2025-08-01T00:00:00.000Z",
  "notes": "Submitted via portal"
}
```

Responses:
- 201 Created `{ ...application }`
- 401 Unauthorized
- 500 Internal Server Error

### GET /api/applications/:id
Fetch one application by id (must belong to current user).

Responses:
- 200 OK `{ ...application }`
- 401 Unauthorized
- 404 Not Found
- 500 Internal Server Error

### PUT /api/applications/:id
Update an application by id (must belong to current user).

Request body (JSON): any updatable fields.

Responses:
- 200 OK `{ ...updatedApplication }`
- 401 Unauthorized
- 404 Not Found
- 500 Internal Server Error

### DELETE /api/applications/:id
Delete an application by id (must belong to current user).

Responses:
- 200 OK `{ "success": true }`
- 401 Unauthorized
- 404 Not Found
- 500 Internal Server Error

### POST /api/applications/sync
Pull recent relevant emails from Gmail and upsert applications for the current user. Requires that the user linked Google via OAuth.

Behavior:
- Lists recent Gmail messages (query defaults to `subject:PhD`).
- Fetches each message body, parses to extract `applicationId`, `status`, `interviewDate` (see `src/utils/emailParser.js`).
- Upserts by `sourceEmailId` per user, updating `applicationStatus`, `interviewDate`, `submissionDate`, etc.

Responses:
- 200 OK `{ "synced": <numberOfUpsertedOrUpdatedItems> }`
- 400 Bad Request – Google account not connected
- 401 Unauthorized
- 500 Internal Server Error

---

## Authentication Details

- Send JWT in `Authorization: Bearer <token>` header for protected routes.
- Tokens are issued on `/auth/register`, `/auth/login`, and `/auth/google/callback` and are valid for 7 days.
- Logout is client-side (discard the token).

---

## Error Format

Controllers typically return:
```
{ "message": "<human-readable message>", "error": "<optional more details>" }
```

Global error handler (`src/middleware/errorHandler.js`) returns 500s as:
```
{
  "success": false,
  "message": "An unexpected error occurred. Please try again later."
}
```

---

## Gmail Parsing Notes

- Email parsing lives in `src/utils/emailParser.js`.
- Expected patterns in the email body:
  - `Application ID: <alphanumeric>` -> `applicationId`
  - `Status: <word>` -> `applicationStatus`
  - `Interview Date: YYYY-MM-DD` -> `interviewDate`
- You can adjust the regex patterns and the Gmail search query (`src/services/gmailService.js`) to improve recall.

---

## Example Flow (Google OAuth + Sync)
1. User signs in (or registers) to get a JWT.
2. Frontend calls `GET /auth/google/initiate`, opens the returned URL.
3. User completes consent; server handles `/auth/google/callback` and returns a JWT (also stores refresh token).
4. Frontend calls `POST /api/applications/sync` with the JWT to import applications from Gmail.

---

## Versioning
Current API version: v1 (unversioned paths). If breaking changes are introduced, consider namespacing under `/v1`.
