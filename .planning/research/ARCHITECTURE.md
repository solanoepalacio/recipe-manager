# Architecture Research

**Domain:** NestJS API ergonomics — additive changes to existing recipe manager
**Researched:** 2026-03-20
**Confidence:** HIGH (all findings from direct source inspection)

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                         HTTP Layer                               │
├──────────────────┬───────────────────┬───────────────────────────┤
│  SharedModule    │   RecipesModule   │   (other modules)         │
│  ┌────────────┐  │  ┌─────────────┐  │                           │
│  │ FoodsCtrl  │  │  │ RecipesCtrl │  │                           │
│  │ UnitsCtrl  │  │  │ IngrCtrl    │  │                           │
│  └─────┬──────┘  │  │ StepsCtrl   │  │                           │
│        │         │  └──────┬──────┘  │                           │
│  (no service     │         │         │                           │
│   layer today)   │  ┌──────▼──────┐  │                           │
│        │         │  │ RecipesSvc  │  │                           │
│        │         │  │ IngrSvc     │  │                           │
│        │         │  │ StepsSvc    │  │                           │
│        │         │  └──────┬──────┘  │                           │
│        │         │         │         │                           │
├────────┴─────────┴─────────┴─────────┴───────────────────────────┤
│                      PrismaService (global)                      │
├──────────────────────────────────────────────────────────────────┤
│                      PostgreSQL                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Current state |
|-----------|----------------|---------------|
| FoodsController | List all foods for ingredient pickers | Injects PrismaService directly — no service layer |
| UnitsController | List all units for ingredient pickers | Injects PrismaService directly — no service layer |
| SharedModule | Hosts Foods/Units controllers | Declares no providers — relies on globally-exported PrismaModule |
| RecipesService | Recipe CRUD + ownership verification | Single-record create today; slug generation lives here |
| IngredientsService | Ingredient CRUD within a section | Own ownership verification; separate Prisma calls per operation |
| RecipesModule | Wires all recipe sub-controllers and services | Already exports RecipesService |
| packages/shared | API boundary contract (source of truth) | Shared interfaces enforced by compiler |

## Recommended Project Structure

Changes are isolated to the files listed below. No new directories required.

```
apps/api/src/
├── shared/
│   ├── foods.controller.ts          MODIFY — add ?name= query param + where clause
│   └── units.controller.ts          MODIFY — add ?name= query param + where clause
│
├── recipes/
│   ├── recipes.controller.ts        MODIFY — call findByIdOrSlug() instead of findOne()
│   ├── recipes.service.ts           MODIFY — add findByIdOrSlug(); expand create() for compound
│   ├── dto/
│   │   └── create-recipe.dto.ts     MODIFY — add optional ingredients[] and steps[] arrays
│   │
│   └── ingredients/
│       ├── ingredients.controller.ts  MODIFY — add POST .../batch route (before :ingredientId)
│       ├── ingredients.service.ts     MODIFY — add batchCreate() method
│       └── dto/
│           └── batch-create-ingredient.dto.ts   NEW — wraps array of CreateIngredientDto

packages/shared/src/
└── api/
    └── recipes.ts                   MODIFY — extend CreateRecipeRequest; add new interfaces
```

### Structure Rationale

- **No new modules:** All 4 changes fit within existing module boundaries.
- **No service layer for Foods/Units:** The name filter is a single `where` clause addition — introducing a FoodsService/UnitsService for this would be overengineering. The direct-Prisma pattern in these controllers is intentional and stays.
- **batch-create-ingredient.dto.ts as separate file:** Keeps the existing `create-ingredient.dto.ts` unchanged, avoids mixing single/batch validation in one class, and follows the existing DTO-per-operation convention in the codebase.

## Architectural Patterns

### Pattern 1: In-controller query filtering (Foods/Units name filter)

**What:** Add `@Query('name') name?: string` to the controller handler. Build a conditional `where` object inline. No service layer introduced.

**When to use:** When the controller already owns all query logic and the operation is a thin Prisma read with no ownership verification, no transactions, and no cross-entity concerns.

**Trade-offs:** Keeps thin controllers thin. Acceptable because Foods and Units are admin-managed global catalogs — no household scoping, no auth-dependent filtering. A service layer would add ceremony with no benefit.

**Example:**
```typescript
@Get()
findAll(@Query('name') name?: string) {
  return this.prisma.food.findMany({
    where: name ? { name: { contains: name, mode: 'insensitive' } } : undefined,
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  });
}
```

### Pattern 2: Service-layer UUID/slug detection (slug lookup)

