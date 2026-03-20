# Roadmap: Recipe Manager

## Overview

This roadmap takes the project from an empty monorepo to a fully functional household recipe manager. The first six phases build the backend layer-by-layer (infrastructure, database, auth, recipe CRUD, search/sharing/meal plan, admin endpoints). The final six phases deliver the frontend, making every requirement observable to real users. Backend phases validate against the Swagger UI; frontend phases validate through the browser. Every v1 requirement is assigned to the phase where it first becomes fully verifiable.

Milestone v1.1 (phases 13–14) produces the skill bundle — a set of Markdown files that teach an AI agent to consume the recipe-manager REST API with no prior knowledge.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Monorepo + Shared Types** - Yarn workspaces, packages/shared type foundations, Swagger configured (completed 2026-03-16)
- [x] **Phase 2: Database Schema + Prisma** - Full Prisma schema, migrations, seed data, household scoping enforced (completed 2026-03-16)
- [x] **Phase 3: Backend Auth** - User sessions, API key auth, admin auth, setup wizard, password reset (completed 2026-03-16)
- [x] **Phase 4: Backend Recipe CRUD** - Recipe, section, ingredient, step, image endpoints; full non-admin REST API (completed 2026-03-16)
- [x] **Phase 5: Backend Search, Sharing, Meal Plan** - Fuzzy search, filtering, sorting, share tokens, meal plan endpoints (completed 2026-03-16)
- [x] **Phase 6: Backend Admin Endpoints** - Admin CRUD for users, households, foods, units, tokens (completed 2026-03-18)
- [x] **Phase 7: Frontend Setup + App Shell + Auth Flows** - Project scaffold, responsive shell, login/logout, UX primitives (completed 2026-03-18)
- [x] **Phase 8: Frontend Recipe List + Detail + Cook Mode** - Recipe browsing, search, filter, sort, detail view, cook mode (completed 2026-03-18)
- [x] **Phase 9: Frontend Recipe Creation + Editing** - Create/edit form, ingredients, sections, steps, images, lock (completed 2026-03-18)
- [x] **Phase 10: Frontend Meal Planner** - Weekly/monthly calendar, assign recipes, drag-drop, edit/delete entries (completed 2026-03-19)
- [x] **Phase 11: Frontend Profile + Household + Shared Recipe** - Profile editing, household view, public shared recipe page (completed 2026-03-19)
- [x] **Phase 12: Frontend Admin Panel** - Admin login, setup wizard, user/household/foods/units/tokens management UI (completed 2026-03-19)
- [ ] **Phase 13: Skill Bundle — Foundation + Read Operations** - index.md, shared.md, recipes_search.md, recipes_get.md
- [ ] **Phase 14: Skill Bundle — Write Operations + Meal Plan** - recipes_create.md, recipes_edit.md, recipes_image.md, meal_plan.md

## Phase Details

### Phase 1: Monorepo + Shared Types
**Goal**: The monorepo compiles cleanly, the shared types package exports the full API boundary, and Swagger is reachable at /api/docs.
**Depends on**: Nothing (first phase)
**Requirements**: API-03
**Success Criteria** (what must be TRUE):
  1. `yarn build` succeeds across all three workspaces with no type errors
  2. `@recipe-manager/shared` exports typed interfaces for every API domain (auth, recipes, ingredients, steps, images, meal-plan, admin, etc.)
  3. The NestJS API starts and Swagger UI is accessible at `/api/docs` with at least a placeholder spec
  4. A developer can import a shared type in both `apps/api` and `apps/web` and the compiler enforces the contract
**Plans**: 3 plans

Plans:
- [x] 01-01: Monorepo scaffold (Yarn v4 workspaces, root tsconfig, .yarnrc.yml, package.json per workspace)
- [x] 01-02: packages/shared — all domain type files, enums, PaginatedResponse, ErrorResponse, barrel export
- [x] 01-03: NestJS bootstrap — main.ts, AppModule, PrismaModule, global ValidationPipe, Swagger setup at /api/docs

