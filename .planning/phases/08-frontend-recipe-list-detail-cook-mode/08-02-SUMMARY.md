---
phase: 08-frontend-recipe-list-detail-cook-mode
plan: 02
subsystem: ui
tags: [react, next.js, tanstack-query, lucide, tailwind]

# Dependency graph
requires:
  - phase: 08-frontend-recipe-list-detail-cook-mode
    provides: RecipeListItem with slug and id fields enabling ?id= query param navigation
  - phase: 07-frontend-setup-app-shell-auth-flows
    provides: AppShell, Skeleton, api-client, query-keys, shared CSS variables
  - phase: 04-backend-recipe-crud
    provides: GET /api/recipes/:id endpoint returning RecipeDetailResponse
  - phase: 01-monorepo-shared-types
    provides: RecipeDetailResponse, SectionResponse, IngredientResponse, StepResponse shared types

provides:
  - Recipe detail page at /recipes/[slug]?id=:id with full recipe content
  - DetailTopBar component (sand bg, back arrow, overflow icon)
  - SectionAccordion component (chevron toggle, expanded by default)
  - InfoGrid component (4-cell prep/cook/total/servings grid)
  - IngredientList component (sections with ingredient rows)
  - InstructionList component (numbered step list)

affects:
  - 08-03-cook-mode (reads recipe id from same ?id= search param pattern)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Slug + id query param pattern: RecipeCard passes ?id=:id so detail page can call API by UUID
    - useSearchParams for id, useParams for slug — two separate URL data sources on same page
    - TDD: test scaffold created before implementation, all 5 tests pass GREEN

key-files:
  created:
    - apps/web/src/app/(app)/recipes/[slug]/page.tsx
    - apps/web/src/components/recipes/DetailTopBar.tsx
    - apps/web/src/components/recipes/SectionAccordion.tsx
    - apps/web/src/components/recipes/InfoGrid.tsx
    - apps/web/src/components/recipes/IngredientList.tsx
    - apps/web/src/components/recipes/InstructionList.tsx
    - apps/web/src/components/__tests__/RecipeDetailPage.test.tsx
  modified:
    - apps/web/src/components/recipes/RecipeCard.tsx

key-decisions:
  - "Detail page reads recipe UUID from ?id= search param (not slug) to call GET /api/recipes/:id — slug is URL-only"
  - "InfoGrid uses border-r on first 3 cells as divider (simpler than CSS pseudo-element approach from spec)"
  - "Editar receta rendered as disabled <span> placeholder — wires to Phase 9 edit route"
  - "Test uses getAllByText for Pollo since name appears in both DetailTopBar and sticky h1"

patterns-established:
  - "SectionAccordion: reusable accordion with defaultExpanded prop and ChevronDown/ChevronRight icon toggle"
  - "Detail page layout: fixed top bar + sticky recipe header + scrollable accordion sections + pb-20 FAB clearance"

requirements-completed:
  - RCP-07

# Metrics
duration: 5min
completed: 2026-03-18
---

# Phase 8 Plan 02: Recipe Detail Page Summary

**Recipe detail page at /recipes/[slug] with DetailTopBar, InfoGrid, SectionAccordion, IngredientList, InstructionList — full recipe viewing experience wired to GET /api/recipes/:id via TanStack Query**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-18T15:45:09Z
- **Completed:** 2026-03-18T15:50:29Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- 5 reusable recipe detail components created (DetailTopBar, SectionAccordion, InfoGrid, IngredientList, InstructionList)
- Recipe detail page fully wired to API via useQuery with loading/error states and all three accordion sections
- All 23 web tests pass and TypeScript build compiles clean

## Task Commits

Each task was committed atomically:

1. **Task 1: Detail components + Wave 0 test scaffold** - `753c84f` (feat)
2. **Task 2: Recipe detail page wired to API** - `38d766d` (feat)

## Files Created/Modified

- `apps/web/src/app/(app)/recipes/[slug]/page.tsx` - Recipe detail page: useQuery, DetailTopBar, sticky header, 3 accordion sections
- `apps/web/src/components/recipes/DetailTopBar.tsx` - Sand-background top bar with back arrow, recipe name (centered), overflow icon
- `apps/web/src/components/recipes/SectionAccordion.tsx` - Expandable section with ChevronDown/ChevronRight toggle, starts expanded
- `apps/web/src/components/recipes/InfoGrid.tsx` - 4-cell grid: Preparacion/Coccion/Total/Porciones with null -> em dash
- `apps/web/src/components/recipes/IngredientList.tsx` - Sections with optional title + ingredient rows (qty + unit + food + note)
- `apps/web/src/components/recipes/InstructionList.tsx` - Numbered steps with foreground circle badge
- `apps/web/src/components/__tests__/RecipeDetailPage.test.tsx` - 5 tests: name, info grid labels, ingredients, instructions, Iniciar receta
- `apps/web/src/components/recipes/RecipeCard.tsx` - Auto-fixed: removed non-existent totalTime/cookTime fields from RecipeListItem

## Decisions Made

- Detail page reads recipe UUID from `?id=` search param (not slug) to call `GET /api/recipes/:id` — slug is URL-only for display
- InfoGrid uses `border-r border-border` on first 3 cells as vertical divider (simpler than CSS pseudo-element from spec, visually equivalent)
- "Editar receta" rendered as disabled `<span>` placeholder with `text-placeholder` and `cursor-not-allowed` — wires to Phase 9
- Test uses `getAllByText(/Pollo/)` since "Pollo al Horno" appears in both DetailTopBar and sticky `<h1>`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed RecipeCard.tsx referencing non-existent time fields on RecipeListItem**
- **Found during:** Task 2 build verification
- **Issue:** RecipeCard accessed `recipe.totalTime` and `recipe.cookTime` but `RecipeListItem` only has `imageCount`, `name`, `slug`, `id` — TypeScript build error
- **Fix:** Removed time display from RecipeCard (time data is not in `RecipeListItem`; plan 08-01 had used wrong fields); removed unused `Clock` import
- **Files modified:** `apps/web/src/components/recipes/RecipeCard.tsx`
- **Verification:** `yarn workspace @recipe-manager/web build` compiles clean
- **Committed in:** 38d766d (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Fix was necessary for TypeScript build to pass. RecipeListItem intentionally omits time fields (lean select for list view — see Phase 05 decisions). No scope creep.

## Issues Encountered

- Test for "renders ingredient names" used `getByText(/Pollo/)` but "Pollo al Horno" also matched — updated to `getAllByText` asserting at least one match

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Recipe detail page complete at `/recipes/[slug]?id=:id`
- Cook mode (Plan 08-03) can navigate from "Iniciar receta" button at `/recipes/[slug]/cook?id=:id`
- "Editar receta" placeholder awaits Phase 9 implementation

---
*Phase: 08-frontend-recipe-list-detail-cook-mode*
*Completed: 2026-03-18*
