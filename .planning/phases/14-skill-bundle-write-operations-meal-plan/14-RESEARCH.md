# Phase 14: Skill Bundle — Write Operations + Meal Plan - Research

**Researched:** 2026-03-20
**Domain:** Documentation authoring — Markdown skill files for AI agent consumption
**Confidence:** HIGH

---

## Summary

Phase 14 completes the skill bundle by adding the four remaining files: `recipes_create.md`, `recipes_edit.md`, `recipes_image.md`, and `meal_plan.md`. These files teach an agent how to write data — creating and editing recipes with all sub-resources (sections, ingredients, steps, images) and managing meal plan entries.

The work is pure documentation authoring. No application code changes. All endpoint contracts are fully implemented and verified from Phase 4 and Phase 5 source files. The primary research task is extracting the exact request/response shapes, validations, and status codes from the live API source to ensure the skill files are accurate and self-contained.

The skill bundle format and conventions are already established by Phase 13. Phase 14 follows the same document structure: H2 sections, Markdown tables for fields, fenced JSON blocks for examples, explicit cross-references between files. There is no design ambiguity — everything flows directly from the implemented API.

**Primary recommendation:** Map each skill requirement directly to the corresponding controller and shared type, then author the file. The documentation pattern from `recipes_search.md` and `recipes_get.md` is the exact template to follow.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SKILL-05 | Agent can create a recipe with sections, ingredients (resolved food/unit IDs), and steps (`recipes_create.md`) | POST /api/recipes, GET /api/foods, GET /api/units, POST sections/ingredients/steps with recommended sequence — all verified from source |
| SKILL-06 | Agent can update or delete recipe metadata, sections, ingredients, and steps (`recipes_edit.md`) | PATCH/DELETE endpoints verified from RecipesController, SectionsController, IngredientsController, StepsController |
| SKILL-07 | Agent can upload and delete recipe images via multipart form (`recipes_image.md`) | POST multipart/form-data and DELETE endpoints verified from ImagesController with exact MIME types and size limit |
| SKILL-08 | Agent can read, create, update, and delete meal plan entries (`meal_plan.md`) | GET/POST/PATCH/DELETE verified from MealPlanController; MealType enum values verified from packages/shared/src/enums.ts |
</phase_requirements>

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Markdown | — | Skill file format | Agent-agnostic, no code language required |
| JSON | — | Request/response examples | Universal, language-independent |

No npm packages are installed. This phase creates only `.md` files.

**Installation:** none required.

---

## Architecture Patterns

### Recommended Project Structure

```
skills/recipe-manager/
├── index.md          (Phase 13 — complete)
├── shared.md         (Phase 13 — complete)
├── recipes_search.md (Phase 13 — complete)
├── recipes_get.md    (Phase 13 — complete)
├── recipes_create.md (Phase 14 — SKILL-05)
├── recipes_edit.md   (Phase 14 — SKILL-06)
├── recipes_image.md  (Phase 14 — SKILL-07)
└── meal_plan.md      (Phase 14 — SKILL-08)
```

### Pattern 1: Skill File Document Structure

**What:** Every skill file uses a consistent heading hierarchy and section order established in Phase 13.
**When to use:** All four Phase 14 files follow this exact pattern.

```markdown
# <title>

## Endpoint

\`\`\`
METHOD /api/path
\`\`\`

Authentication required (see `shared.md`). <one-sentence scope note>

- `201` — success, <description>
- `400` — validation error
- `403` — access denied (different household)
- `404` — resource not found

## Request body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
...

## Response

<field table or JSON block>

## Example

Request:
\`\`\`
POST /api/recipes ...
\`\`\`

Request body:
\`\`\`json
{ ... }
\`\`\`

Response:
\`\`\`json
{ ... }
\`\`\`

## Cross-references

- <explicit link to other skill files when IDs or knowledge are required>
```

### Pattern 2: Multi-Endpoint Files (SKILL-05, SKILL-06, SKILL-08)

**What:** Some skill files cover multiple related endpoints. Each endpoint gets its own `##` section within the file.
**When to use:** `recipes_create.md` (create recipe + add section + add ingredient + add step + resolve foods/units), `recipes_edit.md` (patch/delete for recipe/section/ingredient/step), `meal_plan.md` (list/create/update/delete entries).

Structure:
```markdown
# <file title>

## <Operation 1>

### Endpoint
...

## <Operation 2>

### Endpoint
...

## Recommended sequence

<numbered steps when order matters>
```

