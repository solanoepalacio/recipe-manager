# Pitfalls Research

**Domain:** Adding compound creates, batch endpoints, dual-lookup, and query param filters to a live NestJS/Prisma app with an active UI client
**Researched:** 2026-03-20
**Confidence:** HIGH — all pitfalls derived directly from the existing codebase, not from generalised web search

---

## Critical Pitfalls

### Pitfall 1: Compound Create Breaks the Shared Type Contract If `CreateRecipeRequest` Is Widened

**What goes wrong:**
`CreateRecipeDto` implements `CreateRecipeRequest` from `packages/shared`. If the new optional `ingredients` and `steps` arrays are added to the DTO without adding them to `CreateRecipeRequest`, TypeScript will reject the DTO class. If they are added to `CreateRecipeRequest` instead, the UI's `api.post<RecipeDetailResponse>('/recipes', body)` call must be updated because every call site typed against `CreateRecipeRequest` will now show a type mismatch — the UI sends the old narrow shape and the compiler emits warnings or, if types are only checked at build time, silently passes wrong data at runtime.

**Why it happens:**
The project constraint is that `packages/shared` is the API boundary source of truth. The DTO `implements CreateRecipeRequest` enforces this. Developers adding agent-only fields to the DTO frequently forget this bidirectional enforcement and widen the shared interface, breaking the UI's typed call sites.

**How to avoid:**
Create a separate `CreateRecipeCompoundDto` that extends `CreateRecipeDto` and adds the optional arrays, but does NOT flow back into `CreateRecipeRequest`. The controller method signature and Swagger schema reflect the compound DTO; the shared type `CreateRecipeRequest` stays narrow. The UI never imports `CreateRecipeCompoundDto` — it stays in `apps/api`.

Alternatively, add `ingredients?: CreateIngredientRequest[]` and `steps?: CreateStepRequest[]` to `CreateRecipeRequest` with `@IsOptional()` on both. Because both fields are optional and the UI never sends them, no existing UI call breaks. This is acceptable if the intent is to allow future UI use of compound create; otherwise the separate-DTO approach keeps the shared contract leaner.

**Warning signs:**
- TypeScript compilation errors in `apps/web` after modifying `CreateRecipeRequest`
- A UI test (e.g., `RecipeEditor.test.tsx`) fails with unexpected required-field errors
- Swagger UI shows `ingredients` as required in the POST body

**Phase to address:**
Change 2 (Compound recipe create) — define the DTO extension strategy before writing any service code.

---

### Pitfall 2: Compound Create Transaction Leaves a Partial Recipe on Validation Failure

**What goes wrong:**
The current `RecipesService.create` creates the recipe and its default section in a single `prisma.recipe.create` with a nested `sections: { create: [...] }`. If ingredient or step insertion is added outside this nested create (e.g., in a loop after the initial `prisma.recipe.create` call), a validation failure on ingredient 3 of 5 leaves a saved recipe with 2 orphaned ingredients and no steps — an inconsistent state the UI will display as a broken recipe.

**Why it happens:**
Developers extend the existing `create` method incrementally, appending ingredient inserts after the recipe create, rather than restructuring the whole operation into a `prisma.$transaction`. The existing code has no transaction boundary because none was needed before.

**How to avoid:**
Wrap the entire compound create — recipe row, section row, all ingredient rows, all step rows — in a single `prisma.$transaction([...])` or interactive transaction (`prisma.$transaction(async (tx) => { ... })`). Use the interactive form because nested `create` with relations inside a `$transaction` array is harder to reason about and Prisma's interactive transactions handle relation creation cleanly. If the transaction throws, nothing is committed.

Specifically: do not call `prisma.recipe.create` followed by separate `prisma.recipeIngredient.createMany` calls outside a transaction.

**Warning signs:**
- Integration test: send compound create with an invalid `foodId` (non-existent UUID) — recipe row appears in DB but no ingredients
- The service method grows beyond the existing `prisma.recipe.create` call without a `$transaction` wrapper

**Phase to address:**
Change 2 (Compound recipe create) — transaction boundary must be part of the service design before implementation.

---

### Pitfall 3: Order Values for Batch-Inserted Ingredients Are Inconsistent with `MAX(order) + 1` Pattern

**What goes wrong:**
`IngredientsService.create` computes `order` as `(MAX(order) ?? -1) + 1` for each individual insert. If batch insert naively loops and calls this same method N times concurrently (e.g., via `Promise.all`), all N calls may read the same `MAX(order)` before any write completes, producing N ingredients all assigned `order = 0` — a tie that makes sorting non-deterministic. Even serial calls inside a transaction can have this race if the aggregate query is called before each insert in a tight loop.

