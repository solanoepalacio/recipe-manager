# Phase 18: Compound Recipe Create - Research

**Researched:** 2026-03-21
**Domain:** NestJS / Prisma atomic transaction, DTO extension, class-validator nested validation
**Confidence:** HIGH

## Summary

Phase 18 extends `POST /api/recipes` to accept optional `ingredients[]` and `steps[]` arrays in a single atomic `$transaction`. All design decisions are locked in CONTEXT.md. The codebase has already proven every required pattern in Phases 16 and 17: `$transaction(async tx => {...})` in `IngredientsService.batchCreate`, P2003 catch → named exception, and deeply nested Prisma `create` in `RecipesService.duplicate`. No new packages are needed.

The work is a straightforward extension of two existing files: `create-recipe.dto.ts` (add two new DTO classes and extend `CreateRecipeDto`) and `recipes.service.ts` (wrap `create` in `$transaction` with conditional ingredient/step nesting). The `duplicate` method already demonstrates the exact Prisma nested-create shape that compound create will use.

**Primary recommendation:** Copy the `$transaction` + P2003 catch pattern from `IngredientsService.batchCreate` and the nested `sections[0].ingredients.create` + `steps.create` shape from `RecipesService.duplicate`. These are the canonical references — no research into alternatives is needed.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**DTO Design**
- Ingredient item DTO: reuse `BatchIngredientItemDto` from Phase 17 (same shape, no duplication) — import from `apps/api/src/recipes/ingredients/dto/batch-create-ingredient.dto.ts`
- Steps item DTO: new `CompoundStepItemDto` class with `@IsOptional() @IsString() title?: string` and `@IsString() body: string`
- Both new DTO classes defined in `create-recipe.dto.ts` (small, co-located)
- `CreateRecipeDto` extended with `@IsOptional() @IsArray() @ValidateNested({ each: true }) @Type()` decorators for both arrays

**Transaction Scope & Section Handling**
- `generateUniqueSlug` runs OUTSIDE the `$transaction` — reads DB but no writes; avoids nested transaction complexity
- When `ingredients` are provided, they go into the default section `{ title: null, order: 0 }` using nested `{ create: [...] }` in the Prisma create call
- Always wrap `prisma.recipe.create` in `$transaction` — single code path, no conditional complexity

**Error Handling**
- FK error from invalid foodId/unitId: throw `BadRequestException` with "Invalid ingredient data: food or unit not found" — creation context warrants 400 not 404
- Catch Prisma P2003 (FK constraint violation) inside the transaction and convert to `BadRequestException`

**Test Strategy**
- Integration tests verify orphaned recipe row: assert `prisma.recipe.count()` is 0 after failed compound create (not just HTTP status)
- Backward-compat test: `POST /api/recipes` with no arrays creates recipe + default empty section (unchanged behavior)
- Success path test: compound create with ingredients + steps returns fully hydrated `RecipeDetailResponse`

### Claude's Discretion
- Exact `@ApiProperty` description wording for the new array fields
- Whether to add `@ApiExtraModels` to expose nested DTO schemas in Swagger

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ERGO-03 | User can create a recipe with inline ingredients and steps in a single request (`POST /api/recipes` with optional `ingredients[]` + `steps[]`) — all inserted atomically; existing single-field create unchanged | Prisma nested create + `$transaction` pattern confirmed from `duplicate` method; P2003 catch confirmed from `batchCreate`; `ValidationPipe({ transform: true })` already in `main.ts` so `@ValidateNested` will work |
</phase_requirements>

## Standard Stack

### Core (no new packages needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@nestjs/common` | already installed | `BadRequestException`, `Injectable`, decorators | Project standard |
| `class-validator` | already installed | `@IsOptional`, `@IsArray`, `@ValidateNested`, `@IsString` | Project standard; every DTO uses it |
| `class-transformer` | already installed | `@Type(() => ...)` — required for `@ValidateNested` on nested objects | Already used in `BatchCreateIngredientsDto` |
| `@nestjs/swagger` | already installed | `@ApiProperty`, `@ApiPropertyOptional` | Every DTO has `@ApiProperty` decorators |
| `@prisma/client` | already installed | `Prisma.PrismaClientKnownRequestError`, `$transaction` | Project standard |

**No `npm install` required.** All dependencies are already present.

### Pre-condition Verified

