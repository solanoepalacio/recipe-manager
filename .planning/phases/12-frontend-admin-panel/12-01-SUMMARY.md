---
phase: 12-frontend-admin-panel
plan: 01
subsystem: auth
tags: [nestjs, next.js, react-context, admin-auth, session, tanstack-query]

# Dependency graph
requires:
  - phase: 06-backend-admin-endpoints
    provides: AdminAuthController login/logout endpoints, AdminAuthGuard, CurrentAdmin decorator
  - phase: 07-frontend-setup-app-shell-auth-flows
    provides: api-client.ts, AuthProvider pattern, login page pattern

provides:
  - AdminMeResponse shared interface (packages/shared/src/api/admin.ts)
  - GET /admin/auth/me backend endpoint (admin-auth.controller.ts)
  - admin-api-client.ts with 401 auto-redirect to /admin/login
  - AdminAuthProvider context (mirrors AuthProvider pattern)
  - (admin) route group layout with auth guard skipping /admin/login and /setup
  - Admin login page at /admin/login with inline 401 error
  - Setup wizard at /setup calling GET /setup, redirecting when required=false
  - 11 passing tests across AdminAuthProvider, admin login, and setup page

affects:
  - 12-02 (admin panel shell and nav)
  - 12-03 (admin CRUD sections — all depend on AdminAuthProvider)
  - 12-04 (admin CRUD sections — all depend on AdminAuthProvider)
  - 12-05 (admin CRUD sections — all depend on AdminAuthProvider)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - AdminAuthProvider mirrors AuthProvider exactly (createContext, useEffect, api call on mount, finally sets isLoading false)
    - admin-api-client wraps api-client with 401 intercept — typeof window guard prevents SSR crash
    - AdminGuardedShell skips auth guard for public paths (/admin/login, /setup) by pathname check

key-files:
  created:
    - packages/shared/src/api/admin.ts (AdminMeResponse added)
    - apps/api/src/admin/auth/admin-auth.controller.ts (getMe endpoint added)
    - apps/api/src/admin/auth/admin-auth.controller.spec.ts
    - apps/web/src/lib/admin-api-client.ts
    - apps/web/src/components/admin/AdminAuthProvider.tsx
    - apps/web/src/app/(admin)/layout.tsx
    - apps/web/src/app/(admin)/admin/login/page.tsx
    - apps/web/src/app/(admin)/setup/page.tsx
    - apps/web/src/components/__tests__/AdminAuthProvider.test.tsx
    - apps/web/src/components/__tests__/admin-login-page.test.tsx
    - apps/web/src/components/__tests__/setup-page.test.tsx
  modified:
    - packages/shared/src/api/admin.ts

key-decisions:
  - "AdminGuardedShell checks pathname === '/admin/login' || '/setup' to skip auth guard — avoids circular redirect loop on public admin paths"
  - "admin-api-client.ts uses typeof window !== 'undefined' guard before window.location.replace — prevents SSR/build crash"
  - "Test files placed in apps/web/src/components/__tests__/ following existing project convention (not apps/web/tests/ as specified in plan)"
  - "(admin)/layout.tsx creates its own QueryClient instance (not wrapping root Providers) — admin panel has isolated query state"

patterns-established:
  - "AdminAuthProvider pattern: mirrors AuthProvider exactly; call adminApi.get on mount, set admin/null in then/catch, setIsLoading false in finally"
  - "Admin 401 intercept: adminApi wraps api with error handler — status 401 triggers window.location.replace('/admin/login')"
  - "Admin route guard: AdminGuardedShell pattern skips protection for public admin paths, AdminProtectedLayout handles redirect to /admin/login"

requirements-completed: [ADM-01, ADM-02, ADM-03, ADM-04, ADM-05, ADM-06]

# Metrics
duration: 4min
completed: 2026-03-19
---

# Phase 12 Plan 01: Admin Auth Foundation Summary

**Admin login flow with session-backed GET /admin/auth/me, AdminAuthProvider context, protected (admin) route group, and setup wizard — all with passing tests**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-19T18:47:24Z
- **Completed:** 2026-03-19T18:51:45Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments
- Added AdminMeResponse shared type and GET /admin/auth/me backend endpoint with unit test
- Created admin-api-client.ts wrapping api-client with 401 auto-redirect to /admin/login (SSR-safe)
- Built AdminAuthProvider, (admin) route group layout with auth guard, admin login page, and setup wizard
- 11 new tests pass (100 total passing in web test suite)

## Task Commits

Each task was committed atomically:

1. **Task 1: Backend GET /admin/auth/me + AdminMeResponse type + admin-api-client.ts** - `6f61ba4` (feat)
2. **Task 2: AdminAuthProvider + admin layout + login page + setup wizard + tests** - `c32d273` (feat)

**Plan metadata:** (this commit)

## Files Created/Modified
- `packages/shared/src/api/admin.ts` - Added AdminMeResponse interface
- `apps/api/src/admin/auth/admin-auth.controller.ts` - Added GET /admin/auth/me with AdminAuthGuard + CurrentAdmin
- `apps/api/src/admin/auth/admin-auth.controller.spec.ts` - Unit test for getMe (created)
- `apps/web/src/lib/admin-api-client.ts` - Admin API wrapper with 401 redirect (created)
- `apps/web/src/components/admin/AdminAuthProvider.tsx` - Admin session context (created)
- `apps/web/src/app/(admin)/layout.tsx` - Route group layout with QueryClient + auth guard (created)
- `apps/web/src/app/(admin)/admin/login/page.tsx` - Admin login page with inline 401 error (created)
- `apps/web/src/app/(admin)/setup/page.tsx` - Setup wizard page (created)
- `apps/web/src/components/__tests__/AdminAuthProvider.test.tsx` - 4 tests (created)
- `apps/web/src/components/__tests__/admin-login-page.test.tsx` - 4 tests (created)
- `apps/web/src/components/__tests__/setup-page.test.tsx` - 3 tests (created)

## Decisions Made
- AdminGuardedShell checks pathname for /admin/login and /setup to skip auth guard — avoids redirect loop on public paths
- admin-api-client uses `typeof window !== 'undefined'` guard before window.location.replace — prevents SSR/build crash
- Test files placed in apps/web/src/components/__tests__/ following existing project convention
- (admin)/layout.tsx creates its own QueryClient (not wrapping root Providers) — admin panel has isolated query state

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Test files placed in src/components/__tests__/ instead of apps/web/tests/admin/**
- **Found during:** Task 2 (creating test files)
- **Issue:** Plan specified `apps/web/tests/admin/` but the actual project test convention is `apps/web/src/components/__tests__/` (all 15+ existing test files live there)
- **Fix:** Created tests in the existing convention location so they are picked up by the vitest config
- **Files modified:** All 3 test files placed at `src/components/__tests__/`
- **Verification:** All 11 new tests pass; yarn test runs them correctly
- **Committed in:** c32d273 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking — wrong test directory from plan)
**Impact on plan:** Necessary for tests to be discovered by vitest. No scope change.

## Issues Encountered
- NestJS controller unit test initially failed because AdminAuthGuard requires PrismaService dependency. Fixed by using `.overrideGuard(AdminAuthGuard).useValue({ canActivate: () => true })` pattern — standard NestJS testing approach.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Admin auth foundation complete — AdminAuthProvider, protected layout, login page, and setup wizard all working
- Plan 12-02 (admin panel shell with sidebar nav) can now build on top of the protected layout
- All admin CRUD sections (12-03 through 12-05) depend on AdminAuthProvider being available via the layout

---
*Phase: 12-frontend-admin-panel*
*Completed: 2026-03-19*
