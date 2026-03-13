# Implementation Workflow

Defines the orchestration process for implementing the recipe manager. Every task from `implementation_progress.md` follows this workflow.

---

## Roles

### Orchestrator (main conversation)

The human + Claude Code main session. Responsibilities:

- Reads `implementation_progress.md` to determine the next task
- Verifies milestone dependencies are met before starting a task
- Spawns task agents and review agents
- Makes final merge decisions
- Updates `implementation_progress.md` after each task completes

### Task Agent (subagent, per task)

A subagent spawned in an **isolated worktree** branch. Performs the full TDD cycle for one task. Has access to all tools.

- Works on branch `impl/{task-id}-{short-name}`
- Reads design artifacts to understand requirements
- Writes tests first, then implementation
- Runs tests to confirm they pass
- Commits all work on its branch

### Architect Agent (subagent, review)

A subagent spawned to review the task agent's work. Provides expert feedback on:

- Type safety (especially `@recipe-manager/shared` contract adherence)
- NestJS/Next.js patterns and best practices
- Security (auth, validation, injection risks)
- Code quality (naming, structure, unnecessary complexity)
- Test coverage gaps

Returns a structured review with required changes (if any) and optional suggestions.

---

## Task Lifecycle

Every task follows these phases in order:

```
┌─────────────────────────────────────────────────────────────┐
│                     ORCHESTRATOR                             │
│                                                              │
│  1. Pick next task from implementation_progress.md           │
│  2. Verify dependencies met                                  │
│  3. Update task status → In Progress                         │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              TASK AGENT (worktree branch)               │  │
│  │                                                         │  │
│  │  Phase 1 — ANALYZE                                      │  │
│  │  • Read design artifacts relevant to the task           │  │
│  │  • Read shared types that the task must conform to      │  │
│  │  • Read adjacent modules for pattern consistency        │  │
│  │  • Identify the exact interfaces, endpoints, or         │  │
│  │    components to implement                              │  │
│  │                                                         │  │
│  │  Phase 2 — TEST (write failing tests)                   │  │
│  │  • Write tests BEFORE implementation                    │  │
│  │  • Tests go in `tests/` (unit) or                       │  │
│  │    `integration_tests/` (integration)                   │  │
│  │  • Tests must cover the verification criteria           │  │
│  │    from implementation_progress.md                      │  │
│  │  • Tests must compile but FAIL (no implementation yet)  │  │
│  │  • Commit: "test({scope}): add tests for {feature}"    │  │
│  │                                                         │  │
│  │  Phase 3 — IMPLEMENT (make tests pass)                  │  │
│  │  • Write the minimum code to make all tests pass        │  │
│  │  • Import and conform to @recipe-manager/shared types   │  │
│  │  • Follow established patterns from adjacent modules    │  │
│  │  • Run tests — all must pass                            │  │
│  │  • Commit: "feat({scope}): implement {feature}"        │  │
│  │                                                         │  │
│  │  Phase 4 — SELF-CHECK                                   │  │
│  │  • Run full test suite (not just new tests)             │  │
│  │  • Run linter/type-check                                │  │
│  │  • Fix any regressions                                  │  │
│  │  • Commit fixes if needed                               │  │
│  │                                                         │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  4. Spawn ARCHITECT AGENT to review the branch              │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              ARCHITECT AGENT (review)                    │  │
│  │                                                         │  │
│  │  • Read the diff (all commits on the branch)            │  │
│  │  • Check type safety against @recipe-manager/shared     │  │
│  │  • Check pattern consistency with existing modules      │  │
│  │  • Check test quality and coverage                      │  │
│  │  • Check security (auth, validation, scoping)           │  │
│  │  • Check for over-engineering or missing edge cases     │  │
│  │                                                         │  │
│  │  Returns:                                                │  │
│  │  • APPROVED — no changes needed                         │  │
│  │  • CHANGES REQUIRED — list of required fixes            │  │
│  │  • (optional) suggestions for improvement               │  │
│  │                                                         │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                              │
│  5a. If APPROVED → merge branch to main                     │
│  5b. If CHANGES REQUIRED → spawn task agent again on        │
│      same branch to apply fixes, then re-review             │
│                                                              │
│  6. Update task status → Complete                            │
│  7. Move to next task                                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Phase Details

### Phase 1 — Analyze

The task agent reads relevant design artifacts before writing any code. Which artifacts to read depends on the task type:

| Task type | Read |
|-----------|------|
| Shared types | `01_tech_stack_and_data_model.md`, `03_api_design.md` |
| Database | `01_tech_stack_and_data_model.md`, `02_auth_design.md` |
| API module | `03_api_design.md`, `02_auth_design.md`, relevant shared types in `packages/shared/src/api/` |
| Frontend foundation | `06_hifi_wireframes.md`, `07_project_structure.md` |
| Frontend page | `05_ui_views.md`, `06_hifi_wireframes.md`, relevant hi-fi HTML in `mvp_plans/hifi/`, relevant shared types |
| Integration test | `04_user_flows.md`, all relevant artifacts |

The agent also reads existing code in adjacent modules to maintain pattern consistency. For example, before implementing the `household` module, read how `profile` was implemented.

### Phase 2 — Test

Tests are written first and must fail before implementation exists.

**Backend unit tests** (`apps/api/tests/`):
- Test services with mocked `PrismaService`
- Test guards with mocked request objects
- Test pipes/decorators in isolation
- Mirror source structure: `tests/recipes/recipes.service.spec.ts`

**Backend integration tests** (`apps/api/integration_tests/`):
- Use a real PostgreSQL test database
- Test full HTTP request → response cycle via `supertest`
- Set up test data via Prisma, not via API calls
- Clean up between tests (transaction rollback or truncate)
- Test auth by creating real sessions/tokens
- Mirror source structure: `integration_tests/recipes/recipes.spec.ts`

**Frontend unit tests** (`apps/web/tests/`):
- Use React Testing Library + Vitest (or Jest)
- Test component rendering, user interactions, callback invocations
- Mock API client for data-dependent components
- Mirror source structure: `tests/components/ui/Button.spec.tsx`

**Frontend integration tests** (`apps/web/integration_tests/`):
- Test full page renders with mocked API responses
- Test navigation flows
- Test form submission → API call → UI update cycles

### Phase 3 — Implement

Write the minimum code to make tests pass. Key rules:

- **Shared types first**: if the task creates a new endpoint, the shared types for its request/response must already exist (from M1). The service must return these types. The controller DTOs must implement the shared request interfaces.
- **Type safety chain**: `PrismaService` → service (maps Prisma result to shared type) → controller (returns shared type). The compiler must catch any drift.
- **NestJS conventions**: one module per feature; controller stays thin; service owns all Prisma access; DTOs use `class-validator` + `@ApiProperty()`.
- **Frontend conventions**: pages are client components; data fetching via TanStack Query hooks; shared types used for API responses; Tailwind for styling.

### Phase 4 — Self-Check

Before the task agent finishes:

1. Run the full test suite for the workspace (`yarn workspace @recipe-manager/api test`, etc.) — not just new tests
2. Run `tsc --noEmit` on all workspaces to catch type errors
3. Run the linter
4. Fix any regressions and commit

---

## Architect Review Criteria

The architect agent evaluates the branch diff against these criteria:

### Required (blocks merge)

1. **Type safety**: shared types correctly imported and used; no `any`, no type assertions without justification; service return types match shared response types
2. **Auth correctness**: appropriate guard applied; household scoping enforced at service layer; `@Public()` used only where documented
3. **Validation**: all user input validated via DTOs with `class-validator`; `@ApiProperty()` present on all DTO fields
4. **Test coverage**: verification criteria from `implementation_progress.md` are covered; edge cases (not found, unauthorized, validation errors) tested
5. **Pattern consistency**: follows the same structure as existing modules; no unnecessary deviations
6. **Security**: no injection risks; no sensitive data leaks; passwords hashed; tokens hashed

### Optional (suggestions, not blocking)

- Naming improvements
- Performance optimizations
- Code organization within a file
- Additional test cases for robustness

---

## Branch & Merge Strategy

### Branch creation

Each task agent creates its branch from the current `main`:

```
git checkout main
git pull
git checkout -b impl/{task-id}-{short-name}
```

Branch name examples:
- `impl/0.1-workspace-init`
- `impl/4.6-auth-endpoints`
- `impl/6.6-recipes-crud`
- `impl/11.5-recipe-detail-view`

### Merge criteria

A branch may only be merged to `main` when:

1. All tests pass (unit + integration for the task's workspace)
2. Type-check passes across all workspaces
3. Architect review returns APPROVED
4. No merge conflicts with `main`

### Merge process

```
git checkout main
git merge --no-ff impl/{task-id}-{short-name}
git branch -d impl/{task-id}-{short-name}
```

Use `--no-ff` to preserve branch history in the merge commit.

---

## Commit Message Convention

```
{type}({scope}): {description}

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

