---
phase: 02-database-schema-prisma
plan: 01
subsystem: database
tags: [prisma, postgresql, schema, orm, jest, integration-tests]

# Dependency graph
requires:
  - phase: 01-monorepo-shared-types
    provides: NestJS bootstrap with PrismaModule, packages/shared enums (Gender, MealType)

provides:
  - Full Prisma schema with all 13 models and 2 enums
  - HH-01 structural enforcement: non-nullable householdId on Recipe and MealPlan
  - Recipe.@@unique([householdId, slug]) compound constraint
  - Jest integration test config and HH-01 spec stubs
  - prisma db seed config in package.json (tsx runner)

affects:
  - 02-database-schema-prisma (Plans 02-03: migration, seeding depend on this schema)
  - 03-auth (User model with passwordHash, resetToken fields)
  - 04-recipes (Recipe, IngredientSection, RecipeIngredient models)
  - 05-meal-plan (MealPlan, MealPlanEntry models)

# Tech tracking
tech-stack:
  added: [tsx@4.21.0]
  patterns:
    - "Prisma enum values are lowercase strings matching TypeScript enum values (e.g., Gender.Male = 'male' → enum Gender { male })"
    - "Integration tests use separate jest config (jest-integration.config.ts) with rootDir pointing outside src/"
    - "prisma seed uses tsx runner (not ts-node) for ESM compatibility"

key-files:
  created:
    - apps/api/prisma/schema.prisma
    - apps/api/jest-integration.config.ts
    - apps/api/integration_tests/schema.integration-spec.ts
  modified:
    - apps/api/package.json

key-decisions:
  - "MealPlan is one-to-one with Household (householdId @unique) — each household has exactly one meal plan"
  - "ApiToken links userId to User AND createdById to Admin — only admins can issue API tokens for users"
  - "Integration tests run with separate jest config (rootDir: integration_tests) to avoid polluting unit test suite"
  - "Wave 0 spec stubs use Prisma DMMF introspection for structural assertion — actual DB-level tests run after migration in Plan 02-02"

patterns-established:
  - "Integration tests live in apps/api/integration_tests/ with *.integration-spec.ts pattern"
  - "prisma key in package.json drives `prisma db seed` — seed file at prisma/seed.ts using tsx"

requirements-completed: [HH-01]

# Metrics
duration: 2min
completed: 2026-03-16
---

# Phase 2 Plan 01: Database Schema and Wave 0 Test Infrastructure Summary

**Full Prisma schema with 13 models, 2 enums, HH-01 household-scoping constraints, and Jest integration test scaffolding**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-16T11:17:52Z
- **Completed:** 2026-03-16T11:20:15Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Complete Prisma schema covering all 13 entities — Household, User, Admin, ApiToken, Food, Unit, Recipe, IngredientSection, RecipeIngredient, InstructionStep, RecipeImage, MealPlan, MealPlanEntry
- HH-01 structural enforcement: Recipe.householdId and MealPlan.householdId are non-nullable String fields; Recipe.@@unique([householdId, slug]) compound constraint prevents slug collisions within a household
- Wave 0 test infrastructure: jest-integration.config.ts, schema.integration-spec.ts with 3 HH-01 test cases, tsx installed, prisma seed config in package.json
- Prisma client regenerated with all 13 model types; `npx prisma validate` exits 0

## Task Commits

Each task was committed atomically:

1. **Task 1: Wave 0 — Test infrastructure and package config** - `952abc0` (feat)
2. **Task 2: Full Prisma schema — all 13 models and 2 enums** - `7021ef1` (feat)

**Plan metadata:** (docs: complete plan — see final commit)

## Files Created/Modified

- `apps/api/prisma/schema.prisma` — Complete schema: 2 enums + 13 models with all relations, constraints, and HH-01 enforcement
- `apps/api/jest-integration.config.ts` — Jest config for integration tests (rootDir: integration_tests, ts-jest transform)
- `apps/api/integration_tests/schema.integration-spec.ts` — HH-01 test stubs: non-nullable householdId on Recipe/MealPlan, compound unique on Recipe
- `apps/api/package.json` — Added test:integration script, prisma seed config, tsx devDependency

## Decisions Made

- MealPlan is one-to-one with Household (householdId @unique) — each household has exactly one meal plan, matching the design where a household maintains a single rolling meal plan
- ApiToken links userId (User) and createdById (Admin) — only admins can issue API tokens, enforcing that the agent client cannot self-provision access
- Wave 0 spec stubs use Prisma DMMF introspection for the compound unique assertion — actual DB-level constraint tests (insert + reject) run in Plan 02-02 after migration

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- `npx prisma validate` returned an error about DATABASE_URL env var not being set. Fixed by passing DATABASE_URL inline during validation. This is a local dev environment concern — the .env file at the project root has the value, but prisma validate requires it at invocation time. Not a schema issue.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Schema is ready for Plan 02-02: migration (`prisma migrate dev`) and seed (`prisma db seed`)
- Integration tests will run after migration verifies DB-level constraints
- PrismaModule from Phase 1 will automatically pick up the new models after regeneration

## Self-Check: PASSED

- `apps/api/prisma/schema.prisma` — FOUND
- `apps/api/jest-integration.config.ts` — FOUND
- `apps/api/integration_tests/schema.integration-spec.ts` — FOUND
- `02-01-SUMMARY.md` — FOUND
- Commit `952abc0` — FOUND
- Commit `7021ef1` — FOUND

---
*Phase: 02-database-schema-prisma*
*Completed: 2026-03-16*
