---
gsd_state_version: 1.0
milestone: v1.2
milestone_name: API Ergonomics
status: unknown
stopped_at: Completed 19-02-PLAN.md
last_updated: "2026-03-27T19:42:11.329Z"
progress:
  total_phases: 5
  completed_phases: 5
  total_plans: 7
  completed_plans: 7
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-20)

**Core value:** Households can organize, discover, and cook their recipes together — from a searchable library to a weekly meal plan to an in-kitchen cook mode.
**Current focus:** Phase 19 — skill-bundle-updates

## Current Position

Phase: 19 (skill-bundle-updates) — EXECUTING
Plan: 2 of 2

## Performance Metrics

**Velocity:**

- Total plans completed: 49 (phases 1–14)
- Average duration: ~3.4 min
- Total execution time: ~2.8 hours

**By Phase (v1.1):**

| Phase | Plans | Avg/Plan |
|-------|-------|----------|
| 13. Foundation + Read | 2 | 2 min |
| 14. Write Ops + Meal Plan | 2 | 1.5 min |

*Updated after each plan completion*
| Phase 15-shared-types-name-filters P01 | 1 | 2 tasks | 4 files |
| Phase 15-shared-types-name-filters P02 | 2 | 2 tasks | 2 files |
| Phase 16-slug-uuid-dual-lookup P01 | 1 | 2 tasks | 4 files | 6 min |
| Phase 17-batch-ingredient-add P01 | 3 | 2 tasks | 5 files |
| Phase 18-compound-recipe-create P01 | 3 | 2 tasks | 4 files |
| Phase 19-skill-bundle-updates P01 | 3 | 2 tasks | 2 files |
| Phase 19-skill-bundle-updates P02 | 2 | 2 tasks | 2 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting v1.2:

- v1.2: All four API changes are purely additive — no schema migrations, no new packages
- v1.2: Phase 15 first — shared package must compile before compound create (Phase 18) or TypeScript breaks mid-work
- v1.2: Phase 18 last — RecipesService.create is the most critical service method; change only after all patterns are proven in earlier phases
- v1.2: Slug lookup must include householdId in Prisma where predicate (never post-fetch check) — null result is always 404, never 403
- v1.2: Compound create must use prisma.$transaction wrapping the full create — no separate creates outside transaction
- v1.2: Batch ingredient add must compute MAX(order) once before batch, not per-item — prevents order collisions on non-empty sections
- [Phase 14-02]: recipes_create.md documents GET /api/foods and GET /api/units as full-list endpoints with no search parameter (actual v1.1 implementation has no ?name= filter — v1.2 adds it)
- [Phase 15-01]: Inlined ingredient/step shapes in CreateRecipeRequest to keep compound create interface self-contained
- [Phase 15-01]: transform: true added to ValidationPipe in plan 15-01 (not 18) to avoid mid-phase main.ts edits
- [Phase 15-02]: Conditional where clause with undefined (not empty object) when name is omitted so Prisma sees no filter at all
- [Phase 16-01]: isUuid is a module-level function (not class method) — no DI needed, placed above @Injectable
- [Phase 16-01]: findByIdOrSlug sets recipe=null on cross-household UUID (404), findAndVerifyOwnership unchanged for write ops (403)
- [Phase 16-01]: jest.resetAllMocks() preferred over jest.clearAllMocks() in beforeEach when tests use mockResolvedValueOnce — prevents Once-queue leakage across tests
- [Phase 17-batch-ingredient-add]: Mappers (toIngredientResponse, toSectionResponse) duplicated in ingredients.service.ts to avoid cross-service coupling
- [Phase 17-batch-ingredient-add]: POST batch route placed as first IngredientsController method to prevent route collision with :ingredientId parameterized routes
- [Phase 18-compound-recipe-create]: generateUniqueSlug stays OUTSIDE $transaction (read-only, avoids locking issues)
- [Phase 18-compound-recipe-create]: dto.ingredients?.length guard treats both undefined and empty array as no-ingredients case
- [Phase 18-compound-recipe-create]: BadRequestException (not NotFoundException) for P2003, error message: Invalid ingredient data: food or unit not found
- [Phase 19-skill-bundle-updates]: Compound path listed first in Recommended sequence — unambiguously the primary agent workflow for recipe creation (3 calls)
- [Phase 19-skill-bundle-updates]: ?name= documented in shared.md independently so it is discoverable without reading recipes_create.md
- [Phase 19-02]: recipes_get.md uses :idOrSlug endpoint display to make slug acceptance unambiguous; 403 removed (slug lookup always 404 for cross-household — no information leak)
- [Phase 19-02]: Batch ingredient section placed after Update an ingredient to group ingredient operations together in recipes_edit.md