Types:
- `feat` — new functionality
- `test` — adding or updating tests
- `fix` — bug fix or review fix
- `refactor` — restructuring without behavior change
- `chore` — tooling, config, dependencies

Scope matches the module or domain: `auth`, `recipes`, `shared`, `web`, `api`, `prisma`, etc.

---

## Dependency Graph

Tasks must be executed respecting these dependencies. Tasks within the same milestone can be parallelized if they don't depend on each other.

```
M0 (scaffold)
 ├── M1 (shared types)
 │    ├── M6 (user API)
 │    ├── M7 (admin API)
 │    └── M9 (frontend foundation)
 │         ├── M10 (frontend auth pages)
 │         │    ├── M11 (frontend main views)
 │         │    └── M12 (frontend admin)
 │         └── M11
 ├── M2 (database)
 │    ├── M3 (API core)
 │    │    ├── M4 (auth)
 │    │    │    ├── M5 (setup)
 │    │    │    ├── M6
 │    │    │    └── M7
 │    │    └── M5
 │    └── M4
 └── M9

M6 + M7 → M8 (password reset)
All → M13 (integration & polish)
```

### Parallelization opportunities

These task groups can run concurrently:

- **M1 tasks** (shared types) are all independent of each other
- **M6.1–M6.5** (profile, household, foods, units) are independent
- **M7.1–M7.6** (all admin modules) are independent of each other
- **M9.5–M9.10** (UI primitives) are independent
- **M11.2, M11.3, M11.14–M11.18** (simple pages) are independent once foundation exists
- **M12.2–M12.8** (admin panels) are independent once admin layout exists

