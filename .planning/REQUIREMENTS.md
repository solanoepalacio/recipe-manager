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
- [x] **SKILL-05**: Agent can create a recipe with sections, ingredients (resolved food/unit IDs), and steps (`recipes_create.md` — POST /api/recipes, GET /api/foods, GET /api/units, POST sections/ingredients/steps with recommended sequence)
- [x] **SKILL-06**: Agent can update or delete recipe metadata, sections, ingredients, and steps (`recipes_edit.md` — PATCH/DELETE for recipe, sections, ingredients, steps)
- [x] **SKILL-07**: Agent can upload and delete recipe images via multipart form (`recipes_image.md` — POST /api/recipes/:id/images multipart, DELETE image)
- [x] **SKILL-08**: Agent can read, create, update, and delete meal plan entries (`meal_plan.md` — GET/POST/PATCH/DELETE /api/meal-plan/entries with date range and mealType enum)

## v1.2 Requirements

### API Ergonomics

- [x] **ERGO-01**: User can filter foods by name substring (`GET /api/foods?name=<value>`) — case-insensitive; without param, full list returned unchanged
- [x] **ERGO-02**: User can filter units by name substring (`GET /api/units?name=<value>`) — case-insensitive; without param, full list returned unchanged
- [ ] **ERGO-03**: User can create a recipe with inline ingredients and steps in a single request (`POST /api/recipes` with optional `ingredients[]` + `steps[]`) — all inserted atomically; existing single-field create unchanged
- [x] **ERGO-04**: User can look up a recipe by its slug (`GET /api/recipes/tortilla-de-patatas`) — same response shape and household scoping as UUID lookup; UUID still works unchanged
- [ ] **ERGO-05**: User can add multiple ingredients to a section in one call (`POST /api/recipes/:id/sections/:sectionId/ingredients/batch`) — atomic insert, returns updated `SectionResponse`

### Skill Bundle

- [ ] **SKILL-09**: Agent reading skill files can discover and use `?name=` filter on foods and units for targeted ID resolution
- [ ] **SKILL-10**: Agent reading `recipes_create.md` can use compound create to build a full recipe in ≤3 calls (previously 11)
- [ ] **SKILL-11**: Agent reading `recipes_get.md` (or `recipes_search.md`) can navigate directly to a recipe by slug
- [ ] **SKILL-12**: Agent reading `recipes_edit.md` can use batch ingredient add for the edit flow

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
| SKILL-05 | Phase 14 | Complete |
| SKILL-06 | Phase 14 | Complete |
| SKILL-07 | Phase 14 | Complete |
| SKILL-08 | Phase 14 | Complete |
| ERGO-01 | Phase 15 | Complete |
| ERGO-02 | Phase 15 | Complete |
| ERGO-04 | Phase 16 | Complete |
| ERGO-05 | Phase 17 | Pending |
| ERGO-03 | Phase 18 | Pending |
| SKILL-09 | Phase 19 | Pending |
| SKILL-10 | Phase 19 | Pending |
| SKILL-11 | Phase 19 | Pending |
| SKILL-12 | Phase 19 | Pending |

**Coverage (v1.1):**
- v1.1 requirements: 8 total
- Mapped to phases: 8
- Unmapped: 0 ✓

**Coverage (v1.2):**
- v1.2 requirements: 9 total
- Mapped to phases: 9
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-20*
*Last updated: 2026-03-20 — v1.2 traceability complete (phases 15–19)*
