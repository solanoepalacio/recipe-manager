# Step 2 — Authentication & Authorization Design

## Overview

The API serves two clients:
- **UI (Next.js)** — human users, authenticated via cookie-based sessions
- **Agent** — programmatic client, authenticated via API key (Bearer token)

Both clients use the same endpoints for all non-admin functionality. Admin endpoints are human-only and use a separate auth flow.

---

## Authentication Flows

### 1. User Login (UI)

- Endpoint: `POST /auth/login`
- Accepts: `email` or `username` + `password`
- On success: creates a server-side session, sets an HttpOnly session cookie
- On failure: 401
- Sessions are persistent by default (no expiry unless explicitly logged out or session deleted)
- Session store: PostgreSQL via `connect-pg-simple`

### 2. User Logout

- Endpoint: `POST /auth/logout`
- Destroys the server-side session and clears the cookie

### 3. Admin Login

- Endpoint: `POST /admin/auth/login`
- Accepts: `email` + `password`
- Separate session from user sessions
- Admin session stored in PostgreSQL alongside user sessions (different session key)

### 4. Agent (API Key)

- Transport: `Authorization: Bearer <token>` header
- On each request: hash the incoming token, look up matching `ApiToken` row, load the associated `User`
- The agent authenticates *as* a specific `User` — all actions are attributed to that user
- Token shown once on creation; only the hash is stored (`SHA-256`)
- `ApiToken.lastUsedAt` updated on each successful request

### 5. Password Reset

- Admin generates a reset URL for any user via the admin panel
- A one-time signed token is stored on the `User` row: `passwordResetToken` (hashed) + `passwordResetExpiresAt`
- The URL contains the raw token; using it clears both fields
- No email sending — admin shares the URL out-of-band
- Add to `User`: `passwordResetToken String?`, `passwordResetExpiresAt DateTime?`

### 6. First-Time Setup Wizard

- The setup wizard is accessible only when no `Admin` record exists in the database
- Completing the wizard creates the single `Admin` record
- After setup, the wizard endpoint returns 404 (or redirects)
- Detection: check `Admin` table count — no separate config flag needed

---

## NestJS Guard Structure

| Guard | Validates | Attaches to request | Used on |
|-------|-----------|-------------------|---------|
| `SessionAuthGuard` | Session cookie → valid User session | `req.user` | — (composed into AnyAuthGuard) |
| `ApiKeyAuthGuard` | Bearer token → valid ApiToken → User | `req.user` | — (composed into AnyAuthGuard) |
| `AnyAuthGuard` | Either session or API key | `req.user` | All non-admin endpoints |
| `AdminAuthGuard` | Admin session cookie | `req.admin` | All admin endpoints |
| `SetupGuard` | No Admin record exists | — | Setup wizard endpoint only |

All non-admin endpoints are protected by `AnyAuthGuard` — both the UI and the agent hit the same routes transparently.

---

## Authorization Rules

### Household Scoping
Every query for household-owned data (recipes, meal plans, users) is filtered by the `householdId` of the authenticated user (`req.user.householdId`). This is enforced at the **service layer**, not the guard layer.

### Admin Access
Admin endpoints are protected by `AdminAuthGuard`. The `Admin` entity is completely separate from `User` — there is no `role` field on `User`. Admins can:
- Manage all users and households
- Create, view, and delete API tokens
- Generate password reset URLs

### Agent Access
The agent authenticates as a regular `User` and has the same access as any household member — full non-admin functionality. No additional endpoint restrictions in MVP.

### No-Login Members
Users with `passwordHash = null` cannot authenticate. They exist in the system for household data purposes (readable by the agent) but cannot initiate sessions.

---

## Data Model Additions (from this step)

Fields added to `User`:

| Field | Type | Notes |
|-------|------|-------|
| `passwordResetToken` | String? | Hashed one-time reset token |
| `passwordResetExpiresAt` | DateTime? | Expiry for the reset token |

---

## Decisions Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Session mechanism | Cookie-based sessions (HttpOnly) | Persistent, revocable, exempt from cookie consent requirements (strictly necessary cookie). HttpOnly prevents XSS access. |
| Session storage | PostgreSQL via `connect-pg-simple` | Consistent with existing DB, no extra infrastructure |
| JWT vs sessions | Sessions | For this app, JWT with per-user salt still requires a DB lookup per request — same cost as sessions, but with added complexity and coarser revocation granularity |
| API key storage | SHA-256 hash only | Token shown once on creation; only hash stored. SHA-256 is appropriate for high-entropy random tokens (unlike passwords). |
| API key attribution | Tied to a `User` (agent user) | All agent actions attributed to a real user record — enables future history/audit features |
| Admin auth | Separate session, separate guard | Admin is a different entity; keeps admin and user auth flows fully isolated |
| Setup detection | Check if `Admin` row exists | Simplest approach; no separate config table needed |
| Password reset | One-time token on `User` row | Admin generates and shares URL out-of-band; no email infrastructure required |
