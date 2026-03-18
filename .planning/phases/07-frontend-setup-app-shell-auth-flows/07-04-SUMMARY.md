---
phase: 07-frontend-setup-app-shell-auth-flows
plan: "04"
subsystem: ui
tags: [react, tailwind, sonner, vitest, skeleton, toast]

# Dependency graph
requires:
  - phase: 07-frontend-setup-app-shell-auth-flows
    provides: Providers.tsx with Toaster mounted, AppShell, AuthProvider, LoginPage from plans 07-01/02/03
provides:
  - Skeleton component (bg-subtle animate-pulse, accepts className, aria-hidden)
  - Toast notification tests — 4 passing assertions (mounted, success, error, info)
affects:
  - All future data-fetching pages (consume Skeleton for loading states)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Skeleton as presentational primitive: bg-subtle animate-pulse rounded, aria-hidden, className prop for sizing"
    - "Toast tests: render Providers (which mounts Toaster), call toast.* inside act(), findByText to assert"

key-files:
  created:
    - apps/web/src/components/ui/Skeleton.tsx
  modified:
    - apps/web/src/components/__tests__/Toast.test.tsx
    - apps/web/src/app/(app)/page.tsx
    - apps/web/src/app/(app)/recipes/page.tsx
    - apps/web/src/components/AppShell.tsx
    - apps/web/src/components/Drawer.tsx
    - apps/web/globals.css

key-decisions:
  - "Sonner v2 renders section[aria-label='Notifications alt+T'] not ol[tabindex] — test selector updated to match actual DOM"
  - "Tailwind v4 --spacing-sm token conflicted with built-in scale — removed custom token, used max-w-[24rem] literal"
  - "Next.js proxy port corrected to 3001 (was 3000)"
  - "Root page.tsx removed — / routes to (app)/page.tsx (Hoy placeholder); /recipes shows recipe list"
  - "Search/filter bar moved from AppShell into /recipes page — AppShell is now nav-only chrome"
  - "Drawer nav restored: Hoy / Recetas / Planificador"

patterns-established:
  - "Skeleton usage: <Skeleton className='w-[72px] h-[68px] rounded-[10px]' /> — className sets size, component handles color+animation"
  - "Toast test pattern: render Providers wrapper, act(() => toast.X()), screen.findByText() for async DOM assertion"

requirements-completed: [UX-02, UX-03]

# Metrics
duration: 15min
completed: 2026-03-18
---

# Phase 7 Plan 04: Skeleton Component and Toast Tests Summary

**Reusable pulsing Skeleton component (bg-subtle/animate-pulse) and 4 passing Toast notification tests replacing Wave 0 stubs — full suite 14 tests green; human verification passed at all breakpoints**

## Performance

- **Duration:** ~15 min (including post-checkpoint fixes)
- **Started:** 2026-03-18T14:03:36Z
- **Completed:** 2026-03-18 (post-checkpoint)
- **Tasks:** 2 of 2 complete (Task 1 automated + Task 2 human-verify approved)
- **Files modified:** 8

## Accomplishments
- Created `Skeleton.tsx` with bg-subtle animate-pulse rounded, aria-hidden, className prop — ready for all future loading states
- Replaced 3 todo stubs in Toast.test.tsx with 4 real assertions covering Toaster mounted, success, error, info variants
- Full test suite passes: AppShell (7) + AuthProvider (3) + Toast (4) = 14 tests green
- Human verification passed: responsive layout at 375px/768px/1024px, unauthenticated redirect to /login, drawer animation smooth, toast appears and auto-dismisses
- Post-checkpoint fixes applied: Tailwind v4 spacing token conflict, Next.js proxy port, route restructure (Hoy at /, recipes at /recipes), search/filter bar scoped to /recipes, drawer nav links restored

## Task Commits

Each task was committed atomically:

1. **Task 1: Skeleton component and Toast tests** - `2771bc3` (feat)
2. **Post-checkpoint fixes** - `d899ecc`, `04f7fad`, `c5552eb`, `135b8f9` (fix commits applied after checkpoint)

## Files Created/Modified
- `apps/web/src/components/ui/Skeleton.tsx` - Pulsing skeleton block, bg-subtle animate-pulse rounded, aria-hidden, className prop
- `apps/web/src/components/__tests__/Toast.test.tsx` - 4 real assertions replacing Wave 0 todos
- `apps/web/src/app/(app)/page.tsx` - Hoy placeholder page (new home route)
- `apps/web/src/app/(app)/recipes/page.tsx` - Recipe list page with search/filter bar
- `apps/web/src/components/AppShell.tsx` - Search/filter removed (moved to /recipes page)
- `apps/web/src/components/Drawer.tsx` - Nav links restored: Hoy / Recetas / Planificador
- `apps/web/globals.css` - Removed conflicting --spacing-sm token, fixed max-w literal
- Next.js config - Proxy port corrected to 3001