`main.ts` already has `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })`. The STATE.md blocker ("verify transform: true before Phase 18 execution") is **resolved** — confirmed by reading the file directly. `@ValidateNested({ each: true })` will work without modification.

## Architecture Patterns

### Recommended Project Structure

No new files or directories. Changes touch:

```
apps/api/src/recipes/
├── dto/
│   └── create-recipe.dto.ts          # ADD CompoundStepItemDto + extend CreateRecipeDto
└── recipes.service.ts                 # MODIFY create() to use $transaction + nesting

apps/api/src/recipes/ingredients/dto/
└── batch-create-ingredient.dto.ts    # READ ONLY — import BatchIngredientItemDto from here

apps/api/integration_tests/
└── recipes-compound-create.integration-spec.ts   # NEW file

apps/api/src/recipes/
└── recipes.service.spec.ts           # ADD describe('create — compound') block
```

### Pattern 1: Reusing BatchIngredientItemDto (import, not duplicate)

**What:** Import `BatchIngredientItemDto` from the Phase 17 location. Do NOT copy the class.
**When to use:** Any time the compound ingredient item shape is needed.

```typescript
// In create-recipe.dto.ts
import { BatchIngredientItemDto } from '../ingredients/dto/batch-create-ingredient.dto';
```

This is the locked decision. The DTO already has `@IsString() foodId`, `@IsOptional() @IsString() unitId?`, `@IsOptional() @IsNumber() @Min(0) quantity?`, and `@IsOptional() @IsString() note?`.

### Pattern 2: CompoundStepItemDto (new, co-located)

**What:** New class defined at top of `create-recipe.dto.ts` before `CreateRecipeDto`.

```typescript
// Source: CONTEXT.md locked decision
export class CompoundStepItemDto {
  @ApiPropertyOptional({ description: 'Optional step title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ description: 'Step instructions' })
  @IsString()
  body: string;
}
```

### Pattern 3: Extending CreateRecipeDto with optional arrays

**What:** Add two optional array fields to `CreateRecipeDto` using the full decorator chain required for nested validation.

```typescript
// Source: CONTEXT.md locked decision + BatchCreateIngredientsDto pattern
@ApiPropertyOptional({
  type: [BatchIngredientItemDto],
  description: 'Inline ingredients for the default section (optional)',
})
@IsOptional()
@IsArray()
@ValidateNested({ each: true })
@Type(() => BatchIngredientItemDto)
ingredients?: BatchIngredientItemDto[];

@ApiPropertyOptional({
  type: [CompoundStepItemDto],
  description: 'Inline steps (optional)',
})
@IsOptional()
@IsArray()
@ValidateNested({ each: true })
@Type(() => CompoundStepItemDto)
steps?: CompoundStepItemDto[];
```

**Critical:** `@Type(() => ClassName)` is mandatory for `@ValidateNested` to instantiate the nested class. Without it, `class-transformer` passes a plain object and validation silently passes even with invalid data.

### Pattern 4: $transaction wrapping create (from duplicate method)

**What:** The `create` method always uses `$transaction`. `generateUniqueSlug` runs before the transaction (read-only, no writes). Inside the transaction, the `prisma.recipe.create` call uses nested `create` for sections, ingredients (if provided), and steps (if provided).

```typescript
// Source: recipes.service.ts duplicate() method (confirmed pattern)
async create(userId: string, householdId: string, dto: CreateRecipeDto): Promise<RecipeDetailResponse> {
  const slug = await this.generateUniqueSlug(dto.name, householdId); // outside tx

  try {
    const recipe = await this.prisma.$transaction(async (tx: any) => {
      return tx.recipe.create({
        data: {
          householdId,
          createdById: userId,
          name: dto.name,
          slug,
          // ... other scalar fields ...
          sections: {
            create: [{
              title: null,
              order: 0,
              ...(dto.ingredients?.length
                ? {
                    ingredients: {
                      create: dto.ingredients.map((item, i) => ({
                        foodId: item.foodId,
                        unitId: item.unitId ?? null,
                        quantity: item.quantity ?? null,
                        note: item.note ?? null,
                        order: i,
                      })),
                    },
                  }
                : {}),
            }],
          },
          ...(dto.steps?.length
            ? {
                steps: {
                  create: dto.steps.map((step, i) => ({
                    title: step.title ?? null,
                    body: step.body,
                    order: i,
                  })),
                },
              }
            : {}),
        },
        include: RECIPE_INCLUDE,
      });
    });
    return toRecipeDetailResponse(recipe);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2003'
    ) {
      throw new BadRequestException('Invalid ingredient data: food or unit not found');
    }
    throw error;
  }
}
```

