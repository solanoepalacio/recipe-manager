# Create a recipe

## Create recipe

### Endpoint

```
POST /api/recipes
```

Authentication required (see `shared.md`). Creates a new recipe in the authenticated user's household. A default ingredient section is auto-created and returned in `sections[0]` of the response (see Recommended sequence below).

- `201` — created
- `400` — validation error

### Request body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Recipe name |
| description | string | No | Plain text description |
| servingsQty | integer | No | Number of servings (must be integer, not decimal) |
| servingsUnit | string | No | Servings label (e.g., "porciones") |
| prepTime | integer | No | Preparation time in minutes |
| cookTime | integer | No | Cooking time in minutes |
| totalTime | integer | No | Total time in minutes |
| performTime | integer | No | Active hands-on time in minutes |
| sourceUrl | string | No | Must be a valid URL if provided |

### Response

Full `RecipeDetailResponse` — same shape as `GET /api/recipes/:id` (see `recipes_get.md`). The response includes a `sections` array with one auto-created default section. Use `sections[0].id` as the `:sectionId` when adding ingredients without creating additional sections.

## Resolve food and unit IDs

Ingredients require a `foodId` (required) and optionally a `unitId`. Resolve these from the reference lists before adding ingredients.

### List all foods

```
GET /api/foods
```

Authentication required (see `shared.md`). Returns ALL foods as a plain array (not paginated). No query parameters are supported — the endpoint does not accept a `search` parameter. Scan the array by `name` (case-insensitive match recommended) to find the matching `id`.

Response item shape:

```json
{ "id": "uuid", "name": "Huevo" }
```

### List all units

```
GET /api/units
```

Authentication required (see `shared.md`). Returns ALL units as a plain array (not paginated). No query parameters are supported.

Response item shape:

```json
{ "id": "uuid", "name": "kilogramo", "abbreviation": "kg" }
```

## Add a section

### Endpoint

```
POST /api/recipes/:id/sections
```

Authentication required (see `shared.md`). Adds a named ingredient section to the recipe. Only needed if you want sections beyond the auto-created default.

- `201` — created
- `403` — recipe belongs to a different household
- `404` — recipe not found

### Request body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | string | No | Section title; omit for an unnamed section |

### Response

```json
{ "id": "s1s2s3s4-...", "title": "Salsa", "order": 1, "ingredients": [] }
```

## Add an ingredient to a section

### Endpoint

```
POST /api/recipes/:id/sections/:sectionId/ingredients
```

Authentication required (see `shared.md`). Adds an ingredient to the specified section.

- `201` — created
- `400` — validation error
- `403` — recipe belongs to a different household
- `404` — recipe or section not found

### Request body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| foodId | string (UUID) | Yes | Food ID from `GET /api/foods` |
| unitId | string (UUID) | No | Unit ID from `GET /api/units` |
| quantity | number | No | Amount (can be decimal, e.g., 0.5) |
| note | string | No | Additional note (e.g., "finely chopped") |

### Response

```json
{
  "id": "i1i2i3i4-...",
  "foodId": "f1f2f3f4-...",
  "foodName": "Huevo",
  "unitId": "u1u2u3u4-...",
  "unitName": "unidad",
  "quantity": 6,
  "note": null,
  "order": 0
}
```

## Add a step

### Endpoint

```
POST /api/recipes/:id/steps
```

Authentication required (see `shared.md`). Adds an instruction step to the recipe. Steps are ordered by creation order.

- `201` — created
- `403` — recipe belongs to a different household
- `404` — recipe not found

### Request body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| body | string | Yes | Instruction text |
| title | string | No | Optional step heading |

### Response

```json
{ "id": "st1st2st3-...", "title": null, "body": "Batir los huevos con sal.", "order": 0 }
```

## Recommended sequence

1. **Create the recipe** — `POST /api/recipes` with at least `name`. The response includes `id` (the recipe ID) and `sections[0].id` (the auto-created default section ID).
2. **Resolve food and unit IDs** — `GET /api/foods` and `GET /api/units`. Scan each list by name to find the matching `id`. Cache the results for reuse across ingredients.
3. **Add ingredients to the default section** — `POST /api/recipes/:id/sections/:sectionId/ingredients` using `sections[0].id` from step 1 as `:sectionId`. Repeat for each ingredient.
4. **(Optional) Add named sections** — `POST /api/recipes/:id/sections` with a `title`. Use the returned `id` as `:sectionId` for ingredients in that section.
5. **Add steps** — `POST /api/recipes/:id/steps` for each instruction step. Steps are ordered by creation order.

## Example

Step 1 — Create recipe:

```
POST /api/recipes
```

Request body:

```json
{ "name": "Tortilla espanola", "servingsQty": 4, "servingsUnit": "porciones", "prepTime": 15, "cookTime": 20, "totalTime": 35 }
```

Response (abbreviated):

```json
{ "id": "r1r2r3r4-...", "sections": [{ "id": "s1s2s3s4-...", "title": null, "order": 0, "ingredients": [] }], "steps": [], "images": [] }
```

Step 2 — Add ingredient (after resolving foodId and unitId from `GET /api/foods` and `GET /api/units`):

```
POST /api/recipes/r1r2r3r4-.../sections/s1s2s3s4-.../ingredients
```

Request body:

```json
{ "foodId": "f1f2f3f4-...", "quantity": 6, "unitId": "u1u2u3u4-...", "note": null }
```

Step 3 — Add step:

```
POST /api/recipes/r1r2r3r4-.../steps
```

Request body:

```json
{ "body": "Batir los huevos con sal." }
```

## Cross-references

- Full response shape for the created recipe: see `recipes_get.md`.
- To upload images after creating the recipe: see `recipes_image.md`.
- To edit or delete any sub-resource after creation: see `recipes_edit.md`.
- Authentication and error codes: see `shared.md`.