### Phase 2: Database Schema + Prisma
**Goal**: The full Prisma schema is migrated, the database is seeded with foods and units, and household scoping is structurally enforced.
**Depends on**: Phase 1
**Requirements**: HH-01
**Success Criteria** (what must be TRUE):
  1. `prisma migrate deploy` applies all migrations against a fresh PostgreSQL database with no errors
  2. `prisma db seed` populates the foods and units tables with production-ready seed data
  3. Every household-scoped table (Recipe, MealPlan, MealPlanEntry) has a non-nullable `householdId` foreign key enforced at the database level
  4. All entities from the data model (User, Admin, ApiToken, Food, Unit, Recipe, IngredientSection, RecipeIngredient, InstructionStep, RecipeImage, MealPlan, MealPlanEntry) exist as Prisma models with correct relations
**Plans**: 2 plans

Plans:
- [x] 02-01-PLAN.md — Wave 0 infrastructure + full Prisma schema (13 models, 2 enums, compound unique constraints)
- [x] 02-02-PLAN.md — Initial migration (prisma migrate dev --name init) + seed script (50 foods, 13 units, idempotent upsert)

### Phase 3: Backend Auth
**Goal**: Users can authenticate via session cookie or API key; admins can authenticate via a separate session; the setup wizard creates the single Admin record; password reset URLs can be generated.
**Depends on**: Phase 2
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, API-02
**Success Criteria** (what must be TRUE):
  1. `POST /auth/login` with valid email+password returns a session cookie; subsequent authenticated requests succeed without re-sending credentials
  2. `POST /auth/logout` destroys the server-side session; the session cookie is cleared
  3. A request with `Authorization: Bearer <valid-api-key>` is authenticated as the associated user with no session cookie required
  4. `POST /setup` creates the Admin record when no Admin exists; the endpoint returns 404 after setup is complete
  5. Admin can call the password reset endpoint and receive a one-time reset URL containing a raw token; using the URL clears the token fields on the User row
**Plans**: 4 plans

Plans:
- [x] 03-01-PLAN.md — Guards + decorators (SessionAuthGuard, ApiKeyAuthGuard, AnyAuthGuard as APP_GUARD, AdminAuthGuard, @Public(), @CurrentUser()) + unit tests
- [x] 03-02-PLAN.md — Session middleware (express-session + connect-pg-simple), AuthService, AuthController (login/logout/me), AdminAuthService, AdminAuthController
- [x] 03-03-PLAN.md — SetupModule (SetupGuard, SetupService, SetupController GET/POST /setup)
- [x] 03-04-PLAN.md — AdminUsersService (password reset URL generation), AdminUsersController (POST /admin/users/:id/password-reset-url)

### Phase 4: Backend Recipe CRUD
**Goal**: The full non-admin REST API is complete for recipes, sections, ingredients, steps, and images — all household-scoped, all documented in Swagger.
**Depends on**: Phase 3
**Requirements**: API-01
**Success Criteria** (what must be TRUE):
  1. An authenticated request to `POST /recipes` creates a recipe with an auto-generated slug scoped to the household; the response matches the shared `RecipeDetailResponse` type
  2. All nested sub-resources (sections, ingredients, steps, images) have working CRUD endpoints accessible at their nested routes
  3. Image upload stores the file at `apps/api/uploads/` with a UUID filename; the relative URL is stored in DB; image delete removes the record and the file from disk
  4. All recipe endpoints appear in Swagger with correct request/response schemas derived from shared types
**Plans**: 4 plans

Plans:
- [x] 04-01-PLAN.md — Schema cleanup (remove isLocked) + shared recipe types + static serving + Wave-0 test scaffolds
- [x] 04-02-PLAN.md — RecipesService (CRUD, slug, household scoping) + RecipesController + RecipesModule
- [x] 04-03-PLAN.md — Sections sub-module (CRUD, reorder) + Ingredients sub-module (CRUD, reorder)
- [x] 04-04-PLAN.md — Steps sub-module (CRUD, reorder) + Images sub-module (Multer upload, delete) + final RecipesModule

