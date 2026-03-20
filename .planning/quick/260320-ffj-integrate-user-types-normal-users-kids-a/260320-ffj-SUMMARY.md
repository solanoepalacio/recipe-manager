---
phase: quick
plan: 260320-ffj
subsystem: user-types
tags: [user-types, schema, backend, frontend, admin, household]
dependency_graph:
  requires: []
  provides: [UserType enum, type-conditional member forms, agent auto-token, filtered token assignment]
  affects: [household, admin-panel, auth, tokens]
tech_stack:
  added: []
  patterns: [type-conditional validation, agent auto-token creation, Suspense boundary for useSearchParams]
key_files:
  created:
    - apps/api/prisma/migrations/20260320000000_add_user_type/migration.sql
  modified:
    - packages/shared/src/enums.ts
    - packages/shared/src/api/household.ts
    - packages/shared/src/api/admin.ts
    - apps/api/prisma/schema.prisma
    - apps/api/src/admin/users/dto/create-user.dto.ts
    - apps/api/src/admin/users/dto/update-user.dto.ts
    - apps/api/src/admin/users/admin-users.service.ts
    - apps/api/src/admin/users/admin-users.controller.ts
    - apps/api/src/admin/households/admin-households.service.ts
    - apps/api/src/admin/tokens/admin-tokens.service.ts
    - apps/api/src/auth/auth.service.ts
    - apps/api/src/household/household.service.ts
    - apps/api/src/profile/profile.service.ts
    - apps/api/prisma/seed-dev.ts
    - apps/web/src/app/(app)/household/page.tsx
    - apps/web/src/app/(admin)/admin/panel/households/page.tsx
    - apps/web/src/app/(admin)/admin/panel/tokens/page.tsx
decisions:
  - "UserType Prisma enum values are lowercase matching TypeScript enum values (normal/kid/agent)"
  - "gender and dateOfBirth made optional on User model to accommodate kid and agent types"
  - "Agent users do NOT get an auto-created token on creation — tokens are created manually via the admin tokens page"
  - "AdminUserCreatedResponse removed from shared types since auto-token was removed after checkpoint review"
  - "Token creation restricted to agent users only via BadRequestException in admin-tokens.service"
  - "Only normal users can log in via session auth (validateUser returns null for kid/agent)"
  - "toAdminUserResponse includes household join so householdName is available in AdminUserResponse"
  - "User-facing household page shows Agente badge only; Adulto/Nino badges removed after checkpoint review"
  - "Migration applied manually (migrate resolve --applied) due to session table drift between DB and migration history"
metrics:
  duration: 12 min
  completed_date: "2026-03-20"
  tasks_completed: 2
  files_modified: 21
---

# Phase quick Plan 260320-ffj: Integrate User Types (Normal, Kids, Agents) Summary

User types (normal, kid, agent) integrated across the full stack: Prisma schema, shared types, backend validation, and frontend forms. Kids are tracked without credentials, agents have manually-assigned API tokens, and the admin UI adapts forms and lists to each type.

## Tasks Completed

| # | Task | Commit | Status |
|---|------|--------|--------|
| 1 | Add UserType enum, update schema, shared types, and backend | 1546d78 | Done |
| 2 | Update frontend — household member forms and admin tokens page | 6b33b4e | Done |
| 3 | Post-checkpoint: remove auto-token creation and adulto/nino badges | bebd41f | Done |

## What Was Built

**Schema:** Added `UserType` Prisma enum (`normal/kid/agent`) and `userType` column (default `normal`) to `User`. Made `gender` and `dateOfBirth` optional to accommodate kid/agent types.

**Shared types:** `UserType` enum in `enums.ts`. `HouseholdMemberResponse` and `CreateMemberRequest` updated with `userType` field and optional `gender`/`dateOfBirth`. `AdminUserResponse` gets `userType` and optional `householdName`. `AdminTokenResponse` gets optional `userName` and `householdName`. New `AdminUserCreatedResponse` extends `AdminUserResponse` with optional `autoToken`.

**Backend:**
- `admin-users.service`: type-conditional required-field validation on create; agent users auto-create an API token; `findAll` supports `?userType=` filter; `toAdminUserResponse` includes `householdName` via join
- `admin-tokens.service`: token creation restricted to agent users only; token list includes `userName` and `householdName`
- `auth.service`: `validateUser` returns `null` for non-normal users
- `household.service`: member mapping includes `userType`
- `admin-households.service` + `profile.service`: updated to handle optional `gender`/`dateOfBirth`