### Pattern 3: Recommended Sequence (SKILL-05 critical)

**What:** `recipes_create.md` must document the correct call order to build a full recipe.
**When to use:** The skill-bundle-spec explicitly requires this.

Sequence:
1. `POST /api/recipes` — creates the recipe shell, returns `id`
2. `GET /api/foods?search=<name>` — resolves food IDs (repeat for each ingredient food)
3. `GET /api/units?search=<name>` — resolves unit IDs (repeat for each ingredient unit)
4. `POST /api/recipes/:id/sections` — creates one or more ingredient sections, returns section `id`
5. `POST /api/recipes/:id/sections/:sectionId/ingredients` — adds ingredients per section (requires `foodId`)
6. `POST /api/recipes/:id/steps` — adds instruction steps

**Note from Phase 13 decision:** A default section is auto-created on recipe creation (Phase h10 quick task). The agent can use this section immediately; it does not need to POST a section unless it wants additional named sections. However, it still must POST /api/recipes/:id/sections to get the `sectionId` for the auto-created default if it wants to add to it — or it can read the sectionId from `GET /api/recipes/:id`.

### Anti-Patterns to Avoid

- **Padding with prose:** Each file is read by a machine. Omit introductions, summaries, and transitions. Every line is a fact, example, or "when/how" guidance.
- **Omitting nullable annotations:** All fields must be explicitly marked nullable or not — the agent cannot infer this.
- **Missing cross-references:** When a file requires an ID from another file, state the file explicitly (e.g., "obtain `sectionId` from `GET /api/recipes/:id` — see `recipes_get.md`").
- **Confusing request field naming with response field naming:** The `perPage`/`pageSize` distinction from Phase 13 is a model for this vigilance.
- **Documenting the `GET /api/meal-plan` list endpoint with a `PaginatedResponse` envelope:** The meal-plan list returns a flat `MealPlanResponse` with an `entries` array, NOT a paginated envelope. This is a critical difference from recipe search.

---

## API Contract Reference (verified from source)

### SKILL-05: recipes_create.md

#### POST /api/recipes

Source: `apps/api/src/recipes/recipes.controller.ts` + `apps/api/src/recipes/dto/create-recipe.dto.ts` + `packages/shared/src/api/recipes.ts (CreateRecipeRequest)`

**Request body:**

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| name | string | YES | IsString | Recipe name |
| description | string | No | IsOptional, IsString | Plain text description |
| servingsQty | number | No | IsOptional, IsInt, Min(0) | Integer number of servings |
| servingsUnit | string | No | IsOptional, IsString | Servings label (e.g., "porciones") |
| prepTime | number | No | IsOptional, IsInt, Min(0) | Prep time in minutes |
| cookTime | number | No | IsOptional, IsInt, Min(0) | Cook time in minutes |
| totalTime | number | No | IsOptional, IsInt, Min(0) | Total time in minutes |
| performTime | number | No | IsOptional, IsInt, Min(0) | Active hands-on time in minutes |
| sourceUrl | string | No | IsOptional, IsUrl | Must be a valid URL if provided |

**Status codes:** 201 (created), 400 (validation error).
**Response:** Full `RecipeDetailResponse` (same shape as GET /api/recipes/:id — see recipes_get.md).

#### GET /api/foods

Source: `apps/api/src/shared/foods.controller.ts`

No query params. Returns ALL foods ordered by name. The spec mentions `?search=<name>` as guidance in the skill file but the actual controller does not support a search param — it returns the full list. The agent must filter client-side or scan the list.

**IMPORTANT FINDING:** The `FoodsController.findAll()` has NO `search` query parameter — it returns all foods unconditionally. The skill-bundle-spec says `GET /api/foods?search=<name>` but the API does not support this. The skill file must document the actual behavior: `GET /api/foods` returns ALL foods; agent must scan by name.

Similarly, the `UnitsController.findAll()` has NO search param — returns all units with `id`, `name`, and `abbreviation`.

**Foods response item shape:**
```json
{ "id": "uuid", "name": "Huevo" }
```

**Units response item shape:**
```json
{ "id": "uuid", "name": "kilogramo", "abbreviation": "kg" }
```

Both return plain arrays (not paginated envelopes).

#### POST /api/recipes/:id/sections

Source: `apps/api/src/recipes/sections/sections.controller.ts` + `packages/shared/src/api/recipes.ts (CreateSectionRequest)`

**Request body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | string | No | Section title; omit for a default unnamed section |

**Response:** `SectionResponse` — `{ id, title, order, ingredients: [] }`

