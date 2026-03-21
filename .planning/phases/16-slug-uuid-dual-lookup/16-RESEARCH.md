# Phase 16: Slug/UUID Dual Lookup - Research

**Researched:** 2026-03-21
**Domain:** NestJS service layer — dual-key lookup with Prisma, household scoping, Swagger annotation
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- UUID detection: regex `/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i` — no new dependency
- `isUuid` helper is inline in `recipes.service.ts` — single-use, no reason to share
- Ambiguous input (neither UUID nor slug, e.g. "abc123") is treated as a slug — attempt lookup, return 404 on miss
- New `findByIdOrSlug(idOrSlug: string, householdId: string)` method called only by `findOne`
- `findAndVerifyOwnership` is unchanged — used only by write ops (update, delete, duplicate)
- Slug lookup scope: `GET /recipes/:id` only — write ops stay UUID-only
- 404 message format: same as current (`Recipe ${id} not found`)
- Integration tests in `apps/api/integration_tests/` — consistent with other API phases
- Test data: seed a recipe with a known name and use its auto-generated slug in assertions
- Cross-household 404 test: slug of household B returns 404 when authenticated as household A user

### Claude's Discretion

- Swagger `@ApiParam` description wording for `:id` field

### Deferred Ideas (OUT OF SCOPE)

None.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ERGO-04 | User can look up a recipe by its slug (`GET /api/recipes/tortilla-de-patatas`) — same response shape and household scoping as UUID lookup; UUID still works unchanged | Prisma `@@unique([householdId, slug])` supports `findFirst({ where: { householdId, slug } })` with full `RECIPE_INCLUDE`; `toRecipeDetailResponse()` reused unchanged; UUID regex branch hits `findUnique` as today |
</phase_requirements>

---

## Summary

Phase 16 is a contained service-layer change: `findOne` in `RecipesService` is rerouted through a new `findByIdOrSlug` method that branches on whether the incoming string looks like a UUID v4. The UUID branch preserves the existing `findAndVerifyOwnership` path (well, actually replaces the internal call with a `findUnique`; `findAndVerifyOwnership` itself stays untouched for write ops). The slug branch uses Prisma's `findFirst` with `{ householdId, slug }` in the `where` predicate so that a slug belonging to another household is invisible — it returns null, which becomes 404. No schema migration, no new package, no shared-type change is required.

The Prisma schema already has `@@unique([householdId, slug])` on the `Recipe` model. The `RECIPE_INCLUDE` constant and `toRecipeDetailResponse()` mapper are both reusable unchanged. The controller's `findOne` handler does not change its signature — only the service method it calls internally changes.

The integration-test pattern is established in `schema.integration-spec.ts` and `seed.integration-spec.ts`: a `PrismaClient` instance against `DATABASE_URL`, no HTTP layer, no NestJS app boot. New tests for this phase follow the same file naming convention (`recipes-slug.integration-spec.ts`) and seed their own household/user/recipe fixture inline.

**Primary recommendation:** Add `isUuid` helper function + `findByIdOrSlug` method to `recipes.service.ts`, update `findOne` to call it, add `@ApiParam` to the controller's `GET :id` handler, and write integration tests covering UUID hit, slug hit, cross-household slug, and non-existent slug.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @prisma/client | already installed | `findFirst` for slug branch, `findUnique` for UUID branch | Project ORM — no change |
| @nestjs/swagger | already installed | `@ApiParam` on `GET :id` | Project API docs layer |
| jest + ts-jest | already installed | Integration tests under `jest-integration.config.ts` | Project test stack |

No new packages required.

**Installation:** None.

---

## Architecture Patterns

### Recommended Project Structure

No new files in `src/`. One new test file:

```
apps/api/
├── src/recipes/
│   └── recipes.service.ts      # add isUuid + findByIdOrSlug, update findOne
│   └── recipes.controller.ts   # add @ApiParam to GET :id
└── integration_tests/
    └── recipes-slug.integration-spec.ts   # new
```

### Pattern 1: isUuid Helper (inline, private scope)

**What:** A module-level function (not a class method) that returns `true` for UUID v4 strings only.

**When to use:** Called once, at the top of `findByIdOrSlug`, to decide which Prisma branch to execute.

**Example:**

```typescript
// recipes.service.ts — above the @Injectable() class

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
```

