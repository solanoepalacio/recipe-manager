---
phase: 08-frontend-recipe-list-detail-cook-mode
plan: 01
subsystem: ui
tags: [react, nextjs, tanstack-query, tailwind, lucide-react]

# Dependency graph
requires:
  - phase: 07-frontend-setup-app-shell-auth-flows
    provides: AppShell, TanStack Query provider, api-client, query-keys
  - phase: 05-backend-search-sharing-meal-plan
    provides: GET /api/recipes with search/filter/sort/pagination, GET /api/foods

provides:
  - useDebounce hook (300ms debounce, generic)
  - RecipeCard component linking to /recipes/[slug]?id=[id]
  - RecipeListFilters component with search input + sort/filter buttons
  - PaginationControls component with prev/next and page size selector
  - Full /recipes page with debounced search, food filter, sort, pagination wired to API
  - foods query key added to queryKeys

affects:
  - 08-02 (RecipeDetailPage — navigates from RecipeCard links)
  - 08-03 (CookModePage — same app shell context)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - useDebounce for debounced API params (300ms delay, generic T)
    - randomSeed in TanStack Query key to force random sort refetch
    - buildQueryString helper converting RecipeQueryParams to URLSearchParams
    - page reset to 1 via useEffect on search/sort/foodId deps
    - Backdrop div (fixed inset-0 z-40) to close dropdowns on outside click

key-files:
  created:
    - apps/web/src/hooks/useDebounce.ts
    - apps/web/src/components/recipes/RecipeCard.tsx
    - apps/web/src/components/recipes/RecipeListFilters.tsx
    - apps/web/src/components/recipes/PaginationControls.tsx
    - apps/web/src/components/__tests__/RecipeListPage.test.tsx
  modified:
    - apps/web/src/app/(app)/recipes/page.tsx
    - apps/web/src/lib/query-keys.ts
    - apps/web/src/components/__tests__/AppShell.test.tsx

key-decisions:
  - "RecipeCard omits time row — RecipeListItem does not include totalTime/cookTime fields (only RecipeDetailResponse has them)"
  - "randomSeed state forces TanStack Query cache miss on random sort repeat — ensures reshuffle on each click"
  - "Backdrop div at z-40 below dropdowns at z-50 handles outside click without event bubbling issues"

patterns-established:
  - "useDebounce<T>(value, delay) — generic hook, place in apps/web/src/hooks/"
  - "buildQueryString(RecipeQueryParams) — omit undefined fields from URLSearchParams"
  - "parseSortOption(value) — splits 'name-asc' format into { sort, order } for RecipeQueryParams"

requirements-completed: [SRCH-01, SRCH-02, SRCH-03, SRCH-04]

# Metrics
duration: 8min
completed: 2026-03-18
---

# Phase 8 Plan 01: Recipe List Page Summary

**Full /recipes page with debounced search, food filter dropdown, 5-option sort, and pagination — all wired to TanStack Query against the live API**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-18T18:43:00Z
- **Completed:** 2026-03-18T18:50:26Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- useDebounce<T> hook with configurable delay (default 300ms), used for search input
- RecipeCard component: sand thumbnail placeholder (72x68px), recipe name, image indicator icon, link to /recipes/[slug]?id=[id]
- RecipeListFilters component: live search input (Buscar recetas...), sort button (Ordenar), food filter button (Filtrar por ingredientes) with active state coloring
- PaginationControls component: prev/next buttons with disabled states, "Pagina N de M" indicator, page size selector (10/20/50)
- Full /recipes page replacing placeholder with real TanStack Query integration, dropdowns, loading/empty/error states

## Task Commits

Each task was committed atomically:

1. **Task 1: useDebounce hook + RecipeCard + RecipeListFilters + PaginationControls + Wave 0 test scaffold** - `11ac732` (feat)
2. **Task 2: Full recipe list page with search, filter, sort, pagination wired to API** - `5b20148` (feat)

## Files Created/Modified
- `apps/web/src/hooks/useDebounce.ts` - Generic debounce hook, 300ms default
- `apps/web/src/components/recipes/RecipeCard.tsx` - Recipe list item card with sand thumbnail and link
- `apps/web/src/components/recipes/RecipeListFilters.tsx` - Search input + sort/filter action buttons
- `apps/web/src/components/recipes/PaginationControls.tsx` - Prev/next pagination with page size selector
- `apps/web/src/app/(app)/recipes/page.tsx` - Full recipe list page implementation
- `apps/web/src/lib/query-keys.ts` - Added foods.all and foods.list() keys
- `apps/web/src/components/__tests__/AppShell.test.tsx` - Removed stale "renders search placeholder text" test
- `apps/web/src/components/__tests__/RecipeListPage.test.tsx` - 5 integration tests for the recipes page

## Decisions Made
- RecipeCard omits time row because RecipeListItem type lacks totalTime/cookTime fields (they are on RecipeDetailResponse only)
- randomSeed injected into TanStack Query key for random sort to ensure cache miss and real reshuffle on repeated clicks
- Backdrop div pattern (fixed inset-0 z-40) for closing dropdowns on outside click — simpler than portal or click-outside hook

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] RecipeCard referenced non-existent time fields on RecipeListItem**
- **Found during:** Task 2 (TypeScript build verification)
- **Issue:** Plan action specified `recipe.totalTime ?? recipe.cookTime` but RecipeListItem type (packages/shared/src/api/recipes.ts) only has id, name, slug, description, servingsQty, servingsUnit, shareToken, createdAt, updatedAt, imageCount — no time fields
- **Fix:** Removed time display from RecipeCard; time data only available on RecipeDetailResponse (detail page)
- **Files modified:** apps/web/src/components/recipes/RecipeCard.tsx
- **Verification:** `yarn workspace @recipe-manager/web build` compiles with no type errors
- **Committed in:** 5b20148 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug)
**Impact on plan:** Necessary fix for TypeScript correctness. Time display will be available on the detail page where RecipeDetailResponse is used. No scope change.

## Issues Encountered
None beyond the Rule 1 auto-fix above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- RecipeCard links to /recipes/[slug]?id=[id] — ready for Plan 08-02 (RecipeDetailPage)
- PaginationControls, RecipeListFilters, RecipeCard all exported and testable
- queryKeys.foods.list() available for future food-related queries

---
*Phase: 08-frontend-recipe-list-detail-cook-mode*
*Completed: 2026-03-18*
