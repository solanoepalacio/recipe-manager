# Phase 17: Batch Ingredient Add - Context

**Gathered:** 2026-03-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 17 adds `POST /api/recipes/:id/sections/:sectionId/ingredients/batch` — an atomic endpoint that accepts an array of ingredients, inserts them all in a single transaction, computes correct `order` values (starting from current MAX), and returns the updated `SectionResponse` with fully hydrated `foodName` and `unitName` for every ingredient.

</domain>

<decisions>
## Implementation Decisions

### Service Implementation Details
- Transaction approach: interactive `prisma.$transaction(async tx => {...})` — allows conditional logic and FK error catching within the transaction body
- `SECTION_WITH_INGREDIENTS_INCLUDE` constant defined at module level in `ingredients.service.ts` — single-use, no reason to share
- Re-fetch after `createMany`: use `tx.ingredientSection.findUnique({ where: { id: sectionId }, include: SECTION_WITH_INGREDIENTS_INCLUDE })` — returns the full `SectionResponse` shape

### Error Handling
- FK failure (invalid foodId/unitId): throw `NotFoundException` with message `"Food ${foodId} not found"` — consistent with existing service patterns
- Section not found or wrong recipe: throw `NotFoundException` with same `"Section ${sectionId} not found"` message as single-create
- Empty ingredients array: treat as no-op — return current `SectionResponse` without any DB calls (empty array is valid)

### Test Strategy
- Unit tests: new `describe('batchCreate')` block added to existing `ingredients.service.spec.ts`
- Integration tests: new `recipes-batch-ingredient.integration-spec.ts` in `apps/api/integration_tests/` — Prisma-direct pattern same as Phase 16
- FK rollback test: seed a valid section, pass an invalid foodId, assert no ingredients were created (atomicity verified at Prisma level)

### Claude's Discretion
- Exact `@ApiOperation` summary wording on the batch endpoint
- `toSectionResponse` mapper reuse strategy (import from recipes.service or duplicate)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `IngredientsService.create()` — uses `_max: { order: true }` pattern; `batchCreate` replicates this for the starting order
- `toSectionResponse()` mapper in `recipes.service.ts` — maps `{ id, title, order, ingredients[] }` to `SectionResponse`; reuse or duplicate for batch response
- `BatchCreateIngredientsRequest` type already defined in `packages/shared/src/api/foods-units.ts` (Phase 15) — item shape: `{ foodId: string; unitId?: string; quantity?: number; note?: string }`
- `SectionResponse` interface in `packages/shared/src/api/recipes.ts` — `{ id, title, order, ingredients: IngredientResponse[] }`

### Established Patterns
- Ingredients controller at `@Controller('recipes/:id/sections/:sectionId/ingredients')` — batch route appended as `@Post('batch')`
- Household ownership verified via recipe ownership check before section lookup
- `recipeIngredient.create` includes `{ food: true, unit: true }` for hydration — `createMany` does NOT support include, so re-fetch is mandatory
- Integration tests use Prisma-direct, seed their own fixtures, no NestJS app boot

### Integration Points
- `apps/api/src/recipes/ingredients/ingredients.service.ts` — add `SECTION_WITH_INGREDIENTS_INCLUDE` const + `batchCreate` method
- `apps/api/src/recipes/ingredients/ingredients.controller.ts` — add `POST batch` route
- `apps/api/src/recipes/ingredients/dto/` — add `batch-create-ingredient.dto.ts`
- `apps/api/integration_tests/recipes-batch-ingredient.integration-spec.ts` — new file

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches for transaction and response shape.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
