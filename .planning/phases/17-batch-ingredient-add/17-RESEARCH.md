# Phase 17: Batch Ingredient Add - Research

**Researched:** 2026-03-21
**Domain:** NestJS + Prisma — batch insert with transaction, order computation, hydrated response
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Transaction approach:** Interactive `prisma.$transaction(async tx => {...})` — allows conditional logic and FK error catching within the transaction body.

**SECTION_WITH_INGREDIENTS_INCLUDE constant:** Defined at module level in `ingredients.service.ts` — single-use, no reason to share.

**Re-fetch after createMany:** Use `tx.ingredientSection.findUnique({ where: { id: sectionId }, include: SECTION_WITH_INGREDIENTS_INCLUDE })` — returns the full `SectionResponse` shape.

**FK failure (invalid foodId/unitId):** Throw `NotFoundException` with message `"Food ${foodId} not found"` — consistent with existing service patterns.

**Section not found or wrong recipe:** Throw `NotFoundException` with same `"Section ${sectionId} not found"` message as single-create.

**Empty ingredients array:** Treat as no-op — return current `SectionResponse` without any DB calls (empty array is valid).

**Unit tests:** New `describe('batchCreate')` block added to existing `ingredients.service.spec.ts`.

**Integration tests:** New `recipes-batch-ingredient.integration-spec.ts` in `apps/api/integration_tests/` — Prisma-direct pattern same as Phase 16.

**FK rollback test:** Seed a valid section, pass an invalid foodId, assert no ingredients were created (atomicity verified at Prisma level).

### Claude's Discretion

- Exact `@ApiOperation` summary wording on the batch endpoint
- `toSectionResponse` mapper reuse strategy (import from recipes.service or duplicate)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ERGO-05 | User can add multiple ingredients to a section in one call (`POST /api/recipes/:id/sections/:sectionId/ingredients/batch`) — atomic insert, returns updated `SectionResponse` | Prisma `$transaction` with `createMany` + `aggregate MAX(order)` + re-fetch with INCLUDE covers all four success criteria |
</phase_requirements>

## Summary

Phase 17 adds a single new endpoint: `POST /api/recipes/:id/sections/:sectionId/ingredients/batch`. The endpoint accepts a body shaped as `BatchCreateIngredientsRequest` (already defined in `packages/shared`), inserts all items in a single Prisma interactive transaction, and returns a `SectionResponse` with fully hydrated `foodName` and `unitName` on every ingredient.

The critical Prisma constraint is that `createMany` does NOT support `include`, so a re-fetch is mandatory after the bulk insert. Order computation uses `_max: { order: true }` aggregation — the same pattern used by single `create()` — run once before `createMany` to avoid order collisions. The interactive transaction (`prisma.$transaction(async tx => {...})`) is the correct choice because it allows conditional logic (section validation, empty-array short-circuit) and structured FK error detection inside the transaction boundary.

The `toSectionResponse` and `toIngredientResponse` helper functions are module-level non-exported functions in `recipes.service.ts`. The planner must decide whether to import them (requires exporting) or duplicate them in `ingredients.service.ts`. Both options are valid; the CONTEXT.md leaves this to Claude's discretion.

**Primary recommendation:** Implement `batchCreate` following the exact pattern of existing `create()` — aggregate MAX(order), call `createMany`, re-fetch with the new INCLUDE constant. Keep all logic self-contained in `ingredients.service.ts` to avoid circular dependencies with `recipes.service.ts`.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@prisma/client` | project version | ORM — `createMany`, `aggregate`, `$transaction` | Established in this project; all DB access goes through PrismaService |
| `class-validator` | project version | DTO validation decorators | All DTOs in this project use it |
| `@nestjs/swagger` | project version | `@ApiProperty` / `@ApiOperation` decorators | Required by project rules |

No new packages are needed. This phase is purely additive on the existing stack.

**Installation:** None required.

## Architecture Patterns

### Recommended Project Structure

No new directories. Files added to existing locations:

```
apps/api/src/recipes/ingredients/
├── dto/
│   └── batch-create-ingredient.dto.ts   (NEW)
├── ingredients.controller.ts             (modified — add POST batch route)
└── ingredients.service.ts               (modified — add const + batchCreate method)

