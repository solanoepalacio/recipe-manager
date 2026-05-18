# Roadmap: Recipe Manager

## Milestones

- ✅ **v1.0 MVP** — Phases 1–12 (shipped 2026-03-19)
- ✅ **v1.1 Skill Bundle** — Phases 13–14 (shipped 2026-03-20)
- ✅ **v1.2 API Ergonomics** — Phases 15–19 (shipped 2026-03-21, closed 2026-05-18)
- 📋 **vNext** — to be planned via `/gsd:new-milestone`

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1–12) — SHIPPED 2026-03-19</summary>

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Monorepo + Shared Types** — Yarn workspaces, packages/shared type foundations, Swagger configured (completed 2026-03-16)
- [x] **Phase 2: Database Schema + Prisma** — Full Prisma schema, migrations, seed data, household scoping enforced (completed 2026-03-16)
- [x] **Phase 3: Backend Auth** — User sessions, API key auth, admin auth, setup wizard, password reset (completed 2026-03-16)
- [x] **Phase 4: Backend Recipe CRUD** — Recipe, section, ingredient, step, image endpoints; full non-admin REST API (completed 2026-03-16)
- [x] **Phase 5: Backend Search, Sharing, Meal Plan** — Fuzzy search, filtering, sorting, share tokens, meal plan endpoints (completed 2026-03-16)
- [x] **Phase 6: Backend Admin Endpoints** — Admin CRUD for users, households, foods, units, tokens (completed 2026-03-18)
- [x] **Phase 7: Frontend Setup + App Shell + Auth Flows** — Project scaffold, responsive shell, login/logout, UX primitives (completed 2026-03-18)
- [x] **Phase 8: Frontend Recipe List + Detail + Cook Mode** — Recipe browsing, search, filter, sort, detail view, cook mode (completed 2026-03-18)
- [x] **Phase 9: Frontend Recipe Creation + Editing** — Create/edit form, ingredients, sections, steps, images, lock (completed 2026-03-18)
- [x] **Phase 10: Frontend Meal Planner** — Weekly/monthly calendar, assign recipes, drag-drop, edit/delete entries (completed 2026-03-19)
- [x] **Phase 11: Frontend Profile + Household + Shared Recipe** — Profile editing, household view, public shared recipe page (completed 2026-03-19)
- [x] **Phase 12: Frontend Admin Panel** — Admin login, setup wizard, user/household/foods/units/tokens management UI (completed 2026-03-19)

> Full phase details (goals, success criteria, plans) live in earlier versions of this file (see git history). Per-milestone archives are at `.planning/milestones/v1.0-*.md` when created.

</details>

<details>
<summary>✅ v1.1 Skill Bundle (Phases 13–14) — SHIPPED 2026-03-20</summary>

- [x] **Phase 13: Skill Bundle — Foundation + Read Operations** — `index.md`, `shared.md`, `recipes_search.md`, `recipes_get.md` (completed 2026-03-20)
- [x] **Phase 14: Skill Bundle — Write Operations + Meal Plan** — `recipes_create.md`, `recipes_edit.md`, `recipes_image.md`, `meal_plan.md` (completed 2026-03-20)

**Audit:** `.planning/v1.1-MILESTONE-AUDIT.md`

</details>

<details>
<summary>✅ v1.2 API Ergonomics (Phases 15–19) — SHIPPED 2026-03-21 / CLOSED 2026-05-18</summary>

- [x] **Phase 15: Shared Types + Name Filters** — Extend packages/shared contract; add `?name=` filter to `GET /api/foods` and `GET /api/units` (completed 2026-03-21)
- [x] **Phase 16: Slug/UUID Dual Lookup** — `GET /api/recipes/:idOrSlug` accepts both UUID and slug, household-scoped, 404-only on miss (completed 2026-03-21)
- [x] **Phase 17: Batch Ingredient Add** — `POST /api/recipes/:id/sections/:sectionId/ingredients/batch`; atomic insert returning `SectionResponse` (completed 2026-03-21)
- [x] **Phase 18: Compound Recipe Create** — `POST /api/recipes` with optional `ingredients[]` + `steps[]`; atomic via `prisma.$transaction` (completed 2026-03-21)
- [x] **Phase 19: Skill Bundle Updates** — Update `recipes_create.md`, `recipes_get.md`, `recipes_edit.md`; document `?name=` filter in `shared.md` (completed 2026-03-21)

**Archive:** `.planning/milestones/v1.2-ROADMAP.md` and `.planning/milestones/v1.2-REQUIREMENTS.md`

</details>

### 📋 vNext — TBD

_Next milestone scope to be defined via `/gsd:new-milestone`._

Carry-over from v1.2:

- Pending high-priority todo: Fix agent empty-body validation loop on recipe/meal-plan creation (see `.planning/todos/pending/fix-agent-empty-body-loop.md`)

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Monorepo + Shared Types | v1.0 | 3/3 | Complete | 2026-03-16 |
| 2. Database Schema + Prisma | v1.0 | 2/2 | Complete | 2026-03-16 |
| 3. Backend Auth | v1.0 | 4/4 | Complete | 2026-03-16 |
| 4. Backend Recipe CRUD | v1.0 | 4/4 | Complete | 2026-03-16 |
| 5. Backend Search, Sharing, Meal Plan | v1.0 | 4/4 | Complete | 2026-03-16 |
| 6. Backend Admin Endpoints | v1.0 | 5/5 | Complete | 2026-03-18 |
| 7. Frontend Setup + App Shell + Auth Flows | v1.0 | 4/4 | Complete | 2026-03-18 |
| 8. Frontend Recipe List + Detail + Cook Mode | v1.0 | 3/3 | Complete | 2026-03-18 |
| 9. Frontend Recipe Creation + Editing | v1.0 | 5/5 | Complete | 2026-03-18 |
| 10. Frontend Meal Planner | v1.0 | 3/3 | Complete | 2026-03-19 |
| 11. Frontend Profile + Household + Shared Recipe | v1.0 | 3/3 | Complete | 2026-03-19 |
| 12. Frontend Admin Panel | v1.0 | 5/5 | Complete | 2026-03-19 |
| 13. Skill Bundle — Foundation + Read Operations | v1.1 | 2/2 | Complete | 2026-03-20 |
| 14. Skill Bundle — Write Operations + Meal Plan | v1.1 | 2/2 | Complete | 2026-03-20 |
| 15. Shared Types + Name Filters | v1.2 | 2/2 | Complete | 2026-03-21 |
| 16. Slug/UUID Dual Lookup | v1.2 | 1/1 | Complete | 2026-03-21 |
| 17. Batch Ingredient Add | v1.2 | 1/1 | Complete | 2026-03-21 |
| 18. Compound Recipe Create | v1.2 | 1/1 | Complete | 2026-03-21 |
| 19. Skill Bundle Updates | v1.2 | 2/2 | Complete | 2026-03-21 |
