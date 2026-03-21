# Stack Research

**Domain:** API ergonomics improvements — NestJS + Prisma + PostgreSQL backend
**Researched:** 2026-03-20
**Confidence:** HIGH

---

## Summary

No new packages are required for any of the four changes. Every pattern needed — case-insensitive Prisma filters, `$transaction`, nested creates, and UUID detection — is already available in the installed versions. The work is purely additive changes to existing files plus two new shared-type additions.

---

## Installed Versions (Verified from `package.json` and `node_modules`)

| Package | Installed | Source |
|---------|-----------|--------|
| `@nestjs/common` | 11.1.x | `node_modules` |
| `@nestjs/swagger` | 8.1.x | `node_modules` |
| `@prisma/client` | 6.19.2 | `node_modules` |
| `prisma` (CLI) | 6.x | devDependency |
| `class-validator` | 0.14.4 | `node_modules` |
| `class-transformer` | 0.5.1 | `node_modules` |
| `typescript` | 5.x | devDependency |

---

## Change-by-Change Analysis

### Change 1 — Case-insensitive `?name=` filter on `GET /api/foods` and `GET /api/units`

**What already exists:**
`RecipesService.findAll` already uses the exact pattern:
```typescript
name: { contains: search, mode: 'insensitive' }
```
This is Prisma's standard case-insensitive substring filter for PostgreSQL (Prisma 6 confirmed). No new syntax.

**What needs to be added:**

1. `FoodsQueryDto` and `UnitsQueryDto` — simple query DTOs with an optional `name` field.
   - Pattern to follow: `RecipeQueryDto` in `apps/api/src/recipes/dto/recipe-query.dto.ts`
   - Decorators needed: `@IsOptional()`, `@IsString()`, `@ApiPropertyOptional()` — all from already-installed `class-validator` and `@nestjs/swagger`.

2. Both controllers (`FoodsController`, `UnitsController`) currently call Prisma inline with no service layer. They need to accept `@Query() query: FoodsQueryDto` and conditionally add a `where` clause.
   - No service extraction is required for such small controllers; the `where` can stay inline.

3. No shared-type change required — the response shape (`{ id, name }` for foods; `{ id, name, abbreviation }` for units) is unchanged. The `?name=` param is purely a controller concern.

**Prisma query pattern:**
```typescript
this.prisma.food.findMany({
  where: query.name
    ? { name: { contains: query.name, mode: 'insensitive' } }
    : undefined,
  select: { id: true, name: true },
  orderBy: { name: 'asc' },
});
```

---

### Change 2 — Compound recipe create (`POST /api/recipes` with optional `ingredients[]` and `steps[]`)

**What already exists:**
`RecipesService.duplicate` already performs a nested recipe create with ingredients and steps inside a single Prisma call:
```typescript
await this.prisma.recipe.create({
  data: {
    ...fields,
    sections: { create: [...] },
    steps:    { create: [...] },
  },
  include: RECIPE_INCLUDE,
});
```
The `$transaction` wrapper is not needed here because nested writes inside a single `create` call are automatically atomic in Prisma. The `duplicate` method proves this pattern works end-to-end.

**What needs to be added:**

1. Two new inline DTO classes (not exported files — nest them inside or adjacent to `CreateRecipeDto`):
   - `CreateRecipeIngredientInlineDto` — mirrors `CreateIngredientDto` but without `order` (service assigns it)
   - `CreateRecipeStepInlineDto` — mirrors `CreateStepDto`

   ```typescript
   // class-validator decorators for inline DTOs
   class CreateRecipeIngredientInlineDto {
     @IsString() foodId: string;
     @IsOptional() @IsString() unitId?: string;
     @IsOptional() @IsNumber() @Min(0) quantity?: number;
     @IsOptional() @IsString() note?: string;
   }

   class CreateRecipeStepInlineDto {
     @IsOptional() @IsString() title?: string;
     @IsString() body: string;
   }
   ```

   Decorators needed: `@ValidateNested({ each: true })`, `@Type(() => ClassName)`, `@IsArray()`, `@IsOptional()` — all from `class-validator` and `class-transformer`, both already installed.

2. `CreateRecipeDto` gains two optional array fields:
   ```typescript
   @IsOptional()
   @IsArray()
   @ValidateNested({ each: true })
   @Type(() => CreateRecipeIngredientInlineDto)
   ingredients?: CreateRecipeIngredientInlineDto[];

   @IsOptional()
   @IsArray()
   @ValidateNested({ each: true })
   @Type(() => CreateRecipeStepInlineDto)
   steps?: CreateRecipeStepInlineDto[];
   ```

