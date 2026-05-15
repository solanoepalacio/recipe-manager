---
phase: 260515-kxk
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - apps/api/src/auth/auth.service.spec.ts
  - apps/api/src/recipes/sharing/sharing.service.spec.ts
  - apps/api/src/meal-plan/meal-plan.service.spec.ts
  - apps/api/src/admin/tokens/admin-tokens.service.spec.ts
  - apps/api/src/admin/users/admin-users.service.spec.ts
autonomous: true
requirements: [QUICK-260515-kxk]

must_haves:
  truths:
    - "Running `yarn --cwd apps/api jest` from the repo root reports 0 failed suites and 0 failed tests"
    - "No spec file imports from 'vitest'"
    - "Every spec whose service injects UmamiService provides a UmamiService mock (`{ trackEvent: jest.fn() }`) in its DI setup"
  artifacts:
    - path: apps/api/src/auth/auth.service.spec.ts
      provides: "Jest-native AuthService spec (no vitest imports)"
      contains: "jest.fn()"
    - path: apps/api/src/recipes/sharing/sharing.service.spec.ts
      provides: "SharingService spec with UmamiService mock provider"
      contains: "UmamiService"
  key_links:
    - from: apps/api/src/auth/auth.service.spec.ts
      to: jest (ambient globals)
      via: "no vitest import; describe/it/expect/jest are ambient"
      pattern: "^(?!.*from 'vitest').*$"
    - from: apps/api/src/recipes/sharing/sharing.service.spec.ts
      to: UmamiService DI mock
      via: "{ provide: UmamiService, useValue: { trackEvent: jest.fn() } } in Test.createTestingModule providers"
      pattern: "provide: UmamiService"
---

<objective>
Fix all 13 failing unit tests in `apps/api` so `yarn --cwd apps/api jest` reports 20/20 suites passing. Two mechanical root causes:

1. `auth.service.spec.ts` uses Vitest APIs (`import ... from 'vitest'`, `vi.fn()`) inside a Jest project — Jest cannot load the ESM-only `vitest` module.
2. Four service specs build their service via Nest DI (or direct constructor) without providing the new `UmamiService` dependency that the production services now inject — Nest throws "can't resolve dependencies" or the constructor receives `undefined`.

Purpose: Restore green unit tests so future TDD work in `apps/api` runs on a clean baseline. Tests-only changes; no production code modifications.

Output:
- Rewritten `auth.service.spec.ts` using Jest ambient globals.
- Spec files for SharingService / MealPlanService / AdminTokensService / AdminUsersService updated to satisfy each service's actual constructor signature (verify before editing — only add UmamiService mock to services that actually inject it).
</objective>

<execution_context>
@/home/solanoe/code/recipe-manager/.claude/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@./CLAUDE.md
@apps/api/jest.config.ts
@apps/api/src/umami/umami.service.ts

<interfaces>
<!-- UmamiService surface (from apps/api/src/umami/umami.service.ts) -->
```typescript
@Injectable()
export class UmamiService {
  constructor(private readonly httpService: HttpService) {}
  trackEvent(eventName: string, data: Record<string, string | number | boolean>): void
}
```

<!-- Standard mock shape (matches the only method used by callers): -->
```typescript
{ trackEvent: jest.fn() }
```

<!-- Service constructor signatures (verify in source before editing each spec): -->
- SharingService(prisma: PrismaService, umamiService: UmamiService)  ← injects UmamiService
- MealPlanService(prisma: PrismaService)                              ← does NOT inject UmamiService per current source
- AdminTokensService(prisma: PrismaService)                            ← does NOT inject UmamiService per current source
- AdminUsersService(prisma: PrismaService)                             ← does NOT inject UmamiService per current source

