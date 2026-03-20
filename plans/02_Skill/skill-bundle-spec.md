# Skill Bundle Spec: recipe-manager

## Background

A **skill bundle** is a directory of Markdown files that teaches an AI agent how to interact
with an external system. The agent reads these files on demand at runtime — it does not receive
them all at once. The bundle is designed around progressive disclosure: the agent starts with
only a lightweight index, then fetches the specific file it needs before performing each
operation.

Skill bundles are installed into the consuming application and used as-is. The bundle must be
self-contained and require no prior knowledge of the API beyond what the files describe.

---

## Goals

1. **Enable an agent to perform all supported recipe-manager operations** — searching recipes,
   reading recipe details, creating and editing recipes, managing ingredients and steps,
   attaching images, and reading meal plans.

2. **Keep each file focused and minimal** — the agent only loads what it needs for the current
   operation. Files that cover unrelated operations should never need to be read together.

3. **Be accurate and self-contained** — each file must document the exact endpoint, request
   shape, response shape, and relevant status codes. An agent with no other knowledge of the
   API must be able to construct a correct HTTP request from the file alone.

4. **Be agent-agnostic** — the skill does not assume any specific framework or programming
   language. It describes HTTP interactions in plain terms. Examples may use pseudo-HTTP
   notation or JSON snippets, not code in any particular language.

---

## Requirements

### Bundle structure

The bundle must be placed at `skills/recipe-manager/` and contain the following files:

```
skills/recipe-manager/
├── index.md
├── shared.md
├── recipes_search.md
├── recipes_get.md
├── recipes_create.md
├── recipes_edit.md
├── recipes_image.md
└── meal_plan.md
```

---

### `index.md`

The index is the only file the agent receives at startup. It must be short.

Requirements:
- List every file in the bundle with a one-line description of what it covers
- State clearly that the agent must read the relevant file before performing any operation
- Mention `shared.md` and when it should be consulted (auth setup, error codes)
- Must not contain any endpoint documentation itself — the index only points to other files

---

### `shared.md`

Covers knowledge that applies across all operations.

Requirements:
- How to authenticate: `Authorization: Bearer <token>` header, required on every request
- Base URL convention: all paths are relative to a configurable base URL
- Standard error status codes and their meanings:
  - `400` / `422` — validation error, check the request body
  - `401` / `403` — auth failure
  - `404` — resource not found
  - `500` — server error, do not retry immediately
- Pagination envelope shape used by list endpoints:
  ```json
  { "items": [...], "total": 100, "page": 1, "pageSize": 20 }
  ```

---

### `recipes_search.md`

Covers listing and searching recipes.

Requirements:
- Endpoint: `GET /api/recipes`
- All supported query parameters:
  - `search` — case-insensitive substring match on recipe name
  - `foodId` — filter to recipes containing an ingredient with this food ID
  - `sort` — `name | createdAt | updatedAt | random`
  - `order` — `asc | desc`
  - `page` — 1-based page number (default: 1)
  - `pageSize` — items per page (default: 20)
- Response shape: paginated envelope (see `shared.md`), each item containing at minimum `id`
  and `name`
- Guidance on when to use `search` vs. `foodId`
- At least one example request and response

---

### `recipes_get.md`

Covers fetching full recipe details.

Requirements:
- Endpoint: `GET /api/recipes/:id`
- Full response shape, including all nested objects:
  - Top-level fields: `id`, `name`, `description`, `servingsQty`, `servingsUnit`, `prepTime`,
    `cookTime`, `totalTime`, `performTime`, `sourceUrl`, `isLocked`
  - `sections[]` — each with `id`, `title`, and `ingredients[]`
  - `ingredients[]` — each with `id`, `quantity`, `unit` (name), `food` (name), `note`
  - `steps[]` — each with `id`, `title`, `body`
  - `images[]` — each with `id` and `url`
- Note that `id` returned here is used as the `:id` parameter for all sub-resource operations

---

### `recipes_create.md`

Covers creating a new recipe and populating it with sections, ingredients, and steps.

Requirements:

**Create recipe**
- Endpoint: `POST /api/recipes`
- Request body fields (all optional except `name`):
  `name`, `description`, `servingsQty`, `servingsUnit`, `prepTime`, `cookTime`, `totalTime`,
  `performTime`, `sourceUrl`
- Response: full recipe object including the `id` needed for subsequent calls

**Resolve food and unit IDs** (required before adding ingredients)
- Foods endpoint: `GET /api/foods?search=<name>` — returns matching food objects with `id`
  and `name`
