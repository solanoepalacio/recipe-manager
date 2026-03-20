# Edit a recipe

Always fetch the current recipe via `GET /api/recipes/:id` (see `recipes_get.md`) before editing. This gives you the correct sub-resource IDs (section, ingredient, step) needed for update and delete operations.

If `isLocked` is `true` in the response, the recipe cannot be edited. To unlock, send `PATCH /api/recipes/:id` with `{ "isLocked": false }` first.

## Update recipe metadata

### Endpoint

```
PATCH /api/recipes/:id
```

Authentication required (see `shared.md`). Partial update — include only the fields you want to change.

- `200` — updated
- `400` — validation error
- `403` — recipe belongs to a different household
- `404` — recipe not found

### Request body

All fields are optional:

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| name | string | No | Recipe name |
| description | string | Yes | Set `null` to clear |
| servingsQty | integer | Yes | Set `null` to clear |
| servingsUnit | string | Yes | Set `null` to clear |
| prepTime | integer | Yes | Set `null` to clear |
| cookTime | integer | Yes | Set `null` to clear |
| totalTime | integer | Yes | Set `null` to clear |
| performTime | integer | Yes | Set `null` to clear |
| sourceUrl | string | Yes | Set `null` to clear; must be a valid URL if non-null |
| isLocked | boolean | No | Set `true` to lock, `false` to unlock |

### Response

Full `RecipeDetailResponse` (see `recipes_get.md`).

### Example

Request:

```
PATCH /api/recipes/a1b2c3d4-...
```

Request body:

```json
{ "description": "Receta actualizada", "cookTime": 25 }
```

## Update a section

### Endpoint

```
PATCH /api/recipes/:id/sections/:sectionId
```

Authentication required (see `shared.md`). Partial update.

- `200` — updated
- `403` — recipe belongs to a different household
- `404` — recipe or section not found

### Request body

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| title | string | Yes | Set `null` to remove the title |

### Response

`SectionResponse`: `{ "id": "...", "title": "Nuevo titulo", "order": 0, "ingredients": [...] }`

## Update an ingredient

### Endpoint

```
PATCH /api/recipes/:id/sections/:sectionId/ingredients/:ingredientId
```

Authentication required (see `shared.md`). Partial update — all fields optional.

- `200` — updated
- `400` — validation error
- `403` — recipe belongs to a different household
- `404` — recipe, section, or ingredient not found

### Request body

All fields are optional:

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| foodId | string (UUID) | No | Change the food |
| unitId | string (UUID) | Yes | Set `null` to remove unit |
| quantity | number | Yes | Set `null` to remove quantity (allows decimals) |
| note | string | Yes | Set `null` to remove note |

### Response

`IngredientResponse` (same shape as in `recipes_get.md` nested ingredients).

## Update a step

### Endpoint

```
PATCH /api/recipes/:id/steps/:stepId
```

Authentication required (see `shared.md`). Partial update.

- `200` — updated
- `403` — recipe belongs to a different household
- `404` — recipe or step not found

### Request body

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| body | string | No | Instruction text |
| title | string | Yes | Set `null` to remove title |

### Response

`StepResponse`: `{ "id": "...", "title": null, "body": "Updated instruction.", "order": 0 }`

## Delete operations

All delete endpoints return `200` on success. No request body is needed.

| Endpoint | What it deletes |
|----------|-----------------|
| `DELETE /api/recipes/:id` | The entire recipe and all sub-resources (sections, ingredients, steps, images) |
| `DELETE /api/recipes/:id/sections/:sectionId` | The section and all its ingredients |
| `DELETE /api/recipes/:id/sections/:sectionId/ingredients/:ingredientId` | A single ingredient |
| `DELETE /api/recipes/:id/steps/:stepId` | A single step |

Status codes for all delete operations: `200` (success), `403` (recipe belongs to a different household), `404` (not found).

## Cross-references

- To obtain the recipe `id` and all sub-resource IDs: see `recipes_get.md`.
- To find a recipe by name: see `recipes_search.md`.
- To manage images (upload/delete): see `recipes_image.md`.
- To create new sub-resources (sections, ingredients, steps): see `recipes_create.md`.
- Authentication and error codes: see `shared.md`.
