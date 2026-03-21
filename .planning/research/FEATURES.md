# Feature Research

**Domain:** REST API ergonomics for agent clients — NestJS + Prisma + PostgreSQL
**Researched:** 2026-03-20
**Confidence:** HIGH (spec fully defined in api-ergonomics.md; implementation patterns are standard NestJS/Prisma idioms verified in codebase)

---

## Feature Landscape

### Table Stakes (Users Expect These)

These four features are the entire scope of v1.2. Each one is table stakes *for the agent client*: without them the agent cannot operate ergonomically. "Table stakes" here means the expected behavior any API consumer would take for granted when the feature is advertised.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| `?name=` substring filter on `GET /api/foods` | Any lookup-by-name endpoint must support partial, case-insensitive match; exact-match-only forces client-side scan | LOW | Prisma `contains` + `mode: 'insensitive'`; param is additive — no response shape change |
| `?name=` substring filter on `GET /api/units` | Same rationale as foods; units catalog is smaller but pattern must be consistent | LOW | Same Prisma clause; units response adds `abbreviation` field vs foods |
| Compound recipe create — optional `ingredients[]` and `steps[]` in `POST /api/recipes` | Creating a resource with its sub-resources in one call is standard REST practice for nested ownership | MEDIUM | Transaction required; default section (order: 0) already created in existing `create()`; ingredients must be appended into it; steps appended to recipe directly; response shape is the already-existing `RecipeDetailResponse` |
| Slug/UUID dual lookup — `GET /api/recipes/:id` | Named-resource lookup is expected in any REST API that exposes human-readable slugs | LOW | UUID detection via regex; slug fallback via `findFirst({ where: { householdId, slug: id } })`; same 403/404 semantics apply |
| Batch ingredient add — `POST /api/recipes/:id/sections/:sectionId/ingredients/batch` | Bulk-insert endpoint is expected whenever N-at-once calls are the natural use case | LOW | Array body; `prisma.$transaction([])`; responds with `SectionResponse` — already a shared type |

### Differentiators (Competitive Advantage)

