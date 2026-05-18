# Recipe Manager

## What This Is

A full-stack household recipe manager. Authenticated users belong to a household and share a private recipe collection and meal plan with household members. An AI agent client consumes the same REST API as the UI using API-key auth, enabling programmatic recipe and household management — now with ergonomic compound-create, slug lookup, batch ingredient add, and `?name=` filters that reduce common workflows from 11+ calls to 3 or fewer. A separate admin panel manages users, households, foods, units, and API tokens.

## Core Value

Households can organize, discover, and cook their recipes together — from a searchable library to a weekly meal plan to an in-kitchen cook mode.

## Requirements

### Validated

#### v1.0 MVP (shipped 2026-03-19)

- ✓ User can sign in with email or username + password (persistent session) — v1.0
- ✓ User can sign out — v1.0
- ✓ Admin can complete first-time setup wizard (creates the single Admin record) — v1.0
- ✓ Admin can generate a password reset URL for any user (no email — admin shares out-of-band) — v1.0
- ✓ User can create a new recipe from scratch — v1.0
- ✓ User can duplicate an existing recipe — v1.0
- ✓ User can set recipe name (slug auto-generated), description, servings, yield unit, prep/cook/total/perform time, source URL — v1.0
- ✓ User can add ingredients with quantity, unit, food, and optional note; organized into titled sections — v1.0
- ✓ User can add step-by-step instructions with optional titles; reorder via drag-and-drop — v1.0
- ✓ User can upload and delete recipe images — v1.0
- ✓ User can lock a recipe to prevent editing — v1.0
- ✓ User can view full recipe detail (ingredients, instructions, images) — v1.0
- ✓ User can enter cook mode (full-screen, large text, step navigation) — v1.0
- ✓ User can search recipes by name (with fuzzy matching) — v1.0
- ✓ User can filter recipes by food/ingredient — v1.0
- ✓ User can sort by name, date created, date updated, or random (asc/desc) — v1.0
- ✓ User can paginate recipe list (configurable page size) — v1.0
- ✓ User can generate a shareable public link for a recipe (no login required to view) — v1.0
- ✓ User can view a weekly/monthly meal planner (1 or 4 weeks) — v1.0
- ✓ User can assign recipes to dates and meal types — v1.0
- ✓ User can drag-and-drop entries to reorganize the meal plan — v1.0
- ✓ User can edit or delete meal plan entries — v1.0
- ✓ User can view and edit their own profile — v1.0
- ✓ Users belong to a household; recipes and meal plans are scoped to the household — v1.0
- ✓ Household members can view all household recipes and the shared meal plan — v1.0
- ✓ Admin can view, create, edit, and delete users (with password reset URL generation) — v1.0
- ✓ Admin can view, create, edit, and delete households — v1.0
- ✓ Admin can manage foods database — v1.0
- ✓ Admin can manage units database — v1.0
- ✓ Admin can create long-lived API tokens tied to a user; view and delete existing tokens — v1.0
- ✓ Full application functionality accessible via REST API (same endpoints as UI) — v1.0
- ✓ API key auth via Bearer token (agent authenticates as a specific user) — v1.0
- ✓ Interactive API docs at `/api/docs` (Swagger UI) — v1.0
- ✓ Responsive layout (phone, tablet, desktop) — v1.0
- ✓ Loading indicators during data fetching — v1.0
- ✓ Toast notifications for success, error, and info states — v1.0

#### v1.1 Skill Bundle (shipped 2026-03-20)

- ✓ **SKILL-01** — Agent index file (`index.md`) — v1.1
- ✓ **SKILL-02** — Agent shared conventions (`shared.md`: auth, errors, pagination) — v1.1
- ✓ **SKILL-03** — Agent recipes search/list (`recipes_search.md`) — v1.1
- ✓ **SKILL-04** — Agent recipe detail fetch (`recipes_get.md`) — v1.1
- ✓ **SKILL-05** — Agent recipe creation flow (`recipes_create.md`) — v1.1
- ✓ **SKILL-06** — Agent recipe edit/delete (`recipes_edit.md`) — v1.1
- ✓ **SKILL-07** — Agent recipe image upload/delete (`recipes_image.md`) — v1.1
- ✓ **SKILL-08** — Agent meal plan CRUD (`meal_plan.md`) — v1.1

#### v1.2 API Ergonomics (shipped 2026-03-21)

- ✓ **ERGO-01** — `?name=` substring filter on `GET /api/foods` (case-insensitive) — v1.2
- ✓ **ERGO-02** — `?name=` substring filter on `GET /api/units` (case-insensitive) — v1.2
- ✓ **ERGO-03** — Compound recipe create: optional `ingredients[]` and `steps[]` on `POST /api/recipes`, atomic via `prisma.$transaction` — v1.2 (reduced agent create flow from 11+ calls to ≤3)
- ✓ **ERGO-04** — Slug-based recipe lookup `GET /api/recipes/:idOrSlug` (UUID + slug, household-scoped, 404-only on miss) — v1.2
- ✓ **ERGO-05** — Batch ingredient add `POST /api/recipes/:id/sections/:sectionId/ingredients/batch` (atomic, hydrated `SectionResponse`) — v1.2
- ✓ **SKILL-09** — Agent discovers `?name=` filter via `shared.md` / `recipes_create.md` — v1.2
- ✓ **SKILL-10** — Agent uses compound create from `recipes_create.md` (≤3 calls) — v1.2
- ✓ **SKILL-11** — Agent navigates by slug via `recipes_get.md` / `recipes_search.md` — v1.2
- ✓ **SKILL-12** — Agent uses batch ingredient add via `recipes_edit.md` — v1.2