**Why it happens:**
Developers reuse the existing single-ingredient service method inside the batch endpoint because it already handles ownership verification and order computation. The implicit assumption is that each call sees the writes from the previous call, which is not true when calls are parallelised or when the aggregate is computed before any insert in the batch.

**How to avoid:**
In the batch service method, compute the starting `order` once — `MAX(order) ?? -1` — then assign `startOrder + index + 1` to each ingredient in the batch before inserting. Use `prisma.recipeIngredient.createMany` (or nested creates inside a transaction) to insert all rows in one statement rather than N individual creates. Do not delegate to `IngredientsService.create` inside the batch loop.

**Warning signs:**
- Integration test: batch-insert 3 ingredients, then fetch the section — all three have `order: 0`
- The batch endpoint response shows ingredients in insertion-order for the first call but random order on refresh

**Phase to address:**
Change 4 (Batch ingredient add) — order assignment strategy must be explicit in the plan before coding.

---

### Pitfall 4: Batch Insert Response Shape Does Not Match `SectionResponse` Contract

**What goes wrong:**
The spec says the batch endpoint returns `SectionResponse` (`id, title, order, ingredients[]`). `SectionResponse.ingredients` is typed as `IngredientResponse[]`, which requires `foodName` and `unitName` — the joined names, not just the foreign keys. A naive `prisma.ingredientSection.findUnique` without `include: { ingredients: { include: { food: true, unit: true } } }` returns the raw DB row, which has `foodId`/`unitId` but no `foodName`/`unitName`. The UI components consuming `SectionResponse` (`SectionAccordion`, `IngredientList`, `IngredientSectionEditor`) will render `undefined` for food and unit names — a silent visual regression, not a crash.

**Why it happens:**
The existing `RECIPE_INCLUDE` constant in `recipes.service.ts` handles the full include tree for recipe-level fetches. When a new endpoint fetches only a section, developers forget to replicate the ingredient join. The missing join does not throw; it produces structurally incomplete data.

**How to avoid:**
Define a reusable `SECTION_WITH_INGREDIENTS_INCLUDE` constant (mirroring the section sub-tree from `RECIPE_INCLUDE`) and use it in the batch endpoint's response query. Pipe the result through the existing `toSectionResponse` helper, which calls `toIngredientResponse`, which requires `food.name` and `unit?.name`. If the include is missing, `toIngredientResponse` will throw at `ing.food.name`, failing fast in tests rather than silently.

**Warning signs:**
- Batch endpoint response contains ingredients with `foodName: undefined`
- TypeScript will not catch this if the Prisma return type is typed as `any` or if the mapper is bypassed
- `RecipeEditor.test.tsx` or `IngredientEditor.test.tsx` renders blank food name after batch add

**Phase to address:**
Change 4 (Batch ingredient add) — response mapper must be tested explicitly.

---

### Pitfall 5: Slug/UUID Dual Lookup Applies the Wrong Household Scope on the Slug Path

**What goes wrong:**
The existing `findAndVerifyOwnership` uses `prisma.recipe.findUnique({ where: { id } })` followed by a `householdId` check. For slugs, the lookup must change to `prisma.recipe.findFirst({ where: { householdId, slug } })` — the household scope is part of the query predicate, not a post-query check. If the slug path uses `findFirst({ where: { slug } })` without `householdId`, a recipe belonging to a different household can be retrieved, then the ownership check throws 403. This produces a 403 where a 404 is the correct response — the caller learns that a recipe with this slug exists in the system, which is an information leak.

**Why it happens:**
Developers adapt `findAndVerifyOwnership` by adding a slug branch that replicates the UUID logic: `findFirst({ where: { slug } })` then post-check `householdId`. The post-check returns 403 instead of 404, and the slug is confirmed to exist.

**How to avoid:**
The slug branch must use `findFirst({ where: { slug, householdId } })`. If the result is `null` (no recipe with that slug in this household), throw `NotFoundException`. Never pass a cross-household recipe object to the ownership check — ownership check for slugs is the `householdId` in the query predicate, full stop.

**Warning signs:**
- Integration test: user A's recipe slug fetched by user B (different household) — expect 404, receive 403
- The slug path calls `findFirst` without `householdId` in the `where` clause

**Phase to address:**
Change 3 (Slug-based recipe lookup) — the security invariant must be in the test spec, not just the implementation.

