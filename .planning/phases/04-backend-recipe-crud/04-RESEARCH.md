# Phase 4: Backend Recipe CRUD - Research

**Researched:** 2026-03-16
**Domain:** NestJS CRUD, nested resources, Multer file upload, slug generation, shared-type contracts
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Image storage**
- Store uploaded files on local disk at `apps/api/uploads/`
- NestJS serves them as static assets at `/uploads/*` (configured in `main.ts`)
- URL stored in DB: `/uploads/{uuid}.{ext}` (relative, not absolute)
- Filenames renamed to random UUID + original extension on upload (e.g. `a1b2c3d4.jpg`) — collision-proof, no path traversal risk; original filename discarded
- No abstraction layer needed — local disk implementation is sufficient for MVP

**Lock enforcement**
- Removed from scope entirely — `isLocked` field removed from Prisma schema, shared types, DTOs, and all implementation code
- `RCP-05` removed from REQUIREMENTS.md
- No dead code, no TODO comments referencing this feature

**Duplicate recipe**
- Removed from scope entirely — `POST /recipes/:id/duplicate` endpoint not implemented
- `RCP-02` removed from REQUIREMENTS.md
- No dead code, no TODO comments referencing this feature

**Shared types scope**
- Phase 4 adds only the types needed for CRUD endpoints: `RecipeDetailResponse`, `CreateRecipeRequest`, `UpdateRecipeRequest`, and sub-resource types (section, ingredient, step, image request/response shapes)
- `RecipeListItem` and search/filter/pagination query types are deferred to Phase 5
- `GET /recipes` in Phase 4 returns full `RecipeDetailResponse[]` temporarily — Phase 5 introduces the proper list/search shape

### Claude's Discretion

- Slug generation algorithm (e.g. kebab-case name, collision resolution with `-2`, `-3` suffix)
- Exact Multer configuration (file size limits, allowed MIME types)
- Ordering strategy for reorder endpoints (set `order` field from array index)
- Error message text for 403 household ownership violations

### Deferred Ideas (OUT OF SCOPE)

- Recipe duplication (`POST /recipes/:id/duplicate`) — removed from scope, can be added in a future phase
- `isLocked` / recipe locking — removed from scope, can be added in a future phase if the need arises
- `RecipeListItem` shape and search/filter/pagination types — Phase 5
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| API-01 | Full non-admin functionality is accessible via REST API (same endpoints as UI) | All recipe, section, ingredient, step, and image CRUD endpoints are authenticated via `AnyAuthGuard` (session OR API key) — the existing guard infrastructure covers this automatically |
</phase_requirements>

---

## Summary

Phase 4 implements the full non-admin recipe CRUD API in NestJS. The project already has NestJS 11, Prisma, and all required guards in place. The work is additive: new modules, new shared types, Prisma schema cleanup (`isLocked` removal), and static file serving for images.

The patterns are fully established by Phase 3. Every sub-module (sections, ingredients, steps, images) follows the same module/controller/service/dto layout already used for auth and admin. The one new technical concern is Multer file upload + disk storage, which is straightforward with `@nestjs/platform-express` (already installed) since `multer` v2.1.1 is present in the monorepo.

The key discipline for this phase is **household scoping**: every service method that touches recipes must filter by `user.householdId` derived from `@CurrentUser()`, never from URL params. Ownership must also be verified before any mutation — a request targeting a recipe that belongs to a different household gets a 403, not a 404.

