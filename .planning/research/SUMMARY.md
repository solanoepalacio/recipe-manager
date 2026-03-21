# Project Research Summary

**Project:** API Ergonomics v1.2 — Recipe Manager
**Domain:** REST API ergonomics improvements for agent clients (NestJS + Prisma + PostgreSQL)
**Researched:** 2026-03-20
**Confidence:** HIGH

## Executive Summary

This milestone delivers four additive REST API improvements to the existing recipe manager backend, targeting agent client ergonomics. The changes are entirely at the service/controller/DTO layer — no schema migrations, no new infrastructure, and no new npm packages required. All four patterns (case-insensitive Prisma filters, nested creates, UUID/slug detection, `$transaction` batch inserts) are already in use elsewhere in the codebase; the work is extending proven patterns to new endpoints.

The recommended implementation order is: shared package types first, then name filters (simplest, no side effects), then slug/UUID lookup (isolated service method), then batch ingredient add, and finally compound recipe create (largest change, requires the shared type update). All four changes are P1 for this milestone. Compound create and slug lookup together unlock the primary agent workflow and deliver the most agent value per implementation effort.

The two non-trivial risks are: (1) transaction atomicity for compound create — partial inserts on failure leave orphaned recipe rows unless the entire create is wrapped in `prisma.$transaction`; and (2) the household scoping invariant on slug lookup — the slug branch must include `householdId` in the Prisma `where` predicate, not as a post-query ownership check, or a 403 leaks slug existence to other households. Both risks are well-understood, straightforward to test, and documented with specific prevention strategies.

## Key Findings

### Recommended Stack

All required capabilities are available in the currently installed package versions. No additions to `package.json` are needed. The key packages are Prisma 6.19.2 (for `contains`/`mode: 'insensitive'`, `$transaction`, `createMany`, `findFirst`), class-validator 0.14.4 and class-transformer 0.5.1 (for `@ValidateNested({ each: true })` + `@Type()` on nested DTO arrays), and `@nestjs/swagger` 8.1.x (for `@ApiProperty({ type: [ClassName] })` on array bodies). One configuration check is required before implementation: verify that `apps/api/src/main.ts` registers `ValidationPipe` with `transform: true` and `whitelist: true` — without `transform: true`, nested array DTO validation silently fails at runtime.

**Core technologies:**
- `@prisma/client` 6.19.2: data access — `contains`/`mode: 'insensitive'` for name filter; `$transaction` + `createMany` for batch/compound writes; `findFirst` for slug lookup
- `class-validator` 0.14.4 + `class-transformer` 0.5.1: request validation — `@ValidateNested({ each: true })` + `@Type()` for inline ingredient/step arrays in compound create and batch DTO
- `@nestjs/swagger` 8.1.x: OpenAPI documentation — `@ApiQuery`, `@ApiProperty({ type: [ClassName] })` for all new params and array bodies
- `packages/shared` (`@recipe-manager/shared`): API contract enforcement — `CreateRecipeRequest` must be extended for compound create; new `FoodItem`, `UnitItem`, `BatchCreateIngredientsRequest` interfaces needed

### Expected Features

All four features are in scope for v1.2. There are no deferred features — every item below is required for agent ergonomics.

**Must have (table stakes):**
- `?name=` case-insensitive substring filter on `GET /api/foods` — agents cannot reliably guess exact food names from a catalog of Spanish ingredient names
- `?name=` case-insensitive substring filter on `GET /api/units` — same rationale; consistent pattern with foods
- Compound recipe create (`POST /api/recipes` with optional `ingredients[]` and `steps[]`) — eliminates 8+ sequential API calls for the most common agent workflow
- Slug/UUID dual lookup (`GET /api/recipes/:idOrSlug`) — enables stateless agent navigation by recipe name without maintaining a UUID cache between sessions
- Batch ingredient add (`POST /api/recipes/:id/sections/:sectionId/ingredients/batch`) — eliminates N sequential calls for the edit-ingredients workflow