---

## Agent Prompt Templates

### Task Agent prompt

```
You are implementing task {task-id} for the recipe-manager project.

**Task:** {task description}
**Branch:** impl/{task-id}-{short-name}
**Verification:** {verification criteria}

Follow this workflow strictly:

1. ANALYZE — Read these design artifacts: {list}. Read adjacent modules for
   patterns: {list}. Read the shared types your work must conform to: {list}.

2. TEST — Write failing tests FIRST in {test location}. Cover the verification
   criteria above plus edge cases (not found, unauthorized, validation errors).
   Commit with message: "test({scope}): add tests for {feature}"

3. IMPLEMENT — Write the minimum code to pass all tests. Conform to
   @recipe-manager/shared types. Follow patterns from existing modules.
   Commit with message: "feat({scope}): implement {feature}"

4. SELF-CHECK — Run full test suite. Run tsc --noEmit. Fix any issues.

Key rules:
- Import types from @recipe-manager/shared — never redefine API boundary types
- Service methods return shared response types
- Controller DTOs implement shared request interfaces
- Add @ApiProperty() to every DTO field for OpenAPI docs
- Household-scoped data must filter by householdId at the service layer
- Follow existing patterns exactly — check adjacent modules
```

### Architect Agent prompt

```
You are reviewing the implementation of task {task-id} for the recipe-manager
project.

**Task:** {task description}
**Branch:** impl/{task-id}-{short-name}

Review the full diff on this branch against main. Evaluate:

REQUIRED (blocks merge):
1. Type safety — @recipe-manager/shared types used correctly? No any/assertions?
2. Auth — correct guard applied? Household scoping at service layer?
3. Validation — class-validator on all DTOs? @ApiProperty() present?
4. Tests — verification criteria covered? Edge cases (404, 401, 400) tested?
5. Pattern consistency — matches structure of existing modules?
6. Security — no injection, no data leaks, passwords/tokens hashed?

OPTIONAL (non-blocking suggestions):
- Naming, performance, organization improvements

Return your review as:

## Verdict: APPROVED | CHANGES REQUIRED

### Required Changes (if any)
- [ ] {change 1}
- [ ] {change 2}

### Suggestions (optional)
- {suggestion 1}
```

---

## Orchestrator Checklist (per task)

```
[ ] Read implementation_progress.md — identify next task
[ ] Verify milestone dependencies are complete
[ ] Update task status → In Progress
[ ] Spawn task agent in worktree (isolation: worktree)
[ ] Wait for task agent to complete
[ ] Spawn architect agent to review the branch
[ ] If CHANGES REQUIRED: resume task agent to apply fixes, then re-review
[ ] If APPROVED: merge branch to main (--no-ff)
[ ] Run full test suite on main post-merge
[ ] Update task status → Complete
[ ] Proceed to next task
```