### Pattern 2: findByIdOrSlug (service method)

**What:** Branches on `isUuid`, uses `RECIPE_INCLUDE` for both branches, throws `NotFoundException` for any miss regardless of branch.

**When to use:** Called only by `findOne`. Write ops continue using `findAndVerifyOwnership`.

**Example:**

```typescript
async findByIdOrSlug(idOrSlug: string, householdId: string) {
  let recipe: any;

  if (isUuid(idOrSlug)) {
    recipe = await this.prisma.recipe.findUnique({
      where: { id: idOrSlug },
      include: RECIPE_INCLUDE,
    });
    // UUID hit but wrong household → 404, not 403
    if (recipe && recipe.householdId !== householdId) recipe = null;
  } else {
    recipe = await this.prisma.recipe.findFirst({
      where: { householdId, slug: idOrSlug },
      include: RECIPE_INCLUDE,
    });
  }

  if (!recipe) throw new NotFoundException(`Recipe ${idOrSlug} not found`);
  return recipe;
}
```

**Key implementation note:** The UUID branch must also enforce household scope. The existing `findAndVerifyOwnership` throws `ForbiddenException` for cross-household UUID access. `findByIdOrSlug` must throw `NotFoundException` instead (403 leaks existence; requirement says 404-only). So the UUID branch does NOT call `findAndVerifyOwnership` — it calls `findUnique` directly and sets `recipe = null` if `householdId` mismatches.

### Pattern 3: Updated findOne

```typescript
async findOne(id: string, householdId: string): Promise<RecipeDetailResponse> {
  const recipe = await this.findByIdOrSlug(id, householdId);
  return toRecipeDetailResponse(recipe);
}
```

### Pattern 4: Controller @ApiParam annotation

**What:** `@ApiParam` from `@nestjs/swagger` documents that `:id` accepts both UUID and slug.

```typescript
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';

@Get(':id')
@ApiOperation({ summary: 'Get a recipe by UUID or slug' })
@ApiParam({
  name: 'id',
  description: 'Recipe UUID (e.g. 550e8400-e29b-41d4-a716-446655440000) or human-readable slug (e.g. tortilla-de-patatas)',
})
@ApiResponse({ status: 200, description: 'Recipe detail' })
@ApiResponse({ status: 404, description: 'Not found' })
findOne(@Param('id') id: string, @CurrentUser() user: any) {
  return this.recipesService.findOne(id, user.householdId);
}
```

Note: The existing `@ApiResponse({ status: 403 })` should be removed from this endpoint — `findOne` no longer throws 403, only 404.

### Pattern 5: Integration Test Structure

The project's integration tests instantiate `PrismaClient` directly against `DATABASE_URL` with no NestJS app boot. Tests seed their own fixtures inline using `prisma.X.create()` and clean up in `afterAll`. File naming: `*.integration-spec.ts` (picked up by `jest-integration.config.ts`).

```typescript
// apps/api/integration_tests/recipes-slug.integration-spec.ts
import { PrismaClient } from '@prisma/client';
import { RecipesService } from '../src/recipes/recipes.service';
import { PrismaService } from '../src/prisma/prisma.service';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('ERGO-04: Slug/UUID dual lookup', () => {
  // Seed a household, user, and recipe with known slug in beforeAll
  // Run: UUID hit, slug hit, slug cross-household → 404, non-existent → 404
});
```

**Important fixture note:** Integration tests must seed a `Household`, `User`, and `Recipe` (and a second `Household`/`User` for the cross-household test). Clean up with `prisma.recipe.deleteMany` + `prisma.user.deleteMany` + `prisma.household.deleteMany` scoped to test-created IDs in `afterAll`.

The `RecipesService` cannot be instantiated with the real NestJS DI container in a bare integration test. The established pattern in this project is **Prisma-direct tests only** (no service class instantiation in integration tests). Test the behavior via direct Prisma assertions on data shape, or test the HTTP layer via `supertest` against a booted app. Since no `test/jest-e2e.json` pattern is used for these tests, the correct approach is to verify the Prisma data state directly and separately test the service with mocks in unit tests.