Note: `BadRequestException` must be added to the import from `@nestjs/common`. Error message is the exact string from CONTEXT.md.

### Pattern 5: P2003 catch → BadRequestException

**What:** FK violation during `prisma.recipe.create` (invalid `foodId` or `unitId`) throws Prisma error code `'P2003'`. Catch it and convert to `BadRequestException`.

**Why 400 not 404:** CONTEXT.md decision: creation context warrants 400 (the request body is invalid), not 404 (resource not found at a known address).

Reference implementation in this codebase: `IngredientsService.batchCreate` lines 136–145 in `apps/api/src/recipes/ingredients/ingredients.service.ts`. Phase 18 uses `BadRequestException` where Phase 17 used `NotFoundException` — the difference is intentional and locked.

### Anti-Patterns to Avoid

- **Conditional transaction path:** Do NOT have one code path that calls `prisma.recipe.create` directly (no arrays) and another that uses `$transaction`. Always use `$transaction` — single code path, simpler maintenance.
- **Running generateUniqueSlug inside the transaction:** It reads the DB but does no writes. Nested transactions in Prisma interactive transactions can cause issues. Keep it outside.
- **Copying BatchIngredientItemDto:** Import it. If the shape ever changes in Phase 17's DTO, compound create gets the update for free.
- **Forgetting `@Type(() => ClassName)`:** `@ValidateNested({ each: true })` without `@Type` does nothing. The nested DTOs will not be instantiated and validation passes silently for malformed input.
- **Using `prisma.recipe.count()` to verify rollback without scoping to householdId:** The integration test should scope the count to the test household to avoid false negatives from other test data.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Atomic recipe + ingredient + step insert | Manual sequential creates with rollback logic | Prisma `$transaction(async tx => {...})` | Built-in rollback on any exception; already proven in this codebase |
| Nested DTO class validation | Manual `if` checks on array items | `@ValidateNested({ each: true }) + @Type()` | class-validator/class-transformer handles deep validation with proper error messages |
| FK violation detection | Try/catch on all errors | Prisma P2003 error code | Precise, only catches FK violations not other DB errors |
| Post-transaction re-fetch | Second query after create | Prisma `include: RECIPE_INCLUDE` on the create call itself | Prisma returns fully hydrated data in the same round trip |

**Key insight:** Prisma's nested `create` within `recipe.create` is the right tool — it generates a single SQL statement with CTE (common table expression) that Postgres executes atomically, which is exactly the FK rollback guarantee required.

## Common Pitfalls

### Pitfall 1: Missing `isLocked` field in mock recipe objects

**What goes wrong:** Unit tests fail with `undefined` for `isLocked` in `RecipeDetailResponse`.
**Why it happens:** `toRecipeDetailResponse` reads `recipe.isLocked ?? false`. Mock objects in `recipes.service.spec.ts` created before Phase 12 (when `isLocked` was added) may be missing this field.
**How to avoid:** Include `isLocked: false` in all new mock recipe objects in the `describe('create — compound')` block.
**Warning signs:** `result.isLocked` is `undefined` instead of `false` in test assertions.

### Pitfall 2: Spreading undefined into sections.create

**What goes wrong:** When `dto.ingredients` is `undefined` (not provided), the spread `...(dto.ingredients?.length ? {...} : {})` returns `{}` which is fine. But if the check is `dto.ingredients` (without `?.length`), an empty array `[]` (which is falsy? No — arrays are truthy) would still produce an empty `create: []`, which Prisma accepts but wastes a round trip. Using `?.length` correctly handles both `undefined` and `[]`.
**How to avoid:** Use `dto.ingredients?.length` not just `dto.ingredients` as the condition.

### Pitfall 3: Wrong error type for P2003

**What goes wrong:** Throwing `NotFoundException` (Phase 17 pattern) instead of `BadRequestException` for the compound create case.
**Why it happens:** Copy-paste from `IngredientsService.batchCreate` without noticing the CONTEXT.md decision to use 400 for creation context.
**How to avoid:** The catch block must import and use `BadRequestException`. Message: `'Invalid ingredient data: food or unit not found'`.
**Warning signs:** Integration test for invalid foodId receives 404 instead of 400.

