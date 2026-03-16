# Phase 1: Monorepo + Shared Types - Context

**Gathered:** 2026-03-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Set up the Yarn v4 monorepo with three workspaces (`apps/api`, `apps/web`, `packages/shared`), create the shared types package for Phase 1–3 domains with full field-level types, and bootstrap NestJS with Swagger accessible at `/api/docs`. `yarn build` must succeed across all three workspaces.

</domain>

<decisions>
## Implementation Decisions

### Shared types coverage
- Only create type files for domains needed in **Phase 1–3**: `auth.ts`, `setup.ts`, `profile.ts`, `household.ts`, `common.ts`, `enums.ts`
- Type files for later domains (recipes, ingredients, steps, images, meal-plan, foods, units, admin) are **omitted** from the package and barrel export — they will be added by the phase that implements them
- Fields must be pulled from **both** `mvp_plans/01_tech_stack_and_data_model.md` (entity field names and types) **and** `mvp_plans/03_api_design.md` (request/response shapes). Both sources must be reconciled before writing types.
- `common.ts` exports `PaginatedResponse<T>` and `ErrorResponse` (needed universally)
- `enums.ts` exports `Gender` and `MealType`

### apps/web scaffold
- **Minimal only** — just enough for `yarn build` to succeed across workspaces
- Contents: `package.json`, `tsconfig.json`, `next.config.ts`, and a single placeholder `page.tsx`
- No Tailwind config, no `globals.css`, no `api-client.ts`, no route groups — all of that belongs in Phase 7

### AppModule wiring
- **Minimal**: `AppModule` imports only `PrismaModule`; global `ValidationPipe` registered; Swagger configured
- No feature module stubs — `AuthModule`, `RecipesModule`, etc. are created and imported in their respective phases
- Swagger document shows real metadata: title `"Recipe Manager API"`, version from root `package.json`, description

### Claude's Discretion
- Exact PrismaModule implementation (can be a minimal service wrapper that later phases extend)
- TypeScript `strict` settings in `tsconfig.base.json` (assume `strict: true` is appropriate)
- Exact NestJS package versions (use latest stable)
- Swagger bearer auth scheme setup (can be added in Phase 3 when auth is implemented)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Monorepo structure and conventions
- `mvp_plans/07_project_structure.md` — Authoritative directory structure, package names (`@recipe-manager/api`, `@recipe-manager/web`, `@recipe-manager/shared`), tsconfig strategy, backend/frontend conventions, test layout

### Shared types source of truth
- `mvp_plans/01_tech_stack_and_data_model.md` — Entity field names, types, and relationships for auth, profile, household domains
- `mvp_plans/03_api_design.md` — Request/response shapes for every endpoint; what each domain type needs to express

### Scope
- `mvp_plans/user_stories.md` — MVP feature requirements (read to understand what shared types must support long-term)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — codebase is empty. Everything in this phase is created from scratch.

### Established Patterns
- None yet — this phase establishes the foundational patterns all subsequent phases follow.

### Integration Points
- This phase creates the integration points: `packages/shared` barrel export is the contract point between `apps/api` and `apps/web`. Both workspaces must be able to import from `@recipe-manager/shared`.

</code_context>

<specifics>
## Specific Ideas

- No specific product references — open to standard monorepo approaches for Yarn v4 workspaces with NestJS + Next.js

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-monorepo-shared-types*
*Context gathered: 2026-03-16*