### Phase 5: Backend Search, Sharing, Meal Plan
**Goal**: Recipe search (fuzzy, filter, sort, paginate), public share tokens, and meal plan CRUD endpoints are all functional and Swagger-documented.
**Depends on**: Phase 4
**Requirements**: (none — infrastructure for Phases 8, 10, 11)
**Success Criteria** (what must be TRUE):
  1. `GET /recipes?search=choco&fuzzy=true` returns recipes matching the fuzzy query, filtered to the authenticated user's household
  2. `GET /recipes?food=<foodId>&sort=name&order=asc&page=1&pageSize=10` returns a correctly filtered, sorted, paginated response matching `PaginatedResponse<RecipeListItem>`
  3. `POST /recipes/:id/share` generates a unique share token; `GET /shared/:token` returns the full recipe detail with no auth required
  4. `POST /meal-plan/entries` creates a meal plan entry for the household; `PATCH` and `DELETE` on existing entries work correctly
**Plans**: 4 plans

Plans:
- [x] 05-01-PLAN.md — Recipe search (RecipeListItem shared type, RecipeQueryDto, updated findAll with filter/sort/paginate/random)
- [x] 05-02-PLAN.md — Sharing sub-module (SharingService, SharingController, SharedController @Public(), RecipesModule update)
- [x] 05-03-PLAN.md — Meal plan module (MealPlanModule, MealPlanService CRUD, MealPlanController, shared meal-plan types, AppModule update)
- [x] 05-04-PLAN.md — SharedModule (FoodsController GET /foods, UnitsController GET /units, AppModule update)

### Phase 6: Backend Admin Endpoints
**Goal**: All admin CRUD endpoints for users, households, foods, units, and API tokens are functional behind AdminAuthGuard and documented in Swagger.
**Depends on**: Phase 3
**Requirements**: (none — infrastructure for Phase 12)
**Success Criteria** (what must be TRUE):
  1. Admin can call `GET /admin/users` and receive a paginated list of all users; create, edit, delete endpoints work and enforce AdminAuthGuard
  2. Admin can call household CRUD endpoints (`GET/POST/PATCH/DELETE /admin/households`) successfully
  3. Admin can call foods and units CRUD endpoints; created foods and units appear in the seed-queryable lists used by recipe ingredient forms
  4. Admin can call `POST /admin/tokens` to create an API token tied to a user; the raw token is returned once; `GET /admin/tokens` and `DELETE /admin/tokens/:id` work correctly
**Plans**: 5 plans

Plans:
- [x] 06-01-PLAN.md — Shared admin types (packages/shared/src/api/admin.ts) + CurrentAdmin decorator + Wave-0 test scaffolds
- [x] 06-02-PLAN.md — Admin users CRUD (expand AdminUsersService + AdminUsersController with findAll/findOne/create/update/remove)
- [x] 06-03-PLAN.md — Admin households CRUD (AdminHouseholdsService with cascade $transaction delete + AdminHouseholdsController)
- [x] 06-04-PLAN.md — Admin foods + units CRUD (AdminFoodsService/Controller + AdminUnitsService/Controller)
- [x] 06-05-PLAN.md — Admin tokens (AdminTokensService raw-token-once + AdminTokensController + final AdminModule wiring)

### Phase 7: Frontend Setup + App Shell + Auth Flows
**Goal**: The Next.js SPA scaffolds with a responsive app shell, all routes are in place, users can log in and log out, and the core UX primitives (loading states, toast notifications) are operational.
**Depends on**: Phase 3
**Requirements**: UX-01, UX-02, UX-03
**Success Criteria** (what must be TRUE):
  1. The app shell (top bar + drawer navigation) renders correctly on phone, tablet, and desktop without horizontal scroll or layout breakage
  2. An unauthenticated user visiting any protected route is redirected to `/login`; successful login redirects to `/recipes`
  3. Loading spinner/skeleton is visible while any TanStack Query fetch is in flight
  4. A toast notification appears and auto-dismisses for success, error, and informational states from anywhere in the app
