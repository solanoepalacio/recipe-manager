# Get recipe detail

## Endpoint

```
GET /api/recipes/:id
```

Authentication required (see `shared.md`). Returns the full recipe if it belongs to the authenticated user's household.

- `200` — success, returns full recipe detail
- `403` — recipe belongs to a different household
- `404` — recipe not found

## Response shape

Top-level fields:

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | string (UUID) | No | Recipe ID |
| householdId | string (UUID) | No | Owning household ID |
| createdById | string (UUID) | No | User who created the recipe |
| name | string | No | Recipe name |
| slug | string | No | URL-friendly name |
| description | string | Yes | Recipe description |
| servingsQty | number | Yes | Number of servings |
| servingsUnit | string | Yes | Servings unit label (e.g., "porciones") |
| prepTime | number | Yes | Preparation time in minutes |
| cookTime | number | Yes | Cooking time in minutes |
| totalTime | number | Yes | Total time in minutes (may be null even if prepTime and cookTime are set) |
| performTime | number | Yes | Active hands-on time in minutes |
| sourceUrl | string | Yes | Original source URL |
| isLocked | boolean | No | If true, recipe cannot be edited |
| shareToken | string | Yes | Non-null if recipe has a public share link |
| createdAt | string (ISO 8601) | No | Creation timestamp |
| updatedAt | string (ISO 8601) | No | Last update timestamp |
| sections | array | No | Ingredient sections (see below) |
| steps | array | No | Instruction steps (see below) |
| images | array | No | Recipe images (see below) |

## Nested objects

**sections[]** — ingredient sections:

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | string (UUID) | No | Section ID |
| title | string | Yes | Section title (null for the default section) |
| order | number | No | Display order (0-based) |
| ingredients | array | No | Ingredients in this section |

**sections[].ingredients[]** — ingredients:

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | string (UUID) | No | Ingredient ID |
| foodId | string (UUID) | No | Food reference ID |
| foodName | string | No | Food display name |
| unitId | string (UUID) | Yes | Unit reference ID |
| unitName | string | Yes | Unit display name |
| quantity | number | Yes | Amount |
| note | string | Yes | Additional note (e.g., "finely chopped") |
| order | number | No | Display order within section (0-based) |

**steps[]** — instruction steps:

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | string (UUID) | No | Step ID |
| title | string | Yes | Optional step title |
| body | string | No | Instruction text |
| order | number | No | Display order (0-based) |

**images[]** — recipe images:

| Field | Type | Nullable | Description |
|-------|------|----------|-------------|
| id | string (UUID) | No | Image ID |
| url | string | No | Image URL path (e.g., `/uploads/abc123.jpg`) — serve from base URL |
| order | number | No | Display order (0-based) |
| createdAt | string (ISO 8601) | No | Upload timestamp |

## Example

Request:
```
GET /api/recipes/a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

Response:
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "householdId": "h1h2h3h4-...",
  "createdById": "u1u2u3u4-...",
  "name": "Tortilla espanola",
  "slug": "tortilla-espanola",
  "description": "Receta tradicional con patatas",
  "servingsQty": 4,
  "servingsUnit": "porciones",
  "prepTime": 15,
  "cookTime": 20,
  "totalTime": 35,
  "performTime": null,
  "sourceUrl": null,
  "isLocked": false,
  "shareToken": null,
  "createdAt": "2026-03-01T10:00:00.000Z",
  "updatedAt": "2026-03-15T14:30:00.000Z",
  "sections": [
    {
      "id": "s1s2s3s4-...",
      "title": null,
      "order": 0,
      "ingredients": [
        {
          "id": "i1i2i3i4-...",
          "foodId": "f1f2f3f4-...",
          "foodName": "Huevo",
          "unitId": "u1u2u3u4-...",
          "unitName": "unidad",
          "quantity": 6,
          "note": null,
          "order": 0
        },
        {
          "id": "i5i6i7i8-...",
          "foodId": "f5f6f7f8-...",
          "foodName": "Patata",
          "unitId": "u5u6u7u8-...",
          "unitName": "kg",
          "quantity": 0.5,
          "note": "cortadas finas",
          "order": 1
        }
      ]
    }
  ],
  "steps": [
    {
      "id": "st1st2st3-...",
      "title": null,
      "body": "Batir los huevos con sal.",
      "order": 0
    },
    {
      "id": "st4st5st6-...",
      "title": null,
      "body": "Freir las patatas en aceite hasta dorar.",
      "order": 1
    }
  ],
  "images": [
    {
      "id": "im1im2im3-...",
      "url": "/uploads/abc123.jpg",
      "order": 0,
      "createdAt": "2026-03-01T10:05:00.000Z"
    }
  ]
}
```

## Cross-references

- The `id` from this response is used as `:id` in all sub-resource endpoints: sections, ingredients, steps, and images (see `recipes_edit.md`, `recipes_image.md`).
- To find a recipe `id`, search via `GET /api/recipes` (see `recipes_search.md`).
- Sub-resource `id` values (section, ingredient, step, image) are used for update and delete operations in `recipes_edit.md` and `recipes_image.md`.
