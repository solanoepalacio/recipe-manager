---
phase: quick-260319-qas
plan: "01"
subsystem: database-schema, shared-types, backend-services, tests
tags: [prisma, migration, nullability, data-integrity, shared-types]
dependency_graph:
  requires: []
  provides: [required-gender-dob-fields]
  affects: [prisma-schema, shared-types, admin-services, profile-service, frontend-tests]
tech_stack:
  added: []
  patterns: [backfill-before-not-null-migration, username-null-constant]
key_files:
  created:
    - apps/api/prisma/migrations/20260319120000_make_gender_dob_required/migration.sql
  modified:
    - apps/api/prisma/schema.prisma
    - packages/shared/src/api/profile.ts
    - packages/shared/src/api/admin.ts
    - packages/shared/src/api/household.ts
    - apps/api/src/admin/users/dto/create-user.dto.ts
    - apps/api/src/admin/users/dto/update-user.dto.ts
    - apps/api/src/admin/users/admin-users.service.ts
    - apps/api/src/admin/users/admin-users.service.spec.ts
    - apps/api/src/admin/households/admin-households.service.ts
    - apps/api/src/profile/profile.service.ts
    - apps/api/src/profile/dto/update-profile.dto.ts
    - apps/web/src/components/__tests__/ProfilePage.test.tsx
decisions:
  - "Migration created manually (prisma migrate dev --create-only failed due to shadow DB ordering issue from prior manual migration); applied via prisma db execute then prisma migrate resolve --applied"
  - "username column already removed from DB (migration 20260319_remove_username) but service code still referenced it; removed from USER_SELECT and create/update logic; set username: null as constant in response mappers to preserve shared type compatibility"
metrics:
  duration_minutes: 5
  tasks_completed: 2
  files_modified: 12
  completed_date: "2026-03-19"
---

# Quick Task 260319-qas: Make gender and dateOfBirth Required

**One-liner:** Database-enforced non-nullable gender and dateOfBirth on User model with backfill migration, matching nullability changes propagated across all shared types, DTOs, service mappers, and tests.

## What Was Done

### Task 1: Prisma Schema + Migration
- Removed `?` from `gender Gender?` and `dateOfBirth DateTime?` in the User model
- Created migration SQL manually (shadow DB migration ordering blocked `--create-only` flow)
- Migration backfills existing NULL rows: `gender = 'other'`, `dateOfBirth = '2000-01-01'`
- Applied via `prisma db execute` + `migrate resolve --applied`
- Regenerated Prisma client (`prisma generate`)

### Task 2: Shared Types, DTOs, Services, Tests
- `packages/shared/src/api/profile.ts`: `gender: Gender` and `dateOfBirth: string` (non-nullable in ProfileResponse); `gender?: Gender` and `dateOfBirth?: string` in UpdateProfileRequest
- `packages/shared/src/api/admin.ts`: `gender: string` and `dateOfBirth: string` in AdminUserResponse
- `packages/shared/src/api/household.ts`: Non-nullable in HouseholdMemberResponse; `gender: Gender` and `dateOfBirth: string` (required) in CreateMemberRequest; `gender?: Gender` and `dateOfBirth?: string` in UpdateMemberRequest
- `apps/api/src/admin/users/dto/create-user.dto.ts`: Made gender and dateOfBirth required (`@ApiProperty`, removed `@IsOptional`); added `@IsDateString()` for dateOfBirth
- `apps/api/src/admin/users/dto/update-user.dto.ts`: Removed username field (column dropped from DB)
- `apps/api/src/admin/users/admin-users.service.ts`: Updated mapper signature to non-nullable; removed null-handling from dateOfBirth; removed username from USER_SELECT and create/update operations
- `apps/api/src/admin/households/admin-households.service.ts`: Same mapper and USER_SELECT fixes
- `apps/api/src/profile/profile.service.ts`: Updated mapper signature; `dateOfBirth.toISOString()` called directly
- `apps/api/src/profile/dto/update-profile.dto.ts`: Removed `| null` and `nullable: true` from gender and dateOfBirth
- Test mocks updated: gender = 'other', dateOfBirth = new Date('2000-01-01') in spec.ts; gender = 'female', dateOfBirth = '1990-05-15' in ProfilePage.test.tsx

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed username from USER_SELECT and service operations**
- **Found during:** Task 2 TypeScript compilation
- **Issue:** Migration `20260319_remove_username` dropped the `username` column from the DB, but `USER_SELECT`, `create` data object, and `update` data object in both admin services still referenced `username`. Prisma client regeneration exposed this as a TS2353 error.
- **Fix:** Removed `username: true` from USER_SELECT in both services; removed `username: dto.username ?? null` from create; removed `if (dto.username !== undefined) data.username = dto.username` from update; removed username fields from both DTOs. Set `username: null` as a constant in both response mappers to preserve shared type compatibility (AdminUserResponse still declares `username: string | null`).
- **Files modified:** admin-users.service.ts, admin-households.service.ts, create-user.dto.ts, update-user.dto.ts
- **Commit:** 4edfcb5

**2. [Rule 3 - Blocking] Manual migration approach due to shadow DB ordering failure**
- **Found during:** Task 1
- **Issue:** `prisma migrate dev --create-only` failed with P3006 because migration `20260316_remove_landscape_view` (a manually-named migration without a timestamp prefix) causes shadow DB replay ordering issues — same issue noted in Phase 09-05 decisions.
- **Fix:** Created migration SQL file manually, applied via `prisma db execute`, registered via `migrate resolve --applied`.
- **Commit:** fd339ea

## Verification Results

- `prisma validate`: PASSED
- `npx tsc --noEmit -p apps/api/tsconfig.json`: PASSED (0 errors)
- `npx tsc --noEmit -p apps/web/tsconfig.json`: Pre-existing errors in RecipeDetailPage/CookModePage/RecipeEditor/RecipeListPage tests (missing `isLocked`/`coverImageUrl` in mocks) and MetadataForm.tsx — NOT caused by this task
- `cd apps/api && npx jest src/admin/users/admin-users.service.spec.ts`: PASSED (10/10 tests)
- `cd apps/api && npx jest --passWithNoTests`: 87/88 tests pass; 2 pre-existing failures (auth.service.spec.ts uses vitest imports, sharing.service.spec.ts pre-existing bug)

## Self-Check: PASSED

- migration.sql: FOUND
- profile.ts: FOUND
- Commit fd339ea: FOUND
- Commit 4edfcb5: FOUND