**Primary recommendation:** Follow the established module pattern precisely. Keep sub-module controllers inside `src/recipes/` folder and register them all inside `RecipesModule`. No new guard work needed — `AnyAuthGuard` is global.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@nestjs/common` | 11.1.16 | Controllers, services, guards, pipes | Already in use — project standard |
| `@nestjs/platform-express` | 11.1.16 | Multer integration via `FileInterceptor` | Bundles multer bindings; already installed |
| `multer` | 2.1.1 | Multipart file upload handling | In monorepo node_modules; platform-express depends on it |
| `@prisma/client` | 6.x | Recipe, IngredientSection, RecipeIngredient, InstructionStep, RecipeImage queries | Already in use — project ORM |
| `class-validator` | 0.14.x | DTO validation decorators | Already in use — project standard |
| `@nestjs/swagger` | 8.x | `@ApiTags`, `@ApiOperation`, `@ApiResponse`, `@ApiProperty` | Already in use — project standard |
| `@recipe-manager/shared` | workspace | `RecipeDetailResponse`, `CreateRecipeRequest`, sub-resource types | Compiler-enforced API boundary — project rule |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `uuid` (Node crypto) | built-in | Generate UUID filenames for uploads | Use `crypto.randomUUID()` — no extra package needed; available in Node 14.17+ |
| `path` (Node built-in) | built-in | `extname()` to extract file extension safely | For constructing upload filename from original extension |
| `@nestjs/serve-static` | 4.x | Serve `uploads/` folder at `/uploads/*` URL prefix | Needed for image serving; NOT yet installed |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@nestjs/serve-static` | `express.static` via `app.use()` in `main.ts` | `app.use('/uploads', express.static(uploadDir))` works without extra package; simpler for single folder; either is fine for MVP |
| `crypto.randomUUID()` | `uuid` package | uuid package not currently installed; built-in is preferred |
| `diskStorage` with custom filename | Multer default (temp dir) | Default loses the file after request ends; diskStorage is required for persistence |

**Installation (only new packages):**
```bash
# Option A: @nestjs/serve-static (preferred — consistent with NestJS idioms)
yarn workspace @recipe-manager/api add @nestjs/serve-static

# Option B: express.static in main.ts (no new package — simpler)
# No install needed — use app.use() with express built-in
```

---

## Architecture Patterns

### Recommended Project Structure

```
apps/api/src/recipes/
├── recipes.module.ts          # Imports all sub-module controllers/services
├── recipes.controller.ts      # /recipes, /recipes/:id (CRUD + landscape toggle)
├── recipes.service.ts         # Business logic: create, findAll, findOne, update, delete, slug
├── dto/
│   ├── create-recipe.dto.ts
│   └── update-recipe.dto.ts
├── sections/
│   ├── sections.controller.ts # /recipes/:id/sections, .../sections/:sectionId, .../reorder
│   ├── sections.service.ts
│   └── dto/
│       ├── create-section.dto.ts
│       └── update-section.dto.ts
├── ingredients/
│   ├── ingredients.controller.ts
│   ├── ingredients.service.ts
│   └── dto/
│       ├── create-ingredient.dto.ts
│       └── update-ingredient.dto.ts
├── steps/
│   ├── steps.controller.ts
│   ├── steps.service.ts
│   └── dto/
│       ├── create-step.dto.ts
│       └── update-step.dto.ts
└── images/
    ├── images.controller.ts
    ├── images.service.ts
    └── dto/
        └── (no create DTO — upload handled by FileInterceptor)

packages/shared/src/api/
└── recipes.ts                 # RecipeDetailResponse, CreateRecipeRequest, UpdateRecipeRequest,
                               # SectionResponse, IngredientResponse, StepResponse, ImageResponse,
                               # CreateSectionRequest, UpdateSectionRequest, ReorderRequest,
                               # CreateIngredientRequest, UpdateIngredientRequest,
                               # CreateStepRequest, UpdateStepRequest
```

### Pattern 1: Module Registration — Sub-modules inside RecipesModule

**What:** All recipe sub-module controllers and services are registered inside `RecipesModule`, not as separate top-level modules. There is no separate `SectionsModule` — the sections controller/service is a provider of `RecipesModule`.

**When to use:** Whenever sub-resources are tightly coupled to a parent and never used standalone.

**Example:**
```typescript
// apps/api/src/recipes/recipes.module.ts
import { Module } from '@nestjs/common';
import { RecipesController } from './recipes.controller';
import { RecipesService } from './recipes.service';
import { SectionsController } from './sections/sections.controller';
import { SectionsService } from './sections/sections.service';
import { IngredientsController } from './ingredients/ingredients.controller';
import { IngredientsService } from './ingredients/ingredients.service';
import { StepsController } from './steps/steps.controller';
import { StepsService } from './steps/steps.service';
import { ImagesController } from './images/images.controller';
import { ImagesService } from './images/images.service';

@Module({
  controllers: [
    RecipesController,
    SectionsController,
    IngredientsController,
    StepsController,
    ImagesController,
  ],
  providers: [
    RecipesService,
    SectionsService,
    IngredientsService,
    StepsService,
    ImagesService,
  ],
})
export class RecipesModule {}
```

Then import `RecipesModule` in `AppModule`.

### Pattern 2: Household Ownership Guard at Service Layer

**What:** Every service method that reads or mutates a recipe first verifies the recipe's `householdId` matches the calling user's `householdId`. Return 404 if the recipe doesn't exist; return 403 if it exists but belongs to a different household.

**When to use:** ALL recipe service methods. This is non-negotiable per project rules.

**Example:**
```typescript
// apps/api/src/recipes/recipes.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RecipesService {
  constructor(private readonly prisma: PrismaService) {}

  private async findAndVerifyOwnership(recipeId: string, householdId: string) {
    const recipe = await this.prisma.recipe.findUnique({ where: { id: recipeId } });
    if (!recipe) throw new NotFoundException(`Recipe ${recipeId} not found`);
    if (recipe.householdId !== householdId)
      throw new ForbiddenException('Access denied');
    return recipe;
  }
}
```

### Pattern 3: Slug Generation with Collision Handling

**What:** On recipe create, generate a URL-safe slug from the recipe name. If the slug already exists for the household, append `-2`, `-3`, etc.

**When to use:** `RecipesService.create()` only. Updates do not regenerate the slug unless the name changes (and even then, it may be better to keep the slug stable — treat slug as immutable after creation for MVP).

**Example:**
```typescript
private toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')   // strip special chars
    .replace(/\s+/g, '-')            // spaces to hyphens
    .replace(/-+/g, '-');            // collapse multiple hyphens
}

private async generateUniqueSlug(name: string, householdId: string): Promise<string> {
  const base = this.toSlug(name);
  let candidate = base;
  let counter = 2;
  while (
    await this.prisma.recipe.findFirst({ where: { householdId, slug: candidate } })
  ) {
    candidate = `${base}-${counter++}`;
  }
  return candidate;
}
```

### Pattern 4: Reorder Endpoint

**What:** `PUT /recipes/:id/sections/reorder` accepts `{ ids: string[] }` and sets each record's `order` field to its array index. Same pattern for ingredients and steps.

**When to use:** All reorder endpoints. The controller validates ownership at the recipe level; the service does a transaction-like set of updates.

**Example:**
```typescript
// ReorderDto (shared for all reorder endpoints)
export class ReorderDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  ids: string[];
}

// Service method
async reorderSections(recipeId: string, householdId: string, ids: string[]): Promise<void> {
  await this.findAndVerifyOwnership(recipeId, householdId);
  await Promise.all(
    ids.map((id, index) =>
      this.prisma.ingredientSection.update({ where: { id }, data: { order: index } })
    )
  );
}
```

### Pattern 5: File Upload with Multer diskStorage

**What:** `POST /recipes/:id/images` receives a `multipart/form-data` request. Multer intercepts the file, writes it to `apps/api/uploads/`, and the handler stores the relative URL in the DB.

**When to use:** `ImagesController.upload()` only.

**Example:**
```typescript
// apps/api/src/recipes/images/images.controller.ts
import {
  Controller, Post, Delete, Param, UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';

const multerOptions = {
  storage: diskStorage({
    destination: join(process.cwd(), 'uploads'),
    filename: (_req, file, cb) => {
      const ext = extname(file.originalname).toLowerCase();
      cb(null, `${randomUUID()}${ext}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    cb(null, allowed.includes(file.mimetype));
  },
};

@Post(':id/images')
@UseInterceptors(FileInterceptor('file', multerOptions))
async upload(
  @Param('id') recipeId: string,
  @UploadedFile() file: Express.Multer.File,
  @CurrentUser() user: any,
) {
  return this.imagesService.create(recipeId, user.householdId, file);
}
```

```typescript
// Service stores relative URL
async create(recipeId: string, householdId: string, file: Express.Multer.File) {
  await this.findAndVerifyOwnership(recipeId, householdId);
  const url = `/uploads/${file.filename}`;  // relative — stored in DB
  const maxOrder = await this.prisma.recipeImage.aggregate({
    where: { recipeId }, _max: { order: true },
  });
  return this.prisma.recipeImage.create({
    data: { recipeId, url, order: (maxOrder._max.order ?? -1) + 1 },
  });
}
```

### Pattern 6: Serving Static Uploads

Two options are valid; Option B requires no new package and is simpler for a single folder:

**Option A: `@nestjs/serve-static`**
```typescript
// apps/api/src/app.module.ts
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

ServeStaticModule.forRoot({
  rootPath: join(process.cwd(), 'uploads'),
  serveRoot: '/uploads',
  serveStaticOptions: { index: false },
})
```

**Option B: `express.static` in `main.ts`** (no new package)
```typescript
// apps/api/src/main.ts
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

const app = await NestFactory.create<NestExpressApplication>(AppModule);
app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });
```

Option B is preferred: no new dependency, consistent with how `express.static` works, and `NestExpressApplication` is already the platform.

### Pattern 7: Shared Types Structure

```typescript
// packages/shared/src/api/recipes.ts

/** Sub-resource response shapes (embedded in RecipeDetailResponse) */
export interface ImageResponse {
  id: string;
  url: string;
  order: number;
  createdAt: string;
}