### Active

_(Awaiting `/gsd:new-milestone` — next milestone scope TBD)_

Carry-over from v1.2:

- [ ] **Fix agent empty-body validation loop on recipe/meal-plan creation** — high priority (todo captured 2026-05-15; agent receives empty body, validation rejects, agent retries with empty body — investigate root cause and add stable error contract). See `.planning/todos/pending/fix-agent-empty-body-loop.md`.

### Out of Scope

- Email sending — password reset URLs are shared out-of-band by admin
- Agent design and implementation — it consumes the same REST API as the UI
- Deployment, infrastructure, CI/CD (largely handled ad-hoc in quick tasks; not roadmap scope)
- Real-time features (live updates, websockets)
- OAuth / social login
- Mobile native app (web-only)
- Nutritional information or calorie tracking
- Accent-insensitive Spanish search (Postgres `ILIKE` does not accent-fold; documented limitation, not a current requirement)

## Context

v1.0 (MVP), v1.1 (Skill Bundle), and v1.2 (API Ergonomics) have all shipped. The application is fully functional end-to-end and the agent client can drive every non-admin workflow against the REST API with minimal call counts.

Codebase snapshot (~20.6k LOC TS/TSX across apps/* and packages/*).

Tech stack (locked):

- **Monorepo:** Yarn v4 workspaces — `apps/api`, `apps/web`, `packages/shared`
- **Backend:** NestJS + Prisma + PostgreSQL; session auth (cookie, PG store) + API-key auth (Bearer)
- **Frontend:** Next.js (pure SPA) + Tailwind CSS + TanStack Query
- **Shared types:** `@recipe-manager/shared` is the API boundary source of truth (compiler-enforced)
- **Language:** All code/URLs/files in English; UI-facing strings in Spanish
- **Admin:** Separate `Admin` entity (not a User role); exactly one Admin per installation
- **Foods/Units:** Admin-managed, pre-populated via seed; users select from existing entries
- **Household scoping:** Enforced at the service layer for all household-owned data

Recent quick-task activity (post-v1.2 shipping date):

- Validation pipe now returns all errors (`stopAtFirstError: false`), with E2E tests — 2026-05-15
- Failing API unit tests fixed (vitest → jest port, service-spec contract alignment) — 2026-05-15
- Containerization + secure cookie setup; analytics (Umami) integrated; image optimization disabled in Next — earlier in the timeline

## Constraints

- **Tech Stack:** NestJS + Prisma + PostgreSQL + Next.js + Tailwind — locked, no substitutions
- **API boundary:** `packages/shared` types are the contract; backend DTOs must implement them, frontend consumes them
- **Household isolation:** Every household-scoped query must filter by `householdId` at the service layer; for slug lookups, the filter is in the Prisma `where` predicate (never post-fetch)
- **Admin access:** Admin endpoints use a completely separate auth guard (`AdminAuthGuard`); no role field on User
- **Scope:** Deployment, CI, and agent implementation are explicitly out of scope

## Current Milestone

_None — v1.2 closed 2026-05-18. Run `/gsd:new-milestone` to start the next one._

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| NestJS monorepo with `packages/shared` | Compiler-enforced type safety between backend DTOs and frontend API client | ✓ Good — caught contract drift early in v1.2 |
| Cookie-based sessions (HttpOnly, PostgreSQL store) | Revocable, secure, no extra infrastructure vs JWT | ✓ Good — straightforward to containerize |
| Admin as separate entity (not a User role) | Eliminates edge cases in all household-scoped queries | ✓ Good — service-layer scoping stayed simple |
| API key stores only SHA-256 hash | Token shown once; high-entropy token so SHA-256 is appropriate | ✓ Good |
| Pure SPA (no SSR) | API handles all data; Next.js used for routing and build only | ✓ Good |
| Global `AnyAuthGuard` + `@Public()` opt-out | Secure by default; new endpoints require auth unless explicitly marked | ✓ Good — admin login 403 caught by this guard and fixed via `@Public()` |
| Foods/Units pre-populated by admin | Controlled vocabulary; no user-generated food names | ✓ Good |
| v1.2: all API changes purely additive | No schema migrations, no breaking changes for UI client | ✓ Good — UI client untouched during v1.2 |
| v1.2: slug lookup filters by `householdId` in `where` (404-only) | Prevents slug-existence leaks across households | ✓ Good |
| v1.2: compound create wraps full creation in `prisma.$transaction` | FK failure rolls back recipe row — no orphans | ✓ Good |
| v1.2: `MAX(order)` computed once per batch (not per-item) | Prevents collisions on non-empty sections | ✓ Good |
| v1.2: `transform: true` on global `ValidationPipe` enabled in 15-01 | Avoids mid-phase `main.ts` edits when `@ValidateNested` lands in 18 | ✓ Good — sequencing avoided rework |
| v1.2: compound path listed first in `recipes_create.md` | Unambiguously the primary agent workflow (3 calls vs 11+) | ✓ Good |
| Postgres `ILIKE` for `?name=` filters | Accent folding not required by spec | ⚠️ Revisit if Spanish accent-insensitive search becomes a requirement |
| Validation pipe returns all errors at once (`stopAtFirstError: false`) | Better DX for both UI forms and agent retry loops | ✓ Good (post-v1.2 quick task) |

---

_Last updated: 2026-05-18 after v1.2 milestone close_