**Plans**: 4 plans

Plans:
- [x] 07-01-PLAN.md — deps install, Tailwind v4 design tokens, api-client, QueryClient+Toaster, vitest Wave 0
- [x] 07-02-PLAN.md — TopBar, Drawer, AppShell components; route groups (app)/(auth); AppShell tests
- [x] 07-03-PLAN.md — AuthProvider, useAuth, ProtectedLayout redirect, full LoginPage form + auth tests
- [x] 07-04-PLAN.md — Skeleton component, Toast tests, human verification checkpoint

### Phase 8: Frontend Recipe List + Detail + Cook Mode
**Goal**: Users can browse their household recipe library with search, filter, sort, and pagination; they can view a full recipe detail page and enter cook mode.
**Depends on**: Phase 5, Phase 7
**Requirements**: RCP-07, RCP-08, SRCH-01, SRCH-02, SRCH-03, SRCH-04
**Success Criteria** (what must be TRUE):
  1. The `/recipes` page displays recipe cards for all household recipes; typing in the search box updates results with fuzzy matching
  2. Filtering by food/ingredient and sorting by name, date, or random all update the displayed list correctly
  3. Pagination controls let the user navigate pages and change page size
  4. The `/recipes/:slug` page shows the full recipe (ingredients, instructions, images, metadata)
  5. The `/recipes/:slug/cook` page enters full-screen cook mode with large text and step-by-step navigation controls
**Plans**: 3 plans

Plans:
- [x] 08-01-PLAN.md — Recipe list page: useDebounce, RecipeCard, RecipeListFilters, PaginationControls, full page with search/filter/sort/pagination
- [x] 08-02-PLAN.md — Recipe detail page: DetailTopBar, SectionAccordion, InfoGrid, IngredientList, InstructionList, full detail view
- [x] 08-03-PLAN.md — Cook mode page: full-screen overlay, CookStep component, step state machine, check-off navigation, completion state

### Phase 9: Frontend Recipe Creation + Editing
**Goal**: Users can create recipes from scratch, duplicate existing ones, and edit all recipe content (metadata, ingredients in sections, instruction steps, images) including locking.
**Depends on**: Phase 4, Phase 7
**Requirements**: RCP-01, RCP-02, RCP-03, RCP-04, RCP-05, ING-01, ING-02, ING-03, INS-01, INS-02, IMG-01, IMG-02
**Success Criteria** (what must be TRUE):
  1. A user can fill out the new recipe form and submit; the recipe appears in the list with a correct auto-generated slug
  2. A user can duplicate a recipe; the copy is independent with a new name and appears in the household list
  3. The ingredient editor allows adding ingredients (food picker, unit picker, quantity, note), organizing them into titled sections, and reordering within sections
  4. The step editor allows adding, editing, and reordering instruction steps via drag-and-drop
  5. A user can upload an image and see it on the recipe; deleting it removes it from the view
  6. A user can lock a recipe (edit controls disappear); this state persists after page refresh
**Plans**: 5 plans

Plans:
- [x] 09-01-PLAN.md — FAB + name prompt bottom sheet, edit mode toggle on detail page, EditorTabs, MetadataForm (Basico tab), Guardar pill
- [x] 09-02-PLAN.md — Ingredient editor: IngredientSectionEditor, IngredientRow, IngredientPicker with food/unit search, @dnd-kit reorder
- [x] 09-03-PLAN.md — Step editor: StepEditor, StepRow with drag-and-drop reorder, add/delete steps
- [x] 09-04-PLAN.md — Image management: ImageUpload with FormData, image grid, ConfirmDialog, delete confirmation
- [x] 09-05-PLAN.md — Backend isLocked + duplicate endpoint, RecipeSettings (lock toggle + duplicate), lock guard on detail page