---

### Pitfall 6: UUID Detection Regex Misidentifies Slugs That Look Like UUIDs

**What goes wrong:**
Slugs are generated from recipe names by lowercasing, stripping non-alphanumeric characters, and joining with hyphens. The `toSlug` method in `recipes.service.ts` produces strings like `tortilla-de-patatas`. However, a recipe named something like `receta-1a2b3c4d-5678-abcd-ef01-234567890abc` (pathological but possible) would produce a slug that matches the UUID v4 pattern. The dual-lookup code, if it does `if (isUUID(id)) { findByUUID } else { findBySlug }`, would incorrectly attempt a UUID lookup against a slug-format value and return 404.

A more practical risk: UUIDs in URL params are always lowercase hex + hyphens. The slug generator already produces lowercase + hyphens. The standard UUID v4 regex `^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$` is precise enough that false positives from real recipe names are astronomically unlikely — but the detection must use the strict v4 regex, not a loose "looks like 8-4-4-4-12" check.

**Why it happens:**
Developers use a loose UUID check (e.g., length === 36 and contains hyphens in the right places) rather than the strict v4 pattern with the version nibble (`4`) and variant nibble (`8-9-a-b`) locked.

**How to avoid:**
Use the NestJS/class-validator `isUUID(value, '4')` utility or the standard v4 regex. It is strict enough to make false positives impossible from slug-generated strings. Document the assumption explicitly in the method comment.

**Warning signs:**
- UUID detection function accepts strings like `12345678-1234-1234-1234-1234567890ab` (version nibble not `4`) — those are not valid UUIDs and should fall through to slug lookup
- No unit test covering the UUID/slug disambiguation boundary

**Phase to address:**
Change 3 (Slug-based recipe lookup) — UUID detection is a single pure function; add a dedicated unit test.

---

### Pitfall 7: `?name=` Filter on Foods/Units Invalidates the UI's TanStack Query Cache Key

**What goes wrong:**
The UI fetches foods with `queryKey: queryKeys.foods.list()` (a fixed key) and `queryFn: () => api.get<Food[]>('/foods')` — no params. This works because the UI always wants all foods for the local-filter ingredient picker. If the backend adds `?name=` support and the UI's query key or URL is accidentally changed to include the param, TanStack Query will treat parameterised and unparameterised requests as different cache entries, doubling the fetches and splitting the cache. More critically: if a developer "improves" the IngredientPicker by switching to server-side filtering (using `?name=debouncedSearch`), every keystroke triggers a new network request and the full list is never cached — the picker becomes sluggish and the offline/cached UX disappears.

**Why it happens:**
The `?name=` filter is added to the backend and a developer sees an opportunity to remove the client-side `filteredFoods` logic in `IngredientPicker.tsx`, replacing it with a server-filtered query. This seems like a cleanup but breaks the cache model that makes the picker fast.

**How to avoid:**
Explicitly document that `IngredientPicker` must continue fetching the full list and filtering locally. The `?name=` param is for agent use only and should not be adopted by the UI in this milestone. The query key `queryKeys.foods.list()` must not grow a params argument unless it is intentional.

**Warning signs:**
- `IngredientPicker.tsx` is modified during this milestone
- `queryKeys.foods.list()` gains a parameter in this milestone
- `api.get('/foods?name=...')` appears in any UI file

**Phase to address:**
Change 1 (Food/unit name filter) — add a code comment to `IngredientPicker.tsx` stating the intentional design of full-list fetch + local filter.

---

### Pitfall 8: Batch Endpoint Returns Wrong Ingredient Order When Section Already Has Ingredients

**What goes wrong:**
If a section already has 3 ingredients (`order: 0, 1, 2`) and a batch of 2 more is added, the expected result is `order: 3, 4`. If the batch endpoint computes `startOrder` before beginning insertion but then uses `prisma.recipeIngredient.createMany` (which returns a count, not the created rows) and then re-fetches the section, the re-fetch returns all 5 ingredients in DB order. If the re-fetch query does not have `orderBy: { order: 'asc' }`, the UI receives ingredients in an arbitrary order. The UI's `IngredientList` renders them in array order, so the display will be wrong even though the data is correct — a silent visual regression.

**Why it happens:**
The `RECIPE_INCLUDE` constant in `recipes.service.ts` already has `orderBy: { order: 'asc' }` on ingredients. But when a developer writes a standalone section-fetch for the batch response, they may not replicate the `orderBy`. They test with an empty section (order always starts at 0) and miss the interleaving case.