### Pitfall 4: `$transaction` not added to mockPrisma in unit tests

**What goes wrong:** Unit tests fail with `TypeError: this.prisma.$transaction is not a function`.
**Why it happens:** `mockPrisma` in `recipes.service.spec.ts` only mocks `recipe.*` methods, not `$transaction`.
**How to avoid:** Add `$transaction: jest.fn()` to `mockPrisma` and implement it to call through: `mockPrisma.$transaction.mockImplementation(async (fn) => fn(mockPrisma))`.
**Warning signs:** Tests that call `service.create(...)` throw `TypeError` rather than assertion errors.

### Pitfall 5: Swagger not showing nested DTO schemas

**What goes wrong:** `POST /api/recipes` in Swagger UI shows `ingredients` as `object[]` instead of showing the `BatchIngredientItemDto` schema with its properties.
**Why it happens:** Swagger needs to know about the nested DTO type. Using `type: [BatchIngredientItemDto]` in `@ApiPropertyOptional` usually works, but for imported types Swagger may need `@ApiExtraModels`.
**How to avoid:** Add `@ApiExtraModels(BatchIngredientItemDto, CompoundStepItemDto)` decorator on the controller or the DTO class if Swagger inspection shows bare `object` types. This is Claude's discretion per CONTEXT.md.
**Warning signs:** Swagger UI shows `{}` or `object` instead of the typed schema for array items.

## Code Examples

### Integration test structure (modeled on recipes-batch-ingredient.integration-spec.ts)

```typescript
// Source: apps/api/integration_tests/recipes-batch-ingredient.integration-spec.ts pattern

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

describe('ERGO-03: Compound recipe create — Prisma integration', () => {
  let householdId: string;
  let userId: string;
  let foodId: string;
  let unitId: string;

  beforeAll(async () => {
    const household = await prisma.household.create({ data: { name: 'Compound Create Test HH' } });
    householdId = household.id;
    const user = await prisma.user.create({
      data: {
        email: 'compound-create-test@test.com',
        passwordHash: await bcrypt.hash('test', 10),
        name: 'Compound Test User',
        householdId,
        gender: 'other',
        dateOfBirth: new Date('1990-01-01'),
      },
    });
    userId = user.id;
    const food = await prisma.food.create({ data: { name: 'Tomate Compound Test' } });
    foodId = food.id;
    const unit = await prisma.unit.create({ data: { name: 'gramo compound', abbreviation: 'g' } });
    unitId = unit.id;
  });

  afterAll(async () => {
    // clean up in reverse dependency order
    await prisma.$disconnect();
  });

  it('backward-compat: no arrays creates recipe with default empty section', async () => {
    // ...
  });

  it('success: compound create with ingredients and steps returns hydrated RecipeDetailResponse', async () => {
    // ...
  });

  it('FK rollback: invalid foodId leaves no orphaned recipe row', async () => {
    const countBefore = await prisma.recipe.count({ where: { householdId } });
    // attempt compound create with invalid foodId
    // ...
    const countAfter = await prisma.recipe.count({ where: { householdId } });
    expect(countAfter).toBe(countBefore); // no orphaned row
  });
});
```

### Unit test additions to recipes.service.spec.ts

```typescript
// In mockPrisma, add:
$transaction: jest.fn(),

// In beforeEach, the mockPrisma.$transaction.mockImplementation pattern:
mockPrisma.$transaction.mockImplementation(async (fn: any) => fn(mockPrisma));

// describe block:
describe('create — compound', () => {
  it('passes ingredients to nested section create', async () => { ... });
  it('passes steps to recipe create', async () => { ... });
  it('empty arrays behave same as no arrays', async () => { ... });
  it('throws BadRequestException on P2003 error', async () => { ... });
});
```

### Prisma nested create shape (from duplicate() — confirmed working)