**Seed:** Added Sofia (kid, 2018) and Recipe Bot (agent, with auto-token) to dev household.

**Frontend:**
- Household page: "Agente" badge shown next to agent member names only; normal and kid members are unlabeled; agents show "Bot" instead of age
- Admin households page: "Tipo de miembro" selector as first form field; conditional fields per type; password reset hidden for kid/agent members
- Admin tokens page: user dropdown filters to agent users only; token table shows `userName (householdName)` from server

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed admin-households.service toAdminUserResponse mapper**
- **Found during:** Task 1 API build
- **Issue:** `toAdminUserResponse` in `admin-households.service.ts` was missing `userType` in select and mapper, and expected non-nullable `gender`/`dateOfBirth` which are now optional
- **Fix:** Added `userType: true` to USER_SELECT, updated mapper to handle nullable fields
- **Files modified:** `apps/api/src/admin/households/admin-households.service.ts`
- **Commit:** 1546d78

**2. [Rule 1 - Bug] Fixed profile.service toProfileResponse mapper**
- **Found during:** Task 1 API build
- **Issue:** `toProfileResponse` expected non-nullable `gender: string` and `dateOfBirth: Date` which are now optional in the Prisma schema
- **Fix:** Updated mapper to handle `string | null` and `Date | null`
- **Files modified:** `apps/api/src/profile/profile.service.ts`
- **Commit:** 1546d78

**3. [Rule 1 - Bug] Fixed three pre-existing web build errors**
- **Found during:** Task 2 web build
- **Issues:**
  - `MetadataForm.tsx`: returned `null` for optional string fields in `UpdateRecipeRequest` (should be `undefined`)
  - `vitest.config.ts`: invalid `tsconfig` property in test config
  - `reset-password/page.tsx`: `useSearchParams()` used without Suspense boundary (Next.js SSG error)
- **Fix:** Used `undefined` for optional strings, removed invalid vitest property, wrapped page in Suspense
- **Files modified:** `apps/web/src/components/recipes/editor/MetadataForm.tsx`, `apps/web/vitest.config.ts`, `apps/web/src/app/(auth)/reset-password/page.tsx`
- **Commit:** bd7321b

**4. [Rule 3 - Blocking] Applied migration SQL manually due to session table drift**
- **Found during:** Task 1 migration
- **Issue:** `prisma migrate dev` detected drift from the `session` table (created by `connect-pg-simple` outside Prisma migrations). Could not run in interactive mode.
- **Fix:** Used `prisma migrate diff` with a shadow DB to generate the SQL, created the migration directory manually, applied SQL directly via psql, then ran `prisma migrate resolve --applied`
- **Commit:** 1546d78

### Post-checkpoint Changes (human-directed)

**5. Remove auto-token creation for agent users**
- **Directed by:** Human checkpoint review
- **Reason:** Tokens should be created manually from the tokens page, not auto-generated
- **Changes:**
  - `admin-users.service.ts`: removed auto-token creation block from `create()`, return type changed from `AdminUserCreatedResponse` to `AdminUserResponse`
  - `packages/shared/src/api/admin.ts`: removed `AdminUserCreatedResponse` interface
  - `apps/web/src/app/(admin)/admin/panel/households/page.tsx`: removed `autoToken` state, `autoTokenForHousehold` state, `OneTimeDisplay` for agent token, `AdminUserCreatedResponse` import, and related HouseholdRow props
- **Commit:** bebd41f

**6. Remove "Adulto" and "Nino/a" badges from user-facing household page**
- **Directed by:** Human checkpoint review
- **Reason:** Only the agent badge adds useful information for the household view; labeling every member is noisy
- **Changes:**
  - `apps/web/src/app/(app)/household/page.tsx`: replaced `UserTypeBadge` (all three types) with `AgentBadge` (agent-only); removed unused `isKid` variable
- **Commit:** bebd41f

## Self-Check: PASSED

- SUMMARY.md: FOUND
- migration.sql: FOUND
- enums.ts: FOUND
- Commit 1546d78 (Task 1): FOUND
- Commit 6b33b4e (Task 2): FOUND
- Commit bd7321b (pre-existing fixes): FOUND
- Commit bebd41f (post-checkpoint fixes): FOUND