**What:** Move the identifier-type detection into `RecipesService` as a new `findByIdOrSlug(idOrSlug, householdId)` method. The controller calls this instead of `findOne()`. `findOne()` can remain as an internal helper or be removed.

**When to use:** When the routing concern (what identifier was provided) has direct implications on the Prisma query shape. Detection in the controller would require threading the result down or duplicating the guard.

**Trade-offs:** Keeps the controller thin. The service owns all query logic including which field to filter on. UUID regex is a one-liner and well-understood.

**Example:**
```typescript
private isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

async findByIdOrSlug(idOrSlug: string, householdId: string): Promise<RecipeDetailResponse> {
  const where = this.isUuid(idOrSlug)
    ? { id: idOrSlug }
    : { householdId, slug: idOrSlug };
  const recipe = await this.prisma.recipe.findFirst({ where, include: RECIPE_INCLUDE });
  if (!recipe) throw new NotFoundException(`Recipe not found`);
  if (recipe.householdId !== householdId) throw new ForbiddenException('Access denied');
  return toRecipeDetailResponse(recipe);
}
```

Note: When the identifier is a slug, `householdId` must be included in the `where` clause directly (not just as a post-fetch check) to correctly return 404 for slugs that belong to another household. UUID lookups already do the post-fetch household check via `findAndVerifyOwnership`.

### Pattern 3: Inline transaction for compound create (no service method reuse)

**What:** When `dto.ingredients` or `dto.steps` are present, wrap the entire create operation in `prisma.$transaction()` and inline the ingredient/step inserts. Do NOT call `IngredientsService.create()` or `StepsService` methods inside the transaction.

**When to use:** When child-record creation must be atomic with the parent but the child services do not accept a transaction client (`Prisma.TransactionClient`) parameter. Reusing service methods inside `$transaction` is incorrect because those methods use `this.prisma` (the pool client), not the transaction client.

**Trade-offs:** Some logic duplication vs IngredientsService (order calculation, field mapping). Acceptable because: (a) the logic is simple, (b) the transaction boundary requirement is real, (c) introducing a shared transaction-client parameter across all services would be a larger refactor than the milestone warrants.

**Example:**
```typescript
async create(userId: string, householdId: string, dto: CreateRecipeDto): Promise<RecipeDetailResponse> {
  const slug = await this.generateUniqueSlug(dto.name, householdId);

  const recipe = await this.prisma.$transaction(async (tx) => {
    const created = await tx.recipe.create({
      data: {
        householdId, createdById: userId, name: dto.name, slug,
        // ...other scalar fields...
        sections: { create: [{ title: null, order: 0 }] },
      },
      include: { sections: true, steps: true, images: true },
    });

    // Resolve the auto-created default section id
    const defaultSection = created.sections[0];

    if (dto.ingredients?.length) {
      await tx.recipeIngredient.createMany({
        data: dto.ingredients.map((ing, i) => ({
          sectionId: defaultSection.id,
          foodId: ing.foodId,
          unitId: ing.unitId ?? null,
          quantity: ing.quantity ?? null,
          note: ing.note ?? null,
          order: i,
        })),
      });
    }

    if (dto.steps?.length) {
      await tx.recipeStep.createMany({
        data: dto.steps.map((step, i) => ({
          recipeId: created.id,
          title: step.title ?? null,
          body: step.body,
          order: i,
        })),
      });
    }

    return tx.recipe.findUnique({ where: { id: created.id }, include: RECIPE_INCLUDE });
  });

  return toRecipeDetailResponse(recipe);
}
```

`createMany` is more efficient than looped `create` calls for the batch insert. The final re-fetch brings back the fully hydrated record with food/unit names included (required by `RECIPE_INCLUDE`).

### Pattern 4: Batch route placement (prevent collision)

**What:** Declare `POST batch` BEFORE `PATCH :ingredientId` / `DELETE :ingredientId` in the controller. NestJS matches routes top-to-bottom; a literal segment (`batch`) must be registered before a parameter segment (`:ingredientId`) to avoid the literal being swallowed as a param value.

**When to use:** Any time a literal sub-route shares a path prefix with a parameterized route.

**Trade-offs:** Order-dependent routing is a known NestJS/Express footgun. The existing codebase already handles this correctly for `reorder` (see `IngredientsController` line 15 comment). Follow the same pattern.

