---
phase: quick
plan: 260320-eq1
subsystem: auth
tags: [nestjs, guards, admin, session-auth]

requires:
  - phase: 06-backend-admin-endpoints
    provides: AdminAuthGuard, admin controllers, AnyAuthGuard global guard

provides:
  - All admin endpoints bypass AnyAuthGuard via @Public() while retaining AdminAuthGuard enforcement
  - Admin login, logout, me, users, households, tokens, foods, units routes now accessible with valid admin session

affects:
  - admin-panel frontend (apps/web/app/(admin))

tech-stack:
  added: []
  patterns:
    - "@Public() at class level bypasses global AnyAuthGuard; @UseGuards(AdminAuthGuard) enforces admin session independently"

key-files:
  created: []
  modified:
    - apps/api/src/admin/auth/admin-auth.controller.ts
    - apps/api/src/admin/users/admin-users.controller.ts
    - apps/api/src/admin/households/admin-households.controller.ts
    - apps/api/src/admin/tokens/admin-tokens.controller.ts
    - apps/api/src/admin/foods/admin-foods.controller.ts
    - apps/api/src/admin/units/admin-units.controller.ts

key-decisions:
  - "@Public() added at method level on logout/getMe (admin-auth.controller) since login already had it — method-level avoids blanket bypass on login"
  - "@Public() added at class level on all other admin controllers — cleanest pattern for controllers where every route needs the bypass"

patterns-established:
  - "Admin controller pattern: @Public() class-level + @UseGuards(AdminAuthGuard) class-level — AnyAuthGuard bypassed, admin session enforced"

requirements-completed: []

duration: 5min
completed: 2026-03-20
---

# Quick Task 260320-eq1: Admin Login Fix Summary

**@Public() decorator added to all admin controllers so AnyAuthGuard (global APP_GUARD) no longer blocks admin endpoints with 403 before AdminAuthGuard can run**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-20T00:00:00Z
- **Completed:** 2026-03-20T00:05:00Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Root cause identified: AnyAuthGuard (global APP_GUARD) checked for user session/API key before AdminAuthGuard; found neither, returned 403
- Added `@Public()` to logout and getMe in admin-auth.controller (method-level), login already had it
- Added `@Public()` at class level to admin-users, admin-households, admin-tokens, admin-foods, admin-units controllers
- All admin tests pass; 2 pre-existing unrelated failures confirmed present before fix

## Task Commits

1. **Task 1: Add @Public() to all admin controllers** - `afe2110` (fix)
2. **Task 2: Verify existing tests pass** - no code changes (tests already correct)

**Plan metadata:** (docs commit below)

## Files Created/Modified
- `apps/api/src/admin/auth/admin-auth.controller.ts` - Added @Public() on logout and getMe methods
- `apps/api/src/admin/users/admin-users.controller.ts` - Added @Public() import + class-level decorator
- `apps/api/src/admin/households/admin-households.controller.ts` - Added @Public() import + class-level decorator
- `apps/api/src/admin/tokens/admin-tokens.controller.ts` - Added @Public() import + class-level decorator
- `apps/api/src/admin/foods/admin-foods.controller.ts` - Added @Public() import + class-level decorator
- `apps/api/src/admin/units/admin-units.controller.ts` - Added @Public() import + class-level decorator

## Decisions Made
- Used class-level `@Public()` for the 5 resource controllers — every route in those controllers needs the bypass so class-level is cleaner than per-method
- Used method-level `@Public()` on logout/getMe in admin-auth.controller — keeps the pattern consistent with existing login method decoration style

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- 2 pre-existing test failures unrelated to this fix: `sharing.service.spec.ts` (regex mismatch) and `auth.service.spec.ts` (Vitest import in Jest environment). Both confirmed pre-existing by stash-and-retest. Out of scope.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Admin login flow fully operational; frontend admin panel can now authenticate and access all admin endpoints
- No blockers

---
*Quick task: 260320-eq1*
*Completed: 2026-03-20*
