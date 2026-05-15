---
phase: 260515-kxk
plan: 01
subsystem: apps/api unit tests
tags: [tests, jest, vitest-removal, nest-di]
key-files:
  modified:
    - apps/api/src/auth/auth.service.spec.ts
    - apps/api/src/recipes/sharing/sharing.service.spec.ts
    - apps/api/src/meal-plan/meal-plan.service.spec.ts
    - apps/api/src/admin/tokens/admin-tokens.service.spec.ts
    - apps/api/src/admin/users/admin-users.service.spec.ts
  created: []
decisions:
  - "Drove every spec edit from the actual Jest failure messages, not from the task description prose; only SharingService actually injects UmamiService."
  - "Restricted edits to *.spec.ts files; no production source under apps/api/src was touched."
metrics:
  completed: 2026-05-15
  duration: ~10 min
---

# Phase 260515-kxk Plan 01: Fix Failing apps/api Unit Tests Summary

One-liner: Restored `apps/api` Jest suite to 20/20 green by porting `auth.service.spec` off Vitest, wiring the `UmamiService` provider in the sharing spec, and aligning four other specs with current production validation contracts.

## Final Test Run

```
yarn --cwd apps/api jest
Test Suites: 20 passed, 20 total
Tests:       111 passed, 111 total
```

## Per-File Changes

| Spec file | Change |
|-----------|--------|
| `apps/api/src/auth/auth.service.spec.ts` | Removed `vitest` import; swapped `vi.fn()` -> `jest.fn()` and `ReturnType<typeof vi.fn>` -> `jest.Mock`; added `userType: 'normal'` to the two mock users that exercise the success path (production now gates `validateUser` on `userType === 'normal'`). |
| `apps/api/src/recipes/sharing/sharing.service.spec.ts` | Imported `UmamiService`, added `mockUmami = { trackEvent: jest.fn() }`, and registered it as a provider in `Test.createTestingModule`; in the `generateToken` happy-path test, the recipe stub now sets `shareToken: null` so the service runs the `randomBytes(32)` branch instead of short-circuiting on the pre-existing token. |
| `apps/api/src/meal-plan/meal-plan.service.spec.ts` | Added a `recipe: { findUnique: jest.fn() }` group to `mockPrisma`; stubbed `recipe.findUnique` -> `{ id: 'r1', householdId: 'hh1' }` in both `createEntry` tests so the new recipe-ownership check passes. |
| `apps/api/src/admin/tokens/admin-tokens.service.spec.ts` | Changed the `prisma.user.findUnique` stub in the `create` test to `{ id: 'u1', userType: 'agent' }` so the production agent-only guard does not throw `BadRequestException`. |
| `apps/api/src/admin/users/admin-users.service.spec.ts` | First `create` test now passes `gender: 'other'` and `dateOfBirth: '2000-01-01'` (required for `userType: 'normal'`); the second `create` test switches to `userType: 'kid'` + `dateOfBirth: '2010-01-01'` so it satisfies the kid-path validation while still landing on `passwordHash: null`. |

## Divergence from Task Description

The task description claimed four services (Sharing, MealPlan, AdminTokens, AdminUsers) inject `UmamiService`. The actual source on this branch shows only `SharingService` injects it. The plan flagged this discrepancy explicitly; the real failures in the other three suites were unrelated:

- `MealPlanService` newly validates the recipe via `prisma.recipe.findUnique` -> the spec's `mockPrisma` lacked the `recipe` namespace.
- `AdminTokensService.create` rejects non-agent users -> the mocked user needed `userType: 'agent'`.
- `AdminUsersService.create` validates type-specific required fields -> the spec DTOs were missing `gender`/`dateOfBirth` (and, for the kid case, the right `userType`).

Each fix was applied minimally, keyed off the exact failure message, with no production code changes.

## Deviations from Plan

None — both tasks executed exactly as written; only the per-spec details were chosen from the actual Jest output as the plan instructed.

## Self-Check: PASSED

- `apps/api/src/auth/auth.service.spec.ts` — FOUND
- `apps/api/src/recipes/sharing/sharing.service.spec.ts` — FOUND
- `apps/api/src/meal-plan/meal-plan.service.spec.ts` — FOUND
- `apps/api/src/admin/tokens/admin-tokens.service.spec.ts` — FOUND
- `apps/api/src/admin/users/admin-users.service.spec.ts` — FOUND
- Commit `4808cd3` (Task 1) — FOUND
- Commit `8e4a85a` (Task 2) — FOUND
- `grep -rn "from 'vitest'" apps/api/src` — empty
- `grep -rnE "vi\.fn|vi\.spyOn|vi\.mock" apps/api/src` — empty
- Non-spec files modified under `apps/api/src` — none