The task description claims meal-plan / admin-tokens / admin-users also inject UmamiService. The current source files at the paths listed in <files> show only `PrismaService`. The executor MUST re-grep the service source files for `UmamiService` before adding a mock. Add the UmamiService mock ONLY where the production service actually injects it. For any spec still failing after vitest + sharing fix, read the failure message — it identifies the missing dependency by name.
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Convert auth.service.spec.ts from Vitest to Jest</name>
  <files>apps/api/src/auth/auth.service.spec.ts</files>
  <action>
    Edit `apps/api/src/auth/auth.service.spec.ts` to remove all Vitest dependencies. Mechanical, no behavioral changes:
    1. Delete the line `import { describe, it, expect, vi, beforeEach } from 'vitest';` entirely. Jest provides `describe`, `it`, `expect`, `beforeEach` as ambient globals via `@types/jest` (already present in the project).
    2. Replace every `vi.fn()` with `jest.fn()`.
    3. Replace every `ReturnType<typeof vi.fn>` with `jest.Mock` (the existing `prisma.user.findFirst` type annotation on line 8).
    4. If any `vi.spyOn`, `vi.mock`, `vi.clearAllMocks`, or other `vi.*` call exists, replace with the `jest.*` equivalent.
    5. Do NOT modify imports of `AuthService` or `bcrypt`. Do NOT change any test bodies, assertions, or mock return values.
    No other file changes in this task.
  </action>
  <verify>
    <automated>cd /home/solanoe/code/recipe-manager && yarn --cwd apps/api jest auth.service.spec 2>&1 | tail -20</automated>
    Expect: `Tests: 5 passed` and `Test Suites: 1 passed`. Also verify no `vitest` import remains: `grep -n "vitest" apps/api/src/auth/auth.service.spec.ts` must print nothing.
  </verify>
  <done>
    `yarn --cwd apps/api jest auth.service.spec` reports 1 suite / 5 tests passing. `grep -rn "from 'vitest'" apps/api/src` returns no matches.
  </done>
</task>

<task type="auto">
  <name>Task 2: Add UmamiService (and any other missing) provider mocks to failing service specs</name>
  <files>
    apps/api/src/recipes/sharing/sharing.service.spec.ts,
    apps/api/src/meal-plan/meal-plan.service.spec.ts,
    apps/api/src/admin/tokens/admin-tokens.service.spec.ts,
    apps/api/src/admin/users/admin-users.service.spec.ts
  </files>
  <action>
    For EACH of the four spec files: before editing, inspect its production service source file (e.g. `apps/api/src/recipes/sharing/sharing.service.ts`) and read the `constructor(...)` parameter list. The fix depends on which dependencies the service actually injects today AND on the existing spec pattern.

    Step 1 — Confirm current failure shape (informational, do not act yet):
    ```bash
    yarn --cwd apps/api jest sharing.service.spec meal-plan.service.spec admin-tokens.service.spec admin-users.service.spec 2>&1 | tail -80
    ```
    Note which specific dependency Nest reports as unresolvable for each failing suite. Trust the failure message over the task description prose.

    Step 2 — sharing.service.spec.ts (Test.createTestingModule pattern):
    The production `SharingService` injects `PrismaService` AND `UmamiService`.
    - Add `import { UmamiService } from '../../umami/umami.service';` near the existing PrismaService import.
    - Add a `mockUmami = { trackEvent: jest.fn() };` constant alongside `mockPrisma`.
    - In `Test.createTestingModule({ providers: [...] })`, append `{ provide: UmamiService, useValue: mockUmami }` to the providers array.
    - Do NOT change any test bodies.

    Step 3 — meal-plan.service.spec.ts:
    First, grep the service source: `grep -n "constructor\|UmamiService" apps/api/src/meal-plan/meal-plan.service.ts`.
    - If `MealPlanService` does NOT inject `UmamiService` (current source shows it does not), do NOT add a UmamiService mock. Instead, run the spec in isolation and read the actual error.
    - The most likely real failure: the `createEntry` flow calls `prisma.recipe.findUnique` which is NOT in `mockPrisma`. If the spec fails with "Cannot read properties of undefined (reading 'findUnique')" or similar, add a `recipe: { findUnique: jest.fn() }` group to `mockPrisma` and add `mockPrisma.recipe.findUnique.mockResolvedValueOnce({ id: 'r1', householdId: 'hh1' });` to the two `createEntry` tests (before the `mealPlan.upsert` mock), AND to the `updateEntry` "updates the entry" test if it triggers the recipe lookup branch.
    - If the failure is something else (e.g. UmamiService unresolvable because the service was just updated to inject it), follow the SharingService pattern above with the actual import path: `import { UmamiService } from '../umami/umami.service';`.
    - Do NOT silently widen the mock — only add what the failure requires.

    Step 4 — admin-tokens.service.spec.ts (direct `new Service(prisma as any)` pattern):
    Grep the service source: `grep -n "constructor\|UmamiService" apps/api/src/admin/tokens/admin-tokens.service.ts`.
    - If the constructor takes only `PrismaService` (current source shows this), the spec should already compile. Run it in isolation and capture the real failure. Likely issue: `create` test calls `service.create(...)` but the service checks `user.userType !== 'agent'` — the mock returns `{ id: 'u1' }` without `userType`. Fix the test by changing line 37 to `prisma.user.findUnique.mockResolvedValue({ id: 'u1', userType: 'agent' });` (and any analogous test). If `findAll` test fails because `select` includes `user.household`, augment the `findMany` mock objects accordingly.
    - If the service DOES inject `UmamiService`, change the constructor call to `new AdminTokensService(prisma as any, { trackEvent: jest.fn() } as any)`.
    - Make minimal edits keyed off the actual error output.

    Step 5 — admin-users.service.spec.ts (direct `new Service(prisma as any)` pattern):
    Grep the service source: `grep -n "constructor\|UmamiService" apps/api/src/admin/users/admin-users.service.ts`.
    - If constructor takes only `PrismaService` (current source shows this), run the spec and capture the real failure. Likely culprits: `create` tests call `service.create({...})` but the production code requires `userType`-specific validation (email/password/gender/dateOfBirth for `normal`); the current "hashes password when provided" test passes only email+password+name — it will throw `BadRequestException` because gender + dateOfBirth are missing. Fix by augmenting the DTO in the failing test to satisfy the production validation (add `gender: 'other'`, `dateOfBirth: '2000-01-01'`) — this matches the production contract without altering production code. Update the second `create` test (the one passing `userType` implicitly normal with no password) similarly OR change its `userType` to `'kid'` with a `dateOfBirth` to match the existing assertion `passwordHash: null`.
    - If the service injects `UmamiService`, append `{ trackEvent: jest.fn() } as any` to the `new AdminUsersService(...)` call.

    General rules across all four files:
    - Tests-only. Do not edit production source.
    - Do not refactor specs beyond the minimum required to pass.
    - Do not remove or restructure existing assertions.
    - Use `jest.fn()` (never `vi.fn()`).
    - Each edit must be traceable to a specific failure message from Step 1.
  </action>
  <verify>
    <automated>cd /home/solanoe/code/recipe-manager && yarn --cwd apps/api jest 2>&1 | tail -10</automated>
    Expect final summary: `Test Suites: 20 passed, 20 total` and `Tests: 106 passed, 106 total` (or higher pass counts if test counts shift — must be 0 failed in both lines).
  </verify>
  <done>
    `yarn --cwd apps/api jest` from the repo root reports 0 failed suites and 0 failed tests. All four target spec files compile and pass. No production code under `apps/api/src/**/*.ts` (excluding `*.spec.ts`) was modified — confirm with `git diff --name-only apps/api/src | grep -v '\.spec\.ts$'` printing nothing.
  </done>