apps/api/integration_tests/
└── recipes-batch-ingredient.integration-spec.ts  (NEW)
```

### Pattern 1: Module-level INCLUDE constant

**What:** A `const` object placed above `@Injectable()` that captures the Prisma include shape for a full section with hydrated ingredients.

**When to use:** Whenever a method needs to re-fetch a section with all ingredients including `food` and `unit` relations.

**Example (derived from `recipes.service.ts` RECIPE_INCLUDE pattern):**
```typescript
// Source: apps/api/src/recipes/recipes.service.ts (lines 17-29)
const SECTION_WITH_INGREDIENTS_INCLUDE = {
  ingredients: {
    include: { food: true, unit: true },
    orderBy: { order: 'asc' as const },
  },
} as const;
```

### Pattern 2: Interactive transaction with createMany + re-fetch

**What:** Prisma interactive transaction that aggregates MAX(order), bulk-inserts, then re-fetches the section with the INCLUDE constant.

**When to use:** Any batch insert where the response must include related fields not returned by `createMany`.

**Example:**
```typescript
// Source: Prisma docs pattern, consistent with existing create() in ingredients.service.ts
return await this.prisma.$transaction(async (tx) => {
  // 1. Validate section
  const section = await tx.ingredientSection.findUnique({ where: { id: sectionId } });
  if (!section || section.recipeId !== recipeId) {
    throw new NotFoundException(`Section ${sectionId} not found`);
  }

  // 2. Aggregate MAX(order) once — avoids per-item collision
  const maxOrder = await tx.recipeIngredient.aggregate({
    where: { sectionId },
    _max: { order: true },
  });
  const startOrder = (maxOrder._max.order ?? -1) + 1;

  // 3. Bulk insert with sequential order values
  await tx.recipeIngredient.createMany({
    data: dto.ingredients.map((item, i) => ({
      sectionId,
      foodId: item.foodId,
      unitId: item.unitId ?? null,
      quantity: item.quantity ?? null,
      note: item.note ?? null,
      order: startOrder + i,
    })),
  });

  // 4. Re-fetch with INCLUDE (createMany never returns includes)
  const updated = await tx.ingredientSection.findUnique({
    where: { id: sectionId },
    include: SECTION_WITH_INGREDIENTS_INCLUDE,
  });
  return toSectionResponse(updated!);
});
```

### Pattern 3: BatchCreateIngredientsDto

**What:** DTO class wrapping a validated array of item objects, implementing the shared `BatchCreateIngredientsRequest` interface.

**Example (follows CreateIngredientDto pattern in this project):**
```typescript
// Source: apps/api/src/recipes/ingredients/dto/create-ingredient.dto.ts (pattern reference)
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { BatchCreateIngredientsRequest } from '@recipe-manager/shared';

class BatchIngredientItemDto { /* mirrors CreateIngredientDto fields */ }