```typescript
// Source: apps/api/src/recipes/recipes.service.ts lines 343–367
sections: {
  create: original.sections.map((s, si) => ({
    title: s.title,
    order: si,
    ingredients: {
      create: s.ingredients.map((ing, ii) => ({
        foodId: ing.foodId,
        unitId: ing.unitId,
        quantity: ing.quantity,
        note: ing.note,
        order: ii,
      })),
    },
  })),
},
steps: {
  create: original.steps.map((step, i) => ({
    title: step.title,
    body: step.body,
    order: i,
  })),
},
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Sequential creates outside transaction | Single `prisma.recipe.create` with nested relations | Prisma v3+ | FK failures roll back entire create; no orphaned rows |
| ValidationPipe without `transform: true` | ValidationPipe with `transform: true, whitelist: true` | Phase 15-01 | `@ValidateNested` actually instantiates nested DTO classes |

**Deprecated/outdated:**
- Separate `prisma.recipe.create` + `prisma.ingredientSection.create` calls: replaced by nested `sections.create` in Phase 4. The `duplicate` method is the definitive example.

## Open Questions

1. **Whether `@ApiExtraModels` is needed for Swagger schema exposure**
   - What we know: `@ApiPropertyOptional({ type: [BatchIngredientItemDto] })` usually registers the schema, but imported DTOs from other modules sometimes need explicit `@ApiExtraModels` on the controller.
   - What's unclear: Whether NestJS Swagger introspection will follow the import chain automatically.
   - Recommendation: Implement without `@ApiExtraModels` first; check the Swagger UI `/api/docs` after implementation and add if the array items show as bare `{}` objects. This is Claude's discretion per CONTEXT.md.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest 29 + ts-jest |
| Config file | `apps/api/jest.config.ts` (unit) / `apps/api/jest-integration.config.ts` (integration) |
| Quick run command | `cd apps/api && yarn test --testPathPattern="recipes.service.spec"` |
| Full suite command | `cd apps/api && yarn test` |
| Integration run | `cd apps/api && yarn test:integration --testPathPattern="recipes-compound-create"` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ERGO-03 | Compound create (ingredients + steps) returns hydrated `RecipeDetailResponse` | integration | `cd apps/api && yarn test:integration --testPathPattern="recipes-compound-create"` | No — Wave 0 |
| ERGO-03 | FK failure (invalid foodId) rolls back entire recipe row | integration | same | No — Wave 0 |
| ERGO-03 | No arrays = backward-compatible behavior (default empty section) | integration | same | No — Wave 0 |
| ERGO-03 | DTO validation rejects missing `body` on steps | unit | `cd apps/api && yarn test --testPathPattern="recipes.service.spec"` | Partial — new describe block needed |

### Sampling Rate
- **Per task commit:** `cd apps/api && yarn test --testPathPattern="recipes.service.spec"`
- **Per wave merge:** `cd apps/api && yarn test && yarn test:integration`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `apps/api/integration_tests/recipes-compound-create.integration-spec.ts` — covers ERGO-03 (all three behaviors above)
- [ ] `describe('create — compound')` block in `recipes.service.spec.ts` — unit coverage for P2003 throw, nested shape, empty-array handling

## Sources

### Primary (HIGH confidence)
- `apps/api/src/recipes/recipes.service.ts` — confirmed `duplicate()` nested create pattern; confirmed `RECIPE_INCLUDE` const; confirmed `generateUniqueSlug` is read-only
- `apps/api/src/recipes/ingredients/ingredients.service.ts` — confirmed `$transaction(async tx => {...})` interactive pattern; confirmed P2003 catch block structure
- `apps/api/src/recipes/dto/create-recipe.dto.ts` — confirmed current `CreateRecipeDto` shape and import pattern
- `apps/api/src/recipes/ingredients/dto/batch-create-ingredient.dto.ts` — confirmed `BatchIngredientItemDto` exact shape and decorator chain
- `apps/api/src/main.ts` — confirmed `transform: true` in `ValidationPipe`; STATE.md blocker is resolved
- `packages/shared/src/api/recipes.ts` — confirmed `CreateRecipeRequest` already has `ingredients?` and `steps?` arrays (added in Phase 15-01)
- `apps/api/integration_tests/recipes-batch-ingredient.integration-spec.ts` — confirmed integration test structure, seed pattern, FK rollback test pattern

### Secondary (MEDIUM confidence)
- `.planning/STATE.md` — decision log confirming transaction strategy and blocker status
- `.planning/phases/18-compound-recipe-create/18-CONTEXT.md` — all locked decisions

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages are already in the project; versions confirmed by reading package.json
- Architecture: HIGH — patterns confirmed by reading actual source files in this codebase, not external documentation
- Pitfalls: HIGH — derived from reading actual implementation files and test patterns in this codebase

**Research date:** 2026-03-21
**Valid until:** 2026-04-21 (stable — no external dependencies changing)
