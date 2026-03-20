---
gsd_state_version: 1.0
milestone: v1.1
milestone_name: milestone
status: unknown
stopped_at: Completed 15-01-PLAN.md
last_updated: "2026-03-20T19:57:28.863Z"
last_activity: 2026-03-20
progress:
  total_phases: 19
  completed_phases: 15
  total_plans: 48
  completed_plans: 48
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-20)

**Core value:** Households can organize, discover, and cook their recipes together — from a searchable library to a weekly meal plan to an in-kitchen cook mode.
**Current focus:** Phase 15 — recipe-read-commands

## Current Position

Phase: 15 (recipe-read-commands) — EXECUTING
Plan: 1 of 1

## Performance Metrics

**Velocity (v1.0 reference):**

- Total plans completed: 3
- Average duration: 3.3 min
- Total execution time: 0.17 hours

**By Phase (v1.0):**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-monorepo-shared-types | 3 | 10 min | 3.3 min |

**Recent Trend:**

- Last 5 plans: 3 min, 2 min
- Trend: —

*Updated after each plan completion*
| Phase 02-database-schema-prisma P01 | 2 min | 2 tasks | 4 files |
| Phase 02-database-schema-prisma P02 | 2 min | 2 tasks | 7 files |
| Phase 03-backend-auth P01 | 3 min | 3 tasks | 13 files |
| Phase 03-backend-auth P02 | 3 | 3 tasks | 14 files |
| Phase 03-backend-auth P03 | 3 min | 2 tasks | 8 files |
| Phase 03-backend-auth P04 | 2 | 2 tasks | 6 files |
| Phase 04-backend-recipe-crud P01 | 3 | 2 tasks | 11 files |
| Phase 04-backend-recipe-crud P02 | 3 | 2 tasks | 7 files |
| Phase 04-backend-recipe-crud P03 | 4 min | 2 tasks | 11 files |
| Phase 04-backend-recipe-crud P04 | 4 | 2 tasks | 7 files |
| Phase 05-backend-search-sharing-meal-plan P04 | 3 | 2 tasks | 4 files |
| Phase 05-backend-search-sharing-meal-plan P02 | 4 | 2 tasks | 4 files |
| Phase Phase 05-backend-search-sharing-meal-plan PP03 | 4 | 2 tasks | 10 files |
| Phase 06-backend-admin-endpoints P01 | 4 | 2 tasks | 8 files |
| Phase 06-backend-admin-endpoints P02 | 2 | 2 tasks | 5 files |
| Phase 06-backend-admin-endpoints P03 | 2 | 2 tasks | 5 files |
| Phase 06-backend-admin-endpoints P04 | 2 | 2 tasks | 8 files |
| Phase 06-backend-admin-endpoints P05 | 5 | 2 tasks | 4 files |
| Phase 07-frontend-setup-app-shell-auth-flows P01 | 3 | 2 tasks | 13 files |
| Phase 07-frontend-setup-app-shell-auth-flows P02 | 8 | 2 tasks | 8 files |
| Phase 07-frontend-setup-app-shell-auth-flows P03 | 6 | 2 tasks | 6 files |
| Phase 07-frontend-setup-app-shell-auth-flows P04 | 15 | 2 tasks | 8 files |
| Phase 08-frontend-recipe-list-detail-cook-mode P01 | 8 | 2 tasks | 8 files |
| Phase 08-frontend-recipe-list-detail-cook-mode P02 | 5 | 2 tasks | 8 files |
| Phase 08-frontend-recipe-list-detail-cook-mode P03 | 2 | 2 tasks | 3 files |
| Phase 09 P01 | 3 | 2 tasks | 9 files |
| Phase 09 P02 | 2 | 2 tasks | 7 files |
| Phase 09 P03 | 5 min | 1 task | 4 files |
| Phase 09 P04 | 2 | 1 tasks | 4 files |
| Phase 09 P05 | 6 | 2 tasks | 9 files |
| Phase 10-frontend-meal-planner P01 | 4 | 2 tasks | 8 files |
| Phase 10-frontend-meal-planner P02 | 3 | 2 tasks | 4 files |
| Phase 10-frontend-meal-planner P03 | 2 | 2 tasks | 5 files |
| Phase 11-frontend-profile-household-shared-recipe P01 | 2 | 2 tasks | 3 files |
| Phase 11-frontend-profile-household-shared-recipe P02 | 2 | 2 tasks | 2 files |
| Phase 11 P03 | 2 | 2 tasks | 3 files |
| Phase 12-frontend-admin-panel P01 | 4 | 2 tasks | 11 files |
| Phase 12-frontend-admin-panel P02 | 5 | 2 tasks | 10 files |
| Phase 12-frontend-admin-panel P03 | 6 | 2 tasks | 4 files |
| Phase 12-frontend-admin-panel P04 | 4 | 2 tasks | 4 files |
| Phase 12-frontend-admin-panel P05 | 4 | 1 tasks | 2 files |
| Phase 13-cli-scaffold P01 | 3 | 3 tasks | 14 files |
| Phase 14-lookup-commands P01 | 2 | 2 tasks | 5 files |
| Phase 15-recipe-read-commands P01 | 2 | 2 tasks | 2 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- All design artifacts finalized in mvp_plans/ — no design decisions pending
- packages/shared is compiler-enforced API boundary (backend DTOs implement shared interfaces)
- AnyAuthGuard applied globally; @Public() opt-out for login, setup, and shared recipe routes
- Admin is a separate entity (not a User role); exactly one Admin per installation
- Pure SPA (no SSR); Next.js used for routing and build only
- [01-01] Yarn v4 activated via corepack (system default was Yarn v1 which lacks workspace:* support); packageManager pinned to yarn@4.9.1
- [01-01] nodeLinker: node-modules required for NestJS/Next.js compatibility (not PnP)
- [01-01] tsconfig paths resolve @recipe-manager/shared directly to packages/shared/src/index.ts — no build step needed during development
- [01-02] Dates represented as string (ISO 8601) in shared types — avoids Date serialization issues across API boundary
- [01-02] Gender and MealType are TypeScript enums (not string unions) — enables exhaustive checks in NestJS validation
- [01-02] auth.ts MeResponse omits passwordHash, resetToken — only safe User fields exposed via API
- [01-03] PrismaModule is @Global() — feature modules inject PrismaService without re-importing PrismaModule
- [01-03] E2e smoke tests mock PrismaService.$connect to avoid requiring a live database in automated test runs
- [01-03] Global prefix 'api' replicated in both main.ts and e2e test setup to ensure route consistency
- [Phase 02-database-schema-prisma]: MealPlan is one-to-one with Household (householdId @unique) — each household has exactly one meal plan
- [Phase 02-database-schema-prisma]: Prisma enum values are lowercase strings matching TypeScript enum values exactly (e.g., Gender.Male = 'male' → Prisma enum { male })
- [Phase 02-database-schema-prisma]: Integration tests live in apps/api/integration_tests/ with separate jest config (rootDir: integration_tests) — isolated from unit test suite
- [Phase 02-database-schema-prisma]: seed.ts uses upsert not createMany for idempotent seeding — safe to run in any environment
- [03-01] AnyAuthGuard registered as APP_GUARD globally — all routes protected by default; @Public() decorator used to opt out (login, setup, shared recipe routes)
- [03-01] Short-circuit ordering: session auth checked first, API key only attempted on session miss — avoids redundant DB lookups
- [03-01] ApiToken lastUsedAt updated fire-and-forget (void) — non-blocking, acceptable if update occasionally lost
- [03-01] session.d.ts uses ts-ignore on express-session import — express-session installed in Plan 02
- [Phase 03-backend-auth]: E2e stubs use DB_AVAILABLE conditional so test suite passes in CI without running database — real assertions activate only when DATABASE_URL is present
- [Phase 03-backend-auth]: toMeResponse exported as standalone function to avoid circular dependencies when other modules need to map User to MeResponse
- [Phase 03-backend-auth]: Shared PgStore options reused across both session middlewares — single pg.Pool for connect.sid and admin.sid sessions
- [03-03] SetupGuard injects PrismaService directly (no DI token abstraction) — consistent with SessionAuthGuard and other guards
- [03-03] @Public() + @UseGuards(SetupGuard) on POST /setup: @Public() bypasses AnyAuthGuard global guard, SetupGuard enforces one-time setup constraint
- [03-03] SetupModule exports SetupService for potential reuse by future admin modules
- [Phase 03-04]: Raw token (randomBytes(32)) embedded in reset URL; SHA-256 hash stored in DB — never stores plaintext token
- [Phase 03-04]: Admin-only password reset: no self-service; URL shared out-of-band with user
- [Phase 04-backend-recipe-crud]: isLocked removed from Recipe model before service code written — prevents TypeScript/Prisma errors in Plans 04-02/04
- [Phase 04-backend-recipe-crud]: NestExpressApplication used for useStaticAssets (no new npm package); uploads/ created at runtime via fs.mkdirSync
- [Phase 04-backend-recipe-crud]: Wave-0 spec scaffolds written before services — Plans 04-02/03/04 can run tests immediately on service creation
- [Phase 04-backend-recipe-crud]: findAndVerifyOwnership is public so sub-module services in 04-03/04-04 can call it to verify recipe ownership before operating on child resources
- [Phase 04-backend-recipe-crud]: toRecipeDetailResponse exported as standalone function so sub-modules returning RecipeDetailResponse after mutations can reuse the mapper
- [Phase 04-backend-recipe-crud]: ReorderDto lives in recipes/dto/ shared by all sub-modules — identical interface reduces duplication
- [Phase 04-backend-recipe-crud]: SectionsService and IngredientsService implement ownership verification directly via prisma.recipe.findUnique — Wave-0 specs only mock PrismaService, not RecipesService
- [Phase 04-backend-recipe-crud]: tsconfig.build.json added to exclude spec files from nest build; removed rootDir and added strictPropertyInitialization: false to tsconfig.json
- [Phase 04-backend-recipe-crud]: StepsService and ImagesService verify ownership via direct prisma.recipe.findUnique — Wave-0 specs only mock PrismaService
- [Phase 04-backend-recipe-crud]: process.cwd() used for Multer destination to avoid dist/ path issues after TypeScript build
- [Phase 04-backend-recipe-crud]: @types/multer added as dev dependency — required for Express.Multer.File type
- [Phase 05-backend-search-sharing-meal-plan]: RecipeListItem uses imageCount (_count.images) not full images array — avoids N+1 on list view
- [Phase 05-backend-search-sharing-meal-plan]: Random sort: fetch all matching IDs via findMany({select:{id:true}}), shuffle in JS, then fetch page items by ID — Prisma has no native random orderBy
- [Phase 05-backend-search-sharing-meal-plan]: RECIPE_LIST_SELECT lean select for list endpoint alongside RECIPE_INCLUDE for detail — list view avoids loading full sections/steps/images
- [Phase 05-04]: Direct PrismaService injection in FoodsController/UnitsController — no intermediate service for trivial read-only queries
- [Phase 05-backend-search-sharing-meal-plan]: SharingService owns SHARING_RECIPE_INCLUDE locally — RECIPE_INCLUDE not exported from recipes.service
- [Phase 05-backend-search-sharing-meal-plan]: SharedController uses @Controller('shared') — route is GET /api/shared/:token not /api/recipes/shared/:token
- [Phase Phase 05-03]: MealPlanEntry ownership verified via mealPlan.householdId join (no direct householdId column on entry); lazy MealPlan creation via upsert; jest moduleNameMapper fixed from ../../ to ../../../ (rootDir is src)
- [Phase 06-backend-admin-endpoints]: Wave-0 scaffolds fail by design — implementation plans 06-02 through 06-05 make them pass
- [Phase 06-backend-admin-endpoints]: AdminTokenCreatedResponse extends AdminTokenResponse — raw token shown exactly once on POST; list endpoint never exposes tokenHash
- [Phase 06-backend-admin-endpoints]: CurrentAdmin reads req.admin (set by AdminAuthGuard) — parallel to CurrentUser reading req.user
- [06-02]: USER_SELECT excludes passwordHash/resetToken/resetTokenExpiry — secure by construction; toAdminUserResponse mapper converts Prisma row to AdminUserResponse
- [06-02]: Gender cast to $Enums.Gender on prisma.user.create — DTO/shared type uses string; Prisma client requires enum; cast safe since values are identical strings
- [06-02]: AdminPaginationDto reusable across admin sub-modules — import in 06-03/06-04 without new pagination DTOs
- [06-03]: Cascade delete uses $transaction with deleteMany array in strict dependency order; recipeIds pre-fetched outside transaction (Prisma array transactions cannot reference earlier step results)
- [06-03]: recipes ?? [] null-guard in remove() for test robustness — Wave-0 spec remove test doesn't mock recipe.findMany, bare jest.fn() returns undefined
- [Phase 06-backend-admin-endpoints]: TOKEN_SELECT explicitly excludes tokenHash key — tokenHash never appears in findAll or list mapper output
- [Phase 06-backend-admin-endpoints]: AdminModule wiring is final — all 6 sub-module controller+service pairs registered; NestJS resolves all dependencies
- [Phase 07-01]: next/font/google used for Outfit (self-hosted, eliminates CDN dependency, improves LCP)
- [Phase 07-01]: api-client BASE_URL defaults to /api via Next.js rewrite proxy — eliminates CORS in development
- [Phase 07-02]: AppShell renders SearchBar+FilterActionsRow as persistent chrome; (app)/layout.tsx is temporary stub with null user — Plan 07-03 replaces with AuthProvider+ProtectedLayout
- [Phase 07-03]: auth.tsx uses .tsx extension (not .ts) because AuthProvider renders JSX
- [Phase 07-03]: (auth)/layout.tsx created with AuthProvider so LoginPage useAuth() detects existing sessions — without it, isLoading stays true forever and form never renders
- [Phase 07-04]: Sonner v2 renders section[aria-label='Notifications alt+T'] not ol[tabindex] — Toast test selector updated to section[aria-label]
- [Phase 07-04]: Tailwind v4 --spacing-sm token conflicts with built-in spacing scale — removed custom token, use max-w-[24rem] literal on login form
- [Phase 07-04]: Next.js proxy port corrected to 3001 to match API server
- [Phase 07-04]: Root page.tsx removed — / routes to (app)/page.tsx (Hoy placeholder); /recipes shows recipe list with search/filter
- [Phase 07-04]: Search/filter bar moved from AppShell into /recipes page only — AppShell is nav-only chrome; Drawer nav: Hoy / Recetas / Planificador
- [Phase 08-01]: RecipeCard omits time row — RecipeListItem lacks totalTime/cookTime fields (only RecipeDetailResponse has them)
- [Phase 08-01]: randomSeed state forces TanStack Query cache miss on random sort repeat — ensures reshuffle on each Aleatorio click
- [Phase 08-01]: Backdrop div at z-40 below dropdowns at z-50 for outside-click-to-close pattern without event bubbling issues
- [Phase 08-frontend-recipe-list-detail-cook-mode]: Detail page reads recipe UUID from ?id= search param (not slug) to call GET /api/recipes/:id — slug is URL-only for display
- [Phase 08-frontend-recipe-list-detail-cook-mode]: InfoGrid uses border-r on first 3 cells as vertical divider (simpler than CSS pseudo-element from spec)
- [Phase 08-frontend-recipe-list-detail-cook-mode]: CookStep current variant has onKeyDown handler for keyboard accessibility (Enter/Space) — not in spec but required for WCAG compliance
- [Phase 09-01]: MetadataForm uses forwardRef + useImperativeHandle to expose getValues() — parent reads values imperatively on Guardar press
- [Phase 09-01]: isEditMode is local React state; ?edit=1 in URL triggers entry on mount only — URL not kept in sync
- [Phase 09-01]: Guardar pill shown on Basico tab only; sub-resource tabs fire mutations immediately (no batch save)
- [Phase 09-01]: @dnd-kit core+sortable+utilities pre-installed in plan 01 (wave 1) for use by plans 09-02 and 09-03
- [Phase 09]: api.put added to api-client for reorder endpoint (PUT /api/recipes/:id/sections/:sid/ingredients/reorder)
- [Phase 09]: units query key added to query-keys.ts; IngredientSectionEditor uses per-section DndContext to isolate drag operations within a section
- [09-03]: StepEditor uses single flat DndContext for all steps (steps are not nested into sections); onBlur update mutation fires for title/body fields — no per-step save button needed
- [Phase 09-04]: FormData upload uses raw fetch (not api-client) so browser can set multipart Content-Type with boundary
- [Phase 09-04]: confirmDeleteId string|null state pattern for per-image inline ConfirmDialogs without a global modal
- [Phase 09-04]: ConfirmDialog is inline (not modal overlay) — simpler, no portal, matches mobile-first pattern
- [Phase 09-05]: Prisma shadow DB migration ordering broken by 20260316_remove_landscape_view missing timestamp; used manual SQL + migrate resolve --applied to bypass
- [Phase 09-05]: Accessible lock toggle uses role=switch + aria-checked without third-party component; lock guard hides edit button in view mode when recipe.isLocked is true
- [Phase 10-frontend-meal-planner]: findAllByText used in empty-state test because collapsed day rows also show Sin recetas planificadas in preview summary — multiple matches expected
- [Phase 10-frontend-meal-planner]: entriesByDate Record<string, MealPlanEntryResponse[]> pattern groups API entries by date for O(1) lookup in DayAccordion rendering
- [Phase 10-frontend-meal-planner]: cancelLabel prop on ConfirmDialog is optional with default Cancelar — fully backward-compatible for existing callers
- [Phase 10-frontend-meal-planner]: enabled: isOpen on recipes query in RecipePickerSheet prevents network requests until sheet opens
- [Phase 10-frontend-meal-planner]: DndContext placed inside loading branch only (not wrapping WeekToggle/WeekNav) — drag context active only when entries are loaded
- [Phase 11-01]: Drawer user name wrapped in button calling handleNav('/profile') — reuses existing handleNav pattern, no new imports needed
- [Phase 11-01]: Profile form payload: name always included; email/username/password only when truthy — prevents empty strings reaching API
- [Phase 11]: ShareLinkFlow tests use real QueryClientProvider (not vi.mock tanstack-react-query) so mutation callbacks execute — needed to test share flow state transitions
- [Phase 11]: PublicLayout uses 'use client' because QueryClientProvider is a client component
- [Phase 11]: SharedRecipePage shows 'Este enlace no es valido o ha expirado.' for invalid tokens with no login redirect
- [Phase 12-01]: AdminGuardedShell checks pathname for /admin/login and /setup to skip auth guard — avoids redirect loop on public admin paths
- [Phase 12-01]: admin-api-client uses typeof window !== 'undefined' guard before window.location.replace — prevents SSR/build crash on 401
- [Phase 12-01]: (admin)/layout.tsx creates its own QueryClient instance — admin panel has isolated query state from user app
- [Phase 12-02]: AdminSidebar renders desktop sidebar (lg:flex, 280px) + mobile tab bar (lg:hidden) in same component
- [Phase 12-02]: AdminTable<T> generic pattern: columns/rows/getRowKey — all 5 CRUD sections follow same interface
- [Phase 12-02]: pageSizeOptions prop on PaginationControls defaults to [10,20,50] — fully backward-compatible
- [Phase 12-03]: PaginatedResponse uses items[] not data[]; totalPages computed as Math.ceil(total/perPage) — plan spec was wrong, fixed to match shared type
- [Phase 12-03]: Delete mutation tests use single-row mock to avoid multi-row Eliminar button ambiguity with inline ConfirmDialog
- [Phase 12-05]: [12-05] Raw token stored only in createdToken useState — never in query cache; onDismiss clears it permanently
- [v1.1 Milestone]: rmapi CLI is standalone Python package in tools/rmapi/ — not a Yarn workspace; no shared-type coupling; pip install -e tools/rmapi/ makes rmapi available as shell command
- [v1.1 Milestone]: CLI credentials exclusively from RMAPI_BASE_URL and RMAPI_TOKEN env vars — never from CLI flags (shell history exposure risk)
- [v1.1 Milestone]: All CLI subcommands use shell=False (argument vectors) — prevents shell injection from agent-constructed arguments
- [v1.1 Milestone]: Skill files live in skills/ at repo root so API changes and skill file updates travel in the same PR
- [v1.1 Milestone]: skills/index.md written last after all skill file names are finalized — prevents stale catalogue
- [Phase 13-01]: click 8.3.1 removes mix_stderr from CliRunner — use CliRunner() with no args; result.stderr for errors, result.stdout for pure stdout
- [Phase 13-01]: recipes list placeholder calls Config.from_env() to validate credentials even before Phase 15 implementation
- [Phase 13-01]: pip install uses .venv at repo root — system Python 3.13 has no pip module
- [Phase 14-01]: Client-side name filtering in foods lookup: fetch all from GET /api/foods, filter by name_set in Python (case-insensitive via .lower()) — API has no server-side name filter param
- [Phase 14-01]: Non-matching food names silently omitted with exit code 0 — empty array is valid result, not an error (lookup semantics, not validation)
- [Phase 15-01]: food_id maps to foodId param key; per_page maps to pageSize — API expects camelCase, Click normalizes hyphens to underscores
- [Phase 15-01]: --fields on list uses {**data, 'items': apply_fields(data['items'], fields)} to project items while preserving pagination wrapper

