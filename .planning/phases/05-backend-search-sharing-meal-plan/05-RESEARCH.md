# Phase 5: Backend Search, Sharing, Meal Plan — Research

**Researched:** 2026-03-16
**Domain:** NestJS search/filtering/pagination, secure share token generation, meal plan CRUD, Prisma query patterns
**Confidence:** HIGH

---

## Summary

Phase 5 extends the already-complete NestJS backend with three related concerns: (1) replacing the naive `GET /recipes` list with a full search/filter/sort/paginate implementation, (2) adding a public share token sub-resource to recipes, and (3) implementing the meal plan module with entry CRUD.

All three concerns follow patterns already established in the codebase. The search implementation uses Prisma `findMany` with dynamic `where` + `orderBy` clauses — no external search library is needed for the fuzzy requirement at MVP scale. Fuzzy matching is implemented via Prisma `contains` with `mode: 'insensitive'` (case-insensitive substring match). True Levenshtein-distance fuzzy search is not justified for a household recipe library; substring matching satisfies the requirement.

Share tokens are generated with `crypto.randomBytes(32).toString('hex')` (64-char hex), stored directly in the existing `Recipe.shareToken @unique` column, and served via a `@Public()` endpoint. The meal plan module is a standalone top-level NestJS module following the same controller/service/DTO pattern as auth and admin.

**Primary recommendation:** Extend `RecipesService.findAll` to accept a query DTO with optional search/filter/sort/page params. Add a `sharing` sub-module inside `RecipesModule` following the same sub-module pattern used by sections/steps/images. Add a standalone `MealPlanModule` imported in `AppModule`.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@nestjs/common` | 11.1.16 | Controllers, services, query params via `@Query()` | Already in use — project standard |
| `@prisma/client` | 6.x | Dynamic `where`/`orderBy`/`skip`/`take` for search+pagination; `MealPlan`/`MealPlanEntry` queries | Already in use — project ORM |
| `class-validator` | 0.14.x | DTO validation on query params: `@IsOptional`, `@IsEnum`, `@IsInt`, `@Min`, `@IsBoolean` | Already in use — project standard |
| `class-transformer` | 0.5.x | `@Type(() => Number)` to coerce query string numbers; `@Transform` for booleans | Already in use with `ValidationPipe` |
| `@nestjs/swagger` | 8.x | `@ApiQuery` for documenting query params | Already in use — project standard |
| `@recipe-manager/shared` | workspace | `RecipeListItem`, `PaginatedResponse<RecipeListItem>`, new shared types for search/meal plan | Compiler-enforced API boundary |
| `crypto` (Node built-in) | built-in | `randomBytes(32).toString('hex')` for share token | No extra package; already used in auth (password reset) |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `class-transformer` `@Type(() => Number)` | 0.5.x | Parse `page`, `pageSize` query params as integers (they arrive as strings) | Required for any numeric query param |
| Prisma `mode: 'insensitive'` on `contains` | Prisma 6.x | Case-insensitive substring search on recipe name | Use for the `search` param |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Prisma `contains` (substring match) | PostgreSQL full-text search (`to_tsvector`) | Full-text needs a migration to add a tsvector column + trigger; overkill for household scale |
| Prisma `contains` (substring match) | pg_trgm trigram index | Requires PostgreSQL extension; needs migration; adds ops complexity |
| `crypto.randomBytes(32)` | `uuid()` | `uuid` is also fine; `randomBytes(32).toString('hex')` gives 64 chars, same source already used in Phase 3 for reset tokens — consistent |

**Installation:** No new packages required. All dependencies are already in the monorepo.

---

## Architecture Patterns

### Recommended Project Structure

```
apps/api/src/
├── recipes/
│   ├── recipes.module.ts           # Add SharingController + SharingService
│   ├── recipes.controller.ts       # Extend GET /recipes with query DTO
│   ├── recipes.service.ts          # Extend findAll() to accept RecipeQueryDto
│   ├── dto/
│   │   ├── create-recipe.dto.ts
│   │   ├── update-recipe.dto.ts
│   │   └── recipe-query.dto.ts     # NEW: search, foodId, sort, order, page, pageSize
│   └── sharing/                    # NEW sub-module
│       ├── sharing.controller.ts   # POST /recipes/:id/share, DELETE /recipes/:id/share
│       └── sharing.service.ts      # generateToken(), revokeToken(), findByToken()
│
├── meal-plan/                      # NEW top-level module
│   ├── meal-plan.module.ts
│   ├── meal-plan.controller.ts     # GET /meal-plan, POST/PATCH/DELETE /meal-plan/entries
│   ├── meal-plan.service.ts
│   └── dto/
│       ├── create-meal-plan-entry.dto.ts
│       └── update-meal-plan-entry.dto.ts
│
└── shared/                         # NEW top-level module (foods + units read endpoints)
    ├── shared.module.ts
    ├── foods.controller.ts         # GET /foods
    └── units.controller.ts         # GET /units