**Status codes:** 201 (created), 403, 404.

#### POST /api/recipes/:id/sections/:sectionId/ingredients

Source: `apps/api/src/recipes/ingredients/ingredients.controller.ts` + `packages/shared/src/api/recipes.ts (CreateIngredientRequest)`

**Request body:**
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| foodId | string | YES | IsString | Food ID from GET /api/foods |
| unitId | string | No | IsOptional, IsString | Unit ID from GET /api/units |
| quantity | number | No | IsOptional, IsNumber, Min(0) | Can be decimal (e.g., 0.5) |
| note | string | No | IsOptional, IsString | e.g., "finely chopped" |

**Response:** `IngredientResponse`

#### POST /api/recipes/:id/steps

Source: `apps/api/src/recipes/steps/steps.controller.ts` + `packages/shared/src/api/recipes.ts (CreateStepRequest)`

**Request body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| body | string | YES | Instruction text |
| title | string | No | Optional step heading |

**Response:** `StepResponse` — `{ id, title, order, body }`

---

### SKILL-06: recipes_edit.md

All update endpoints are PATCH (partial update — all fields optional unless noted). All delete endpoints return 200 on success.

#### PATCH /api/recipes/:id

Source: `apps/api/src/recipes/dto/update-recipe.dto.ts` + `packages/shared/src/api/recipes.ts (UpdateRecipeRequest)`

All fields optional:

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| name | string | No | Recipe name |
| description | string | Yes | Set null to clear |
| servingsQty | number | Yes | Set null to clear |
| servingsUnit | string | Yes | Set null to clear |
| prepTime | number | Yes | Set null to clear |
| cookTime | number | Yes | Set null to clear |
| totalTime | number | Yes | Set null to clear |
| performTime | number | Yes | Set null to clear |
| sourceUrl | string | Yes | Set null to clear |
| isLocked | boolean | No | Lock/unlock the recipe |

**Response:** Full `RecipeDetailResponse`.

#### PATCH /api/recipes/:id/sections/:sectionId

**Request body:** `{ "title": "string or null" }` — UpdateSectionRequest allows null to clear.
**Response:** `SectionResponse`

#### PATCH /api/recipes/:id/sections/:sectionId/ingredients/:ingredientId

Source: `packages/shared/src/api/recipes.ts (UpdateIngredientRequest)`

All fields optional:
| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| foodId | string | No | Change the food |
| unitId | string | Yes | Set null to remove unit |
| quantity | number | Yes | Set null to remove quantity |
| note | string | Yes | Set null to remove note |

**Response:** `IngredientResponse`

#### PATCH /api/recipes/:id/steps/:stepId

Source: `packages/shared/src/api/recipes.ts (UpdateStepRequest)`

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| body | string | No | Instruction text |
| title | string | Yes | Set null to remove title |

**Response:** `StepResponse`

#### DELETE operations (all return 200)

| Endpoint | Deletes |
|----------|---------|
| `DELETE /api/recipes/:id` | Recipe + all sub-resources |
| `DELETE /api/recipes/:id/sections/:sectionId` | Section + its ingredients |
| `DELETE /api/recipes/:id/sections/:sectionId/ingredients/:ingredientId` | Single ingredient |
| `DELETE /api/recipes/:id/steps/:stepId` | Single step |

**Status codes for all edit/delete ops:** 200 (success), 400 (validation), 403 (wrong household), 404 (not found).

---

### SKILL-07: recipes_image.md

Source: `apps/api/src/recipes/images/images.controller.ts`

#### POST /api/recipes/:id/images

- **Content-Type:** `multipart/form-data`
- **Field name:** `file` (single file only)
- **Accepted MIME types:** `image/jpeg`, `image/png`, `image/webp`, `image/gif`
- **Max size:** 10 MB (enforced by Multer `limits.fileSize`)
- **Status codes:** 201 (uploaded), 400 (bad MIME type or too large), 403, 404
- **Response:** `ImageResponse` — `{ id, url, order, createdAt }`
- The `url` field is a path like `/uploads/abc123.jpg` — serve from base URL.

#### DELETE /api/recipes/:id/images/:imageId

- **Status codes:** 200 (deleted), 403, 404

---

### SKILL-08: meal_plan.md

Source: `apps/api/src/meal-plan/meal-plan.controller.ts` + `packages/shared/src/api/meal-plan.ts` + `packages/shared/src/enums.ts`

#### GET /api/meal-plan

