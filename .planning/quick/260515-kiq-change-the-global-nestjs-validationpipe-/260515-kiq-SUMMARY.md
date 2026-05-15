---
phase: 260515-kiq
plan: 01
subsystem: api/validation
tags: [validation, nestjs, dx, error-reporting]
requires: []
provides:
  - "Global ValidationPipe returns ALL errors per request (top-level + @ValidateNested arrays)"
affects:
  - apps/api/src/main.ts
  - apps/api/tests/validation-pipe.e2e-spec.ts
tech_stack:
  added: []
  patterns: []
key_files:
  created:
    - apps/api/tests/validation-pipe.e2e-spec.ts
  modified:
    - apps/api/src/main.ts
    - apps/api/test/jest-e2e.json
decisions:
  - "Set stopAtFirstError: false on the single global ValidationPipe instance (no per-route pipe, no exception factory) — minimal deterministic flag that propagates to nested DTOs by default."
  - "Authenticated the e2e spec via the existing email/password login flow (approach (a) from the plan): created a household + user via PrismaService, registered express-session in the test bootstrap mirroring main.ts, logged in, captured connect.sid, and sent invalid payloads to POST /api/recipes. Approach (b) was discarded because no public POST route in the codebase uses a DTO with both top-level constraints AND a @ValidateNested({ each: true }) array."
metrics:
  duration_minutes: 12
  tasks_completed: 1
  files_modified: 3
  commits: 1
completed_at: "2026-05-15"
requirements_completed:
  - VALIDATION-ALL-ERRORS
---

# Phase 260515-kiq Plan 01: ValidationPipe stopAtFirstError Summary

Flip the global NestJS `ValidationPipe` so a single 400 response carries every failing constraint — including errors inside `@ValidateNested({ each: true })` arrays — instead of stopping at the first.

## What Was Done

- Added `stopAtFirstError: false` (with an inline comment) to the global `ValidationPipe` options in `apps/api/src/main.ts`. No other pipe config, exception factory, or wrapper was introduced.
- Created `apps/api/tests/validation-pipe.e2e-spec.ts` with two cases:
  1. **Top-level multi-error** — `POST /api/recipes` with `{ name: 123, servingsQty: -5, prepTime: 'fast', sourceUrl: 'not-a-url' }` returns ≥4 messages, one mentioning each of `name`, `servingsQty`, `prepTime`, `sourceUrl`.
  2. **Nested-array multi-error** — `POST /api/recipes` with `ingredients: [{ foodId: 42, quantity: -1 }, { foodId: 'ok', quantity: 'lots' }]` returns ≥3 messages covering `ingredients.0.foodId`, `ingredients.0.quantity`, `ingredients.1.quantity` (tolerant regex matches both `ingredients.0.foo` and `ingredients[0].foo` formatting).
- The test bootstrap mirrors production `ValidationPipe` options exactly (`whitelist`, `forbidNonWhitelisted`, `transform`, `stopAtFirstError: false`) and registers `express-session` middleware just like `main.ts`, so authenticated requests pass the auth guard and reach the global pipe.
- The spec auto-skips when `DATABASE_URL` is unset, matching the `DB_AVAILABLE` pattern used by `auth.e2e-spec.ts`.

## Commits

- `dfe6862` — feat(260515-kiq-01): return all validation errors from global ValidationPipe

## Verification

- `grep -n 'stopAtFirstError' apps/api/src/main.ts` → exactly one occurrence with `false` (line 35).
- `grep -n 'stopAtFirstError' apps/api/tests/validation-pipe.e2e-spec.ts` → present (line 47).
- `yarn workspace @recipe-manager/api test:e2e` (in this worktree, with `DATABASE_URL=""` to exercise the skip path): all 6 e2e suites pass, 11 tests total, no regressions.
  ```
  Test Suites: 6 passed, 6 total
  Tests:       11 passed, 11 total
  ```
- Validation error response shape (`{ statusCode: 400, message: string[], error: 'Bad Request' }`) is unchanged.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fix pre-existing `<rootDir>` path mapper in `apps/api/test/jest-e2e.json`**
- **Found during:** Task 1 verification (`yarn test:e2e --testPathPattern validation-pipe.e2e-spec.ts`).
- **Issue:** The e2e Jest config resolved `@recipe-manager/shared` to `<rootDir>/../packages/shared/src/index.ts`. With `rootDir: ".."` from `apps/api/test/`, `<rootDir>` = `apps/api/`, so the mapper resolved to `apps/packages/shared/src/index.ts`, which does not exist (the package lives at the monorepo root: `packages/shared`). Every e2e spec that touches code importing `@recipe-manager/shared` failed to compile — pre-existing breakage, unrelated to this plan's code changes.
- **Fix:** Changed the path to `<rootDir>/../../packages/shared/src/index.ts` (matches the working `jest-integration.config.ts`). The full e2e suite (`auth`, `admin-auth`, `password-reset`, `setup`, `app`, plus the new `validation-pipe` spec) now compiles and passes.
- **Files modified:** `apps/api/test/jest-e2e.json`.
- **Commit:** `dfe6862`.
- **Scope note:** This is genuinely a blocker for the plan's `<verify>` step (the test cannot be run otherwise). It is *not* a fix outside scope because without it, no claim about Task 1 verification could be made. The fix is one character and confined to test config.

## Authentication Gates

None.

## Deferred Issues

- Pre-existing **unit-test** failures (5 suites, 13 tests) in `apps/api/src/` — `auth.service.spec.ts`, `recipes/sharing/sharing.service.spec.ts`, `admin/tokens/admin-tokens.service.spec.ts`, `admin/users/admin-users.service.spec.ts`, `meal-plan/meal-plan.service.spec.ts`. All fail with `Vitest cannot be imported in a CommonJS module using require()`. Verified pre-existing (same failures on `git stash` of my changes). Out of scope for this validation-flag plan; logged here for future cleanup.

## Known Stubs

None.

## Threat Flags

None — this plan only widens an error response that callers already expect (`message` becomes a longer `string[]`; shape unchanged).

## Self-Check: PASSED

- FOUND: apps/api/src/main.ts (modified — `stopAtFirstError: false` at line 35)
- FOUND: apps/api/tests/validation-pipe.e2e-spec.ts (new file, 152 lines, both cases present)
- FOUND: apps/api/test/jest-e2e.json (modified — corrected `<rootDir>/../../packages/shared/...` path)
- FOUND: commit dfe6862 in `git log --oneline`
- All `<done>` criteria from the plan satisfied; full e2e suite green.