</task>

</tasks>

<verification>
Full-suite gate (must pass from repo root):
```
yarn --cwd apps/api jest
```
Output tail must show:
- `Test Suites: 20 passed, 20 total`
- `Tests:` line with `0 failed`
- Exit code 0

Hygiene checks:
- `grep -rn "from 'vitest'" apps/api/src` → empty
- `grep -rn "vi\\.fn\\|vi\\.spyOn\\|vi\\.mock" apps/api/src` → empty
- `git diff --name-only apps/api/src | grep -v '\\.spec\\.ts$'` → empty (no production files touched)
</verification>

<success_criteria>
- `yarn --cwd apps/api jest` exits 0 with 20/20 suites passing and 0 failed tests.
- Zero `vitest` references remain anywhere under `apps/api/src`.
- Only `*.spec.ts` files were modified; production code untouched.
- No new dependencies added; `apps/api/jest.config.ts` unchanged.
</success_criteria>

<output>
On completion, write `.planning/quick/260515-kxk-fix-failing-apps-api-unit-tests-vitest-j/260515-kxk-SUMMARY.md` recording:
- Final `yarn --cwd apps/api jest` summary line.
- For each of the 5 edited spec files: a 1-line description of the exact change made (e.g. "added UmamiService provider mock", "replaced vi.fn with jest.fn", "augmented create-test DTO with gender + dateOfBirth").
- Any divergence from the task description's stated root causes (e.g. if MealPlanService did NOT actually inject UmamiService and the real fix was different).
</output>
