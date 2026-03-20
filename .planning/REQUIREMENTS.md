# Requirements: Recipe Manager

**Defined:** 2026-03-20
**Core Value:** Households can organize, discover, and cook their recipes together — from a searchable library to a weekly meal plan to an in-kitchen cook mode.

## v1 Requirements

*(All v1.0 requirements are complete — see ROADMAP.md phases 1–12)*

## v1.1 Requirements

### Skill Bundle

- [x] **SKILL-01**: Agent can find which skill file to read for any operation (`index.md` — startup index with one-line descriptions and read guidance)
- [x] **SKILL-02**: Agent can authenticate and understand error codes and pagination (`shared.md` — Bearer auth, base URL, 400/401/403/404/500 meanings, pagination envelope)
- [x] **SKILL-03**: Agent can search and list recipes by name, food, sort, and pagination (`recipes_search.md` — GET /api/recipes with all query params, example request/response)
- [x] **SKILL-04**: Agent can fetch full recipe detail including sections, ingredients, steps, and images (`recipes_get.md` — GET /api/recipes/:id full response shape)
- [ ] **SKILL-05**: Agent can create a recipe with sections, ingredients (resolved food/unit IDs), and steps (`recipes_create.md` — POST /api/recipes, GET /api/foods, GET /api/units, POST sections/ingredients/steps with recommended sequence)
- [ ] **SKILL-06**: Agent can update or delete recipe metadata, sections, ingredients, and steps (`recipes_edit.md` — PATCH/DELETE for recipe, sections, ingredients, steps)
- [ ] **SKILL-07**: Agent can upload and delete recipe images via multipart form (`recipes_image.md` — POST /api/recipes/:id/images multipart, DELETE image)
- [ ] **SKILL-08**: Agent can read, create, update, and delete meal plan entries (`meal_plan.md` — GET/POST/PATCH/DELETE /api/meal-plan/entries with date range and mealType enum)

## v2 Requirements

*(None defined yet)*

## Out of Scope

| Feature | Reason |
|---------|--------|
| Admin endpoints | Agent users have no admin access by design |
| Auth flows (login/logout) | Agent authenticates via API key Bearer token only — no session management |
| Image download/display | Skill only covers upload/delete; rendering is the consuming app's concern |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SKILL-01 | Phase 13 | Complete |
| SKILL-02 | Phase 13 | Complete |
| SKILL-03 | Phase 13 | Complete |
| SKILL-04 | Phase 13 | Complete |
| SKILL-05 | Phase 14 | Pending |
| SKILL-06 | Phase 14 | Pending |
| SKILL-07 | Phase 14 | Pending |
| SKILL-08 | Phase 14 | Pending |

**Coverage:**
- v1.1 requirements: 8 total
- Mapped to phases: 8
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-20*
*Last updated: 2026-03-20 — traceability updated after roadmap creation (phases 13–14)*
