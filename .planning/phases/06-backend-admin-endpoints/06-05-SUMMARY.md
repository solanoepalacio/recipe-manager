---
phase: 06-backend-admin-endpoints
plan: 05
subsystem: api
tags: [nestjs, prisma, crypto, sha256, api-tokens, admin]

# Dependency graph
requires:
  - phase: 06-backend-admin-endpoints/06-01
    provides: AdminAuthGuard, CurrentAdmin decorator, AdminTokenResponse/AdminTokenCreatedResponse shared types
  - phase: 06-backend-admin-endpoints/06-02
    provides: AdminPaginationDto, AdminUsersController pattern
  - phase: 06-backend-admin-endpoints/06-03
    provides: AdminHouseholdsController + AdminHouseholdsService
  - phase: 06-backend-admin-endpoints/06-04
    provides: AdminFoodsController + AdminUnitsController + AdminFoodsService + AdminUnitsService
provides:
  - AdminTokensService with findAll/create/remove — TOKEN_SELECT excludes tokenHash
  - AdminTokensController GET/POST/DELETE with AdminAuthGuard + CurrentAdmin
  - CreateAdminTokenDto with class-validator + @ApiProperty decorators
  - Updated AdminModule registering all 6 controller+service pairs (auth, users, households, foods, units, tokens)
affects: [phase 07, phase 08, authentication, api-tokens]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - TOKEN_SELECT constant excludes tokenHash at Prisma query level — security by construction
    - Raw token (randomBytes(32) hex) returned once on POST; SHA-256 hash stored in DB
    - @CurrentAdmin() param decorator injects admin entity for createdById on POST /admin/tokens

key-files:
  created:
    - apps/api/src/admin/tokens/admin-tokens.service.ts
    - apps/api/src/admin/tokens/admin-tokens.controller.ts
    - apps/api/src/admin/tokens/dto/create-token.dto.ts
  modified:
    - apps/api/src/admin/admin.module.ts

key-decisions:
  - "TOKEN_SELECT explicitly excludes tokenHash key — tokenHash never appears in findAll or list mapper output"
  - "AdminModule exports trimmed to [AdminAuthService, AdminUsersService] — household/food/unit/token services are internal-only"
  - "AdminModule wiring is final — all 6 sub-module controller+service pairs registered; NestJS resolves all dependencies"

patterns-established:
  - "SELECT constant pattern: declare const ENTITY_SELECT = { ...fields, sensitiveField: false } as const — use in every findMany/findUnique/create to prevent accidental exposure"
  - "Raw token pattern: randomBytes(32).hex → return once; SHA-256 hash stored in DB — same as password reset in admin-users.service.ts"

requirements-completed: []

# Metrics
duration: 5min
completed: 2026-03-18
---

# Phase 6 Plan 05: Admin Tokens Sub-Module + Final AdminModule Wiring Summary

**AdminTokensService (SHA-256 hash stored, raw 64-char hex returned once) + AdminTokensController (CurrentAdmin for createdById) + AdminModule fully wired with all 6 sub-modules — 92 tests green**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-18T11:16:44Z
- **Completed:** 2026-03-18T11:21:44Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- AdminTokensService: findAll returns paginated list with tokenHash explicitly excluded via TOKEN_SELECT; create stores SHA-256 hash and returns raw 64-char hex token once; remove throws NotFoundException on miss
- AdminTokensController: GET/POST/DELETE endpoints protected by AdminAuthGuard at class level; POST uses @CurrentAdmin() to inject admin.id as createdById
- AdminModule updated to register all 6 controller+service pairs — NestJS dependency resolution verified
- Full test suite: 92 tests passing across 18 suites (was 68+ previously)

## Task Commits

Each task was committed atomically:

1. **Task 1: AdminTokensService + DTO** - `2971d0b` (feat)
2. **Task 2: AdminTokensController + full AdminModule wiring** - `303f844` (feat)

**Plan metadata:** _(docs commit follows)_

## Files Created/Modified
- `apps/api/src/admin/tokens/dto/create-token.dto.ts` - CreateAdminTokenDto with @IsString/@IsUUID + @ApiProperty decorators
- `apps/api/src/admin/tokens/admin-tokens.service.ts` - Token CRUD service; TOKEN_SELECT excludes tokenHash; raw token returned once
- `apps/api/src/admin/tokens/admin-tokens.controller.ts` - REST controller GET/POST/DELETE; @CurrentAdmin() on POST for createdById
- `apps/api/src/admin/admin.module.ts` - Updated to register all 6 sub-module controllers and services

## Decisions Made
- TOKEN_SELECT excludes tokenHash at Prisma query level — hash is never loaded into memory for list/get paths, security by construction
- AdminModule exports trimmed to [AdminAuthService, AdminUsersService] — the other services are internal to AdminModule and not exported to avoid unnecessary DI surface
- AdminModule wiring is the final integration point for Phase 6; all sub-modules complete

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 6 complete — all admin endpoints (auth, users, households, foods, units, tokens) implemented and tested
- AdminModule fully wired and NestJS dependency resolution verified with clean build
- 92 unit tests green; build clean — ready for Phase 7
- API token mechanism ready for agent authentication (GET /admin/tokens, POST /admin/tokens, DELETE /admin/tokens/:id)

---
*Phase: 06-backend-admin-endpoints*
*Completed: 2026-03-18*

## Self-Check: PASSED

- FOUND: apps/api/src/admin/tokens/admin-tokens.service.ts
- FOUND: apps/api/src/admin/tokens/admin-tokens.controller.ts
- FOUND: apps/api/src/admin/tokens/dto/create-token.dto.ts
- FOUND: apps/api/src/admin/admin.module.ts
- FOUND: .planning/phases/06-backend-admin-endpoints/06-05-SUMMARY.md
- FOUND: commit 2971d0b (Task 1)
- FOUND: commit 303f844 (Task 2)
