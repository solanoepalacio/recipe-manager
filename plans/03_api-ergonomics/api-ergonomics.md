# API Ergonomics for Agent Clients

Improvements identified through live agent test ride (2026-03-21). All changes are purely additive — no existing endpoint contracts are modified, so the UI client requires zero refactoring.

---

## Background

Creating a single recipe with 5 ingredients and 4 steps required 11 HTTP round-trips:

1. `POST /api/recipes`
2. `GET /api/foods` (50-item full scan)
3. `GET /api/units` (13-item full scan)
4. `POST .../ingredients` × 5
5. `POST .../steps` × 4

The proposals below address the main friction points.

---

## 1. Filter foods and units by name

### Problem

`GET /api/foods` and `GET /api/units` return the full catalog every time. The agent must download everything and scan in memory to resolve a single name to an ID. As households add custom foods this grows unboundedly.

### Change

Add an optional `?name=<substring>` query param (case-insensitive) to both endpoints. Without the param, behavior is unchanged — full list returned.

```
GET /api/foods?name=huevos    → [{ "id": "...", "name": "huevos" }]
GET /api/units?name=kilogramo → [{ "id": "...", "name": "kilogramo", "abbreviation": "kg" }]
```

### UI impact

None. The ingredient picker loads all foods client-side today and filters locally. It keeps working unchanged — the param is additive.

---

## 2. Compound recipe create

### Problem

The agent always knows the full recipe upfront but is forced to drip-feed it through N + M sequential calls after the initial create. This is the largest source of round-trip overhead.

### Change

Accept optional `ingredients` and `steps` arrays in `POST /api/recipes`. The backend inserts them into the auto-created default section within the same transaction and returns the full `RecipeDetailResponse` as usual.

```json
POST /api/recipes
{
  "name": "Tortilla de patatas",
  "description": "La tortilla española clásica.",
  "servingsQty": 4,
  "servingsUnit": "porciones",
  "prepTime": 15,
  "cookTime": 20,
  "totalTime": 35,
  "ingredients": [
    { "foodId": "b0625d22-...", "unitId": "638426a0-...", "quantity": 6 },
    { "foodId": "bb7db2b8-...", "unitId": "f73a79bf-...", "quantity": 0.5, "note": "cortadas en láminas finas" },
    { "foodId": "11942ecb-...", "unitId": "638426a0-...", "quantity": 1 }
  ],
  "steps": [
    { "title": "Preparar", "body": "Pelar y cortar las patatas en láminas finas. Picar la cebolla." },
    { "title": "Pochar", "body": "Calentar el aceite a fuego medio. Añadir patatas y cebolla con sal..." }
  ]
}
```

Cuts 11 calls down to 3 (create + foods lookup + units lookup), or 1 if IDs are already cached from a prior session.

### UI impact

None. The UI sends `{ name }` alone and builds content with separate subsequent calls. It never sends unknown fields. The `ingredients` and `steps` arrays are optional — existing behavior is fully preserved.

---

## 3. Accept slug as recipe identifier

### Problem

To read a specific recipe by name the agent must make two calls: `GET /api/recipes?search=tortilla` to get the `id`, then `GET /api/recipes/:id`. One call should suffice when the name is known.

### Change

In `RecipesController.findOne`, detect whether `:id` is a valid UUID. If not, treat it as a slug and query `findFirst({ where: { householdId, slug: id } })`.

```
GET /api/recipes/tortilla-de-patatas   ← agent can navigate directly by name
GET /api/recipes/bf617346-1bc9-...     ← UUID still works unchanged
```

Same household-scoping and 403/404 behavior applies in both cases.

### UI impact

None. The UI navigates by slug in the browser URL (`/recipes/tortilla-de-patatas`) but always calls the API with the UUID obtained at list time. No existing call changes.

---

## 4. Batch ingredient add

### Problem

When adding ingredients to an existing recipe (edit flow), the agent still makes N sequential calls — one per ingredient. There is no way to add multiple at once.

### Change

Add a new endpoint that accepts an array and inserts all ingredients in a single transaction, returning the updated section.

```
POST /api/recipes/:id/sections/:sectionId/ingredients/batch

Body: [
  { "foodId": "...", "unitId": "...", "quantity": 6 },
  { "foodId": "...", "unitId": "...", "quantity": 0.5, "note": "cortadas en láminas finas" }
]

Response: SectionResponse (id, title, order, ingredients[])
```

Complements proposal #2 for the edit case — when ingredients are added to an existing recipe rather than at creation time.

### UI impact

None. Additive endpoint. The UI's per-ingredient calls continue to work.

---

## Summary

| # | Change | Agent calls saved | Backend effort | UI refactor |
|---|--------|-------------------|----------------|-------------|
| 1 | Food/unit name filter | Reduces payload size | Tiny — one `where` clause per endpoint | None |
| 2 | Compound recipe create | 8+ per new recipe | Medium — transaction wrapping inline create | None |
| 3 | Slug-based recipe lookup | 1 per recipe read | Small — UUID check + slug fallback | None |
| 4 | Batch ingredient add | N−1 per edit session | Small — loop inside service method | None |

Implementing #2 and #3 together reduces the dominant agent workflow (create a recipe from scratch) from 11 calls to 3, or 1 if food/unit IDs are already cached.