### Pending Todos

None yet.

### Blockers/Concerns

None yet.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260318-jf3 | fix packages/shared build output to separate dist dir | 2026-03-18 | 0525c76 | [260318-jf3-fix-packages-shared-build-output-to-sepa](./quick/260318-jf3-fix-packages-shared-build-output-to-sepa/) |
| 260319-pkp | add calendar jump modal to meal planner WeekNav | 2026-03-19 | f2e03d8 | [260319-pkp-add-feature-on-the-meal-planner-view-of-](./quick/260319-pkp-add-feature-on-the-meal-planner-view-of-/) |
| 260319-qas | make gender and dateOfBirth required on User model | 2026-03-19 | 4edfcb5 | [260319-qas-we-need-to-make-two-small-changes-to-the](./quick/260319-qas-we-need-to-make-two-small-changes-to-the/) |
| 260319-qsa | add gender and dateOfBirth fields to profile and admin member forms | 2026-03-19 | 44e0ffb | [260319-qsa-add-dateofbirth-and-gender-fields-to-the](./quick/260319-qsa-add-dateofbirth-and-gender-fields-to-the/) |
| 260319-ut2 | household navbar link and members view | 2026-03-19 | 2d9e134 | [260319-ut2-household-navbar-link-and-members-view](./quick/260319-ut2-household-navbar-link-and-members-view/) |
| 260320-eq1 | fix admin login 403 by adding @Public() to admin controllers | 2026-03-20 | afe2110 | [260320-eq1-admin-login-is-not-working-properly-when](./quick/260320-eq1-admin-login-is-not-working-properly-when/) |
| 260320-ffj | integrate user types: normal users, kids, and agents with type-specific fields and behaviors | 2026-03-20 | 5f7c7a3 | [260320-ffj-integrate-user-types-normal-users-kids-a](./quick/260320-ffj-integrate-user-types-normal-users-kids-a/) |
| 260320-h10 | auto-create default ingredient section on recipe creation to fix UX bug | 2026-03-20 | e318461 | [260320-h10-fix-ux-bug-auto-create-default-section-w](./quick/260320-h10-fix-ux-bug-auto-create-default-section-w/) |
| 260320-h8h | wire recipe delete flow from detail page ellipsis dropdown | 2026-03-20 | 6553a0a | [260320-h8h-recipes-can-t-be-deleted-currently-when-](./quick/260320-h8h-recipes-can-t-be-deleted-currently-when-/) |

## Session Continuity

Last activity: 2026-03-20
Stopped at: Completed 15-01-PLAN.md
Resume file: None
