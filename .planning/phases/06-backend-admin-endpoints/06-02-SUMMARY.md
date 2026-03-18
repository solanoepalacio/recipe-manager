---
phase: 06-backend-admin-endpoints
plan: 02
subsystem: api
tags: [nestjs, prisma, bcrypt, admin, crud, pagination, openapi]

# Dependency graph
requires:
  - phase: 06-backend-admin-endpoints
    provides: "06-01 Wave-0 scaffold with admin-users.service.spec.ts, admin module wiring, AdminAuthGuard"
provides:
  - "AdminUsersService with full CRUD: findAll, findOne, create, update, remove, generatePasswordResetUrl"
  - "AdminUsersController with GET/POST/GET:id/PATCH:id/DELETE:id/POST:id/password-reset-url"
  - "AdminPaginationDto, CreateAdminUserDto, UpdateAdminUserDto"
affects: [06-backend-admin-endpoints, 12-admin-panel]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "USER_SELECT lean projection — passwordHash, resetToken, resetTokenExpiry excluded from all admin user responses"
    - "toAdminUserResponse mapper — converts Prisma User row to AdminUserResponse with ISO 8601 date strings"
    - "AdminPaginationDto — reusable pagination DTO with @Type(() => Number) for query param coercion"
    - "Prisma enum cast — dto.gender cast to $Enums.Gender to satisfy Prisma type system"

key-files:
  created:
    - apps/api/src/admin/users/dto/admin-pagination.dto.ts
    - apps/api/src/admin/users/dto/create-user.dto.ts
    - apps/api/src/admin/users/dto/update-user.dto.ts
  modified:
    - apps/api/src/admin/users/admin-users.service.ts
    - apps/api/src/admin/users/admin-users.controller.ts

key-decisions:
  - "USER_SELECT constant excludes passwordHash/resetToken/resetTokenExpiry — secure by construction, no accidental leakage"
  - "Gender string cast to $Enums.Gender on Prisma create — DTO accepts string, Prisma requires enum; casting avoids leaking Prisma types into shared DTOs"
  - "UpdateAdminUserDto uses Record<string, unknown> data accumulator — cleanly handles partial updates without undefined spreading"

patterns-established:
  - "AdminPaginationDto pattern: reuse in future admin sub-modules (households, recipes)"

requirements-completed: []

# Metrics
duration: 2min
completed: 2026-03-18
---

# Phase 6 Plan 02: Admin Users CRUD Summary

**Full CRUD admin users service and controller — paginated list, create with bcrypt hashing, update, delete, existing password-reset-url preserved; 10 unit tests green; lean USER_SELECT never exposes passwordHash**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-18T11:04:06Z
- **Completed:** 2026-03-18T11:05:54Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Three DTO files created: AdminPaginationDto (reusable pagination), CreateAdminUserDto (householdId required, password optional), UpdateAdminUserDto (all optional fields)
- AdminUsersService expanded from 1 method to 6: findAll (paginated + Promise.all), findOne (404 on miss), create (household validation + bcrypt), update (partial update), remove (existence check), generatePasswordResetUrl (unchanged)
- AdminUsersController now has 6 endpoints: GET/POST/GET:id/PATCH:id/DELETE:id + POST:id/password-reset-url, all behind class-level AdminAuthGuard
- All 10 Wave-0 spec tests pass including original 3 + 7 new CRUD tests

## Task Commits

Each task was committed atomically:

1. **Task 1: DTOs — AdminPaginationDto, CreateAdminUserDto, UpdateAdminUserDto** - `df2c482` (feat)
2. **Task 2: Expand AdminUsersService + AdminUsersController with full CRUD** - `e776c1d` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `apps/api/src/admin/users/dto/admin-pagination.dto.ts` — Page/perPage query params with @Type(() => Number) coercion
- `apps/api/src/admin/users/dto/create-user.dto.ts` — CreateAdminUserDto with householdId @IsUUID, optional password @MinLength(8)
- `apps/api/src/admin/users/dto/update-user.dto.ts` — UpdateAdminUserDto all optional, includes householdId for household transfer
- `apps/api/src/admin/users/admin-users.service.ts` — Full CRUD service; USER_SELECT lean projection; toAdminUserResponse mapper
- `apps/api/src/admin/users/admin-users.controller.ts` — Full REST controller; @UseGuards(AdminAuthGuard) at class level

## Decisions Made
- USER_SELECT constant defined at module scope to guarantee passwordHash/resetToken/resetTokenExpiry are never selected in any query
- Gender string cast to `$Enums.Gender` on Prisma create call — DTO and shared type use `string | null`, Prisma type system requires the enum; cast is safe since enum values are identical strings
- `Record<string, unknown>` data accumulator in `update` keeps TypeScript happy with partial updates without spreading undefined values into the Prisma call

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] TypeScript type mismatch: Prisma gender expects $Enums.Gender, DTO provides string**
- **Found during:** Task 2 (Expand AdminUsersService)
- **Issue:** `prisma.user.create` requires `gender: $Enums.Gender | null`, but `dto.gender` is `string | undefined`; TypeScript TS2322 error blocked tests from running
- **Fix:** Added `import { $Enums } from '@prisma/client'` and cast `dto.gender` to `$Enums.Gender` at the call site
- **Files modified:** apps/api/src/admin/users/admin-users.service.ts
- **Verification:** Tests ran and all 10 passed; `yarn build` clean
- **Committed in:** e776c1d (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - type mismatch bug)
**Impact on plan:** Required fix; Prisma type system enforces enum types at the client layer. No scope creep.

## Issues Encountered
- Prisma's generated client enforces the `Gender` enum type on `user.create` even though the runtime values are identical strings. Cast to `$Enums.Gender` resolves it without leaking Prisma types into the shared DTO layer.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Admin users CRUD complete; ready for Plan 06-03 (admin households) and beyond
- AdminPaginationDto is reusable — import it in 06-03 and 06-04 without creating new pagination DTOs
- No blockers

---
*Phase: 06-backend-admin-endpoints*
*Completed: 2026-03-18*

## Self-Check: PASSED

All files created and all commits found.