- **Query params:** `from` (optional, YYYY-MM-DD) and `to` (optional, YYYY-MM-DD)
- **Response shape:** `MealPlanResponse` — `{ entries: MealPlanEntryResponse[] }` — NOT a paginated envelope
- **Status codes:** 200

**MealPlanEntryResponse shape:**
| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | string (UUID) | No | Entry ID |
| date | string (YYYY-MM-DD) | No | Assigned date |
| mealType | MealType enum | No | One of: breakfast, lunch, dinner, snack, dessert |
| recipeId | string (UUID) | No | Recipe ID |
| recipeName | string | No | Recipe name (denormalized) |
| recipeSlug | string | No | Recipe slug (denormalized) |
| createdAt | string (ISO 8601) | No | Creation timestamp |
| updatedAt | string (ISO 8601) | No | Last update timestamp |

#### POST /api/meal-plan/entries

Source: `apps/api/src/meal-plan/dto/create-meal-plan-entry.dto.ts` + `packages/shared/src/api/meal-plan.ts (CreateMealPlanEntryRequest)`

**Request body — all three fields required:**
| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| recipeId | string | YES | IsString | Recipe ID to assign |
| date | string | YES | Matches /^\d{4}-\d{2}-\d{2}$/ | Date in YYYY-MM-DD format |
| mealType | string | YES | IsEnum(MealType) | One of: breakfast, lunch, dinner, snack, dessert |

**Status codes:** 201 (created), 400 (validation error).
**Response:** `MealPlanEntryResponse`

#### PATCH /api/meal-plan/entries/:id

Source: `packages/shared/src/api/meal-plan.ts (UpdateMealPlanEntryRequest)`

All fields optional:
| Field | Type | Description |
|-------|------|-------------|
| recipeId | string | Change the assigned recipe |
| date | string | Change the date (YYYY-MM-DD) |
| mealType | string | Change the meal type |

**Status codes:** 200, 403, 404.
**Response:** `MealPlanEntryResponse`

#### DELETE /api/meal-plan/entries/:id

**Status codes:** 200, 403, 404.

**MealType enum values (verified from `packages/shared/src/enums.ts`):**

| Value | Description |
|-------|-------------|
| `breakfast` | Breakfast |
| `lunch` | Lunch |
| `dinner` | Dinner |
| `snack` | Snack |
| `dessert` | Dessert |

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| API contract reference | Guessing or paraphrasing endpoint shapes | Read the source DTOs and shared types directly | DTOs have exact validation, types, and optionality |
| MealType values | Listing values from memory | Read `packages/shared/src/enums.ts` | Enum values are the lowercase strings, not the TypeScript key names |

**Key insight:** This phase is documentation work. The API is already implemented. The only correctness risk is transcription errors — always read the source DTO/controller before writing the skill file section.

---

## Common Pitfalls

### Pitfall 1: GET /api/foods does not support search parameter

**What goes wrong:** The skill-bundle-spec mentions `GET /api/foods?search=<name>` but the implemented `FoodsController.findAll()` ignores all query params and returns the full list.
**Why it happens:** The spec was written before implementation; the implementation chose simplicity (full list, client-side filtering).
**How to avoid:** Document the actual behavior: `GET /api/foods` returns all foods as a plain array. The agent must scan the list by name.
**Warning signs:** The skill file contains `?search=` for the foods or units endpoint.

### Pitfall 2: Meal plan list response is NOT a paginated envelope

**What goes wrong:** Agent tries to access `.items` on the meal plan response and gets undefined.
**Why it happens:** All other list endpoints in this API return `PaginatedResponse<T>` with `{ items, total, page, perPage }`. The meal plan list returns `MealPlanResponse` with `{ entries: [...] }`.
**How to avoid:** Explicitly document the flat `entries` array response shape with a JSON example.
**Warning signs:** Any reference to `items` or `perPage` in `meal_plan.md`.

### Pitfall 3: isLocked on recipe blocks edits

**What goes wrong:** Agent attempts to PATCH a recipe and receives a 403 because `isLocked: true`.
**Why it happens:** The lock feature is not covered in recipes_edit.md.
**How to avoid:** Add a note in `recipes_edit.md` — check `isLocked` from `recipes_get.md` before editing; if true, PATCH with `{ "isLocked": false }` first.

### Pitfall 4: Default section is auto-created but sectionId still needed

