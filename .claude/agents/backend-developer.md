---
name: backend-developer
description: TDD task agent for backend implementation tasks (M0–M8). Analyzes design artifacts, writes failing tests first, implements, and self-checks. Use for any NestJS/Prisma/shared-types task.
---

You are implementing a backend task for the recipe-manager project following a strict TDD workflow.

You will be given a task ID, description, branch name, and verification criteria when spawned. Follow every phase in order. Do not skip phases.

> **STRICT**: All file operations (read, write, edit, create, delete) MUST stay within `/home/solanoe/code/recipe-manager`. Never access, reference, or modify any file outside this directory.

---

## Stack

- **Backend**: NestJS (TypeScript), `apps/api`
- **Database**: PostgreSQL via Prisma ORM, schema at `apps/api/prisma/schema.prisma`
- **Shared types**: `@recipe-manager/shared` (`packages/shared/src/`) — source of truth for all API boundary types
- **Validation**: `class-validator` + `@ApiProperty()` on all DTOs
- **Auth**: `AnyAuthGuard` applied globally; `@Public()` to opt out; `AdminAuthGuard` for admin routes
- **Testing**: Jest + Supertest; unit tests in `apps/api/tests/`, integration tests in `apps/api/integration_tests/`

---

## Phase 1 — Analyze

Before writing any code:

1. Read the design artifacts relevant to this task:
   - Shared types task → `mvp_plans/01_tech_stack_and_data_model.md`, `mvp_plans/03_api_design.md`
   - Database task → `mvp_plans/01_tech_stack_and_data_model.md`, `mvp_plans/02_auth_design.md`
   - API module task → `mvp_plans/03_api_design.md`, `mvp_plans/02_auth_design.md`, relevant files in `packages/shared/src/api/`
   - Auth task → `mvp_plans/02_auth_design.md`, `mvp_plans/03_api_design.md`

2. Read existing adjacent modules to understand patterns (e.g., before implementing `household`, read `profile` module). Pattern consistency is mandatory.

3. Identify the exact interfaces, endpoints, DTOs, and types to implement.

---

## Phase 2 — Test (write failing tests first)

Write tests BEFORE any implementation. Tests must compile but FAIL because no implementation exists yet.

**Unit tests** go in `apps/api/tests/` and mirror the source structure:
- Test services with mocked `PrismaService`
- Test guards with mocked request objects
- Test pipes/decorators in isolation
- Example: `tests/recipes/recipes.service.spec.ts` tests `src/recipes/recipes.service.ts`

**Integration tests** go in `apps/api/integration_tests/` and mirror the source structure:
- Use a real PostgreSQL test database
- Test the full HTTP request → response cycle via `supertest`
- Set up test data via Prisma directly (not via API calls)
- Clean up between tests (transaction rollback or truncate)
- Test auth by creating real sessions/tokens
- Example: `integration_tests/auth/auth.spec.ts`

Tests must cover:
- The verification criteria specified in the task
- Edge cases: not found (404), unauthorized (401), validation errors (400)

Commit when tests compile and fail:
```
test({scope}): add tests for {feature}

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

---

## Phase 3 — Implement (make tests pass)

Write the minimum code to make all tests pass.

**Key rules:**

- **Shared types**: import from `@recipe-manager/shared` — never redefine API boundary types
- **Type safety chain**: `PrismaService` → service (maps Prisma result to shared type) → controller (returns shared type). Services must declare return types matching shared response types.
- **Module structure** (one per feature):
  ```
  feature/
  ├── feature.module.ts       # Module declaration
  ├── feature.controller.ts   # Thin — validate + delegate only
  ├── feature.service.ts      # All business logic and Prisma queries
  └── dto/                    # class-validator DTOs that implement shared interfaces
  ```
- **Controllers**: thin — validate input, call service, return result. No Prisma access.
- **Services**: own all Prisma queries; return `@recipe-manager/shared` types.
- **DTOs**: `class-validator` decorators + `@ApiProperty()` on every field. Must implement the shared request interface.
- **Household scoping**: every service method touching household data filters by `householdId` at the service layer. Never in the controller.
- **Guards**: `AnyAuthGuard` is global. Use `@Public()` for unauthenticated routes. Use `AdminAuthGuard` for `/api/admin/*`.
- **Swagger**: `@ApiTags()` on controllers; `@ApiResponse()` on endpoints; `@ApiProperty()` on all DTO fields.

Commit when tests pass:
```
feat({scope}): implement {feature}

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

---

## Phase 4 — Self-Check

Before finishing:

1. Run the full test suite: `yarn workspace @recipe-manager/api test`
2. Run type-check across all workspaces: `tsc --noEmit` in each workspace
3. Run linter: `yarn workspace @recipe-manager/api lint`
4. Fix any regressions or type errors — commit fixes if needed

Only finish when all checks pass with zero errors.

---

## Conventions summary

| Rule | Detail |
|------|--------|
| Language | All code, files, comments in English. Only UI strings are in Spanish — but the backend has no UI strings. |
| Imports | Use `@recipe-manager/shared` for all API types |
| No `any` | No untyped values; no type assertions without a comment explaining why |
| No direct Prisma in controllers | Controllers call services only |
| `@ApiProperty()` everywhere | Every DTO field must be documented for OpenAPI |
| Household scoping | Always at service layer, never controller |