export interface IngredientResponse {
  id: string;
  foodId: string;
  foodName: string;
  unitId: string | null;
  unitName: string | null;
  quantity: number | null;
  note: string | null;
  order: number;
}

export interface SectionResponse {
  id: string;
  title: string | null;
  order: number;
  ingredients: IngredientResponse[];
}

export interface StepResponse {
  id: string;
  title: string | null;
  body: string;
  order: number;
}

export interface RecipeDetailResponse {
  id: string;
  householdId: string;
  createdById: string;
  name: string;
  slug: string;
  description: string | null;
  servingsQty: number | null;
  servingsUnit: string | null;
  prepTime: number | null;
  cookTime: number | null;
  totalTime: number | null;
  performTime: number | null;
  sourceUrl: string | null;
  landscapeView: boolean;
  shareToken: string | null;
  createdAt: string;
  updatedAt: string;
  sections: SectionResponse[];
  steps: StepResponse[];
  images: ImageResponse[];
}

/** Request shapes */
export interface CreateRecipeRequest {
  name: string;
  description?: string;
  servingsQty?: number;
  servingsUnit?: string;
  prepTime?: number;
  cookTime?: number;
  totalTime?: number;
  performTime?: number;
  sourceUrl?: string;
  landscapeView?: boolean;
}