**Should have (differentiators for this milestone):**
- Strict FK error conversion (Prisma P2003 → 422 with field/index context) — differentiates from a generic 500 and enables agent self-correction on invalid `foodId`/`unitId`

**Defer (anti-features — explicitly out of scope):**
- Server-side filtering in the UI's `IngredientPicker` — the UI must continue fetching the full food/unit list and filtering locally; `?name=` is agent-only in this milestone
- Upsert semantics on batch insert — strict insert only; agents must manage their own state
- Slug lookup across all households — household isolation is an invariant; cross-household slug access must return 404

### Architecture Approach

All four changes fit within existing module boundaries. No new NestJS modules, no new services for Foods/Units (the direct-Prisma pattern in those controllers is intentional — these are thin global catalogs with no household scoping). The main structural additions are: a `findByIdOrSlug` method in `RecipesService` (replaces `findOne` in the controller), expansion of `RecipesService.create` to handle nested ingredients/steps inside a `prisma.$transaction`, a new `batchCreate` method in `IngredientsService`, a new `batch-create-ingredient.dto.ts` file, and an export of `toSectionResponse` from `recipes.service.ts` so `IngredientsService` can use it for the batch response.

**Major components:**
1. `packages/shared/src/api/recipes.ts` — extend `CreateRecipeRequest`; add `FoodItem`, `UnitItem`, `BatchCreateIngredientsRequest` interfaces; this is the first thing to change so TypeScript enforces the contract from the start
2. `FoodsController` / `UnitsController` — add `@Query('name')` param and conditional `where` clause inline (no service layer extraction needed)
3. `RecipesService.findByIdOrSlug` — new method with UUID v4 regex detection; slug branch uses `findFirst({ where: { householdId, slug } })`; UUID branch uses existing `findFirst({ where: { id } })` + post-check
4. `RecipesService.create` — wrap in `prisma.$transaction(async (tx) => {...})`; add `tx.recipeIngredient.createMany` and `tx.recipeStep.createMany` when arrays are present; re-fetch with `RECIPE_INCLUDE` at end of transaction
5. `IngredientsService.batchCreate` + `IngredientsController` `POST batch` route — compute `startOrder` once, use `createMany`, re-fetch section with full ingredient include + `orderBy: { order: 'asc' }`

### Critical Pitfalls

1. **Compound create partial insert without transaction** — if ingredient/step inserts are added after `prisma.recipe.create` outside a `$transaction`, any FK failure leaves an orphaned recipe row. Prevention: wrap the entire compound create in `prisma.$transaction(async (tx) => {...})` from the start; do not call `prisma.recipe.create` followed by separate `prisma.recipeIngredient.createMany` calls outside a transaction.

2. **Slug path missing `householdId` in `where` predicate** — using `findFirst({ where: { slug } })` and then checking `householdId` post-fetch returns 403 for a cross-household slug hit, leaking slug existence. Prevention: slug branch must be `findFirst({ where: { slug, householdId } })`; a null result is always 404.

3. **Batch ingredient order collision when appending to non-empty section** — reusing `IngredientsService.create` in a loop (or running concurrent `MAX(order)` queries) produces duplicate order values. Prevention: compute `startOrder = MAX(order) ?? -1` once before the batch, assign `startOrder + index + 1` per item, use `createMany` for a single-query insert.

4. **Batch response missing `foodName`/`unitName`** — `createMany` returns `{ count: N }`, not the created rows. A re-fetch without the full ingredient join produces `foodName: undefined` — a silent visual regression in the UI's ingredient list. Prevention: define `SECTION_WITH_INGREDIENTS_INCLUDE` with `ingredients: { include: { food: true, unit: true }, orderBy: { order: 'asc' } }` and use it for every standalone section fetch.

5. **`CreateRecipeRequest` widening breaking UI call sites** — adding required or incorrectly-typed fields to the shared interface causes TypeScript errors in `apps/web`. Prevention: both new array fields must be `optional` (`ingredients?: ...`, `steps?: ...`); run the full TypeScript build in `apps/web` after any `packages/shared` change before proceeding.