- Units endpoint: `GET /api/units?search=<name>` — returns matching unit objects with `id`
  and `name`
- Guidance: resolve all food and unit names to IDs before creating ingredients; if a food or
  unit is not found, the ingredient can be skipped or added without that field where optional

**Add a section**
- Endpoint: `POST /api/recipes/:id/sections`
- Request body: `{ "title": "optional section title" }`
- Response: section object with `id`

**Add an ingredient to a section**
- Endpoint: `POST /api/recipes/:id/sections/:sectionId/ingredients`
- Request body: `{ "foodId": "...", "unitId": "...", "quantity": 2.5, "note": "finely chopped" }`
  — only `foodId` is required
- Response: ingredient object with `id`

**Add a step**
- Endpoint: `POST /api/recipes/:id/steps`
- Request body: `{ "title": "optional title", "body": "instruction text" }` — only `body` is
  required
- Response: step object with `id`

**Recommended sequence** for building a full recipe: create recipe → add sections → resolve
foods/units → add ingredients per section → add steps.

---

### `recipes_edit.md`

Covers updating an existing recipe's metadata, ingredients, and steps.

Requirements:

**Update recipe metadata**
- Endpoint: `PATCH /api/recipes/:id`
- All fields optional (partial update); same fields as create minus `name` being required
- Additional field: `isLocked` (boolean) — when `true`, prevents edits
- Response: updated recipe object

**Update a section**
- Endpoint: `PATCH /api/recipes/:id/sections/:sectionId`
- Request body: `{ "title": "new title" }`

**Update an ingredient**
- Endpoint: `PATCH /api/recipes/:id/sections/:sectionId/ingredients/:ingredientId`
- Same optional fields as create: `foodId`, `unitId`, `quantity`, `note`

**Update a step**
- Endpoint: `PATCH /api/recipes/:id/steps/:stepId`
- Optional fields: `title`, `body`

**Delete operations**
- Delete section: `DELETE /api/recipes/:id/sections/:sectionId`
- Delete ingredient: `DELETE /api/recipes/:id/sections/:sectionId/ingredients/:ingredientId`
- Delete step: `DELETE /api/recipes/:id/steps/:stepId`
- Delete recipe: `DELETE /api/recipes/:id`

**Guidance**: always fetch the current recipe via `GET /api/recipes/:id` before editing to
obtain the correct sub-resource IDs.

---

### `recipes_image.md`

Covers attaching an image to a recipe.

Requirements:
- Endpoint: `POST /api/recipes/:id/images`
- Request: `multipart/form-data` with a single field named `file`
- Accepted MIME types: `image/jpeg`, `image/png`, `image/webp`, `image/gif`
- Maximum file size: 10 MB
- Response: image object with `id` and `url`
- Note: the `url` returned can be used to display the image; it is served at `/uploads/<filename>`
- Delete image: `DELETE /api/recipes/:id/images/:imageId`

---

### `meal_plan.md`

Covers reading and managing meal plan entries.

Requirements:

**List entries**
- Endpoint: `GET /api/meal-plan`
- Query params:
  - `from` — start date, `YYYY-MM-DD` format (optional)
  - `to` — end date, `YYYY-MM-DD` format (optional)
- Response: array of meal plan entries, each with `id`, `date`, `mealType`, and the associated
  recipe (`id`, `name`)
- Guidance for common queries: today's plan (set both `from` and `to` to today's date),
  this week's plan (set `from` to Monday, `to` to Sunday)

**Create an entry**
- Endpoint: `POST /api/meal-plan/entries`
- Request body: `{ "recipeId": "...", "date": "YYYY-MM-DD", "mealType": "..." }`
- Valid `mealType` values must be listed (document the enum values from the API)
- Response: created entry object

**Update an entry**
- Endpoint: `PATCH /api/meal-plan/entries/:id`
- Same optional fields as create

**Delete an entry**
- Endpoint: `DELETE /api/meal-plan/entries/:id`

---

### General writing guidelines

- **Tone**: dry and precise. These files are read by a machine, not a human.
- **Examples**: include at least one request/response example per endpoint. Use JSON blocks.
- **Cross-references**: when a file depends on IDs or knowledge from another file, say so
  explicitly (e.g. "obtain the recipe `id` from `recipes_search.md` or `recipes_get.md`").
- **No prose padding**: omit introductions, summaries, and transitional sentences. Every line
  should be either a fact, an example, or guidance on when/how to use the endpoint.
- **Length**: each file should be as short as possible while remaining complete. Prefer tables
  and JSON blocks over paragraphs.