export interface UpdateRecipeRequest {
  name?: string;
  description?: string;
  servingsQty?: number | null;
  servingsUnit?: string | null;
  prepTime?: number | null;
  cookTime?: number | null;
  totalTime?: number | null;
  performTime?: number | null;
  sourceUrl?: string | null;
  landscapeView?: boolean;
}

export interface CreateSectionRequest { title?: string; }
export interface UpdateSectionRequest { title?: string | null; }
export interface ReorderRequest { ids: string[]; }

export interface CreateIngredientRequest {
  foodId: string;
  unitId?: string;
  quantity?: number;
  note?: string;
}
export interface UpdateIngredientRequest {
  foodId?: string;
  unitId?: string | null;
  quantity?: number | null;
  note?: string | null;
}

export interface CreateStepRequest { title?: string; body: string; }
export interface UpdateStepRequest { title?: string | null; body?: string; }
```

**Note on `Decimal`:** Prisma returns `Decimal` objects for `servingsQty` and `quantity` fields. Map them to `number | null` in the service mapper (`.toNumber()` or `Number()`). Dates map with `.toISOString()` as established in prior phases.

### Anti-Patterns to Avoid

- **Trusting URL params for household scoping:** Never use `:householdId` from the URL. Always derive from `req.user.householdId` injected via `@CurrentUser()`.
- **404-instead-of-403 on ownership mismatch:** A recipe that exists but belongs to another household must return 403, not 404. Returning 404 leaks no information but is misleading; project convention is 403 with a generic message.
- **Not deleting the file on image record delete:** When `DELETE /recipes/:id/images/:imageId` is called, the service must also delete the file from disk using `fs.unlink()`. Leaving orphan files is a storage leak.
- **Storing absolute URLs for images:** Store `/uploads/filename.jpg` (relative), not `http://localhost:3001/uploads/filename.jpg` (absolute). The frontend constructs the absolute URL by prepending the API base URL.
- **Putting sub-module controllers in separate top-level NestJS modules:** Per project structure (`07_project_structure.md`), recipe sub-resources belong inside `RecipesModule`, not as peers to it.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| File upload parsing | Custom multipart body parser | `FileInterceptor` from `@nestjs/platform-express` | Handles streaming, temp files, limits, cleanup — edge cases are numerous |
| DTO validation | Manual `if (!dto.name)` checks | `class-validator` decorators + `ValidationPipe` | Already global; adding decorators is all that's needed |
| Slug uniqueness check | Single DB read | Loop with `-N` counter (Pattern 3 above) | Simple and correct; race condition risk is acceptable for MVP |
| Request body validation for file endpoint | Manual MIME check in controller | `fileFilter` in Multer options | Rejects before the file is written to disk |