export class BatchCreateIngredientsDto implements BatchCreateIngredientsRequest {
  @ApiProperty({ type: [BatchIngredientItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BatchIngredientItemDto)
  ingredients: BatchIngredientItemDto[];
}
```

Note: `@ValidateNested` requires `transform: true` on the global `ValidationPipe`. STATE.md confirms `transform: true` was added in Phase 15-01, so this is already in `apps/api/src/main.ts`.

### Pattern 4: Controller route placement

**What:** The batch `@Post('batch')` route must be declared BEFORE any parameterized routes (e.g., `@Patch(':ingredientId')`) to prevent NestJS routing from matching the literal string "batch" as an ingredientId.

**Example:**
```typescript
// Source: apps/api/src/recipes/ingredients/ingredients.controller.ts (line 14 comment)
// CRITICAL: reorder before :ingredientId to prevent route collision — same applies to 'batch'
@Post('batch')
batchCreate(...) { ... }

@Post()
create(...) { ... }
```

### Anti-Patterns to Avoid

- **createMany with include:** Prisma `createMany` never accepts `include`. Do not attempt it; always re-fetch after.
- **Per-item order computation inside loop:** Calling `aggregate MAX(order)` inside a loop or inside `map()` causes N queries and potential race conditions. Compute once before `createMany`.
- **Post-fetch check for FK validity:** Prisma throws a Prisma error (P2003 foreign key constraint) when `foodId`/`unitId` is invalid. Catch this error in the transaction catch block and convert to `NotFoundException` — do not pre-validate with separate queries.
- **Module-level constant sharing across services:** `SECTION_WITH_INGREDIENTS_INCLUDE` is only used in `ingredients.service.ts`. Placing it in a shared file adds coupling with no benefit.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Atomic batch insert | Custom loop of individual `create()` calls | `prisma.$transaction` + `createMany` | Individual creates are not atomic; one failure leaves partial data |
| Response hydration | Post-insert `map()` to add food/unit names manually | Re-fetch with `include: { food: true, unit: true }` | Prisma handles joins; manual hydration is error-prone and untested |
| DTO array validation | Custom loop validator | `@ValidateNested({ each: true })` + `@Type(() => ItemDto)` | Class-validator handles nested arrays natively with transform:true |

**Key insight:** `createMany` is fast but returns only a count. The re-fetch is the canonical Prisma pattern for batch insert with relations — it is not a workaround.

## Common Pitfalls

### Pitfall 1: FK constraint error not caught as NotFoundException

**What goes wrong:** When an invalid `foodId` or `unitId` is provided, Prisma throws a `PrismaClientKnownRequestError` with code `P2003` (foreign key constraint failed). If uncaught, NestJS returns a 500.

**Why it happens:** `createMany` does not validate FK existence before inserting — it relies on the database constraint.

**How to avoid:** Wrap the transaction in a try/catch. Check `error.code === 'P2003'` and throw `NotFoundException` with the correct message.

**Warning signs:** Integration test for invalid foodId returns 500 instead of 404.

### Pitfall 2: Route collision — "batch" matched as ingredientId

**What goes wrong:** If `@Post('batch')` is placed after `@Patch(':ingredientId')` or other parameterized routes, NestJS may incorrectly route POST requests to `/batch`.

**Why it happens:** NestJS evaluates routes in declaration order. Literal path segments beat parameters only when declared first.

**How to avoid:** Declare `@Post('batch')` before `@Post()` (which is the single-create) in the controller. The existing comment in the file already flags this pattern for `reorder`.

**Warning signs:** `POST .../batch` returns 404 or triggers the wrong handler.

### Pitfall 3: Empty array calling createMany unnecessarily

**What goes wrong:** `createMany({ data: [] })` is valid in Prisma but wastes a DB round trip and starts an unnecessary transaction.

**Why it happens:** No guard on the input array length.

**How to avoid:** Per CONTEXT.md locked decision — check `dto.ingredients.length === 0` before entering the transaction and return the current `SectionResponse` immediately (requires a separate `findUnique` call outside the transaction, or simply return early after a section lookup).

**Warning signs:** Empty-array integration test takes longer than expected, or unit test shows transaction mock being called.

### Pitfall 4: toSectionResponse not available in ingredients.service.ts

**What goes wrong:** `toSectionResponse` and `toIngredientResponse` are module-level non-exported functions in `recipes.service.ts`. If `ingredients.service.ts` imports them, it creates a cross-service dependency.

**Why it happens:** The mapper functions are not currently exported.

**How to avoid:** Either (a) export the mappers from `recipes.service.ts` and import in `ingredients.service.ts`, or (b) duplicate the two small functions in `ingredients.service.ts`. Option (b) is cleaner for a single-use case — avoids coupling two services. The planner must make this call (Claude's discretion per CONTEXT.md).

**Warning signs:** TypeScript circular import error at compile time.

## Code Examples

Verified patterns from existing codebase sources:

### Existing MAX(order) aggregate pattern (single create)
```typescript
// Source: apps/api/src/recipes/ingredients/ingredients.service.ts (lines 23-26)
const maxOrder = await this.prisma.recipeIngredient.aggregate({
  where: { sectionId },
  _max: { order: true },
});
const order = (maxOrder._max.order ?? -1) + 1;
```

### Existing toSectionResponse mapper
```typescript
// Source: apps/api/src/recipes/recipes.service.ts (lines 101-113)
function toSectionResponse(section: {
  id: string;
  title: string | null;
  order: number;
  ingredients: Parameters<typeof toIngredientResponse>[0][];
}): SectionResponse {
  return {
    id: section.id,
    title: section.title,
    order: section.order,
    ingredients: section.ingredients.map(toIngredientResponse),
  };
}
```

### Integration test scaffold (Prisma-direct pattern, no NestJS boot)
```typescript
// Source: apps/api/integration_tests/recipes-slug.integration-spec.ts (lines 1-5)
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});
```

### Unit test structure for new describe block
```typescript
// Source: apps/api/src/recipes/ingredients/ingredients.service.spec.ts (lines 6-16)
// mockPrisma must be extended with:
//   ingredientSection: { findUnique: jest.fn() }  — already present
//   recipeIngredient: { ..., createMany: jest.fn() }  — createMany not yet in mock
// and prisma.$transaction must be mocked as:
//   (mockPrisma as any).$transaction = jest.fn().mockImplementation((fn) => fn(mockPrisma));
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| N individual `create()` calls | `createMany` inside `$transaction` | Prisma 2.x+ | Single DB round trip for inserts, full rollback on error |
| `ValidationPipe({ whitelist: true })` only | `ValidationPipe({ transform: true, whitelist: true })` | Phase 15-01 | `@ValidateNested` and `@Type()` now work correctly; required for BatchCreateIngredientsDto |