**What goes wrong:** Agent posts ingredients to `POST /api/recipes/:id/sections/:sectionId/ingredients` without knowing the sectionId of the auto-created default section.
**Why it happens:** Phase h10 added auto-creation of a default section on recipe creation, but the section ID is embedded in the `RecipeDetailResponse.sections[0].id`.
**How to avoid:** In `recipes_create.md`, document the recommended sequence: after `POST /api/recipes`, read `sections[0].id` from the response (the auto-created default section). Only post a new section if you need a named/additional section.

### Pitfall 5: ServingsQty and time fields are integer, not float

**What goes wrong:** Agent sends `"servingsQty": 2.5` and gets a 400 validation error.
**Why it happens:** The DTO uses `@IsInt()` for servingsQty, prepTime, cookTime, totalTime, performTime. Only `quantity` in ingredients uses `@IsNumber()` (allows decimals).
**How to avoid:** Document type as "integer" for all time and serving fields. Only ingredient `quantity` is a decimal-safe number.

---

## Code Examples

Verified patterns from source files:

### Default section sectionId from create response

After `POST /api/recipes`, the response includes `sections: [{ id: "...", title: null, ... }]`. The agent uses `sections[0].id` as the sectionId for the first ingredient batch:

```
POST /api/recipes
Body: { "name": "Tortilla espanola" }
Response: { "id": "recipe-id", "sections": [{ "id": "section-id", "title": null, "order": 0, "ingredients": [] }], ... }

POST /api/recipes/recipe-id/sections/section-id/ingredients
Body: { "foodId": "food-id", "quantity": 6, "unitId": "unit-id" }
```

### Multipart upload format (pseudo-HTTP)

```
POST /api/recipes/:id/images HTTP/1.1
Authorization: Bearer <token>
Content-Type: multipart/form-data; boundary=----boundary

------boundary
Content-Disposition: form-data; name="file"; filename="photo.jpg"
Content-Type: image/jpeg

<binary data>
------boundary--
```

### Meal plan date queries

