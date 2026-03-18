---
phase: 07-frontend-setup-app-shell-auth-flows
plan: 03
subsystem: ui
tags: [react-context, auth, next-app-router, tanstack-query, sonner, vitest]

requires:
  - phase: 07-02
    provides: AppShell component, route group structure, (app)/layout.tsx stub

provides:
  - AuthProvider React context fetching /auth/me on mount
  - useAuth hook (re-exported from lib/auth.tsx via hooks/useAuth.ts)
  - ProtectedLayout with redirect guard (!isLoading && !user → router.replace('/login'))
  - AppShellSkeleton shown during auth check
  - Full LoginPage form with useMutation, Spanish copy, toast errors, auth redirect
  - (auth)/layout.tsx wrapping auth routes in AuthProvider
  - AuthProvider test suite: 3 tests (loading/success/401 states)

affects:
  - 07-04 (auth-dependent toast/UX flows)
  - all subsequent (app) route pages (protected via ProtectedLayout)

tech-stack:
  added: []
  patterns:
    - AuthProvider fetches /auth/me on mount; isLoading:true until resolved
    - ProtectedLayout redirect fires only when !isLoading && !user (avoids flicker)
    - AppShellSkeleton shown while auth in-flight (never redirects during loading)
    - (auth) layout wraps auth routes in AuthProvider for already-authenticated detection
    - useAuth hook re-exported from hooks/ directory for component import consistency

key-files:
  created:
    - apps/web/src/lib/auth.tsx
    - apps/web/src/hooks/useAuth.ts
    - apps/web/src/app/(auth)/layout.tsx
  modified:
    - apps/web/src/app/(app)/layout.tsx
    - apps/web/src/app/(auth)/login/page.tsx
    - apps/web/src/components/__tests__/AuthProvider.test.tsx

key-decisions:
  - "auth.tsx uses .tsx extension (not .ts) because AuthProvider renders JSX"
  - "(auth)/layout.tsx created with AuthProvider so LoginPage can detect already-authenticated sessions — without this, useAuth() in login page returns default isLoading:true forever"
  - "Logout: api.post('/auth/logout') fire-and-forget; router.replace('/login') always fires in finally"

patterns-established:
  - "Pattern: auth check is async; always show skeleton, never redirect, while isLoading=true"
  - "Pattern: (auth) group wrapped in AuthProvider for session detection on public pages"

requirements-completed:
  - UX-01
  - UX-02

duration: 6min
completed: 2026-03-18
---

# Phase 07 Plan 03: Auth Provider, Login Form, and Protected Layout Summary

**React Context auth with /auth/me session detection, ProtectedLayout redirect guard, and full Spanish-copy LoginPage form with useMutation error toasts**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-18T13:54:34Z
- **Completed:** 2026-03-18T14:00:58Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- AuthProvider fetches GET /api/auth/me on mount; ProtectedLayout shows skeleton until resolved, redirects unauthenticated users to /login
- Full LoginPage with email/password form, useMutation calling /auth/login, toast.error with Spanish copy and duration:6000, loading spinner state
- AuthProvider test suite: 3 tests covering loading/success/401 states, all passing

## Task Commits

Each task was committed atomically:

1. **Task 1: AuthProvider, useAuth hook, ProtectedLayout** - `2319593` (feat)
2. **Task 2: Full LoginPage form and AuthProvider tests** - `fdeeaed` (feat)

**Prerequisite fix (07-02 uncommitted work staged):** `2e21ec0` (feat)

## Files Created/Modified
- `apps/web/src/lib/auth.tsx` - AuthContext, AuthProvider, useAuth (renamed to .tsx for JSX)
- `apps/web/src/hooks/useAuth.ts` - Re-exports useAuth from lib/auth
- `apps/web/src/app/(app)/layout.tsx` - AuthProvider > ProtectedLayout with skeleton + redirect guard
- `apps/web/src/app/(auth)/layout.tsx` - AuthProvider wrapper for auth routes (bug fix — enables session detection on login page)
- `apps/web/src/app/(auth)/login/page.tsx` - Full LoginPage form replacing stub
- `apps/web/src/components/__tests__/AuthProvider.test.tsx` - 3 real tests replacing todos

## Decisions Made
- `auth.tsx` uses `.tsx` extension because `AuthProvider` renders JSX (`<AuthContext.Provider>`)
- Created `(auth)/layout.tsx` with `AuthProvider` — the plan's LoginPage calls `useAuth()` to detect already-authenticated users; without an AuthProvider ancestor in the `(auth)` route group, `useAuth()` always returns the default `{ user: null, isLoading: true }` causing the form to permanently render `null`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] auth.ts renamed to auth.tsx — JSX in .ts file causes webpack syntax error**
- **Found during:** Task 1 (AuthProvider implementation)
- **Issue:** Plan specifies `apps/web/src/lib/auth.ts` but the file contains JSX (`<AuthContext.Provider>`). TypeScript/webpack treats `.ts` as plain TS and rejects JSX, causing build failure
- **Fix:** Created file as `auth.tsx` instead of `auth.ts`; all imports use `@/lib/auth` (no extension) so nothing else needed to change
- **Files modified:** `apps/web/src/lib/auth.tsx`
- **Verification:** `yarn workspace @recipe-manager/web build` exits 0
- **Committed in:** `2319593` (Task 1 commit)

**2. [Rule 1 - Bug] Created (auth)/layout.tsx to fix permanently-loading LoginPage**
- **Found during:** Task 2 (LoginPage implementation)
- **Issue:** Plan's LoginPage calls `useAuth()` to detect already-authenticated sessions. The `(auth)` route group had no layout, so no `AuthProvider` ancestor existed — `useAuth()` returned the default context `{ user: null, isLoading: true }` permanently, causing the form to render `null` forever
- **Fix:** Created `apps/web/src/app/(auth)/layout.tsx` wrapping children in `AuthProvider`
- **Files modified:** `apps/web/src/app/(auth)/layout.tsx` (new file)
- **Verification:** Build passes; login page renders correctly
- **Committed in:** `fdeeaed` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 1 — bugs in plan spec)
**Impact on plan:** Both fixes essential for correctness. First was a file extension error. Second was a missing context provider that would have silently broken the login form.

## Issues Encountered
- Plan 07-02 artifacts (TopBar, Drawer, AppShell, route groups) were in the working tree but never committed. Staged and committed them as prerequisite before executing Plan 07-03 (Rule 3 blocking fix).

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Auth flow complete: unauthenticated users redirected to /login, authenticated users reach AppShell
- Toast error system wired (sonner + useMutation onError pattern established)
- Ready for Phase 07-04 (remaining toast/UX flows) or Phase 08 (recipe list feature)

---
*Phase: 07-frontend-setup-app-shell-auth-flows*
*Completed: 2026-03-18*