**Example:**
```typescript
@Controller('recipes/:id/sections/:sectionId/ingredients')
export class IngredientsController {
  // 1. Literal routes first
  @Put('reorder') reorder(...)       // existing
  @Post('batch') batchCreate(...)    // NEW — must be before :ingredientId

  // 2. Parameterized routes after
  @Post() create(...)
  @Patch(':ingredientId') update(...)
  @Delete(':ingredientId') remove(...)
}
```

## Data Flow

### Request Flow — Compound Recipe Create

```
POST /api/recipes
    { name, ingredients[], steps[] }
         |
         v
RecipesController.create()
         |
         v
RecipesService.create(userId, householdId, dto)
         |
         ├── generateUniqueSlug()           (2 queries max: slug check loop)
         |
         └── prisma.$transaction(tx)
                  |
                  ├── tx.recipe.create()    (creates recipe + default section)
                  ├── tx.recipeIngredient.createMany()   (if dto.ingredients present)
                  ├── tx.recipeStep.createMany()         (if dto.steps present)
                  └── tx.recipe.findUnique(RECIPE_INCLUDE) → fully hydrated
                           |
                           v
                  toRecipeDetailResponse()
                           |
                           v
                  RecipeDetailResponse (same shape as today)
```

### Request Flow — Slug/UUID Lookup

```
GET /api/recipes/:idOrSlug
         |
         v
RecipesController.findOne(idOrSlug)
         |
         v
RecipesService.findByIdOrSlug(idOrSlug, householdId)
         |
         ├── isUuid(idOrSlug)?
         |     YES → findFirst({ where: { id } })
         |     NO  → findFirst({ where: { householdId, slug } })
         |
         ├── not found → 404
         ├── wrong household (UUID case) → 403
         └── toRecipeDetailResponse() → 200
```

### Request Flow — Batch Ingredient Add

```
POST /api/recipes/:id/sections/:sectionId/ingredients/batch
    [{ foodId, unitId, quantity, note }, ...]
         |
         v
IngredientsController.batchCreate()
         |
         v
IngredientsService.batchCreate(recipeId, householdId, sectionId, dtos[])
         |
         ├── verifyRecipeOwnership()        (1 query)
         ├── verify section belongs to recipe (1 query)
         ├── get maxOrder for section       (1 query)
         ├── prisma.recipeIngredient.createMany()
         └── prisma.ingredientSection.findUnique({ include: ingredients + food + unit })
                  |
                  v
         toSectionResponse() → SectionResponse
```

`batchCreate` returns `SectionResponse`, not `IngredientResponse[]`, per the spec. This requires access to `toSectionResponse` — see Integration Points below.

## Integration Points

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| RecipesModule ↔ IngredientsService (compound create) | None — inline logic inside transaction | Do NOT call IngredientsService from RecipesService; avoids both circular deps and transaction-client mismatch |
| IngredientsController → toSectionResponse | Direct import from recipes.service.ts | `toSectionResponse` is currently a module-private function; it must be exported from recipes.service.ts to be used in ingredients.service.ts |
| SharedModule FoodsController → PrismaService | Global injection (no change) | PrismaModule is globally exported; no SharedModule providers entry needed |

### Shared Types — What Needs Updating

All changes to `packages/shared/src/api/recipes.ts`:

| Interface | Change | Rationale |
|-----------|--------|-----------|
| `CreateRecipeRequest` | Add `ingredients?: CreateIngredientRequest[]` and `steps?: CreateStepRequest[]` | Compound create payload; both optional so existing callers are unaffected |
| `FoodItem` (NEW) | `{ id: string; name: string }` | Typed return for `GET /api/foods`; currently no shared interface exists for the non-admin foods list response |
| `UnitItem` (NEW) | `{ id: string; name: string; abbreviation: string \| null }` | Typed return for `GET /api/units`; same gap as FoodItem |
| `BatchCreateIngredientsRequest` (NEW) | `CreateIngredientRequest[]` (type alias) | Request body type for `POST .../ingredients/batch` |

`AdminFoodResponse` and `AdminUnitResponse` already exist in `admin.ts` but include `createdAt/updatedAt` — they are admin-only types and should not be reused here. The new `FoodItem`/`UnitItem` are the correct public-API equivalents.

### Circular Dependency Risk Assessment

| Scenario | Risk | Verdict |
|----------|------|---------|
| RecipesService calls IngredientsService | Would create RecipesModule → IngredientsService → PrismaService; IngredientsService is already in RecipesModule providers | NO circular dep, but wrong because IngredientsService.create() uses `this.prisma` not the tx client |
| IngredientsService imports toSectionResponse from recipes.service.ts | One-way import of a pure mapper function | Safe — no service injection, no circular module reference |
| BatchCreate returns SectionResponse assembled in IngredientsService | IngredientsService builds the response with an inline query + the imported mapper | Safe |