These are improvements *over* the current API's ergonomics — not competitive differentiation in the product sense. Listed for completeness.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Compound create reducing 11 calls to 1–3 | Agent clients write dramatically simpler code; fewer network round-trips reduces latency and failure surface | MEDIUM | The real differentiator for agent DX; orders of magnitude improvement for create-from-scratch workflow |
| Slug lookup enabling stateless agent navigation | Agent can navigate by human-readable name without maintaining a UUID cache between sessions | LOW | Makes the API self-describing to agents that reason about recipe names |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| `?name=` exact-match-only filter | Simpler query | Misses plurals, accented chars, partial names (especially for Spanish food names); forces agent to guess exact spelling | Substring + case-insensitive (the spec's choice) |
| Auto-slug creation from name filter result | Agent could skip the foods lookup by just passing name strings in ingredient create | Creates implicit food creation side effects; violates admin-controlled vocabulary invariant | Keep name filter as lookup aid; require explicit `foodId`/`unitId` in all ingredient writes |
| Fallback slug lookup across all households | Agent might try `GET /api/recipes/tortilla-de-patatas` without knowing if that slug belongs to its household | Breaks household isolation; could leak recipe existence to wrong household | Slug fallback must stay household-scoped (spec already specifies this correctly) |
| Partial transaction commit on compound create | Return partial success if some ingredients fail (e.g. invalid foodId) | Leaves recipe in inconsistent state; forces client to reconcile; violates atomicity expectation | Full rollback on any validation failure; return 422 with per-item error array |
| Upsert semantics on batch insert | Silently skip or update duplicate ingredients | Surprising side effects; hard to reason about state | Strict insert only; let client decide whether to delete-first |

---

## Feature Dependencies

```
[Slug/UUID Dual Lookup]
    └──no new deps──> uses existing findOne() path; adds slug branch only

[Name Filter — Foods]
    └──no new deps──> additive query param; existing controller/service inline

[Name Filter — Units]
    └──no new deps──> same pattern as foods; independent

[Compound Recipe Create]
    └──requires──> [Default Section Creation] (already in existing create())
    └──requires──> [Valid foodId references] (FK constraint; must exist in Food table)
    └──requires──> [Valid unitId references] (FK nullable; if provided must exist in Unit table)
    └──requires──> [Transaction support in RecipesService] (new: wrap in prisma.$transaction)

[Batch Ingredient Add]
    └──requires──> [Recipe ownership verification] (existing verifyRecipeOwnership pattern)
    └──requires──> [Section existence check] (same check as single-ingredient create)
    └──requires──> [Valid foodId/unitId references] (same FK constraints as compound create)
    └──enhances──> [Compound Recipe Create] (complements #2 for the edit case)
```

### Dependency Notes

- **Compound create requires transaction wrapping:** The existing `create()` method uses a single Prisma nested write that is inherently atomic. Adding inline ingredient/step creation means that write must cover all sub-resources atomically. Prisma nested creates inside a single `prisma.recipe.create({ data: { sections: { create: [{ ingredients: { create: [...] } }] } } })` call are already transactional — this is not a new transaction boundary, just deeper nesting. However, order-assignment logic (computing `order` for each ingredient) must happen before the create call, not inside a separate query.
- **Slug lookup has no dependencies:** It is a pure routing change. UUID detection is a regex (`/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i`); the fallback is `findFirst` with `householdId` scoping. No schema change.
- **Name filter has no dependencies:** Additive `@Query()` param. Both foods and units controllers currently call `prisma` directly (no service layer). The filter is a `where` clause addition.
- **Batch insert enhances but does not require compound create:** They address different workflows (create-new vs edit-existing). Either can be implemented independently.

---

## Edge Cases by Feature

### Feature 1: Name Filter (`?name=`)

| Edge Case | Expected Behavior | HTTP Status |
|-----------|-------------------|-------------|
| `?name=` param absent | Return full list (existing behavior unchanged) | 200 |
| `?name=` empty string (`?name=`) | Treat as absent — return full list OR return full list; do not treat as "nothing matches" | 200, `[]` would be surprising; treat empty string as no-filter |
| No matches found | Return empty array `[]` — never 404 | 200 with `[]` |
| Multiple matches (e.g. `?name=sal`) | Return all matches ordered by name ascending | 200 with N items |
| Accent-insensitive matching (`huevo` vs `huevó`) | Postgres `ilike` is locale-aware; accent folding depends on collation — DO NOT promise accent-insensitive behavior unless collation is verified | Note for implementer: test with accented Spanish food names |
| `?name=` with special regex chars (`%`, `_`) | Prisma `contains` mode uses parameterized SQL — safe; no injection risk, but `%` and `_` are literal characters in `LIKE` when using Prisma's `contains` | Safe; no escaping needed by caller |

### Feature 2: Compound Recipe Create

| Edge Case | Expected Behavior | HTTP Status |
|-----------|-------------------|-------------|
| `ingredients` array absent | Create recipe + default section only (existing behavior) | 201 `RecipeDetailResponse` |
| `steps` array absent | Create recipe without steps | 201 `RecipeDetailResponse` |
| Both arrays present, all valid | Create recipe + default section + all ingredients + all steps in one transaction | 201 `RecipeDetailResponse` with populated sections[0].ingredients and steps[] |
| Invalid `foodId` in any ingredient | FK violation → transaction rolls back entirely; no partial recipe created | 422 Unprocessable Entity with error identifying which foodId failed |
| Invalid `unitId` in any ingredient | Same as invalid foodId — full rollback | 422 |
| `unitId` null/absent for an ingredient | Allowed — `unitId` is nullable per schema | Accepted; ingredient stored with null unitId |
| `quantity` absent for an ingredient | Allowed — `quantity` is nullable per schema | Accepted |
| Empty `ingredients` array `[]` | Treat as "no ingredients provided" — create default section with no ingredients | 201 |
| Empty `steps` array `[]` | Treat as "no steps provided" | 201 |
| Order assignment for ingredients | Order 0, 1, 2... in the array order; do not query DB for max order since section is brand-new | Array index is the order value |
| Order assignment for steps | Same — array index is order | — |
| Transaction failure (DB down mid-write) | Full rollback; no orphaned recipe | 500 |
| `name` collision generates a duplicate slug | Slug uniqueness check (`generateUniqueSlug`) already handles this with `-2`, `-3` suffix logic | Transparent to caller |

### Feature 3: Slug/UUID Dual Lookup

| Edge Case | Expected Behavior | HTTP Status |
|-----------|-------------------|-------------|
| `:id` is a valid UUID, recipe exists in household | Existing behavior unchanged | 200 `RecipeDetailResponse` |
| `:id` is a valid UUID, recipe does not exist | 404 (existing behavior) | 404 |
| `:id` is a valid UUID, recipe exists in different household | 403 (existing behavior) | 403 |
| `:id` is not a UUID, matches a slug in the household | Return recipe detail | 200 `RecipeDetailResponse` |
| `:id` is not a UUID, no slug match in the household | 404 — do not search other households | 404 |
| `:id` is not a UUID, slug exists in a different household | 404 — household scoping prevents cross-household lookup | 404 (not 403 — existence not disclosed) |
| Slug that looks like a UUID prefix (e.g. `abc12345`) | Not a valid UUID → treated as slug | Slug path |
| Slug collision: two recipes in same household have same slug | Cannot happen — `generateUniqueSlug` appends `-2`, `-3` suffix; slugs are unique per household | Architectural invariant |
| UUID-shaped slug (hypothetically) | Not possible in practice — slug generation strips non-alphanumeric and replaces spaces with dashes; UUIDs contain hyphens but no uppercase letters; the regex UUID check fires first | No edge case |

### Feature 4: Batch Ingredient Add

| Edge Case | Expected Behavior | HTTP Status |
|-----------|-------------------|-------------|
| Array with all valid items | All inserted in transaction; response is updated `SectionResponse` | 201 `SectionResponse` |
| Empty array `[]` | Insert nothing; return current `SectionResponse` unchanged | 200 (or 201; 200 preferred since nothing was created) |
| Any item has invalid `foodId` | Entire transaction rolls back; no ingredients inserted | 422 with error identifying which item index and which ID failed |
| Any item has invalid `unitId` | Same — full rollback | 422 |
| `sectionId` does not belong to the recipe | 404 (existing single-create pattern verifies `section.recipeId === recipeId`) | 404 |
| Recipe does not belong to the household | 403 | 403 |
| Recipe does not exist | 404 | 404 |
| Order assignment | Append after existing ingredients: compute current max order, assign `maxOrder + 1`, `maxOrder + 2`, etc. in array order | Single aggregate query before the transaction |
| Very large array (e.g. 100 ingredients) | Prisma `$transaction([])` handles it; no explicit limit needed at API layer for this domain | No special handling; Postgres handles bulk insert |
| Duplicate `foodId`+`sectionId` combination in array | Not prevented — a recipe can have the same food listed multiple times (e.g. "2 eggs" and "1 egg white") | Accepted; no uniqueness constraint on (sectionId, foodId) |

---

## Response Shapes

### Feature 1: Name Filter
No shape change. Existing response arrays:
- Foods: `Array<{ id: string; name: string }>`
- Units: `Array<{ id: string; name: string; abbreviation: string | null }>`

### Feature 2: Compound Recipe Create
Response shape: `RecipeDetailResponse` (existing shared type — no change needed)
- `sections[0].ingredients` will be populated if `ingredients[]` was provided
- `steps` will be populated if `steps[]` was provided
- No new fields on the response type; `packages/shared` does not need a new type

New request types needed in `packages/shared`:
```typescript
// Extend CreateRecipeRequest with optional nested arrays
interface CreateIngredientInline {
  foodId: string;
  unitId?: string;
  quantity?: number;
  note?: string;
}

interface CreateStepInline {
  title?: string;
  body: string;
}

interface CreateRecipeRequest {
  // ...existing fields...
  ingredients?: CreateIngredientInline[];
  steps?: CreateStepInline[];
}
```

### Feature 3: Slug/UUID Dual Lookup
No shape change. Returns `RecipeDetailResponse` on hit, same 403/404 errors on miss.

### Feature 4: Batch Ingredient Add
Response shape: `SectionResponse` (existing shared type)
```typescript
interface SectionResponse {
  id: string;
  title: string | null;
  order: number;
  ingredients: IngredientResponse[];
}
```
No new shared types needed. The endpoint must re-fetch the full section with all ingredients after the batch insert to populate `IngredientResponse.foodName` and `IngredientResponse.unitName` (denormalized display fields).

---

## MVP Definition

### Launch With (v1.2 — all four are in scope)

- [x] Name filter on foods/units — eliminates full-catalog scan on every agent session
- [x] Compound recipe create — eliminates 8+ round-trips for the most common agent workflow
- [x] Slug/UUID dual lookup — eliminates the search-then-fetch pattern for named recipe access
- [x] Batch ingredient add — eliminates N sequential calls for the edit-ingredients workflow

### Dependencies Satisfied Before Implementation

All four features depend on the existing codebase being correct (it is — reviewed above). No new infrastructure, no schema changes, no new shared types for features 1/3/4. Feature 2 requires extending `CreateRecipeRequest` in `packages/shared`.

---

## Feature Prioritization Matrix

| Feature | Agent Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Compound recipe create (#2) | HIGH — eliminates 8+ calls per new recipe | MEDIUM — nested Prisma write + DTO extension | P1 |
| Slug lookup (#3) | HIGH — enables stateless navigation | LOW — regex check + findFirst | P1 |
| Name filter (#1) | MEDIUM — reduces payload; grows in value as food catalog grows | LOW — one `where` clause | P1 |
| Batch ingredient add (#4) | MEDIUM — edit workflow; less frequent than create | LOW — transaction loop | P1 |

All four are P1 for this milestone. Compound create (#2) and slug lookup (#3) together unlock the primary agent workflow.

---

## Implementation Notes for Roadmap

### No Schema Migration Required
All four changes are service/controller/DTO layer only. The Prisma schema is not modified.

### Shared Package Changes
Only feature #2 requires a `packages/shared` update (`CreateRecipeRequest` extended with optional `ingredients` and `steps` arrays, plus new inline DTO interfaces). Features 1, 3, 4 add no new shared types.

### Route Registration Risk
Batch endpoint `POST .../ingredients/batch` must be registered **before** `POST .../ingredients/:ingredientId`-style routes to avoid NestJS treating `batch` as a path param. The existing code already has a comment noting this risk (`// CRITICAL: reorder before :ingredientId to prevent route collision`). The same pattern applies.

### Transaction Boundary for Compound Create
The existing `prisma.recipe.create()` call uses Prisma's nested write API which is inherently atomic. Extending it with inline `ingredients` and `steps` keeps everything in one Prisma write — no explicit `prisma.$transaction()` call needed for feature #2. Feature #4 (batch insert) does need `prisma.$transaction([...updates])` or `prisma.$transaction(async (tx) => {...})` because it involves multiple separate `create` calls.

### Validation Error Shape
For features #2 and #4, invalid `foodId`/`unitId` values will produce Prisma FK constraint errors (P2003). These should be caught and converted to 422 with a structured error body identifying the offending field/index. Standard NestJS `BadRequestException` or a custom `UnprocessableEntityException` with `{ message, field, index }` shape is appropriate.

---

## Sources

- `plans/03_api-ergonomics/api-ergonomics.md` — PRIMARY spec; defines all four changes with examples (HIGH confidence)
- `.planning/PROJECT.md` — milestone context and constraints (HIGH confidence)
- `apps/api/src/recipes/recipes.service.ts` — existing create/findOne patterns (HIGH confidence)
- `apps/api/src/recipes/ingredients/ingredients.service.ts` — existing single-ingredient create pattern (HIGH confidence)
- `apps/api/src/shared/foods.controller.ts` / `units.controller.ts` — current controller structure (HIGH confidence)
- `packages/shared/src/api/recipes.ts` — shared response types (HIGH confidence)
- `apps/api/prisma/schema.prisma` — data model FK constraints and nullability (HIGH confidence)

---
*Feature research for: API ergonomics improvements (v1.2) — NestJS + Prisma recipe manager*
*Researched: 2026-03-20*