**Revised integration test strategy:** Given the existing integration test files (`schema.integration-spec.ts`, `seed.integration-spec.ts`) test Prisma directly without booting NestJS, the new integration tests for ERGO-04 should:
1. Verify that `findFirst({ where: { householdId, slug } })` with correct householdId returns the recipe.
2. Verify that `findFirst({ where: { householdId: wrongHhId, slug } })` returns null (not the recipe).
3. Unit test (in `recipes.service.spec.ts`) covers `findByIdOrSlug` calling the right branch and throwing `NotFoundException` on miss.

### Anti-Patterns to Avoid

- **Post-fetch household check on slug:** Never `findFirst({ where: { slug } })` and then check `recipe.householdId`. Always include `householdId` in the `where` predicate — null result is always 404.
- **Calling findAndVerifyOwnership from findByIdOrSlug:** `findAndVerifyOwnership` throws `ForbiddenException`. `findByIdOrSlug` must only throw `NotFoundException`. They serve different callers.
- **Treating all non-UUID strings as errors:** Ambiguous strings (e.g. "abc123") are treated as slugs, not rejected. Return 404 on miss.
- **Removing @ApiResponse 403 without checking write ops:** Write ops (PATCH, DELETE, duplicate) still use `findAndVerifyOwnership` which throws 403. Only the GET `:id` endpoint loses the 403 response annotation.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| UUID validation | Custom length/format checks | Regex provided in CONTEXT.md | Regex is already the spec — no library overhead needed |
| Slug uniqueness per household | Manual counter logic | Already exists: `generateUniqueSlug()` in `RecipesService` | Phase 16 reads existing slugs only, never generates |
| Full recipe hydration | Inline Prisma include | `RECIPE_INCLUDE` constant (line 17 of recipes.service.ts) | Already defined and tested |

**Key insight:** This phase adds zero new abstractions. Every building block (`RECIPE_INCLUDE`, `toRecipeDetailResponse`, `NotFoundException`, `@CurrentUser`) already exists.

---

## Common Pitfalls

### Pitfall 1: UUID Branch Leaks 403

**What goes wrong:** Developer calls `findAndVerifyOwnership` from `findByIdOrSlug` for the UUID branch. Cross-household UUID access throws `ForbiddenException` (403), which leaks that the UUID exists.

**Why it happens:** `findAndVerifyOwnership` was designed for write ops where 403 is appropriate. Reusing it in read ops breaks the security requirement.

**How to avoid:** In `findByIdOrSlug`, use `findUnique` directly. If `recipe.householdId !== householdId`, set `recipe = null` — the null path throws `NotFoundException`.

**Warning signs:** Integration test for cross-household UUID returns 403 instead of 404.

### Pitfall 2: Slug Branch Missing householdId in Where

**What goes wrong:** `prisma.recipe.findFirst({ where: { slug: idOrSlug } })` — no `householdId` filter. Returns a recipe from another household.

**Why it happens:** Forgetting that slugs are unique per household, not globally.

**How to avoid:** Always `where: { householdId, slug: idOrSlug }`. The `@@unique([householdId, slug])` constraint in the schema documents this invariant.

**Warning signs:** Cross-household test returns 200 instead of 404.

### Pitfall 3: 403 Response Still Documented on GET :id

**What goes wrong:** `@ApiResponse({ status: 403 })` stays on `findOne` after the behavior change. Swagger misleads API clients.

**Why it happens:** Controller decorator left untouched while only the service changed.

**How to avoid:** Remove the 403 ApiResponse from `GET :id` in the controller update.

### Pitfall 4: isUuid Function Placed Inside the Class

**What goes wrong:** `private isUuid()` as a class method — adds noise to the class interface and shows up in mock verification.

**Why it happens:** Habit of putting all functions inside the class.

**How to avoid:** Module-level function above `@Injectable()`. It has no dependencies.

---

## Code Examples

### Prisma findFirst with compound householdId + slug filter

```typescript
// Source: prisma/schema.prisma @@unique([householdId, slug])
// This query uses the compound unique index — single-row lookup, not a scan
const recipe = await this.prisma.recipe.findFirst({
  where: { householdId, slug: idOrSlug },
  include: RECIPE_INCLUDE,
});
```

Note: `findFirst` rather than `findUnique` because there is no single-field unique on `slug`. The compound unique `@@unique([householdId, slug])` could theoretically be used with `findUnique({ where: { householdId_slug: { householdId, slug } } })` using Prisma's generated compound unique accessor. Either works; `findFirst` is simpler and sufficiently indexed by the compound unique.

