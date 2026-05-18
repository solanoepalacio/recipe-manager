# Milestones — Recipe Manager

A historical record of shipped milestones. Each entry summarizes scope, accomplishments, and notable decisions. Full per-milestone archives live in `.planning/milestones/`.

---

## v1.2 — API Ergonomics

**Shipped:** 2026-03-21
**Phases:** 15–19 (5 phases, 7 plans)
**Requirements:** 9/9 complete (5 ERGO + 4 SKILL)
**Tag:** `v1.2`

**Delivered:**
Significantly more ergonomic REST API for agent clients — compound recipe create, `?name=` filters on foods/units, slug-based recipe lookup, and batch ingredient add. All changes purely additive with no breaking changes to the UI client. Skill bundle docs refreshed to expose every new capability.

**Key accomplishments:**

- Compound recipe create — agents can now build a full recipe in ≤3 calls (down from 11+), via optional `ingredients[]`/`steps[]` arrays on `POST /api/recipes`, atomic via `prisma.$transaction`
- Slug-based recipe lookup — `GET /api/recipes/:idOrSlug` accepts both UUIDs and slugs, household-scoped with 404-only on miss to prevent slug-existence leaks across households
- Batch ingredient add — `POST /api/recipes/:id/sections/:sectionId/ingredients/batch` inserts atomically with collision-free ordering and fully hydrated `SectionResponse`
- `?name=` substring filters on `GET /api/foods` and `GET /api/units` (case-insensitive `ILIKE`) for targeted ID resolution
- Shared package extended: `FoodItem`, `UnitItem`, `BatchCreateIngredientsRequest`, extended `CreateRecipeRequest`; `transform: true` on global `ValidationPipe`
- Skill bundle (`shared.md`, `recipes_create.md`, `recipes_get.md`, `recipes_edit.md`) refreshed so an agent reading the docs can discover and use every v1.2 capability

**Stats:**

- Timeline: 2026-03-20 → 2026-03-21 (~1 day of focused execution)
- Commits in v1.2 range: 23
- Plans: 7 (all `Complete` on disk with matching SUMMARY.md files)

**Key decisions:**

- All four API changes purely additive — no schema migrations, no new packages
- Phase ordering: shared types first (15), service-level changes (16/17), compound create last (18) to keep TypeScript green throughout
- Slug lookup uses `householdId` in the Prisma `where` predicate (never post-fetch) — 404 always, never 403
- `MAX(order)` computed once per batch (not per-item) to prevent collisions
- `BadRequestException` (not `NotFoundException`) for P2003 in compound create with explicit error message

**Known limitations / tech debt:**

- Postgres `ILIKE` is not accent-insensitive for Spanish names (e.g., `huevo` vs `huevó`); spec did not require accent folding — documented, not blocking
- `toIngredientResponse`/`toSectionResponse` mappers duplicated in `ingredients.service.ts` to avoid cross-service coupling — revisit if a third consumer appears

**Known deferred items at close:** 1 — see STATE.md `## Deferred Items`

**Archive:**

- `.planning/milestones/v1.2-ROADMAP.md`
- `.planning/milestones/v1.2-REQUIREMENTS.md`

---

## v1.1 — Skill Bundle

**Shipped:** 2026-03-20
**Phases:** 13–14 (2 phases, 4 plans)
**Requirements:** 8/8 complete (SKILL-01 … SKILL-08)

**Delivered:**
A self-contained agent skill bundle — `index.md`, `shared.md`, `recipes_search.md`, `recipes_get.md`, `recipes_create.md`, `recipes_edit.md`, `recipes_image.md`, and `meal_plan.md` — enabling an AI agent to perform all read/write recipe and meal-plan operations against the REST API using only the bundled docs.

**Key accomplishments:**

- Skill bundle foundation (`index.md`, `shared.md`) — startup index, Bearer auth, error/pagination conventions
- Read operations (`recipes_search.md`, `recipes_get.md`) — search/list/get with full query parameter coverage
- Write operations (`recipes_create.md`, `recipes_edit.md`, `recipes_image.md`) — full CRUD coverage with recommended call sequences
- Meal-plan operations (`meal_plan.md`) — date-range queries, mealType enum, full CRUD

**Audit:** See `.planning/v1.1-MILESTONE-AUDIT.md` (in repo root planning dir).

---

## v1.0 — MVP

**Shipped:** 2026-03-19
**Phases:** 1–12 (12 phases)

**Delivered:**
Full-stack recipe manager MVP — NestJS + Prisma + PostgreSQL backend with session and API-key auth, household scoping, full recipe CRUD with sections/ingredients/steps/images, search/filter/sort/paginate, public share tokens, meal plan CRUD, and an admin panel. Next.js SPA frontend with responsive app shell, recipe browsing, cook mode, create/edit flows, meal planner with drag-and-drop, profile, household view, public shared recipe page, and full admin panel.

**Phase summary:**

- Phase 1: Monorepo + Shared Types (Yarn v4 workspaces, packages/shared, Swagger)
- Phase 2: Database Schema + Prisma (full schema, migrations, seed)
- Phase 3: Backend Auth (session, API key, admin, setup wizard, password reset)
- Phase 4: Backend Recipe CRUD (recipes, sections, ingredients, steps, images)
- Phase 5: Backend Search, Sharing, Meal Plan
- Phase 6: Backend Admin Endpoints
- Phase 7: Frontend Setup + App Shell + Auth Flows
- Phase 8: Frontend Recipe List + Detail + Cook Mode
- Phase 9: Frontend Recipe Creation + Editing
- Phase 10: Frontend Meal Planner
- Phase 11: Frontend Profile + Household + Shared Recipe
- Phase 12: Frontend Admin Panel

> Detailed phase content for v1.0 lives in the original ROADMAP.md history (now consolidated under the `## Phases` collapsed block in the current ROADMAP.md).