packages/shared/src/api/
├── recipes.ts                      # Add RecipeListItem, RecipeQueryParams
└── meal-plan.ts                    # NEW: MealPlanResponse, MealPlanEntryResponse,
                                    #      CreateMealPlanEntryRequest, UpdateMealPlanEntryRequest
```

**Note on foods/units:** `GET /api/foods` and `GET /api/units` are specified in the API design as read-only endpoints used by the ingredient picker. These are simple list endpoints with no mutations and fit naturally in a lightweight `SharedModule`. They are unassigned to any roadmap plan but are needed by Phase 8/9 frontend. Including them in Phase 5 is pragmatic since Phase 5 is the last backend-only phase before the frontend phases begin.

### Pattern 1: Dynamic Search/Filter/Sort/Paginate in Prisma

**What:** Build a dynamic Prisma `where` clause from optional query params. Compose `orderBy` based on the `sort`/`order` params. Use `skip`/`take` for pagination. Return `PaginatedResponse<RecipeListItem>`.

**When to use:** `RecipesService.findAll()` — the only list endpoint that needs this.

**Example:**
```typescript
// apps/api/src/recipes/dto/recipe-query.dto.ts
import { IsOptional, IsString, IsEnum, IsInt, Min, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum SortField {
  Name = 'name',
  CreatedAt = 'createdAt',
  UpdatedAt = 'updatedAt',
}

export enum SortOrder {
  Asc = 'asc',
  Desc = 'desc',
}

export class RecipeQueryDto {
  @ApiPropertyOptional({ description: 'Search by name (substring, case-insensitive)' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by food ID (ingredient contains this food)' })
  @IsOptional()
  @IsString()
  foodId?: string;

  @ApiPropertyOptional({ enum: SortField, default: SortField.CreatedAt })
  @IsOptional()
  @IsEnum(SortField)
  sort?: SortField = SortField.CreatedAt;

  @ApiPropertyOptional({ enum: SortOrder, default: SortOrder.Desc })
  @IsOptional()
  @IsEnum(SortOrder)
  order?: SortOrder = SortOrder.Desc;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number = 20;
}
```

```typescript
// apps/api/src/recipes/recipes.service.ts (search method)
async findAll(householdId: string, query: RecipeQueryDto): Promise<PaginatedResponse<RecipeListItem>> {
  const { search, foodId, sort = 'createdAt', order = 'desc', page = 1, pageSize = 20 } = query;

  const where: Prisma.RecipeWhereInput = {
    householdId,
    ...(search && {
      name: { contains: search, mode: 'insensitive' },
    }),
    ...(foodId && {
      sections: {
        some: {
          ingredients: {
            some: { foodId },
          },
        },
      },
    }),
  };

  const [recipes, total] = await Promise.all([
    this.prisma.recipe.findMany({
      where,
      orderBy: { [sort]: order },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: RECIPE_LIST_SELECT,
    }),
    this.prisma.recipe.count({ where }),
  ]);

  return {
    items: recipes.map(toRecipeListItem),
    total,
    page,
    perPage: pageSize,
  };
}
```

**Important:** `sort: 'random'` cannot be expressed as a Prisma `orderBy` clause. Use `$queryRaw` with `ORDER BY RANDOM()` or fetch all IDs and shuffle in application code. For MVP, fetch all matching IDs and shuffle, then paginate — acceptable for household-scale datasets (hundreds of recipes).

### Pattern 2: Share Token Generation

**What:** `POST /recipes/:id/share` generates a unique token and stores it in `Recipe.shareToken`. `DELETE /recipes/:id/share` nulls the field. `GET /shared/:token` (note: NOT `/recipes/shared/:token` — see Anti-Patterns) is `@Public()` and returns `RecipeDetailResponse`.

**When to use:** `SharingService` inside the `recipes/sharing/` sub-module.

**Example:**
```typescript
// apps/api/src/recipes/sharing/sharing.service.ts
import { randomBytes } from 'crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SharingService {
  constructor(private readonly prisma: PrismaService) {}

  async generateToken(recipeId: string, householdId: string): Promise<{ shareToken: string }> {
    // Verify ownership before generating
    const recipe = await this.prisma.recipe.findUnique({ where: { id: recipeId } });
    if (!recipe) throw new NotFoundException(`Recipe ${recipeId} not found`);
    if (recipe.householdId !== householdId) throw new ForbiddenException('Access denied');

    const token = randomBytes(32).toString('hex');
    await this.prisma.recipe.update({
      where: { id: recipeId },
      data: { shareToken: token },
    });
    return { shareToken: token };
  }

  async revokeToken(recipeId: string, householdId: string): Promise<void> {
    const recipe = await this.prisma.recipe.findUnique({ where: { id: recipeId } });
    if (!recipe) throw new NotFoundException(`Recipe ${recipeId} not found`);
    if (recipe.householdId !== householdId) throw new ForbiddenException('Access denied');
    await this.prisma.recipe.update({ where: { id: recipeId }, data: { shareToken: null } });
  }

  async findByToken(token: string) {
    const recipe = await this.prisma.recipe.findUnique({
      where: { shareToken: token },
      include: RECIPE_INCLUDE,  // reuse from recipes.service.ts
    });
    if (!recipe) throw new NotFoundException('Shared recipe not found');
    return toRecipeDetailResponse(recipe);
  }
}
```

### Pattern 3: Public Shared Recipe Route

**What:** The public endpoint must be decorated with `@Public()` to bypass `AnyAuthGuard`. The route is `GET /shared/:token` — a top-level route separate from `/recipes/*`.

**When to use:** `SharedController` — a minimal controller, or add to `RecipesModule` as a sub-controller. Simplest: add a `SharedController` registered in `RecipesModule`.

**Example:**
```typescript
// apps/api/src/recipes/sharing/sharing.controller.ts (public read endpoint)
@Controller('shared')
export class SharedController {
  @Get(':token')
  @Public()
  @ApiOperation({ summary: 'View a publicly shared recipe (no auth required)' })
  findByToken(@Param('token') token: string) {
    return this.sharingService.findByToken(token);
  }
}
```

Register `SharedController` in `RecipesModule.controllers` array alongside the existing controllers.

### Pattern 4: Meal Plan Module

**What:** A standalone top-level NestJS module with one controller and one service. The household's MealPlan record is created lazily on first `POST /meal-plan/entries` if it doesn't yet exist (`upsert`). All entry operations are scoped to the household's meal plan.

**When to use:** All meal plan endpoints.

**Example:**
```typescript
// apps/api/src/meal-plan/meal-plan.service.ts
@Injectable()
export class MealPlanService {
  constructor(private readonly prisma: PrismaService) {}

  private async getOrCreateMealPlan(householdId: string) {
    return this.prisma.mealPlan.upsert({
      where: { householdId },
      create: { householdId },
      update: {},
    });
  }

  async createEntry(householdId: string, dto: CreateMealPlanEntryDto) {
    const mealPlan = await this.getOrCreateMealPlan(householdId);
    return this.prisma.mealPlanEntry.create({
      data: {
        mealPlanId: mealPlan.id,
        recipeId: dto.recipeId,
        date: new Date(dto.date),
        mealType: dto.mealType,
      },
      include: { recipe: { select: { id: true, name: true, slug: true } } },
    });
  }
}
```

### Pattern 5: GET /meal-plan with Date Range Filtering

**What:** `GET /meal-plan?from=2026-01-01&to=2026-01-07` returns entries grouped by date and mealType. The `date` field is `@db.Date` in Prisma — filter with `gte`/`lte` using `new Date(fromParam)`.

**Example:**
```typescript
async getEntries(householdId: string, from?: string, to?: string) {
  const mealPlan = await this.prisma.mealPlan.findUnique({ where: { householdId } });
  if (!mealPlan) return { entries: [] };

  const where: Prisma.MealPlanEntryWhereInput = {
    mealPlanId: mealPlan.id,
    ...(from && { date: { gte: new Date(from) } }),
    ...(to && { date: { ...( from ? { gte: new Date(from) } : {}), lte: new Date(to) } }),
  };

  const entries = await this.prisma.mealPlanEntry.findMany({
    where,
    orderBy: [{ date: 'asc' }, { mealType: 'asc' }],
    include: { recipe: { select: { id: true, name: true, slug: true } } },
  });
  return { entries: entries.map(toMealPlanEntryResponse) };
}
```

### Anti-Patterns to Avoid

- **Returning `RecipeDetailResponse[]` from GET /recipes:** Phase 4's `findAll` loads full includes (sections/steps/images). Phase 5 replaces this with a lean `RecipeListItem` shape that only loads what the list view needs (id, name, slug, createdAt, updatedAt, imageCount, etc.). This avoids N+1 and large response payloads.
- **Placing the public shared route at `/recipes/shared/:token`:** The NestJS `RecipesController` uses `@Controller('recipes')` with `@Get(':id')` — the string `shared` would match `:id` and return a 403/404 on recipe lookup. Use `@Controller('shared')` as a separate top-level controller.
- **Querying MealPlanEntry directly with householdId:** `MealPlanEntry` has no `householdId` column — it has `mealPlanId`. Always resolve the household's `MealPlan.id` first, then filter entries by `mealPlanId`.
- **Using `@Type(() => Number)` without `transform: true` in ValidationPipe:** The global `ValidationPipe` must have `transform: true` for `@Type` decorators to coerce query params. Verify the global pipe config in `main.ts`.
- **Random sort via Prisma orderBy:** Prisma does not support `ORDER BY RANDOM()` in `orderBy`. Use `prisma.$queryRaw` or fetch IDs + shuffle in service code. Do not try to pass `'random'` as an `orderBy` value.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Token uniqueness | Manual collision check loop | Prisma `@unique` on `shareToken` + `randomBytes(32)` | 64-char random hex collision probability is negligible; `@unique` catches the astronomically unlikely collision with a retry |
| Case-insensitive search | Custom lowercase/normalization layer | Prisma `mode: 'insensitive'` on `contains` | PostgreSQL `ILIKE` underneath; correct, efficient, zero extra code |
| Pagination math | Custom offset/limit functions | Prisma `skip`/`take` with `(page - 1) * pageSize` | Standard pattern; no edge cases at MVP scale |
| Meal plan lazy creation | Separate POST to create meal plan | `prisma.mealPlan.upsert({ where: { householdId } })` | One operation, idempotent, atomic |
| Query param type coercion | Manual `parseInt(req.query.page)` | `@Type(() => Number)` + `class-transformer` | Already in the global `ValidationPipe` chain |

**Key insight:** The entire feature set of this phase is achievable with Prisma query composition and Node.js `crypto` — no new npm packages required.

---

## Common Pitfalls

### Pitfall 1: ValidationPipe `transform` Not Enabled

**What goes wrong:** `page=2` arrives at the service as the string `"2"`, not the number `2`. Prisma `take` receives a string and may throw or silently produce unexpected results.
**Why it happens:** `@Type(() => Number)` from `class-transformer` only activates when `ValidationPipe` has `{ transform: true }`.
**How to avoid:** Verify `main.ts` uses `app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))`. If `transform: true` is missing, add it.
**Warning signs:** `page` and `pageSize` always behave as page 1 with default size; query returns wrong offsets.

### Pitfall 2: `GET /recipes/shared/:token` Route Collision

**What goes wrong:** Putting the public shared route under `RecipesController` (`@Controller('recipes')`) causes the path `/recipes/shared/:token` to be matched by the existing `@Get(':id')` handler, treating `shared` as a recipe ID.
**Why it happens:** NestJS parameterized routes (`':id'`) match any path segment including literal strings.
**How to avoid:** Use a separate `SharedController` with `@Controller('shared')` — the route becomes `/api/shared/:token` (different from `/api/recipes/*`). This also matches the `03_api_design.md` spec which shows the public route as `GET /api/recipes/shared/:token` but the implementation approach of a separate controller at `/shared/:token` avoids the collision entirely. Use `/shared/:token`.
**Warning signs:** `GET /recipes/shared/abc123` returns 404 "Recipe abc123 not found" instead of the shared recipe.

### Pitfall 3: Prisma Date vs DateTime for MealPlanEntry.date

**What goes wrong:** `MealPlanEntry.date` is `DateTime @db.Date` in the Prisma schema — stored as a date-only value (no time). Passing an ISO datetime string to `new Date()` is fine (Prisma extracts the date), but comparing with `gte`/`lte` using date-time boundaries (e.g., `2026-01-07T23:59:59`) may behave unexpectedly.
**Why it happens:** PostgreSQL `DATE` type truncates time; comparisons with datetime values depend on timezone and casting.
**How to avoid:** Pass plain date strings (e.g., `2026-01-01`) for `from`/`to` params. Use `new Date('2026-01-01')` — PostgreSQL casts correctly for date comparisons.
**Warning signs:** Entries on the boundary date are excluded from results.

### Pitfall 4: MealPlanEntry Ownership via mealPlanId

**What goes wrong:** On `PATCH /meal-plan/entries/:id` or `DELETE /meal-plan/entries/:id`, the service fetches the entry and updates/deletes it without verifying it belongs to the caller's household.
**Why it happens:** `MealPlanEntry` has no `householdId` — only `mealPlanId`. The household check requires joining through `MealPlan`.
**How to avoid:** Fetch entry with `include: { mealPlan: true }`, then check `entry.mealPlan.householdId === user.householdId`. Or fetch the household's `mealPlan.id` first and query `findUnique({ where: { id: entryId, mealPlanId: mealPlan.id } })` — this implicitly scopes to the household.
**Warning signs:** User A can delete User B's meal plan entries by guessing entry UUIDs.

### Pitfall 5: Random Sort with Prisma orderBy

**What goes wrong:** Passing `sort: 'random'` to Prisma `orderBy: { [sort]: order }` throws a Prisma validation error because `random` is not a valid field name.
**Why it happens:** Prisma `orderBy` is typed to the model's fields only.
**How to avoid:** Handle `sort === 'random'` as a special case before building the `orderBy` clause. For random order: fetch the matching recipe IDs with `select: { id: true }`, shuffle the array in JS, then re-query the paginated slice. At household scale (< 500 recipes), this is acceptable.
**Warning signs:** 500 error when `?sort=random` is passed.

### Pitfall 6: `RecipeListItem` vs `RecipeDetailResponse` in findAll

**What goes wrong:** Continuing to return `RecipeDetailResponse[]` (with full sections/steps/images) from the list endpoint. Each recipe in a 50-item list triggers a large nested join.
**Why it happens:** Phase 4 deliberately deferred this — `findAll` returns full detail as a temporary measure.
**How to avoid:** Phase 5 Plan 01 MUST replace the `findAll` implementation with a `Prisma select` that only fetches list-relevant fields. Define `RecipeListItem` in `packages/shared/src/api/recipes.ts`.
**Warning signs:** Slow list responses; large response payloads on `GET /recipes`.

---

## Code Examples

Verified patterns from official sources and existing codebase:

### RecipeListItem Shared Type (add to packages/shared/src/api/recipes.ts)
```typescript
// packages/shared/src/api/recipes.ts
export interface RecipeListItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  servingsQty: number | null;
  servingsUnit: string | null;
  shareToken: string | null;
  createdAt: string;
  updatedAt: string;
  imageCount: number;  // count of images for the list card thumbnail indicator
}
```

### Prisma Select for List (lean, no nested joins)
```typescript
// Source: Prisma docs — select + _count
const RECIPE_LIST_SELECT = {
  id: true,
  name: true,
  slug: true,
  description: true,
  servingsQty: true,
  servingsUnit: true,
  shareToken: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { images: true } },
} as const;

function toRecipeListItem(recipe: any): RecipeListItem {
  return {
    id: recipe.id,
    name: recipe.name,
    slug: recipe.slug,
    description: recipe.description ?? null,
    servingsQty: recipe.servingsQty ? Number(recipe.servingsQty) : null,
    servingsUnit: recipe.servingsUnit ?? null,
    shareToken: recipe.shareToken ?? null,
    createdAt: recipe.createdAt.toISOString(),
    updatedAt: recipe.updatedAt.toISOString(),
    imageCount: recipe._count.images,
  };
}
```

### MealPlanEntry Shared Types (new file: packages/shared/src/api/meal-plan.ts)
```typescript
export interface MealPlanEntryResponse {
  id: string;
  date: string;          // ISO date string YYYY-MM-DD
  mealType: MealType;    // import MealType from '../enums'
  recipeId: string;
  recipeName: string;
  recipeSlug: string;
  createdAt: string;
  updatedAt: string;
}

export interface MealPlanResponse {
  entries: MealPlanEntryResponse[];
}

export interface CreateMealPlanEntryRequest {
  recipeId: string;
  date: string;          // YYYY-MM-DD
  mealType: MealType;
}

export interface UpdateMealPlanEntryRequest {
  date?: string;
  mealType?: MealType;
  recipeId?: string;
}
```

### CreateMealPlanEntryDto
```typescript
// apps/api/src/meal-plan/dto/create-meal-plan-entry.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, Matches } from 'class-validator';
import { MealType } from '@recipe-manager/shared';
import { CreateMealPlanEntryRequest } from '@recipe-manager/shared';

export class CreateMealPlanEntryDto implements CreateMealPlanEntryRequest {
  @ApiProperty()
  @IsString()
  recipeId: string;

  @ApiProperty({ description: 'Date in YYYY-MM-DD format' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be YYYY-MM-DD' })
  date: string;

  @ApiProperty({ enum: MealType })
  @IsEnum(MealType)
  mealType: MealType;
}
```

### Using @Public() on SharedController
```typescript
// Source: apps/api/src/auth/decorators/public.decorator.ts (existing pattern)
import { Public } from '../auth/decorators/public.decorator';

@Controller('shared')
export class SharedController {
  constructor(private readonly sharingService: SharingService) {}

  @Get(':token')
  @Public()
  @ApiOperation({ summary: 'View a publicly shared recipe — no authentication required' })
  @ApiResponse({ status: 200, description: 'Recipe detail' })
  @ApiResponse({ status: 404, description: 'Token not found or revoked' })
  findByToken(@Param('token') token: string) {
    return this.sharingService.findByToken(token);
  }
}
```

### Foods/Units Lean Controller Pattern
```typescript
// apps/api/src/shared/foods.controller.ts
@ApiTags('foods')
@Controller('foods')
export class FoodsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'List all foods' })
  async findAll() {
    return this.prisma.food.findMany({ orderBy: { name: 'asc' } });
  }
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Full-text search with ElasticSearch | Prisma `contains` + `mode: 'insensitive'` for household-scale | N/A | No external infra needed for < 1000 records |
| Separate `GET /recipes` list vs search | Single endpoint with optional query params | N/A | Cleaner API; same endpoint for list, search, filter, sort |
| Pagination via cursor | Offset pagination (`skip`/`take`) | N/A | Offset is simpler for page-number UI; cursor is better for infinite scroll (not needed here) |

**Deprecated/outdated:**
- `Phase 4 findAll returning RecipeDetailResponse[]`: Intentional temporary state — must be replaced in Phase 5 Plan 01.

---

## Open Questions

1. **Foods/Units endpoints — include in Phase 5 or defer to a later phase?**
   - What we know: `GET /foods` and `GET /units` are specified in `03_api_design.md` and are needed by Phase 8/9 frontend ingredient pickers. They are not in any roadmap plan.
   - What's unclear: Roadmap Phase 5 plans (05-01, 05-02, 05-03) don't explicitly mention foods/units.
   - Recommendation: Add a 4th plan (05-04) for a minimal `SharedModule` with `FoodsController` + `UnitsController`. These are simple read-only endpoints (< 30 lines each). Alternatively, fold into 05-03. The planner should include them to avoid blocking Phase 9.

2. **`sort=random` implementation approach**
   - What we know: Prisma cannot express `ORDER BY RANDOM()` in typed `orderBy`; `$queryRaw` works but loses type safety
   - What's unclear: Whether to use `$queryRaw` or JS shuffle
   - Recommendation: JS shuffle — fetch all matching recipe IDs with a minimal select, shuffle the array, slice for the requested page, then fetch the full `RecipeListItem` data for those IDs. Works correctly for household scale (< 500 recipes).

3. **`GET /shared/:token` — route at `/shared/:token` or `/recipes/shared/:token`?**
   - What we know: `03_api_design.md` shows `GET /api/recipes/shared/:token` but a separate controller at `/shared/:token` avoids the route collision with `GET /recipes/:id`
   - What's unclear: Which path the frontend will use in Phase 11
   - Recommendation: Use `/shared/:token` (i.e., `@Controller('shared')`). The planner should note this deviation from the API design doc and update Phase 11's frontend implementation accordingly. The functional behavior is identical — only the URL path differs.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest 29 + ts-jest |
| Config file | `apps/api/jest.config.ts` (rootDir: `src`, testRegex: `.*\\.spec\\.ts$`) |
| Quick run command | `yarn workspace @recipe-manager/api test --testPathPattern=recipes.service\|sharing\|meal-plan` |
| Full suite command | `yarn workspace @recipe-manager/api test` |

### Phase Requirements → Test Map

Phase 5 has no formal requirement IDs (it is infrastructure for later phases), but its four success criteria map directly to testable behaviors:

| Behavior | Test Type | Automated Command | File Exists? |
|----------|-----------|-------------------|-------------|
| `findAll` with `search` returns filtered results (substring match) | unit | `yarn workspace @recipe-manager/api test --testPathPattern=recipes.service` | Exists — extend |
| `findAll` with `foodId` filters by ingredient food | unit | `yarn workspace @recipe-manager/api test --testPathPattern=recipes.service` | Exists — extend |
| `findAll` with `sort=name&order=asc` returns correct orderBy | unit | `yarn workspace @recipe-manager/api test --testPathPattern=recipes.service` | Exists — extend |
| `findAll` pagination: `page=2&pageSize=5` applies correct skip/take | unit | `yarn workspace @recipe-manager/api test --testPathPattern=recipes.service` | Exists — extend |
| `generateToken` stores token on recipe, returns it | unit | `yarn workspace @recipe-manager/api test --testPathPattern=sharing.service` | ❌ Wave 0 |
| `revokeToken` nulls the shareToken field | unit | `yarn workspace @recipe-manager/api test --testPathPattern=sharing.service` | ❌ Wave 0 |
| `findByToken` returns RecipeDetailResponse for valid token | unit | `yarn workspace @recipe-manager/api test --testPathPattern=sharing.service` | ❌ Wave 0 |
| `findByToken` throws NotFoundException for invalid token | unit | `yarn workspace @recipe-manager/api test --testPathPattern=sharing.service` | ❌ Wave 0 |
| `createEntry` creates MealPlanEntry, lazy-creates MealPlan | unit | `yarn workspace @recipe-manager/api test --testPathPattern=meal-plan.service` | ❌ Wave 0 |
| `updateEntry` verifies household ownership via mealPlanId | unit | `yarn workspace @recipe-manager/api test --testPathPattern=meal-plan.service` | ❌ Wave 0 |
| `deleteEntry` verifies household ownership, removes entry | unit | `yarn workspace @recipe-manager/api test --testPathPattern=meal-plan.service` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `yarn workspace @recipe-manager/api test --testPathPattern=<module>`
- **Per wave merge:** `yarn workspace @recipe-manager/api test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/recipes/sharing/sharing.service.spec.ts` — covers token generation, revocation, public lookup
- [ ] `src/meal-plan/meal-plan.service.spec.ts` — covers entry CRUD, lazy MealPlan creation, household scoping

*(Existing `src/recipes/recipes.service.spec.ts` needs new test cases added — it already exists and the file already mocks `prisma.recipe.findMany`)*

---

## Sources

### Primary (HIGH confidence)

- Codebase inspection: `apps/api/src/recipes/recipes.service.ts` — existing `findAll`, `findAndVerifyOwnership`, `toRecipeDetailResponse`
- Codebase inspection: `apps/api/src/recipes/recipes.module.ts` — sub-module registration pattern
- Codebase inspection: `apps/api/prisma/schema.prisma` — `Recipe.shareToken @unique`, `MealPlan` one-to-one with `Household`, `MealPlanEntry.date @db.Date`, `MealType` enum
- Codebase inspection: `packages/shared/src/common.ts` — `PaginatedResponse<T>` shape: `{ items, total, page, perPage }`
- Codebase inspection: `mvp_plans/03_api_design.md` — authoritative REST contract for all Phase 5 endpoints
- Codebase inspection: `apps/api/src/auth/decorators/public.decorator.ts` — `@Public()` implementation
- Codebase inspection: `apps/api/src/auth/guards/any-auth.guard.ts` — global guard checks `IS_PUBLIC_KEY`
- Codebase inspection: `apps/api/jest.config.ts` — test configuration confirmed
- Codebase inspection: `packages/shared/src/enums.ts` — `MealType` enum values

### Secondary (MEDIUM confidence)

- Prisma docs pattern: `findMany` with `where`, `orderBy`, `skip`, `take`, `_count` select — standard Prisma pagination idiom; consistent with Prisma 6.x API
- NestJS `@Query()` + `class-transformer` `@Type(() => Number)` — standard NestJS query param coercion pattern; stable since NestJS 7

### Tertiary (LOW confidence)

- None — all critical findings have primary source confirmation from the codebase itself.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages; all dependencies verified in monorepo
- Architecture: HIGH — patterns derived directly from Phase 4 codebase; sub-module pattern is established
- Search implementation: HIGH — Prisma `contains` with `mode: 'insensitive'` is standard; verified against schema
- Share tokens: HIGH — `crypto.randomBytes` already used in Phase 3 (password reset); `shareToken @unique` already in schema
- Meal plan: HIGH — schema fully defined in Prisma; `MealType` enum verified; one-to-one MealPlan pattern confirmed
- Pitfalls: HIGH — derived from codebase inspection and established patterns

**Research date:** 2026-03-16
**Valid until:** 2026-04-16 (stable ecosystem — NestJS 11, Prisma 6, no fast-moving dependencies)