---

## Common Pitfalls

### Pitfall 1: `isLocked` Still in Schema

**What goes wrong:** Prisma schema still has `isLocked Boolean @default(false)` from Phase 2 design. The planner must include a migration to remove it.
**Why it happens:** CONTEXT.md decision to remove it was made after the schema was written.
**How to avoid:** Plan 04-01 must include: remove `isLocked` from `schema.prisma`, run `prisma migrate dev --name remove-isLocked`, regenerate client.
**Warning signs:** TypeScript errors if any code references `recipe.isLocked`.

### Pitfall 2: Prisma `Decimal` Serialized as Object

**What goes wrong:** `servingsQty` and `quantity` are `Decimal?` in Prisma. If you return the Prisma object directly without mapping, the JSON response contains `{ "d": [...], "e": ..., "s": ... }` instead of a number.
**Why it happens:** Prisma `Decimal` is a decimal.js object, not a JS number.
**How to avoid:** In the mapper function (e.g. `toRecipeDetailResponse`), call `.toNumber()` or `Number(value)` on every Decimal field. Add a null guard.
**Warning signs:** Frontend receives an object where it expects a number.

### Pitfall 3: Multer `process.cwd()` vs `__dirname`

**What goes wrong:** Using `__dirname` in `diskStorage.destination` points to the compiled `dist/` folder structure, not the project root. Uploads end up in an unexpected location or the directory doesn't exist at runtime.
**Why it happens:** `__dirname` in TypeScript is the compiled file's location.
**How to avoid:** Use `join(process.cwd(), 'uploads')` — `process.cwd()` is always the working directory where `nest start` is invoked, which is `apps/api/`.
**Warning signs:** 500 errors on upload; `ENOENT` in logs.

