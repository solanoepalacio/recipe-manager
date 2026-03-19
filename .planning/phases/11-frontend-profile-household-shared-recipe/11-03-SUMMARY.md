---
phase: 11-frontend-profile-household-shared-recipe
plan: "03"
subsystem: ui
tags: [nextjs, react, tanstack-query, shared-recipe, public-route]

requires:
  - phase: 11-frontend-profile-household-shared-recipe
    provides: ShareLinkFlow component and share token generation (11-02)
  - phase: 05-backend-search-sharing-meal-plan
    provides: GET /api/shared/:token public endpoint returning RecipeDetailResponse

provides:
  - PublicLayout at apps/web/src/app/shared/layout.tsx (standalone, no auth)
  - SharedRecipePage at apps/web/src/app/shared/[token]/page.tsx (full read-only recipe view)
  - 6 unit tests for SharedRecipePage

affects:
  - Anyone testing the public share link flow end-to-end

tech-stack:
  added: []
  patterns:
    - "/shared route group outside (app) — no AuthProvider, no ProtectedLayout, no redirect"
    - "QueryClientProvider in PublicLayout for tanstack-query in public pages"

key-files:
  created:
    - apps/web/src/app/shared/layout.tsx
    - apps/web/src/app/shared/[token]/page.tsx
    - apps/web/src/components/__tests__/SharedRecipePage.test.tsx
  modified: []

key-decisions:
  - "PublicLayout uses 'use client' because QueryClientProvider is a client component"
  - "SharedRecipePage uses the existing SectionAccordion/InfoGrid/IngredientList/InstructionList components — no new components needed for read-only view"
  - "Error state shows 'Este enlace no es valido o ha expirado.' with no redirect to login"

patterns-established:
  - "Public pages outside (app) group: standalone layout with only QueryClientProvider, no auth wrappers"

requirements-completed: [SHR-02]

duration: 2min
completed: 2026-03-19
---

# Phase 11 Plan 03: Public Shared Recipe Page Summary

**Standalone /shared/:token route with PublicLayout (no auth) and read-only recipe view fetching GET /api/shared/:token**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-19T00:20:14Z
- **Completed:** 2026-03-19T00:21:54Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Created PublicLayout with standalone QueryClientProvider, no AuthProvider, no AppShell
- Created SharedRecipePage rendering full recipe detail (header, hero image, name, info grid, ingredients, instructions, footer) via GET /api/shared/:token
- Invalid/expired tokens show "Este enlace no es valido o ha expirado." with no redirect
- 6 unit tests pass covering: recipe rendering, header, footer, API call, error state, loading skeleton

## Task Commits

Each task was committed atomically:

1. **Task 1: Create PublicLayout and SharedRecipePage** - `d585e2c` (feat)
2. **Task 2: SharedRecipePage unit tests** - `e2a57dd` (test)

## Files Created/Modified

- `apps/web/src/app/shared/layout.tsx` - Standalone public layout with QueryClientProvider only
- `apps/web/src/app/shared/[token]/page.tsx` - Read-only shared recipe page
- `apps/web/src/components/__tests__/SharedRecipePage.test.tsx` - 6 unit tests

## Decisions Made

- `PublicLayout` uses `'use client'` because `QueryClientProvider` is a client component that requires client-side rendering
- Reused existing recipe display components (`SectionAccordion`, `InfoGrid`, `IngredientList`, `InstructionList`) without modification — clean read-only view
- Error state text is "Este enlace no es valido o ha expirado." — no redirect to login for invalid tokens (satisfies plan requirement)

## Deviations from Plan

None - plan executed exactly as written.

The mock recipe data in tests uses the actual `RecipeDetailResponse` shape from `packages/shared/src/api/recipes.ts` (with `SectionResponse`, `StepResponse`, `ImageResponse`) rather than the slightly different type names in the plan context — this is correct behavior (types in plan context were illustrative; real types govern).

## Issues Encountered

3 pre-existing PlannerPage test failures (`renders "+ Anadir receta" button in expanded day`, `opens recipe picker sheet...`, `calls api.post...`) were present before this plan's execution — out of scope, logged as deferred.

## Next Phase Readiness

- Phase 11 is now complete (all 3 plans done: profile, share link flow, public shared page)
- The full share link flow works end-to-end: detail page generates token → share URL points to /shared/:token → public page renders without auth

---
*Phase: 11-frontend-profile-household-shared-recipe*
*Completed: 2026-03-19*
