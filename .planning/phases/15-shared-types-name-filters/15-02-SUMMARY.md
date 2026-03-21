---
phase: 15-shared-types-name-filters
plan: "02"
subsystem: api
tags: [nestjs, prisma, swagger, query-filter]

requires:
  - phase: 15-01
    provides: shared types package compiled; ValidationPipe with transform:true in main.ts

provides:
  - FoodsController with optional ?name= case-insensitive substring filter
  - UnitsController with optional ?name= case-insensitive substring filter
  - Swagger @ApiQuery documenting the optional name param on both endpoints

affects:
  - Phase 18 (compound create) — agents can now resolve food/unit IDs by name before creating ingredients

tech-stack:
  added: []
  patterns:
    - "Prisma case-insensitive substring filter: { name: { contains: trimmed, mode: 'insensitive' } }"
    - "Conditional where clause: trimmed ? { ... } : undefined to return full list when param omitted"
    - "@ApiQuery({ required: false }) on existing @Get() handler for optional filter documentation"

key-files:
  created: []
  modified:
    - apps/api/src/shared/foods.controller.ts
    - apps/api/src/shared/units.controller.ts

key-decisions:
  - "Conditional where clause with undefined (not empty object) when name is omitted — Prisma treats undefined as 'no filter'"
  - "name?.trim() before conditional check — whitespace-only strings treated same as omitted param"

patterns-established:
  - "Optional query filter pattern: Query param + trim + conditional Prisma where clause"

requirements-completed:
  - ERGO-01
  - ERGO-02

duration: 2min
completed: 2026-03-21
---

# Phase 15 Plan 02: Name Filters Summary

**Optional ?name= case-insensitive substring filter added to GET /api/foods and GET /api/units via Prisma contains + insensitive mode, documented in Swagger**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-21T10:34:00Z
- **Completed:** 2026-03-21T10:34:33Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- GET /api/foods?name=tomate returns only foods whose name contains "tomate" (case-insensitive)
- GET /api/units?name=taza returns only units whose name contains "taza" (case-insensitive)
- Omitting or passing empty/whitespace ?name= returns the full list unchanged
- Swagger UI shows name as optional query parameter on both endpoints
- API compiles cleanly after changes

## Task Commits

Each task was committed atomically:

1. **Task 1: Add ?name= filter to FoodsController** - `058cb03` (feat)
2. **Task 2: Add ?name= filter to UnitsController** - `1ac261e` (feat)

**Plan metadata:** (final docs commit)

## Files Created/Modified

- `apps/api/src/shared/foods.controller.ts` - Added Query/ApiQuery imports, @ApiQuery decorator, conditional Prisma where with insensitive contains
- `apps/api/src/shared/units.controller.ts` - Same pattern as FoodsController

## Decisions Made

- Used `trimmed ? { ... } : undefined` so Prisma sees no where clause at all when the param is omitted or blank — cleaner than passing an empty where object
- `name?.trim()` applied before the conditional so whitespace-only input is treated the same as an omitted param

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Both lookup endpoints now support targeted name-based filtering — agents can resolve food/unit IDs in a single call
- Phase 18 (compound recipe create) can proceed; all prerequisite patterns are in place

---
*Phase: 15-shared-types-name-filters*
*Completed: 2026-03-21*