## Implications for Roadmap

Based on research, the dependency graph and risk profile suggest four phases matching the four changes, with a zeroth step for shared types:

### Phase 1: Shared Package and Name Filters
**Rationale:** The shared package update must precede compound create (Change 2) to avoid a TypeScript build failure midway through. The name filters (Change 1) are the lowest-risk changes — additive query params, no new files, no shared type impact — making them ideal for validating the dev environment and the `?name=` query pattern before the more complex changes.
**Delivers:** `GET /api/foods?name=` and `GET /api/units?name=` working with case-insensitive substring match; `packages/shared` extended with `FoodItem`, `UnitItem`, `BatchCreateIngredientsRequest`, and the optional `ingredients`/`steps` arrays on `CreateRecipeRequest`.
**Addresses:** Name filter features; shared contract for all subsequent changes.
**Avoids:** TypeScript compilation failures in `apps/web` from incremental shared type updates; inadvertent `IngredientPicker` modification (add a code comment to `IngredientPicker.tsx` at this phase).

### Phase 2: Slug/UUID Dual Lookup
**Rationale:** Entirely self-contained — no DTO changes, no shared type changes, one new private helper (`isUuid`) and one new service method (`findByIdOrSlug`). Isolated changes are lower risk and easier to review. The security invariant (household-scoped slug lookup) should be integration-tested before the larger compound create work begins.
**Delivers:** `GET /api/recipes/:idOrSlug` accepting both UUID and slug identifiers; strict v4 UUID regex; household-scoped slug branch returning 404 (not 403) on cross-household miss.
**Avoids:** Information leak via 403 vs 404 on slug path; UUID false positives from loose regex.

### Phase 3: Batch Ingredient Add
**Rationale:** Requires only the `toSectionResponse` export (a one-line change) and a new DTO file — lower scope than compound create. Establishes the `SECTION_WITH_INGREDIENTS_INCLUDE` constant and `batchCreate` service method that are reusable patterns. Must be tested with a non-empty section to catch the order-appending edge case before compound create testing.
**Delivers:** `POST /api/recipes/:id/sections/:sectionId/ingredients/batch` accepting an array of ingredients, returning `SectionResponse` with correct `order` values and fully hydrated `foodName`/`unitName`.
**Avoids:** Order collision from reusing single-ingredient service in a loop; missing `orderBy` on section re-fetch; incomplete `SectionResponse` with undefined food/unit names.

### Phase 4: Compound Recipe Create
**Rationale:** The most complex change — wraps `RecipesService.create` in `prisma.$transaction`, extends `CreateRecipeDto` with nested array validation, and produces a fully hydrated `RecipeDetailResponse`. Placed last because it touches the most critical service method and requires all prior phases (shared types, transaction patterns established by batch create, validation pipe confirmation) to be in place.
**Delivers:** `POST /api/recipes` accepting optional `ingredients[]` and `steps[]`; atomic creation with full rollback on FK failure; `RecipeDetailResponse` with populated sections/ingredients/steps in a single API call (reduces 8+ agent calls to 1).
**Avoids:** Partial recipe rows on failure; `@ValidateNested` silently skipping nested arrays if `transform: true` is missing from `ValidationPipe`; shared type widening breaking the UI build.

### Phase Ordering Rationale

- Shared types first because `CreateRecipeRequest` must compile before Change 2 is implemented — TypeScript will enforce the contract at every step.
- Simple changes (name filter, slug lookup) before complex changes (compound create, batch insert) — validates environment and patterns with minimal risk.
- Batch insert (Change 4) before compound create (Change 2) because it establishes `SECTION_WITH_INGREDIENTS_INCLUDE` and the `$transaction` pattern at smaller scale; compound create reuses both.
- Change 2 last because `RecipesService.create` is the most business-critical method in the API; it must be changed only after all supporting patterns are proven.

### Research Flags