**How to avoid:**
The section re-fetch after batch insert must use the same include/orderBy structure as `RECIPE_INCLUDE`'s section sub-tree. The safest approach is to define `SECTION_WITH_INGREDIENTS_INCLUDE` once and use it in both the batch endpoint and wherever sections are returned standalone. Any place that returns `SectionResponse` must sort ingredients by `order: asc`.

**Warning signs:**
- Integration test only inserts into an empty section — does not test appending to a section with existing ingredients
- Section re-fetch query does not have `orderBy` on ingredients

**Phase to address:**
Change 4 (Batch ingredient add) — integration test must cover the append-to-non-empty-section case.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Reusing `IngredientsService.create` inside the batch loop | No code duplication | Race condition on `order` values; N round-trips vs 1 | Never — batch must compute order independently |
| Skipping `prisma.$transaction` for compound create and relying on Prisma's implicit per-operation transactions | Simpler code | Partial inserts on failure; no rollback | Never — compound writes must be atomic |
| Adding `ingredients`/`steps` arrays to `CreateRecipeRequest` in `packages/shared` | Single source of truth | Forces all typed call sites (UI) to be aware of agent-only fields | Acceptable only if the UI will eventually use compound create |
| Using a loose UUID check (length + hyphen positions) instead of strict v4 regex | Faster to write | False positives from unusual slug names; security ambiguity in 403 vs 404 | Never |
| Fetching full section after `createMany` without explicit `orderBy` | One less line of code | Non-deterministic ingredient order in response | Never |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| TanStack Query + new query params on foods/units | Adding `?name=` to UI queries, invalidating the fixed cache key | Keep `queryKeys.foods.list()` and `queryKeys.units.list()` param-free; `?name=` is agent-only |
| Prisma `createMany` return value | Treating the `{ count: N }` return as the created records | Re-fetch the section after `createMany` to build the `SectionResponse` |
| Prisma interactive transaction + `generateUniqueSlug` | Calling `prisma.recipe.findFirst` inside a transaction using the outer `prisma` client | Pass the transaction `tx` client to all queries inside `$transaction(async (tx) => ...)` |
| NestJS `ValidationPipe` + nested array DTOs | Forgetting `@ValidateNested({ each: true })` and `@Type(() => ...)` on array fields | Use `class-transformer` `@Type` + `@ValidateNested` on both `ingredients` and `steps` arrays in `CreateRecipeCompoundDto` |
| `class-validator` on `CreateRecipeDto` extension | `@IsOptional()` alone does not strip unknown properties | `ValidationPipe` with `whitelist: true` must be configured globally; array items need their own DTOs with `@ValidateNested` |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| `?name=` substring filter on foods without index | Slow queries as food catalog grows | Add a GIN or `ILIKE`-compatible index on `food.name` if catalog exceeds ~1000 entries | ~1,000+ foods |
| Batch insert via N individual `prisma.recipeIngredient.create` calls instead of `createMany` | Latency proportional to ingredient count | Use `createMany` or nested creates in transaction | 5+ ingredients per batch |
| `generateUniqueSlug` loop inside compound create transaction | Slow transaction if name collision requires multiple retries; holds DB lock longer | Acceptable for current scale; becomes a problem if the name is intentionally adversarial | N/A for typical use |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Slug path uses `findFirst({ where: { slug } })` without `householdId` | Cross-household recipe content leak; 403 reveals slug existence | Always include `householdId` in the slug `where` predicate; return 404 on miss |
| Batch endpoint ownership check only verifies recipe ownership, not that `sectionId` belongs to the recipe | Agent can insert ingredients into another household's section if they know the `sectionId` | Mirror `IngredientsService.create`'s check: verify `section.recipeId === recipeId` after fetching the section |
| Compound create accepts `foodId` / `unitId` values without verifying they exist | FK violation from Prisma thrown as a 500 instead of 422 | Prisma FK errors should be caught and re-thrown as `BadRequestException` with a clear message; or validate existence in the service before insert |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Compound create with invalid ingredient silently creates the recipe without ingredients | User creates recipe, sees empty ingredient list, assumes they forgot to add them | Transaction rollback on any sub-insert failure; return 400 with clear field path |
| Batch add returns stale `SectionResponse` (missing `foodName`) | Ingredient list renders blank food names until next hard refresh | Always join `food` and `unit` in the batch response query |
| Slug lookup returns a different recipe when agent reuses a slug from a deleted recipe | Agent reads wrong recipe data | Slug uniqueness is scoped per household; `generateUniqueSlug` appends `-2`, `-3` etc. — this is correct behavior, but agents must not cache slug-to-content mappings without revalidation |