### Pitfall 4: Orphan Files on Image Delete

**What goes wrong:** The DB record is deleted but the file on disk remains, slowly filling storage.
**Why it happens:** Forgetting to call `fs.unlink()` after the Prisma delete.
**How to avoid:** In `ImagesService.delete()`: fetch the record first, delete from DB, then call `fs.promises.unlink(join(process.cwd(), 'uploads', filename))`. Swallow `ENOENT` errors (file already gone is acceptable).
**Warning signs:** Uploads directory grows unbounded.

### Pitfall 5: Sub-resource Route Collision on Reorder

**What goes wrong:** `PUT /recipes/:id/sections/reorder` and `PUT /recipes/:id/sections/:sectionId` both match — NestJS routes `reorder` as a `:sectionId` value.
**Why it happens:** NestJS matches parameterized routes eagerly if the literal route is registered after.
**How to avoid:** Register the `reorder` route (literal path) before the parameterized route `:sectionId` in the controller. In NestJS, decorator order within a class matters — put `@Put('reorder')` before `@Patch(':sectionId')`.
**Warning signs:** 400 "section 'reorder' not found" errors when calling the reorder endpoint.

### Pitfall 6: Missing `uploads/` Directory

**What goes wrong:** First file upload fails with `ENOENT: no such file or directory`.
**Why it happens:** The `uploads/` directory doesn't exist in the repo (gitignored) and is never created at startup.
**How to avoid:** Add startup logic in `main.ts` or `ImagesService.onModuleInit()` to `fs.mkdirSync(path, { recursive: true })`. Or include it in the Wave 0 setup task with a `.gitkeep`.
**Warning signs:** 500 on first image upload in a fresh environment.

### Pitfall 7: Household Scoping on Nested Sub-resources

**What goes wrong:** A section or ingredient is accessed via its own ID without verifying the parent recipe belongs to the caller's household.
**Why it happens:** Checking `section.recipeId === recipeId` but not verifying `recipe.householdId === user.householdId`.
**How to avoid:** Every sub-resource service method calls the recipe ownership check first (via the shared `findAndVerifyOwnership` helper from `RecipesService`, or a local equivalent). The recipe check is the household check.
**Warning signs:** User A can edit User B's recipe ingredients by guessing UUIDs.

---

## Code Examples

Verified patterns from codebase inspection and official sources:

### DTO Pattern (from `apps/api/src/auth/dto/login.dto.ts`)
```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, Min, IsUrl } from 'class-validator';

export class CreateRecipeDto implements CreateRecipeRequest {
  @ApiProperty({ description: 'Recipe name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Plain text description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Prep time in minutes' })
  @IsOptional()
  @IsInt()
  @Min(0)
  prepTime?: number;

  // ... other optional fields
}
```

### Service Mapper Pattern (from `apps/api/src/auth/auth.service.ts` — `toMeResponse`)
```typescript
function toRecipeDetailResponse(recipe: RecipeWithRelations): RecipeDetailResponse {
  return {
    id: recipe.id,
    householdId: recipe.householdId,
    createdById: recipe.createdById,
    name: recipe.name,
    slug: recipe.slug,
    description: recipe.description,
    servingsQty: recipe.servingsQty ? Number(recipe.servingsQty) : null,
    servingsUnit: recipe.servingsUnit,
    prepTime: recipe.prepTime,
    cookTime: recipe.cookTime,
    totalTime: recipe.totalTime,
    performTime: recipe.performTime,
    sourceUrl: recipe.sourceUrl,
    landscapeView: recipe.landscapeView,
    shareToken: recipe.shareToken,
    createdAt: recipe.createdAt.toISOString(),
    updatedAt: recipe.updatedAt.toISOString(),
    sections: recipe.sections
      .sort((a, b) => a.order - b.order)
      .map(toSectionResponse),
    steps: recipe.steps
      .sort((a, b) => a.order - b.order)
      .map(toStepResponse),
    images: recipe.images
      .sort((a, b) => a.order - b.order)
      .map(toImageResponse),
  };
}
```