### @ApiParam import and usage

```typescript
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';

@Get(':id')
@ApiOperation({ summary: 'Get a recipe by UUID or slug' })
@ApiParam({
  name: 'id',
  description: 'Recipe UUID or human-readable slug (e.g. tortilla-de-patatas)',
})
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `findOne` calls `findAndVerifyOwnership` (UUID-only) | `findOne` calls `findByIdOrSlug` (UUID or slug) | Phase 16 | Read path supports both; write path unchanged |

**No deprecated patterns involved.** All NestJS/Prisma APIs used are stable and present in the current install.

---

## Open Questions

1. **`findUnique` with compound unique accessor vs `findFirst`**
   - What we know: Prisma generates a compound unique accessor `householdId_slug` from `@@unique([householdId, slug])`. Either `findUnique({ where: { householdId_slug: { ... } } })` or `findFirst({ where: { householdId, slug } })` works.
   - What's unclear: Preference is not locked in CONTEXT.md.
   - Recommendation: Use `findFirst` — simpler syntax, semantically clear, same index used.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest + ts-jest |
| Config file | `apps/api/jest-integration.config.ts` (integration) / `apps/api/jest.config.*` (unit) |
| Quick run command | `yarn workspace @recipe-manager/api test --testPathPattern=recipes-slug` |
| Full suite command | `yarn workspace @recipe-manager/api test:integration` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ERGO-04 | UUID lookup returns RecipeDetailResponse | unit | `yarn workspace @recipe-manager/api test --testPathPattern=recipes.service` | ✅ (recipes.service.spec.ts — add cases) |
| ERGO-04 | Slug lookup returns same RecipeDetailResponse shape | unit | `yarn workspace @recipe-manager/api test --testPathPattern=recipes.service` | ✅ (add to spec) |
| ERGO-04 | Slug from different household returns 404 | unit | `yarn workspace @recipe-manager/api test --testPathPattern=recipes.service` | ✅ (add to spec) |
| ERGO-04 | Non-existent UUID returns 404 | unit | `yarn workspace @recipe-manager/api test --testPathPattern=recipes.service` | ✅ (existing pattern) |
| ERGO-04 | Prisma slug branch uses householdId in where predicate | integration | `yarn workspace @recipe-manager/api test:integration` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `yarn workspace @recipe-manager/api test --testPathPattern=recipes.service`
- **Per wave merge:** `yarn workspace @recipe-manager/api test:integration`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `apps/api/integration_tests/recipes-slug.integration-spec.ts` — covers ERGO-04 household scoping via Prisma direct

*(Unit test additions go into the existing `apps/api/src/recipes/recipes.service.spec.ts`)*

---

## Sources

### Primary (HIGH confidence)

- Direct file read: `apps/api/src/recipes/recipes.service.ts` — confirmed `findAndVerifyOwnership`, `RECIPE_INCLUDE`, `toRecipeDetailResponse`, `generateUniqueSlug` signatures and locations
- Direct file read: `apps/api/src/recipes/recipes.controller.ts` — confirmed current `findOne` wiring and Swagger decorators
- Direct file read: `apps/api/prisma/schema.prisma` — confirmed `@@unique([householdId, slug])` at line 126, `slug String` at line 108
- Direct file read: `apps/api/src/recipes/recipes.service.spec.ts` — confirmed mock pattern and existing `findOne` unit test coverage
- Direct file read: `apps/api/integration_tests/schema.integration-spec.ts` — confirmed PrismaClient-direct integration test pattern
- Direct file read: `apps/api/jest-integration.config.ts` — confirmed test runner config and file pattern

### Secondary (MEDIUM confidence)

- Project CONTEXT.md — all locked decisions verified against existing code (decisions are consistent with current implementation)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed, no new dependencies
- Architecture: HIGH — all patterns verified directly from existing source files
- Pitfalls: HIGH — derived from spec requirements (404-only) and Prisma schema (compound unique), cross-checked against existing `findAndVerifyOwnership` behavior
- Test patterns: HIGH — verified from existing integration test files

**Research date:** 2026-03-21
**Valid until:** 2026-04-21 (stable domain — NestJS/Prisma APIs unchanged)