### Pending Todos

None yet.

### Blockers/Concerns

- Before Phase 18 execution: verify apps/api/src/main.ts has ValidationPipe({ transform: true, whitelist: true }) — missing transform:true causes @ValidateNested to silently pass invalid nested arrays
- Known limitation: Postgres ILIKE is not accent-insensitive for Spanish names (e.g., huevo vs huevó); spec does not require accent folding — document in implementation, do not block

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260318-jf3 | fix packages/shared build output to separate dist dir | 2026-03-18 | 0525c76 | [260318-jf3-fix-packages-shared-build-output-to-sepa](./quick/260318-jf3-fix-packages-shared-build-output-to-sepa/) |
| 260319-pkp | add calendar jump modal to meal planner WeekNav | 2026-03-19 | f2e03d8 | [260319-pkp-add-feature-on-the-meal-planner-view-of-](./quick/260319-pkp-add-feature-on-the-meal-planner-view-of-/) |
| 260319-qas | make gender and dateOfBirth required on User model | 2026-03-19 | 4edfcb5 | [260319-qas-we-need-to-make-two-small-changes-to-the](./quick/260319-qas-we-need-to-make-two-small-changes-to-the/) |
| 260319-qsa | add gender and dateOfBirth fields to profile and admin member forms | 2026-03-19 | 44e0ffb | [260319-qsa-add-dateofbirth-and-gender-fields-to-the](./quick/260319-qsa-add-dateofbirth-and-gender-fields-to-the/) |
| 260319-ut2 | household navbar link and members view | 2026-03-19 | 2d9e134 | [260319-ut2-household-navbar-link-and-members-view](./quick/260319-ut2-household-navbar-link-and-members-view/) |
| 260320-eq1 | fix admin login 403 by adding @Public() to admin controllers | 2026-03-20 | afe2110 | [260320-eq1-admin-login-is-not-working-properly-when](./quick/260320-eq1-admin-login-is-not-working-properly-when/) |
| 260320-ffj | integrate user types: normal users, kids, and agents with type-specific fields and behaviors | 2026-03-20 | 5f7c7a3 | [260320-ffj-integrate-user-types-normal-users-kids-a](./quick/260320-ffj-integrate-user-types-normal-users-kids-a/) |
| 260320-h10 | auto-create default ingredient section on recipe creation to fix UX bug | 2026-03-20 | e318461 | [260320-h10-fix-ux-bug-auto-create-default-section-w](./quick/260320-h10-fix-ux-bug-auto-create-default-section-w/) |
| 260320-h8h | wire recipe delete flow from detail page ellipsis dropdown | 2026-03-20 | 6553a0a | [260320-h8h-recipes-can-t-be-deleted-currently-when-](./quick/260320-h8h-recipes-can-t-be-deleted-currently-when-/) |
| 260320-mb4 | I found a bug: when scheduling a meal for today, the hoy view still shows no hay recetas para hoy | 2026-03-20 | 29f3360 | [260320-mb4-i-found-a-bug-when-scheduling-a-meal-for](./quick/260320-mb4-i-found-a-bug-when-scheduling-a-meal-for/) |
| 260327-n75 | implement basic analytics full-stack with Umami | 2026-03-27 | 0205f1b | [260327-n75-i-want-to-implement-basic-analytics-full](./quick/260327-n75-i-want-to-implement-basic-analytics-full/) |
| 260515-kiq | return all validation errors from global ValidationPipe (stopAtFirstError: false) + e2e tests | 2026-05-15 | dfe6862 | [260515-kiq-change-the-global-nestjs-validationpipe-](./quick/260515-kiq-change-the-global-nestjs-validationpipe-/) |

## Session Continuity

Last session: 2026-05-15T17:46:28Z
Stopped at: Completed quick task 260515-kiq: return all validation errors from global ValidationPipe
Resume file: None
