# Phase 4: Backend Recipe CRUD - Context

**Gathered:** 2026-03-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Full non-admin REST API for recipes and all sub-resources (ingredient sections, ingredients, instruction steps, images) — all household-scoped and Swagger-documented. Search, filtering/sorting/pagination, recipe sharing, and meal plan endpoints are Phase 5, not this phase.

</domain>

<decisions>
## Implementation Decisions

### Image storage
- Store uploaded files on local disk at `apps/api/uploads/`
- NestJS serves them as static assets at `/uploads/*` (configured in `main.ts`)
- URL stored in DB: `/uploads/{uuid}.{ext}` (relative, not absolute)
- Filenames renamed to a random UUID + original extension on upload (e.g. `a1b2c3d4.jpg`) — collision-proof, no path traversal risk. Original filename discarded.
- No abstraction layer needed — local disk implementation is sufficient for MVP

### Lock enforcement
- **Removed from scope entirely** — `isLocked` field removed from Prisma schema, shared types, DTOs, and all implementation code
- `RCP-05` removed from REQUIREMENTS.md
- No dead code, no TODO comments referencing this feature

### Duplicate recipe
- **Removed from scope entirely** — `POST /recipes/:id/duplicate` endpoint not implemented
- `RCP-02` removed from REQUIREMENTS.md
- No dead code, no TODO comments referencing this feature

### Shared types scope
- Phase 4 adds only the types needed for CRUD endpoints: `RecipeDetailResponse`, `CreateRecipeRequest`, `UpdateRecipeRequest`, and sub-resource types (section, ingredient, step, image request/response shapes)
- `RecipeListItem` and search/filter/pagination query types are deferred to Phase 5
- `GET /recipes` in Phase 4 returns full `RecipeDetailResponse[]` temporarily, or a stub — Phase 5 introduces the proper list/search shape

### Claude's Discretion
- Slug generation algorithm (e.g. kebab-case name, collision resolution with `-2`, `-3` suffix)
- Exact Multer configuration (file size limits, allowed MIME types)
- Ordering strategy for reorder endpoints (set `order` field from array index)
- Error message text for 403 household ownership violations

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### API contract
- `plans/01_App/03_api_design.md` — Authoritative REST contract: all recipe, section, ingredient, step, and image endpoints, route nesting, query params, guard assignments, reorder endpoint shape (`PUT .../reorder` with `{ ids }`)

### Data model
- `plans/01_App/01_tech_stack_and_data_model.md` — Recipe, IngredientSection, RecipeIngredient, InstructionStep, RecipeImage entity fields and relations; ERD

### Shared types source of truth
- `packages/shared/src/index.ts` — Current barrel export; new recipe types must be added and exported here
- `packages/shared/src/api/auth.ts` — Reference for how prior domain types are structured (MeResponse pattern)

### Project conventions
- `plans/01_App/07_project_structure.md` — Folder structure, naming conventions, test layout (`tests/` unit, `integration_tests/` integration)

### Scope changes (apply before planning)
- Remove `isLocked` field from `apps/api/prisma/schema.prisma` (Recipe model)
- Remove `RCP-05` from `.planning/REQUIREMENTS.md`
- Remove `RCP-02` from `.planning/REQUIREMENTS.md`
- Remove `duplicate` from Phase 4 plan descriptions in `.planning/ROADMAP.md`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `PrismaService` (global, inject directly in any service) — all Prisma queries go through this
- `@CurrentUser()` decorator (`apps/api/src/auth/decorators/current-user.decorator.ts`) — extracts authenticated user from request; already tested and used in AuthController
- `@Public()` decorator — opt-out from AnyAuthGuard; NOT needed for recipe endpoints (all authenticated)
- `AnyAuthGuard` — already registered as global `APP_GUARD`; recipe endpoints are automatically protected, no guard annotation needed

### Established Patterns
- **Module structure**: Each domain has its own `{domain}.module.ts`, `{domain}.service.ts`, `{domain}.controller.ts`, `dto/` folder; module imported into `AppModule`
- **DTO pattern**: Every DTO has `class-validator` decorators + `@ApiProperty()` for Swagger (see `apps/api/src/auth/dto/login.dto.ts`)
- **Swagger tagging**: `@ApiTags('domain')` on controller, `@ApiOperation` + `@ApiResponse` on each handler
- **Service pattern**: Services inject `PrismaService` via constructor; methods are `async`, return plain objects or mapped types (see `toMeResponse` pattern in auth)
- **Household scoping**: All household-scoped queries filter by `user.householdId` at the service layer (never trust URL params for scoping)

### Integration Points
- `AppModule` (`apps/api/src/app.module.ts`) — import `RecipesModule` (and sub-modules) here
- `packages/shared/src/index.ts` — add recipe types barrel export here
- `apps/api/src/main.ts` — configure `ServeStaticModule` or `express.static` for `/uploads/*` static serving

</code_context>

<specifics>
## Specific Ideas

- No specific product references — open to standard NestJS patterns for file uploads (Multer) and nested resource routing

</specifics>

<deferred>
## Deferred Ideas

- Recipe duplication (`POST /recipes/:id/duplicate`) — removed from scope, can be added in a future phase
- `isLocked` / recipe locking — removed from scope, can be added in a future phase if the need arises
- `RecipeListItem` shape and search/filter/pagination types — Phase 5

</deferred>

---

*Phase: 04-backend-recipe-crud*
*Context gathered: 2026-03-16*