**Deprecated/outdated:**

- None for this phase. No schema changes, no new packages.

## Open Questions

1. **toSectionResponse mapper: import or duplicate?**
   - What we know: Function exists in `recipes.service.ts` as non-exported; identical logic needed in `ingredients.service.ts` for batch response
   - What's unclear: Whether exporting from `recipes.service.ts` causes any circular dep issues (NestJS module graph is separate from TypeScript import graph — likely safe)
   - Recommendation: Duplicate (2 small functions, ~20 lines) to keep `IngredientsService` fully self-contained. If the mapper needs updating in the future, a shared utility file (`src/recipes/mappers.ts`) would be the right refactor — but that is out of scope for Phase 17.

2. **FK error detection: P2003 vs generic catch**
   - What we know: Prisma throws `PrismaClientKnownRequestError` with `code: 'P2003'` for FK violations; exact field name is available in `meta.field_name`
   - What's unclear: Whether the error message is reliable enough to extract which `foodId`/`unitId` caused the failure
   - Recommendation: Catch `PrismaClientKnownRequestError`, check `code === 'P2003'`, throw a generic `NotFoundException('Invalid food or unit ID')` — precise field identification is not required by CONTEXT.md.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest (unit) + Jest with Prisma-direct (integration) |
| Config file | `apps/api/jest.config.ts` (unit) / `apps/api/jest-integration.config.ts` (integration) |
| Quick run command | `cd apps/api && yarn test --testPathPattern=ingredients.service.spec` |
| Full suite command | `cd apps/api && yarn test:integration` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ERGO-05 | POST batch inserts all items atomically, returns SectionResponse | integration | `yarn test:integration --testPathPattern=recipes-batch-ingredient` | ❌ Wave 0 |
| ERGO-05 | Correct order values starting from MAX+1 on non-empty section | integration | same file | ❌ Wave 0 |
| ERGO-05 | Returns fully hydrated foodName and unitName | integration | same file | ❌ Wave 0 |
| ERGO-05 | Invalid foodId rolls back all items (no partial insert) | integration | same file | ❌ Wave 0 |
| ERGO-05 | batchCreate service method — empty array returns SectionResponse, no DB calls | unit | `yarn test --testPathPattern=ingredients.service.spec` | ❌ Wave 0 (describe block) |
| ERGO-05 | batchCreate service method — items inserted with correct order | unit | same file | ❌ Wave 0 (describe block) |

### Sampling Rate

- **Per task commit:** `cd apps/api && yarn test --testPathPattern=ingredients.service.spec`
- **Per wave merge:** `cd apps/api && yarn test && yarn test:integration`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `apps/api/integration_tests/recipes-batch-ingredient.integration-spec.ts` — covers ERGO-05 integration scenarios
- [ ] `describe('batchCreate')` block in `apps/api/src/recipes/ingredients/ingredients.service.spec.ts` — covers ERGO-05 unit scenarios
- [ ] `mockPrisma` in `ingredients.service.spec.ts` must be extended with `createMany: jest.fn()` on `recipeIngredient` and `$transaction` mock function

## Sources

### Primary (HIGH confidence)

- Existing codebase — `apps/api/src/recipes/ingredients/ingredients.service.ts` — `_max` aggregate and `create` with `include` patterns
- Existing codebase — `apps/api/src/recipes/recipes.service.ts` — `toSectionResponse`, `toIngredientResponse`, `RECIPE_INCLUDE` const patterns
- Existing codebase — `packages/shared/src/api/foods-units.ts` — `BatchCreateIngredientsRequest` interface (already defined)
- Existing codebase — `packages/shared/src/api/recipes.ts` — `SectionResponse`, `IngredientResponse` interfaces
- Existing codebase — `apps/api/integration_tests/recipes-slug.integration-spec.ts` — Prisma-direct integration test scaffold
- `.planning/phases/17-batch-ingredient-add/17-CONTEXT.md` — all locked implementation decisions

### Secondary (MEDIUM confidence)

- Prisma docs: `createMany` does not support `include` — confirmed by project code pattern (`create()` uses `include` but `createMany` never would); re-fetch is the canonical workaround
- Prisma docs: `PrismaClientKnownRequestError` code `P2003` for FK constraint violations — established pattern

### Tertiary (LOW confidence)

None.

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — no new packages; all patterns verified in existing codebase
- Architecture: HIGH — patterns derived directly from existing service/controller files in this project
- Pitfalls: HIGH — FK error, route collision, and mapper availability pitfalls all observed directly in codebase structure

**Research date:** 2026-03-21
**Valid until:** 2026-04-21 (stable stack, no fast-moving dependencies)