Phases likely needing no additional research — all patterns are well-documented in the codebase and all package capabilities are confirmed:
- **Phase 1 (Name filters):** Standard Prisma `contains`/`mode: 'insensitive'` — already in use in `RecipesService.findAll`; no research needed.
- **Phase 2 (Slug lookup):** UUID v4 regex is a single well-known pattern; `findFirst` with compound `where` is standard Prisma; no research needed.
- **Phase 3 (Batch insert):** `$transaction` + `createMany` pattern is confirmed in codebase; no research needed.
- **Phase 4 (Compound create):** Nested Prisma create pattern is confirmed in `RecipesService.duplicate`; no research needed.

One item to verify before Phase 4 begins: confirm `apps/api/src/main.ts` has `ValidationPipe({ transform: true, whitelist: true })` — if `transform: true` is missing, `@ValidateNested({ each: true })` silently fails on nested array DTOs. This is a one-line check, not a research task.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All package versions verified directly from `node_modules`; all required API surfaces (Prisma `createMany`, `$transaction`, `contains`/`mode`) are confirmed stable since Prisma 4 |
| Features | HIGH | Spec fully defined in `plans/03_api-ergonomics/api-ergonomics.md`; all four changes are unambiguous; response shapes confirmed from existing shared types |
| Architecture | HIGH | All findings from direct codebase inspection; no inferred patterns — every pattern (`toSectionResponse`, `RECIPE_INCLUDE`, `duplicate` nested create) verified by reading the actual source |
| Pitfalls | HIGH | All pitfalls derived from direct source inspection of existing service methods; security and ordering pitfalls verified against existing query patterns and shared type definitions |

**Overall confidence:** HIGH

### Gaps to Address

- **`ValidationPipe` configuration:** Verify `main.ts` has `transform: true` before implementing Change 2 and Change 4. Not a gap in the design — just a runtime config check that blocks silent validation failures. Cost: 30 seconds; consequence of skipping: `@ValidateNested` on nested DTOs silently passes invalid data.
- **Accent-insensitive matching:** Postgres `ILIKE` with `contains` is locale-aware but not guaranteed accent-insensitive for Spanish food names (e.g., `huevo` vs `huevó`). The spec does not require accent folding, but if the food catalog grows with accented names the filter may surprise agent clients. This is a known limitation, not a blocker — document it in the implementation.
- **Swagger documentation:** All four changes produce new query params and request body shapes. Swagger `@ApiQuery`, `@ApiProperty`, and `@ApiOperation` decorators must be added for each — this is easy to forget and will leave the Swagger UI incomplete. Add it to the definition of done for each phase.

## Sources

### Primary (HIGH confidence)

- `apps/api/src/recipes/recipes.service.ts` — confirmed `contains`/`mode: 'insensitive'` pattern, nested create in `duplicate`, `findAndVerifyOwnership`, `toSectionResponse`, `RECIPE_INCLUDE`
- `apps/api/src/recipes/ingredients/ingredients.service.ts` — confirmed `MAX(order) + 1` pattern and ownership verification
- `apps/api/src/shared/foods.controller.ts`, `units.controller.ts` — confirmed current no-param structure and direct Prisma injection
- `apps/web/src/components/recipes/editor/IngredientPicker.tsx` — confirmed full-list fetch + local filter pattern (no server-side filtering)
- `apps/web/src/lib/query-keys.ts` — confirmed fixed cache keys for foods and units
- `packages/shared/src/api/recipes.ts` — confirmed `CreateRecipeRequest`, `SectionResponse`, `IngredientResponse`, `RecipeDetailResponse` type definitions
- `apps/api/package.json` + `node_modules` — confirmed all installed package versions
- `apps/api/prisma/schema.prisma` — confirmed `@@unique([householdId, slug])` index and FK nullability
- `plans/03_api-ergonomics/api-ergonomics.md` — primary spec defining all four changes

### Secondary (MEDIUM confidence)

- NestJS route ordering behavior (literal before param) — inferred from existing `reorder` route comment in `IngredientsController`; HIGH confidence from codebase evidence

---
*Research completed: 2026-03-20*
*Ready for roadmap: yes*