```
GET /api/meal-plan?from=2026-03-20&to=2026-03-20   (today's entries)
GET /api/meal-plan?from=2026-03-16&to=2026-03-22   (week of Mon–Sun)
GET /api/meal-plan                                  (all entries, no filter)
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Foods/units endpoint with search param | Full list endpoint (no search) | Phase 5 implementation | Skill file documents full list, not filtered fetch |
| isLocked separate endpoint | isLocked as field in PATCH /api/recipes/:id | Phase 9 implementation | Agent can lock/unlock via standard update |

---

## Open Questions

1. **Sequence diagram for recipes_create.md**
   - What we know: The spec says "recommended sequence"; Phase 13 plans show numbered steps
   - What's unclear: Whether to include a numbered list, a table, or inline notes per section
   - Recommendation: Use a numbered "Recommended sequence" section at the end of recipes_create.md (consistent with skill-bundle-spec wording)

2. **GET /api/meal-plan with no date params**
   - What we know: The controller accepts `from` and `to` as optional — both can be omitted
   - What's unclear: What the service returns when both are omitted (likely all entries for the household)
   - Recommendation: Document as "omit both to return all entries" — safe to state given the optional param behavior

---

## Validation Architecture

`workflow.nyquist_validation` is `true` in `.planning/config.json`. This section is required.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None — skill files are Markdown; no code test framework applies |
| Config file | N/A |
| Quick run command | `bash` shell assertions (grep-based) |
| Full suite command | Same grep-based assertions per file |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SKILL-05 | recipes_create.md exists and contains all required endpoints | smoke | `grep "POST /api/recipes" skills/recipe-manager/recipes_create.md && grep "POST /api/recipes/:id/sections" skills/recipe-manager/recipes_create.md && grep "POST /api/recipes/:id/sections/:sectionId/ingredients" skills/recipe-manager/recipes_create.md && grep "POST /api/recipes/:id/steps" skills/recipe-manager/recipes_create.md && echo "PASS"` | ❌ Wave 0 |
| SKILL-05 | recipes_create.md documents food/unit ID resolution | smoke | `grep "GET /api/foods" skills/recipe-manager/recipes_create.md && grep "GET /api/units" skills/recipe-manager/recipes_create.md && echo "PASS"` | ❌ Wave 0 |
| SKILL-06 | recipes_edit.md contains all PATCH and DELETE endpoints | smoke | `grep "PATCH /api/recipes/:id" skills/recipe-manager/recipes_edit.md && grep "DELETE /api/recipes/:id" skills/recipe-manager/recipes_edit.md && grep "PATCH /api/recipes/:id/sections/:sectionId" skills/recipe-manager/recipes_edit.md && grep "DELETE /api/recipes/:id/sections/:sectionId" skills/recipe-manager/recipes_edit.md && echo "PASS"` | ❌ Wave 0 |
| SKILL-07 | recipes_image.md documents multipart upload and delete | smoke | `grep "POST /api/recipes/:id/images" skills/recipe-manager/recipes_image.md && grep "multipart" skills/recipe-manager/recipes_image.md && grep "DELETE /api/recipes/:id/images/:imageId" skills/recipe-manager/recipes_image.md && echo "PASS"` | ❌ Wave 0 |
| SKILL-08 | meal_plan.md documents all four operations and MealType values | smoke | `grep "GET /api/meal-plan" skills/recipe-manager/meal_plan.md && grep "POST /api/meal-plan/entries" skills/recipe-manager/meal_plan.md && grep "PATCH /api/meal-plan/entries/:id" skills/recipe-manager/meal_plan.md && grep "DELETE /api/meal-plan/entries/:id" skills/recipe-manager/meal_plan.md && grep "breakfast" skills/recipe-manager/meal_plan.md && echo "PASS"` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** Run the grep assertion for the file created in that task
- **Per wave merge:** Run all grep assertions above
- **Phase gate:** All grep assertions pass before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `skills/recipe-manager/recipes_create.md` — covers SKILL-05 (file does not exist yet)
- [ ] `skills/recipe-manager/recipes_edit.md` — covers SKILL-06 (file does not exist yet)
- [ ] `skills/recipe-manager/recipes_image.md` — covers SKILL-07 (file does not exist yet)
- [ ] `skills/recipe-manager/meal_plan.md` — covers SKILL-08 (file does not exist yet)

No framework install needed — grep-based assertions run in any shell.

---

## Sources

### Primary (HIGH confidence)

- `packages/shared/src/api/recipes.ts` — CreateRecipeRequest, UpdateRecipeRequest, CreateSectionRequest, UpdateSectionRequest, CreateIngredientRequest, UpdateIngredientRequest, CreateStepRequest, UpdateStepRequest, ImageResponse, SectionResponse, IngredientResponse, StepResponse
- `packages/shared/src/api/meal-plan.ts` — MealPlanEntryResponse, MealPlanResponse, CreateMealPlanEntryRequest, UpdateMealPlanEntryRequest
- `packages/shared/src/enums.ts` — MealType enum (breakfast, lunch, dinner, snack, dessert)
- `apps/api/src/recipes/recipes.controller.ts` — POST, PATCH, DELETE /api/recipes/:id
- `apps/api/src/recipes/sections/sections.controller.ts` — POST, PATCH, DELETE /api/recipes/:id/sections/:sectionId
- `apps/api/src/recipes/ingredients/ingredients.controller.ts` — POST, PATCH, DELETE /api/recipes/:id/sections/:sectionId/ingredients/:ingredientId
- `apps/api/src/recipes/steps/steps.controller.ts` — POST, PATCH, DELETE /api/recipes/:id/steps/:stepId
- `apps/api/src/recipes/images/images.controller.ts` — POST multipart, DELETE /api/recipes/:id/images/:imageId; Multer config (10MB limit, MIME types)
- `apps/api/src/meal-plan/meal-plan.controller.ts` — GET, POST /api/meal-plan/entries, PATCH, DELETE /api/meal-plan/entries/:id
- `apps/api/src/shared/foods.controller.ts` — GET /api/foods (no search param, returns all foods)
- `apps/api/src/shared/units.controller.ts` — GET /api/units (no search param, returns all units with abbreviation)
- `plans/02_Skill/skill-bundle-spec.md` — canonical requirements for all 4 Phase 14 files

### Secondary (MEDIUM confidence)

- `.planning/STATE.md` — accumulated decisions including Phase 13 format decisions (perPage vs pageSize, index.md zero endpoint paths)
- `skills/recipe-manager/recipes_search.md`, `skills/recipe-manager/recipes_get.md` — established document format template from Phase 13

### Tertiary (LOW confidence)

- None.

---

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — no external dependencies; all content is sourced from implemented API
- Architecture: HIGH — file format established by Phase 13; all endpoint contracts verified from source
- Pitfalls: HIGH — foods/units no-search pitfall and meal-plan non-paginated response are verified directly from controller source
- Validation: HIGH — grep assertions are deterministic

**Research date:** 2026-03-20
**Valid until:** Stable — skill files are documentation; valid as long as the API implementation does not change