## Decisions Made
- Sonner v2 renders `section[aria-label="Notifications alt+T"]` as its toast region in jsdom (not `ol[tabindex]` as documented in older versions). Updated the "Toaster is mounted" assertion to query `section[aria-label]` for test accuracy.
- Tailwind v4 `--spacing-sm` custom token conflicted with the built-in spacing scale, causing layout issues. Token removed; login form uses `max-w-[24rem]` literal instead.
- Next.js proxy was pointing to port 3000 (backend default) instead of 3001 (actual API port). Fixed in next.config.
- Root `/` route removed to avoid shadowing `(app)/page.tsx`; Hoy placeholder page serves as the authenticated home screen.
- Search/filter bar moved out of AppShell (global chrome) into `/recipes` page only — keeps the shell clean for other pages (Hoy, Planificador) that don't need a search bar.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Sonner v2 DOM selector mismatch in Toast test**
- **Found during:** Task 1 (Skeleton component and Toast tests)
- **Issue:** Plan provided `ol[tabindex]` and `[data-sonner-toaster]` selectors for the "Toaster is mounted" assertion. Sonner v2 (installed version 2.0.7) renders `<section aria-label="Notifications alt+T" tabindex="-1">` instead.
- **Fix:** Changed selector to `section[aria-label]` which correctly matches the Sonner v2 toast container element.
- **Files modified:** `apps/web/src/components/__tests__/Toast.test.tsx`
- **Verification:** All 4 Toast tests pass; full suite 14/14 green.
- **Committed in:** 2771bc3 (Task 1 commit)

**2. [Rule 1 - Bug] Tailwind v4 spacing token conflict causing layout breakage**
- **Found during:** Post-checkpoint verification (human-verify approval)
- **Issue:** Custom `--spacing-sm` CSS variable conflicted with Tailwind v4's built-in spacing scale token, producing incorrect sizing on the login form container.
- **Fix:** Removed `--spacing-sm` from globals.css; replaced `max-w-sm` with `max-w-[24rem]` literal on the login form.
- **Files modified:** `apps/web/globals.css`, login page component
- **Committed in:** post-checkpoint fix commits

**3. [Rule 1 - Bug] Next.js proxy pointing to wrong port**
- **Found during:** Post-checkpoint — API requests failing in browser
- **Issue:** next.config proxy destination used port 3000 (default) instead of 3001 (actual API port).
- **Fix:** Updated proxy destination to http://localhost:3001.
- **Committed in:** post-checkpoint fix commits

**4. [Rule 3 - Blocking] Root page.tsx shadowed (app)/page.tsx**
- **Found during:** Post-checkpoint routing investigation
- **Issue:** A root `page.tsx` was shadowing the `(app)/page.tsx` route, causing auth check to be skipped.
- **Fix:** Root page.tsx removed; `(app)/page.tsx` now serves `/` as a Hoy placeholder; recipe list moved to `/recipes`.
- **Committed in:** post-checkpoint fix commits

**5. [Rule 2 - Missing functionality] Search/filter bar visible on non-list pages**
- **Found during:** Post-checkpoint route restructure
- **Issue:** AppShell rendered the SearchBar+FilterActionsRow globally, making them visible on Hoy and Planificador pages where they don't belong.
- **Fix:** Moved search/filter bar out of AppShell into `/recipes` page component. Drawer nav links updated: Hoy / Recetas / Planificador.
- **Committed in:** post-checkpoint fix commits

---

**Total deviations:** 5 (1 auto-fixed test selector + 4 post-checkpoint fixes)
**Impact on plan:** All fixes correct pre-existing issues found during real browser verification. No scope creep. All requirements verified.

## Human Verification Results (Task 2 - Approved)

All 5 checks passed:
- Responsive layout at 375px, 768px, 1024px — no horizontal scroll
- Unauthenticated redirect to /login works
- Drawer opens/closes with animation
- Toast notifications appear and auto-dismiss
- Auth skeleton shows during auth check

## Issues Encountered
- Sonner v2 DOM structure differs from plan documentation — resolved by inspecting actual jsdom output from the failing test error message.
- Tailwind v4 custom token naming conflicts with built-in scale require using literal values instead of token names where conflicts exist.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 7 complete — all 4 plans done, all 3 requirements verified (UX-01, UX-02, UX-03)
- Skeleton.tsx ready for import by all future data-fetching pages
- Toast pattern established and tested
- App shell: TopBar, Drawer (Hoy/Recetas/Planificador), AuthProvider, LoginPage all operational
- Ready for Phase 8: Frontend Recipe List + Detail + Cook Mode

## Self-Check: PASSED

- `apps/web/src/components/ui/Skeleton.tsx` — exists (created in Task 1, commit 2771bc3)
- `apps/web/src/components/__tests__/Toast.test.tsx` — exists (modified in Task 1, commit 2771bc3)
- Post-checkpoint fix commits — d899ecc, 04f7fad, c5552eb, 135b8f9 present in git log
- Human verification — approved by user (all 5 checks passed)

---
*Phase: 07-frontend-setup-app-shell-auth-flows*
*Completed: 2026-03-18*