## Build Order

The 4 changes have the following dependency graph:

```
Change 1 (name filter)         — independent, no deps
Change 3 (slug lookup)         — independent, no deps
Change 4 (batch ingredient)    — depends on toSectionResponse export (trivial)
Change 2 (compound create)     — depends on CreateRecipeRequest update in shared
```

Recommended implementation order:

1. **packages/shared** — update `CreateRecipeRequest`; add `FoodItem`, `UnitItem`, `BatchCreateIngredientsRequest`
2. **Change 1** — foods/units name filter (smallest, good warm-up, validates query-param pattern)
3. **Change 3** — slug/UUID lookup (isolated service method, no DTO changes)
4. **Export `toSectionResponse`** — prepend `export` to the function in `recipes.service.ts`
5. **Change 4** — batch ingredient add (new DTO, new service method, new route)
6. **Change 2** — compound recipe create (largest change; update DTO, wrap service method in transaction)

Changes 1 and 3 can be done in either order. Change 2 is last because it touches `RecipesService.create()` — the most complex method — and requires the shared type update to be in place first.

## Anti-Patterns

### Anti-Pattern 1: Calling service methods inside a Prisma transaction

**What people do:** Call `this.ingredientsService.create()` inside a `prisma.$transaction()` callback to reuse validation logic.

**Why it's wrong:** `IngredientsService.create()` uses `this.prisma` (the connection pool client). Queries issued through the pool client inside a `$transaction` callback execute outside the transaction boundary. Failures in the batch will not roll back the ingredient inserts.

**Do this instead:** Inline the insert logic using the transaction client (`tx`) passed to the callback. Accept minor duplication. The transaction boundary is non-negotiable for atomicity.

### Anti-Pattern 2: UUID detection in the controller

**What people do:** Check `isUuid(id)` in `RecipesController.findOne()` and pass a `type: 'uuid' | 'slug'` flag or two separate service calls.

**Why it's wrong:** The controller becomes aware of query strategy, which is a service concern. It also forces the controller to handle the 404/403 distinction for two code paths.

**Do this instead:** Pass the raw `idOrSlug` string to `RecipesService.findByIdOrSlug()` and let the service own the detection, query shape, and error handling.

### Anti-Pattern 3: Reusing AdminFoodResponse / AdminUnitResponse for public endpoints

**What people do:** Import `AdminFoodResponse` from `admin.ts` as the return type for `GET /api/foods` to avoid creating new interfaces.

**Why it's wrong:** `AdminFoodResponse` includes `createdAt` and `updatedAt` — administrative metadata not relevant to the ingredient picker. Using admin types for user-facing endpoints couples unrelated domains and leaks unnecessary data.

**Do this instead:** Define `FoodItem` and `UnitItem` in `recipes.ts` (or a new `foods.ts` file if the catalog grows). Keep admin types in `admin.ts`.

### Anti-Pattern 4: Declaring batch route after parameterized route

**What people do:** Append `@Post('batch')` at the bottom of the controller after `@Patch(':ingredientId')`.

**Why it's wrong:** Express (underlying NestJS) matches routes in registration order. `POST .../ingredients/batch` will match `:ingredientId = "batch"` and invoke the `create` handler instead.

**Do this instead:** Register all literal sub-routes (`reorder`, `batch`) before parameterized routes. The existing codebase has a comment noting this for `reorder` — follow the same pattern.

## Sources

- Direct source inspection: `apps/api/src/shared/foods.controller.ts`, `units.controller.ts`, `shared.module.ts`
- Direct source inspection: `apps/api/src/recipes/recipes.service.ts`, `recipes.controller.ts`, `recipes.module.ts`
- Direct source inspection: `apps/api/src/recipes/ingredients/ingredients.service.ts`, `ingredients.controller.ts`
- Direct source inspection: `apps/api/src/recipes/sections/sections.service.ts`
- Direct source inspection: `packages/shared/src/api/recipes.ts`, `admin.ts`, `index.ts`
- Spec: `plans/03_api-ergonomics/api-ergonomics.md`
- NestJS route ordering behavior: known framework behavior (controller registration order = Express middleware order); HIGH confidence from direct codebase evidence (existing `reorder` comment at IngredientsController line 15)

---
*Architecture research for: API ergonomics — v1.2 milestone (NestJS recipe manager)*
*Researched: 2026-03-20*
