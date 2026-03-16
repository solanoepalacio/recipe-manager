# Recipe Manager

## What This Is

A full-stack household recipe manager application. Authenticated users belong to a household and share a private recipe collection and meal plan with household members. An AI agent client consumes the same REST API as the UI using API key auth, enabling programmatic recipe and household management. A separate admin panel manages users, households, foods, units, and API tokens.

## Core Value

Households can organize, discover, and cook their recipes together — from a searchable library to a weekly meal plan to an in-kitchen cook mode.

## Requirements

### Validated

(None yet — ship to validate)

### Active

#### Authentication & Setup
- [ ] User can sign in with email or username + password (persistent session)
- [ ] User can sign out
- [ ] Admin can complete first-time setup wizard (creates the single Admin record)
- [ ] Admin can generate a password reset URL for any user (no email — admin shares out-of-band)

#### Recipe Creation & Editing
- [ ] User can create a new recipe from scratch
- [ ] User can duplicate an existing recipe
- [ ] User can set recipe name (slug auto-generated), description, servings, yield unit, prep/cook/total/perform time, source URL
- [ ] User can add ingredients with quantity, unit, food, and optional note; organized into titled sections
- [ ] User can add step-by-step instructions with optional titles; reorder via drag-and-drop
- [ ] User can upload and delete recipe images
- [ ] User can lock a recipe to prevent editing

#### Recipe Viewing & Cooking
- [ ] User can view full recipe detail (ingredients, instructions, images)
- [ ] User can enter cook mode (full-screen, large text, step navigation)

#### Recipe Search & Discovery
- [ ] User can search recipes by name (with fuzzy matching)
- [ ] User can filter recipes by food/ingredient
- [ ] User can sort by name, date created, date updated, or random (asc/desc)
- [ ] User can paginate recipe list (configurable page size)

#### Recipe Sharing
- [ ] User can generate a shareable public link for a recipe (no login required to view)

#### Meal Planning
- [ ] User can view a weekly/monthly meal planner (1 or 4 weeks)
- [ ] User can assign recipes to dates and meal types (breakfast, lunch, dinner, snack, dessert)
- [ ] User can drag-and-drop entries to reorganize the meal plan
- [ ] User can edit or delete meal plan entries

#### User Accounts & Profiles
- [ ] User can view and edit their own profile (name, email, username)

#### Households
- [ ] Users belong to a household; recipes and meal plans are scoped to the household
- [ ] Household members can view all household recipes and the shared meal plan

#### Administration
- [ ] Admin can view, create, edit, and delete users (with password reset URL generation)
- [ ] Admin can view, create, edit, and delete households
- [ ] Admin can manage foods database (view, create, edit, delete)
- [ ] Admin can manage units database (view, create, edit, delete)
- [ ] Admin can create long-lived API tokens tied to a user; view and delete existing tokens

#### API & Developer Access
- [ ] Full application functionality accessible via REST API (same endpoints as UI)
- [ ] API key auth via Bearer token (agent authenticates as a specific user)
- [ ] Interactive API docs at `/api/docs` (Swagger UI)

#### Mobile & Accessibility
- [ ] Responsive layout (phone, tablet, desktop)
- [ ] Loading indicators during data fetching
- [ ] Toast notifications for success, error, and info states

### Out of Scope

- Email sending — password reset URLs are shared out-of-band by admin
- Agent design and implementation — it consumes the same REST API as the UI
- Deployment, infrastructure, CI/CD
- Real-time features (live updates, websockets)
- OAuth / social login
- Mobile native app (web-only)
- Nutritional information or calorie tracking

## Context

All design artifacts are finalized in `mvp_plans/`. High-fidelity HTML wireframes for all views live in `mvp_plans/hifi/`. The project enters the **implementation phase** now.

Key architectural decisions already locked:
- **Monorepo**: Yarn v4 workspaces — `apps/api`, `apps/web`, `packages/shared`
- **Backend**: NestJS + Prisma + PostgreSQL; session auth (cookie) + API key auth (Bearer)
- **Frontend**: Next.js pure SPA + Tailwind CSS + TanStack Query
- **Shared types**: `@recipe-manager/shared` is the API boundary source of truth (compiler-enforced)
- **Language**: All code/URLs/files in English; UI-facing strings in Spanish
- **Admin**: Separate `Admin` entity (not a User role); exactly one Admin per installation
- **Foods/Units**: Admin-managed, pre-populated via seed; users select from existing entries
- **Household scoping**: Enforced at the service layer for all household-owned data

## Constraints

- **Tech Stack**: NestJS + Prisma + PostgreSQL + Next.js + Tailwind — locked, no substitutions
- **API boundary**: `packages/shared` types are the contract; backend DTOs must implement them, frontend consumes them
- **Household isolation**: Every household-scoped query must filter by `householdId` at the service layer
- **Admin access**: Admin endpoints use a completely separate auth guard (`AdminAuthGuard`); no role field on User
- **Scope**: Deployment, CI, and agent implementation are explicitly out of scope

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| NestJS monorepo with `packages/shared` | Compiler-enforced type safety between backend DTOs and frontend API client | — Pending |
| Cookie-based sessions (HttpOnly, PostgreSQL store) | Revocable, secure, no extra infrastructure vs JWT | — Pending |
| Admin as separate entity (not a User role) | Eliminates edge cases in all household-scoped queries | — Pending |
| API key stores only SHA-256 hash | Token shown once; high-entropy token so SHA-256 is appropriate | — Pending |
| Pure SPA (no SSR) | API handles all data; Next.js used for routing and build only | — Pending |
| Global `AnyAuthGuard` + `@Public()` opt-out | Secure by default; new endpoints require auth unless explicitly marked | — Pending |
| Foods/Units pre-populated by admin | Controlled vocabulary; no user-generated food names | — Pending |

---
*Last updated: 2026-03-16 after initialization*