3. `CreateRecipeRequest` in `packages/shared/src/api/recipes.ts` needs the same optional fields added so `CreateRecipeDto implements CreateRecipeRequest` continues to compile.

4. `RecipesService.create` extends the nested write to include ingredients into the auto-created default section and steps, when arrays are present. No new Prisma API surface — reuses the same `sections.create[0].ingredients.create` nesting already proven in `duplicate`.

**Key constraint:** NestJS does not run `@ValidateNested` without the `@Type()` transformer decorator. `class-transformer` must be in scope. It is already installed at 0.5.1 and the global `ValidationPipe` with `transform: true` is standard NestJS setup — verify the pipe is configured with `transform: true` in `main.ts`.

---

### Change 3 — Slug fallback in `GET /api/recipes/:id`

**What already exists:**
- `RecipesService.findAndVerifyOwnership` calls `prisma.recipe.findUnique({ where: { id } })`.
- The schema has `@@unique([householdId, slug])`, which enables `findFirst({ where: { householdId, slug } })`.
- `RecipesService` already has slug logic (`toSlug`, `generateUniqueSlug`).

**What needs to be added:**

UUID format detection. No external library is required. Use a standard UUID v4 regex:

```typescript
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}
```

This is preferable to installing `uuid` (not in the dependency tree) or using `crypto.randomUUID()` (generates, doesn't validate). A 1-line regex is the lowest-friction, zero-dependency solution.

Service method change:

```typescript
async findOne(id: string, householdId: string): Promise<RecipeDetailResponse> {
  if (isUuid(id)) {
    const recipe = await this.prisma.recipe.findUnique({
      where: { id },
      include: RECIPE_INCLUDE,
    });
    if (!recipe) throw new NotFoundException(`Recipe ${id} not found`);
    if (recipe.householdId !== householdId) throw new ForbiddenException('Access denied');
    return toRecipeDetailResponse(recipe);
  }

  // Slug path
  const recipe = await this.prisma.recipe.findFirst({
    where: { householdId, slug: id },
    include: RECIPE_INCLUDE,
  });
  if (!recipe) throw new NotFoundException(`Recipe not found`);
  return toRecipeDetailResponse(recipe);
}
```

`findFirst` with `{ householdId, slug }` satisfies household scoping — no extra ownership check needed because the `householdId` is already in the `where`.

**No shared-type changes needed.** Return type is the same `RecipeDetailResponse`.

---

### Change 4 — Batch ingredient add (`POST /api/recipes/:id/sections/:sectionId/ingredients/batch`)

**What already exists:**
- `IngredientsService.create` handles single inserts with auto-incremented `order`.
- `IngredientsController` is at `recipes/:id/sections/:sectionId/ingredients`.
- `SectionResponse` in `@recipe-manager/shared` is the correct return type (per spec).

**What needs to be added:**

1. `BatchCreateIngredientsDto` — an array-body DTO:
   ```typescript
   export class BatchCreateIngredientsDto {
     @IsArray()
     @ValidateNested({ each: true })
     @Type(() => CreateIngredientDto)
     @ApiProperty({ type: [CreateIngredientDto] })
     items: CreateIngredientDto[];
   }
   ```

   This reuses the existing `CreateIngredientDto` directly — no duplication.

2. `IngredientsService.createBatch` — use `prisma.$transaction` with sequential inserts to assign correct `order` values (starting after the current max), returning the updated section with `SectionResponse` shape.

   The reason to use `$transaction` rather than `createMany` here is that `createMany` does not support `include` in Prisma — the response requires joining `food` and `unit` for each ingredient. The pattern is:
   ```typescript
   // Within $transaction:
   // 1. Get current maxOrder for the section
   // 2. Insert all items with assigned order indices
   // 3. Return section with ingredients via findUnique + SECTION_INCLUDE
   ```

   Alternatively: use `createMany` for the bulk insert (fast, single query), then fetch the section with a follow-up `findUnique`. Either approach works; the `$transaction` wrapping both ensures the response reflects exactly what was inserted.

3. New route in `IngredientsController`:
   ```typescript
   @Post('batch')
   ```
   Must be registered **before** `@Post()` to prevent route collision — same principle as the existing `@Put('reorder')` placement.

4. `SectionResponse` — already in `@recipe-manager/shared`. No changes needed.

5. A `toSectionResponse` helper — already exported from `recipes.service.ts` (the `toSectionResponse` function is defined there). The batch method can import and reuse it, or the ingredients service can have its own inline mapper.

---

## What Already Exists (Do Not Re-implement)

| Capability | Location |
|------------|----------|
| `contains` + `mode: 'insensitive'` Prisma filter | `RecipesService.findAll` |
| Nested `recipe.create` with sections + ingredients + steps | `RecipesService.duplicate` |
| `@ValidateNested` + `@Type()` pattern | (standard NestJS — confirm in `main.ts` pipe config) |
| `toSectionResponse` mapper | `apps/api/src/recipes/recipes.service.ts` (exported) |
| `RECIPE_INCLUDE` deep include | `apps/api/src/recipes/recipes.service.ts` |
| Ownership + 403/404 pattern | `RecipesService.findAndVerifyOwnership`, `IngredientsService.verifyRecipeOwnership` |
| `SectionResponse` type | `packages/shared/src/api/recipes.ts` |
| `RecipeDetailResponse` type | `packages/shared/src/api/recipes.ts` |

---

## New Packages Required

**None.** All required capabilities are provided by:
- `@prisma/client` 6.19.2 — `contains`/`mode: 'insensitive'`, `$transaction`, `createMany`, `findFirst`
- `class-validator` 0.14.4 — `@IsArray()`, `@ValidateNested({ each: true })`
- `class-transformer` 0.5.1 — `@Type()` for nested DTO transformation
- `@nestjs/swagger` 8.1.1 — `@ApiProperty({ type: [ClassName] })` for array bodies

---

## Shared Package Changes Required

`packages/shared/src/api/recipes.ts` needs two additions:

1. **`CreateRecipeIngredientInlineRequest`** — inline ingredient shape for compound create:
   ```typescript
   export interface CreateRecipeIngredientInlineRequest {
     foodId: string;
     unitId?: string;
     quantity?: number;
     note?: string;
   }
   ```

2. **`CreateRecipeStepInlineRequest`** — inline step shape for compound create:
   ```typescript
   export interface CreateRecipeStepInlineRequest {
     title?: string;
     body: string;
   }
   ```

3. **`CreateRecipeRequest`** gets two optional arrays:
   ```typescript
   export interface CreateRecipeRequest {
     // ...existing fields...
     ingredients?: CreateRecipeIngredientInlineRequest[];
     steps?: CreateRecipeStepInlineRequest[];
   }
   ```

These interfaces are structurally identical to `CreateIngredientRequest` and `CreateStepRequest` — they can be type aliases rather than new interfaces if preferred, but named types communicate intent more clearly.

---

## Validation Pipe Configuration Check

NestJS's `@ValidateNested({ each: true })` only works if:
1. `ValidationPipe` is applied globally with `transform: true`
2. `whitelist: true` is recommended (strips unknown properties)

Verify `apps/api/src/main.ts` has:
```typescript
app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
```
If `transform: true` is missing, the inline DTO arrays in Change 2 and the batch array in Change 4 will not be transformed into class instances and validation will silently fail.

---

## Alternatives Considered

| Approach | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| UUID detection | Inline regex | Install `uuid` package | `uuid` not in dep tree; regex is 1 line, zero overhead |
| Batch insert | `$transaction` + `createMany` + fetch | `Promise.all(creates)` | `$transaction` gives atomicity guarantee; `Promise.all` outside transaction allows partial inserts |
| Inline ingredient DTOs | Nest inside `CreateRecipeDto` file | Separate DTO files | Too small to warrant separate files; keeps compound create co-located |
| `createMany` for batch return | `createMany` then `findUnique` | Multiple `create` with `include` | `createMany` is one round-trip for inserts; `findUnique` is one for the response — cleaner than N `create` calls with N includes |

---

## Sources

- Codebase inspection: `apps/api/src/recipes/recipes.service.ts` — confirmed `contains`/`mode: 'insensitive'` pattern in use (HIGH confidence)
- Codebase inspection: `apps/api/src/recipes/recipes.service.ts` (duplicate method) — confirmed nested create pattern (HIGH confidence)
- Codebase inspection: `apps/api/package.json` + `node_modules` — confirmed all package versions (HIGH confidence)
- Codebase inspection: `apps/api/prisma/schema.prisma` — confirmed `@@unique([householdId, slug])` index exists (HIGH confidence)
- Codebase inspection: `packages/shared/src/api/recipes.ts` — confirmed `CreateRecipeRequest` shape and what needs extension (HIGH confidence)
- Prisma 6.x docs: `findFirst`, `createMany`, `$transaction`, `mode: 'insensitive'` all stable since Prisma 4 (HIGH confidence)

---

*Stack research for: API Ergonomics v1.2 — NestJS + Prisma recipe manager*
*Researched: 2026-03-20*