### Prisma Include for Full Recipe Fetch
```typescript
const RECIPE_INCLUDE = {
  sections: {
    include: {
      ingredients: {
        include: { food: true, unit: true },
        orderBy: { order: 'asc' as const },
      },
    },
    orderBy: { order: 'asc' as const },
  },
  steps: { orderBy: { order: 'asc' as const } },
  images: { orderBy: { order: 'asc' as const } },
};
```

### Guard Pattern — Global AnyAuthGuard Already Applied
```typescript
// No guard annotation needed on recipe controllers.
// AnyAuthGuard is registered as APP_GUARD in AuthModule.
// All routes are protected by default unless decorated with @Public().
// Recipe endpoints are NOT @Public().
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Multer `dest` string option | `diskStorage` with custom `filename` function | N/A (both valid) | `dest` generates random filenames without extensions; `diskStorage` with custom fn gives UUID + ext |
| `__dirname` for upload path | `process.cwd()` | NestJS build tooling | `__dirname` points to dist/ after compilation; `process.cwd()` is stable |
| `express.static()` | `app.useStaticAssets()` on `NestExpressApplication` | NestJS 6+ | Type-safe, works with global prefix; equivalent to `express.static` under the hood |

**Deprecated/outdated:**
- `@nestjs/multer` as a separate package: Multer is bundled with `@nestjs/platform-express` since NestJS 6. Do not install a separate `@nestjs/multer` package.

---

## Open Questions

1. **`GET /recipes` temporary response shape**
   - What we know: CONTEXT.md says Phase 4 may return `RecipeDetailResponse[]` temporarily
   - What's unclear: Loading all sections/steps/images for a list endpoint is expensive. A stub returning minimal fields (id, name, slug, createdAt) avoids the N+1 but returns incomplete data.
   - Recommendation: Return `RecipeDetailResponse[]` with the full include for now (Phase 4 is correct), but note in the plan that Phase 5 will replace this with a paginated `RecipeListItem` shape. The expense is acceptable for MVP with small household datasets.

2. **Image delete: 403 or 404 when image belongs to a different recipe?**
   - What we know: Ownership is verified at the recipe level
   - What's unclear: If `imageId` is valid but doesn't belong to `recipeId` in the URL
   - Recommendation: Fetch image by `{ id: imageId, recipeId }` — if not found, return 404. This implicitly handles cross-recipe access without leaking information.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest 29 + ts-jest |
| Config file | `apps/api/jest.config.ts` (rootDir: `src`, testRegex: `.*\\.spec\\.ts$`) |
| Quick run command | `yarn workspace @recipe-manager/api test --testPathPattern=recipes` |
| Full suite command | `yarn workspace @recipe-manager/api test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| API-01 | POST /recipes creates recipe with slug, returns RecipeDetailResponse | unit | `yarn workspace @recipe-manager/api test --testPathPattern=recipes.service` | ❌ Wave 0 |
| API-01 | PATCH /recipes/:id updates fields | unit | `yarn workspace @recipe-manager/api test --testPathPattern=recipes.service` | ❌ Wave 0 |
| API-01 | DELETE /recipes/:id removes recipe | unit | `yarn workspace @recipe-manager/api test --testPathPattern=recipes.service` | ❌ Wave 0 |
| API-01 | Different-household recipe access returns 403 | unit | `yarn workspace @recipe-manager/api test --testPathPattern=recipes.service` | ❌ Wave 0 |
| API-01 | POST sections/ingredients/steps CRUD | unit | `yarn workspace @recipe-manager/api test --testPathPattern=sections\|ingredients\|steps` | ❌ Wave 0 |
| API-01 | Reorder endpoint sets order from array index | unit | `yarn workspace @recipe-manager/api test --testPathPattern=sections.service\|steps.service` | ❌ Wave 0 |
| API-01 | POST images stores file, returns URL | unit | `yarn workspace @recipe-manager/api test --testPathPattern=images.service` | ❌ Wave 0 |
| API-01 | DELETE image removes record and file | unit | `yarn workspace @recipe-manager/api test --testPathPattern=images.service` | ❌ Wave 0 |
| API-01 | Slug collision produces unique slug (base-2, base-3) | unit | `yarn workspace @recipe-manager/api test --testPathPattern=recipes.service` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `yarn workspace @recipe-manager/api test --testPathPattern=<module>`
- **Per wave merge:** `yarn workspace @recipe-manager/api test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/recipes/recipes.service.spec.ts` — covers recipe CRUD, slug generation, household scoping
- [ ] `src/recipes/sections/sections.service.spec.ts` — covers section CRUD and reorder
- [ ] `src/recipes/ingredients/ingredients.service.spec.ts` — covers ingredient CRUD and reorder
- [ ] `src/recipes/steps/steps.service.spec.ts` — covers step CRUD and reorder
- [ ] `src/recipes/images/images.service.spec.ts` — covers image create/delete (mock `fs.promises.unlink`)

