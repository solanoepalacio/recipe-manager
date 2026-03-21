# Phase 15: Shared Types + Name Filters - Context

**Gathered:** 2026-03-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 15 delivers two things: (1) extend `packages/shared` with all four v1.2 type contracts (`FoodItem`, `UnitItem`, `BatchCreateIngredientsRequest`, extended `CreateRecipeRequest`), and (2) add optional `?name=` substring filter to `GET /api/foods` and `GET /api/units`. No schema migrations. All changes are purely additive.

</domain>

<decisions>
## Implementation Decisions

### Name Filter Behavior
- Empty string `?name=` returns the full list (treat as omitted) — consistent with "omitting param returns full list" spec
- Trim leading/trailing whitespace on name param before matching
- No max-length validation on `?name=` — Prisma/Postgres handles gracefully
- ILIKE pattern: `%name%` (contains substring) — matches "substring" language in spec

### FoodItem / UnitItem Type Shapes
- `FoodItem` = `{ id: string; name: string }` — matches current Prisma select
- `UnitItem` = `{ id: string; name: string; abbreviation: string | null }` — includes abbreviation (already returned by controller)
- Define both types in a new file: `packages/shared/src/api/foods-units.ts`
- `BatchCreateIngredientsRequest` item fields mirror `CreateIngredientRequest`: `{ foodId: string; unitId?: string; quantity?: number; note?: string }`

### Extended CreateRecipeRequest
- Inline `ingredients` array is flat (for default section) — simplest compound create; section nesting is Phase 18 detail
- Inline `steps` items shape: `{ title?: string; body: string }` — same as existing `CreateStepRequest` pattern
- No max batch size validation on `BatchCreateIngredientsRequest` — DB handles; order computed once (MAX) before batch per STATE.md decision
- All new fields on `CreateRecipeRequest` are optional — backward compatible; "existing single-field create unchanged" per spec

### Claude's Discretion
- Order field is auto-assigned (MAX + index), not accepted from client

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `CreateIngredientRequest` in `packages/shared/src/api/recipes.ts` — exact shape to reuse for batch item type
- `FoodsController.findAll()` — currently `prisma.food.findMany({ select: { id, name }, orderBy: name asc })`
- `UnitsController.findAll()` — currently `prisma.unit.findMany({ select: { id, name, abbreviation }, orderBy: name asc })`
- `packages/shared/src/index.ts` — add `export * from './api/foods-units'` after other exports

### Established Patterns
- Shared types live in `packages/shared/src/api/` with one file per domain
- Controllers inject `PrismaService` directly (no service layer for simple list endpoints)
- `@ApiQuery` decorator for optional query params; `@Query` for extracting from request
- NestJS `@Get()` with `@Query('name') name?: string` pattern for optional string params

### Integration Points
- `packages/shared/src/index.ts` — new export entry needed
- `apps/api/src/shared/foods.controller.ts` — add `?name=` filter
- `apps/api/src/shared/units.controller.ts` — add `?name=` filter
- `apps/api/src/main.ts` — verify `ValidationPipe({ transform: true, whitelist: true })` (per STATE.md blocker note)

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches for filter implementation and Swagger annotation.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
