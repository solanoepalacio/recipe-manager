# Phase 18: Compound Recipe Create - Context

**Gathered:** 2026-03-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 18 extends `POST /api/recipes` to accept optional `ingredients[]` and `steps[]` arrays, creating the complete recipe in a single atomic `$transaction`. A FK failure (invalid foodId/unitId) rolls back the entire recipe row — no orphaned records. Requests without arrays behave identically to the pre-v1.2 endpoint (backward compatible).

</domain>

<decisions>
## Implementation Decisions

### DTO Design
- Ingredient item DTO: reuse `BatchIngredientItemDto` from Phase 17 (same shape, no duplication) — import from `apps/api/src/recipes/ingredients/dto/batch-create-ingredient.dto.ts`
- Steps item DTO: new `CompoundStepItemDto` class with `@IsOptional() @IsString() title?: string` and `@IsString() body: string`
- Both new DTO classes defined in `create-recipe.dto.ts` (small, co-located)
- `CreateRecipeDto` extended with `@IsOptional() @IsArray() @ValidateNested({ each: true }) @Type()` decorators for both arrays

### Transaction Scope & Section Handling
- `generateUniqueSlug` runs OUTSIDE the `$transaction` — reads DB but no writes; avoids nested transaction complexity
- When `ingredients` are provided, they go into the default section `{ title: null, order: 0 }` using nested `{ create: [...] }` in the Prisma create call
- Always wrap `prisma.recipe.create` in `$transaction` — single code path, no conditional complexity

### Error Handling
- FK error from invalid foodId/unitId: throw `BadRequestException` with "Invalid ingredient data: food or unit not found" — creation context warrants 400 not 404
- Catch Prisma P2003 (FK constraint violation) inside the transaction and convert to `BadRequestException`

### Test Strategy
- Integration tests verify orphaned recipe row: assert `prisma.recipe.count()` is 0 after failed compound create (not just HTTP status)
- Backward-compat test: `POST /api/recipes` with no arrays creates recipe + default empty section (unchanged behavior)
- Success path test: compound create with ingredients + steps returns fully hydrated `RecipeDetailResponse`

### Claude's Discretion
- Exact `@ApiProperty` description wording for the new array fields
- Whether to add `@ApiExtraModels` to expose nested DTO schemas in Swagger

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `BatchIngredientItemDto` in `apps/api/src/recipes/ingredients/dto/batch-create-ingredient.dto.ts` — exact shape for compound ingredient items
- `RECIPE_INCLUDE` const in `recipes.service.ts` — reuse for post-transaction re-fetch
- `toRecipeDetailResponse()` mapper — returns `RecipeDetailResponse`, unchanged
- `generateUniqueSlug()` method — reads DB, must run before `$transaction`

### Established Patterns
- `prisma.recipe.create({ data: { ..., sections: { create: [{ title: null, order: 0 }] } } })` — current create pattern; extend sections[0] with `{ ingredients: { create: [...] } }`
- Interactive `$transaction(async tx => {...})` — established in Phase 17
- P2003 FK catch → named exception — established in Phase 17
- Integration tests: Prisma-direct, seed own fixtures, `apps/api/integration_tests/`

### Integration Points
- `apps/api/src/recipes/dto/create-recipe.dto.ts` — add `CompoundStepItemDto` + extend `CreateRecipeDto`
- `apps/api/src/recipes/recipes.service.ts` — wrap `create` in `$transaction`, handle ingredient/step nesting
- `apps/api/src/recipes/recipes.service.spec.ts` — add `describe('create — compound')` unit tests
- `apps/api/integration_tests/recipes-compound-create.integration-spec.ts` — new file

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