### Phase 10: Frontend Meal Planner
**Goal**: Users can view the household meal plan as a weekly or monthly calendar, assign recipes to dates and meal types, drag-drop entries to reorganize, and edit or delete entries.
**Depends on**: Phase 5, Phase 7
**Requirements**: PLAN-01, PLAN-02, PLAN-03, PLAN-04, HH-02
**Success Criteria** (what must be TRUE):
  1. The `/planner` page renders a calendar grid showing 1 week or 4 weeks, switchable by the user
  2. A user can assign a recipe to a date and meal type (breakfast, lunch, dinner, snack, dessert); the entry appears in the correct calendar cell
  3. Dragging a meal plan entry to a different date or meal type slot updates it on the server and reflects in the UI
  4. A user can edit an entry (change recipe or meal type) or delete it; changes are visible to all household members after refresh
**Plans**: 3 plans

Plans:
- [x] 10-01-PLAN.md — Planner layout: date utils, WeekNav, WeekToggle, DayAccordion, MealEntryRow, MealTypeChips, PlannerPage with data fetching + delete mutation, Wave 0 test scaffold
- [x] 10-02-PLAN.md — Assign recipe: RecipePickerSheet with search + meal type chips, ConfirmDialog cancelLabel prop, create entry mutation, wired into PlannerPage
- [x] 10-03-PLAN.md — Drag-and-drop + edit/delete: useDraggable on MealEntryRow, useDroppable on DayAccordion, DndContext + optimistic PATCH, EditEntrySheet with save/delete

### Phase 11: Frontend Profile + Household + Shared Recipe
**Goal**: Users can view and edit their own profile, see household membership, and anyone with a share link can view a recipe publicly without logging in.
**Depends on**: Phase 4, Phase 7
**Requirements**: PROF-01, SHR-01, SHR-02
**Success Criteria** (what must be TRUE):
  1. The `/profile` page displays the current user's name, email, and username; editing and saving updates the data and confirms with a toast
  2. A user can generate a shareable public link from a recipe detail page; copying the link is accessible in one click
  3. Visiting `/shared/:token` in an unauthenticated browser tab shows the full recipe detail (no login prompt, no app shell)
**Plans**: 3 plans

Plans:
- [x] 11-01-PLAN.md — Profile page: display + edit form, PATCH /profile, Drawer nav link, ProfilePage tests
- [x] 11-02-PLAN.md — Share link: wire Compartir button to POST /share, BottomSheet with copy-to-clipboard, ShareLinkFlow tests
- [x] 11-03-PLAN.md — Public shared recipe page: /shared/[token] route outside (app), PublicLayout, read-only detail, SharedRecipePage tests

### Phase 12: Frontend Admin Panel
**Goal**: Admins can log in, complete the setup wizard on first install, and manage all system data (users, households, foods, units, API tokens) through a dedicated admin panel.
**Depends on**: Phase 6, Phase 7
**Requirements**: ADM-01, ADM-02, ADM-03, ADM-04, ADM-05, ADM-06
**Success Criteria** (what must be TRUE):
  1. The `/setup` page is accessible when no Admin exists; completing the form creates the Admin and redirects to `/admin/login`; visiting `/setup` afterward shows a 404 or redirect
  2. The `/admin/panel` page shows tabs or sections for Users, Households, Foods, Units, and Tokens; all CRUD actions work end-to-end
  3. Admin can generate a password reset URL for any user from the Users section; the URL is displayed for out-of-band sharing
  4. Admin can create an API token tied to a user; the raw token is shown exactly once; existing tokens are listed with name and creation date; tokens can be deleted
**Plans**: 5 plans