---

## "Looks Done But Isn't" Checklist

- [ ] **Compound create transaction:** Verify that a request with a bad `foodId` in ingredient 2 of 3 does NOT create a recipe row — confirm with integration test querying the DB after the failed request
- [ ] **Batch insert order:** Verify that batch-inserting into a section that already has ingredients appends at the end (not order 0) — confirm with integration test
- [ ] **Slug/UUID security:** Verify that `GET /api/recipes/<slug-of-household-B-recipe>` by household A user returns 404, not 403 — confirm with integration test using two separate household sessions
- [ ] **Batch response completeness:** Verify that the batch endpoint response contains `foodName` and `unitName` (not `undefined`) — confirm with integration test checking response body fields
- [ ] **Food/unit filter additive:** Verify that `GET /api/foods` (no params) still returns the full list after adding `?name=` support — confirm with existing test or add a regression test
- [ ] **`@ValidateNested` on compound DTO arrays:** Verify that sending `{ name: "X", ingredients: [{ foodId: null }] }` returns 400 — confirm that validation reaches nested objects
- [ ] **Swagger docs updated:** Compound create, batch endpoint, slug lookup, and `?name=` param are all documented in Swagger with `@ApiProperty` / `@ApiQuery` decorators

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Partial recipe in DB from failed compound create | MEDIUM | Write a one-time cleanup script to delete recipes with zero sections or sections with no ingredients that were created in the deployment window; add DB constraint or application check going forward |
| UI cache split from inadvertent `?name=` in query key | LOW | Revert the query key and URL change in `IngredientPicker.tsx`; the full-list cache repopulates on next load |
| Cross-household slug access (403 vs 404) | LOW (code fix) | One-line fix in the slug branch to add `householdId` to the where predicate; deploy immediately |
| Incorrect ingredient `order` values from batch insert | MEDIUM | Add a one-time DB migration to reassign `order` values based on `createdAt` for affected sections; fix the batch service method |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Shared type widening breaks UI call sites | Phase implementing Change 2 | TypeScript build in `apps/web` must pass without errors after shared type change |
| Compound create partial insert | Phase implementing Change 2 | Integration test: bad `foodId` → 400 + DB has no recipe row |
| Batch ingredient order race | Phase implementing Change 4 | Integration test: batch append to non-empty section → ingredients ordered correctly |
| Batch response missing `foodName` / `unitName` | Phase implementing Change 4 | Integration test: response body fields `foodName`, `unitName` are non-null strings |
| Slug cross-household information leak | Phase implementing Change 3 | Integration test: cross-household slug lookup → 404 |
| UUID detection false positive | Phase implementing Change 3 | Unit test: `isUUID` returns false for non-v4 hex strings and slug strings |
| IngredientPicker inadvertently switched to server-filter | Phase implementing Change 1 | Code review + test: `IngredientPicker.tsx` is not modified; no new query param on foods cache key |
| Batch response order wrong when appending | Phase implementing Change 4 | Integration test: section has pre-existing ingredients; batch adds 2 more; response `ingredients` sorted ascending by `order` |

---

## Sources

- Direct code inspection: `apps/api/src/recipes/recipes.service.ts` — existing `create`, `findOne`, `findAndVerifyOwnership` patterns
- Direct code inspection: `apps/api/src/recipes/ingredients/ingredients.service.ts` — `MAX(order) + 1` pattern and ownership verification
- Direct code inspection: `apps/api/src/shared/foods.controller.ts`, `units.controller.ts` — current no-param shape
- Direct code inspection: `apps/web/src/components/recipes/editor/IngredientPicker.tsx` — full-list fetch + local filter pattern
- Direct code inspection: `apps/web/src/app/(app)/recipes/[slug]/page.tsx` — UUID-based API calls despite slug-based routing
- Direct code inspection: `apps/web/src/lib/query-keys.ts` — fixed cache keys for foods and units
- Direct code inspection: `packages/shared/src/api/recipes.ts` — `SectionResponse`, `IngredientResponse`, `CreateRecipeRequest` type definitions
- Spec: `plans/03_api-ergonomics/api-ergonomics.md` — stated UI impact claims for all 4 changes

---
*Pitfalls research for: API Ergonomics milestone — NestJS/Prisma compound creates, batch endpoints, dual-lookup, query filters*
*Researched: 2026-03-20*
