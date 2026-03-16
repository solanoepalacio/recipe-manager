---
phase: 03-backend-auth
plan: "04"
subsystem: auth
tags: [nestjs, crypto, password-reset, admin, prisma, sha256]

# Dependency graph
requires:
  - phase: 03-backend-auth
    provides: AdminAuthGuard (guards admin-only routes), AdminModule base, PrismaService (User model with resetToken/resetTokenExpiry fields)
provides:
  - AdminUsersService.generatePasswordResetUrl(userId) — raw token generation, SHA-256 hash storage, 24h expiry
  - POST /admin/users/:id/password-reset-url protected by AdminAuthGuard
  - password-reset.e2e-spec.ts stub (Wave 0, AUTH-05)
affects: [04-user-management, 06-integration-tests]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Token hash pattern: generate raw token with randomBytes(32), store SHA-256 hash in DB, return raw token in URL"
    - "Admin user management follows same guard/controller/service pattern as admin auth"

key-files:
  created:
    - apps/api/src/admin/users/admin-users.service.ts
    - apps/api/src/admin/users/admin-users.service.spec.ts
    - apps/api/src/admin/users/admin-users.controller.ts
    - apps/api/src/admin/users/dto/password-reset-url.dto.ts
    - apps/api/tests/password-reset.e2e-spec.ts
  modified:
    - apps/api/src/admin/admin.module.ts

key-decisions:
  - "Raw token (64-char hex) embedded in reset URL; SHA-256 hash stored in DB — token never stored in plaintext"
  - "No self-service password reset — admin-only flow; URL shared out-of-band"
  - "Calling the endpoint a second time silently overwrites the previous token (prisma.user.update is idempotent)"

patterns-established:
  - "Token security pattern: randomBytes(32) for raw token, createHash('sha256') for stored value"
  - "Admin-only controller uses @UseGuards(AdminAuthGuard) at class level, no @Public() needed"

requirements-completed: [AUTH-05, API-02]

# Metrics
duration: 2min
completed: 2026-03-16
---

# Phase 3 Plan 04: Admin Password Reset URL Summary

**Admin-only password reset URL endpoint using crypto.randomBytes + SHA-256 hash pattern: raw token in URL, hash stored in DB, 24h expiry on User.resetToken/resetTokenExpiry**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-16T12:48:31Z
- **Completed:** 2026-03-16T12:50:31Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- AdminUsersService with generatePasswordResetUrl: generates 64-char hex raw token, stores SHA-256 hash in User.resetToken, sets User.resetTokenExpiry to +24h, returns resetUrl with raw token
- AdminUsersController protected by @UseGuards(AdminAuthGuard) at class level with POST :id/password-reset-url
- AdminModule updated to include AdminUsersController and AdminUsersService
- 3 unit tests cover NotFoundException on missing user, correct hash/expiry storage, and raw-token-in-URL verification
- Password-reset e2e stub documenting AUTH-05 unauthorized behavior

## Task Commits

Each task was committed atomically:

1. **Task 1: AdminUsersService unit tests (RED)** - `6b2e986` (test)
2. **Task 1: AdminUsersService implementation (GREEN)** - `478a53d` (feat)
3. **Task 2: AdminUsersController, AdminModule, e2e stub** - `df15dec` (feat)

**Plan metadata:** (docs commit — see final_commit below)

_Note: TDD task has two commits (test RED → feat GREEN)_

## Files Created/Modified
- `apps/api/src/admin/users/admin-users.service.ts` - generatePasswordResetUrl with crypto token + SHA-256 hash + 24h expiry
- `apps/api/src/admin/users/admin-users.service.spec.ts` - 3 unit tests (not-found, hash/expiry, raw-token-in-URL)
- `apps/api/src/admin/users/admin-users.controller.ts` - POST :id/password-reset-url with @UseGuards(AdminAuthGuard)
- `apps/api/src/admin/users/dto/password-reset-url.dto.ts` - PasswordResetUrlResponse with @ApiProperty()
- `apps/api/src/admin/admin.module.ts` - Added AdminUsersController and AdminUsersService
- `apps/api/tests/password-reset.e2e-spec.ts` - Wave 0 e2e stub for AUTH-05

## Decisions Made
- Raw token (64-char hex via randomBytes(32)) is embedded in the reset URL; only the SHA-256 hash is stored in the database — this matches the same secure token pattern used by ApiToken in Plan 01
- No self-service reset endpoint — admin shares URL out-of-band with the user per project design
- Calling the endpoint twice silently overwrites the previous token (prisma.user.update replaces data)

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 3 (Backend Auth) is complete: AUTH-01 through AUTH-05 and API-02 all have implementation and unit test coverage
- All 24 unit tests pass across 7 test suites
- Phase 4 can proceed (User Management endpoints or next planned phase)

---
*Phase: 03-backend-auth*
*Completed: 2026-03-16*

## Self-Check: PASSED

All files present and all commits verified:
- admin-users.service.ts: FOUND
- admin-users.service.spec.ts: FOUND
- admin-users.controller.ts: FOUND
- password-reset-url.dto.ts: FOUND
- password-reset.e2e-spec.ts: FOUND
- 03-04-SUMMARY.md: FOUND
- Commit 6b2e986 (test RED): FOUND
- Commit 478a53d (feat GREEN): FOUND
- Commit df15dec (task 2): FOUND