Plans:
- [ ] 12-01-PLAN.md — Backend GET /admin/auth/me + AdminMeResponse type + admin-api-client + AdminAuthProvider + admin login + setup wizard
- [ ] 12-02-PLAN.md — Admin panel shell: AdminSidebar, AdminTable, AdminForm, OneTimeDisplay, panel layout, query keys, PaginationControls update
- [ ] 12-03-PLAN.md — Users management (CRUD + password reset URL) + Households management (CRUD + cascade warning)
- [ ] 12-04-PLAN.md — Foods management (CRUD) + Units management (CRUD with abbreviation)
- [ ] 12-05-PLAN.md — API Tokens management (create with one-time display, list, revoke)

### Phase 13: Skill Bundle — Foundation + Read Operations
**Goal**: An agent can authenticate, understand shared conventions, and perform all read operations on recipes without prior knowledge of the API.
**Depends on**: Nothing (documentation only — no code dependencies)
**Requirements**: SKILL-01, SKILL-02, SKILL-03, SKILL-04
**Success Criteria** (what must be TRUE):
  1. An agent reading only `index.md` knows which file to open for any recipe-manager operation and does not need to guess
  2. An agent reading `shared.md` can construct a correctly authenticated request, interpret any error status code, and parse any paginated response
  3. An agent reading `recipes_search.md` can call `GET /api/recipes` with any combination of search, foodId, sort, order, page, and pageSize parameters and parse the response
  4. An agent reading `recipes_get.md` can call `GET /api/recipes/:id` and extract sections, ingredients, steps, and images from the response shape
**Plans**: TBD

### Phase 14: Skill Bundle — Write Operations + Meal Plan
**Goal**: An agent can create and edit recipes (including sections, ingredients, steps, and images) and manage meal plan entries entirely from the skill files.
**Depends on**: Phase 13
**Requirements**: SKILL-05, SKILL-06, SKILL-07, SKILL-08
**Success Criteria** (what must be TRUE):
  1. An agent reading `recipes_create.md` can resolve food and unit IDs, create a recipe, add sections with ingredients, and add steps — in the correct sequence — without consulting any other source
  2. An agent reading `recipes_edit.md` can update or delete recipe metadata, a section, an ingredient, or a step using only the IDs obtained from `recipes_get.md`
  3. An agent reading `recipes_image.md` can upload a multipart image and delete an existing image using only the recipe `id`
  4. An agent reading `meal_plan.md` can list entries for a date range, create an entry with a valid mealType value, update an entry, and delete an entry
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9 -> 10 -> 11 -> 12 -> 13 -> 14

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Monorepo + Shared Types | 3/3 | Complete   | 2026-03-16 |
| 2. Database Schema + Prisma | 2/2 | Complete | 2026-03-16 |
| 3. Backend Auth | 4/4 | Complete   | 2026-03-16 |
| 4. Backend Recipe CRUD | 4/4 | Complete   | 2026-03-16 |
| 5. Backend Search, Sharing, Meal Plan | 4/4 | Complete   | 2026-03-16 |
| 6. Backend Admin Endpoints | 5/5 | Complete   | 2026-03-18 |
| 7. Frontend Setup + App Shell + Auth Flows | 4/4 | Complete   | 2026-03-18 |
| 8. Frontend Recipe List + Detail + Cook Mode | 3/3 | Complete | 2026-03-18 |
| 9. Frontend Recipe Creation + Editing | 5/5 | Complete   | 2026-03-18 |
| 10. Frontend Meal Planner | 3/3 | Complete   | 2026-03-19 |
| 11. Frontend Profile + Household + Shared Recipe | 3/3 | Complete    | 2026-03-19 |
| 12. Frontend Admin Panel | 5/5 | Complete    | 2026-03-19 |
| 13. Skill Bundle — Foundation + Read Operations | 0/? | Not started | - |
| 14. Skill Bundle — Write Operations + Meal Plan | 0/? | Not started | - |