---

## Sources

### Primary (HIGH confidence)
- Codebase inspection: `apps/api/src/auth/auth.service.ts`, `auth.controller.ts`, `dto/login.dto.ts` — established patterns
- Codebase inspection: `apps/api/src/admin/users/admin-users.service.ts` — service pattern, NotFoundException
- Codebase inspection: `apps/api/src/app.module.ts`, `main.ts` — module registration, global prefix
- Codebase inspection: `apps/api/jest.config.ts` — test configuration
- Codebase inspection: `apps/api/prisma/schema.prisma` — confirmed `isLocked` is still present (must be removed)
- Codebase inspection: `packages/shared/src/api/auth.ts` — shared type pattern
- `mvp_plans/03_api_design.md` — authoritative REST contract (all endpoints verified)
- `mvp_plans/01_tech_stack_and_data_model.md` — entity fields verified
- `mvp_plans/07_project_structure.md` — folder structure, naming conventions
- Package inspection: `multer` v2.1.1 present in monorepo `node_modules`; `@nestjs/platform-express` v11.1.16

### Secondary (MEDIUM confidence)
- [NestJS serve-static docs (GitHub source)](https://github.com/nestjs/docs.nestjs.com/blob/master/content/recipes/serve-static.md) — `ServeStaticModule.forRoot({ rootPath, serveRoot })`
- [FreeCodeCamp NestJS Multer article](https://www.freecodecamp.org/news/how-to-handle-file-uploads-in-nestjs-with-multer/) — `FileInterceptor`, `diskStorage`, `UploadedFile` pattern
- [NestJS file.interceptor.ts source](https://github.com/nestjs/nest/blob/master/packages/platform-express/multer/interceptors/file.interceptor.ts) — `MulterOptions` type confirmed

### Tertiary (LOW confidence)
- None — all critical findings have primary or secondary source confirmation

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages inspected in actual monorepo node_modules
- Architecture: HIGH — patterns derived directly from existing codebase (auth.service.ts, admin-users.service.ts)
- Multer patterns: MEDIUM — verified against official NestJS source and secondary articles; no breaking changes in NestJS 11 for this feature
- Pitfalls: HIGH — derived from codebase inspection (isLocked still in schema confirmed), Prisma Decimal behavior (well-known), and official source inspection

**Research date:** 2026-03-16
**Valid until:** 2026-04-16 (stable ecosystem; NestJS 11 and Prisma 6 are both current stable releases)
