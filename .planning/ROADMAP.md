# Roadmap: Recipe Manager

## Overview

This roadmap takes the project from an empty monorepo to a fully functional household recipe manager. The first six phases build the backend layer-by-layer (infrastructure, database, auth, recipe CRUD, search/sharing/meal plan, admin endpoints). The final six phases deliver the frontend, making every requirement observable to real users. Backend phases validate against the Swagger UI; frontend phases validate through the browser. Every v1 requirement is assigned to the phase where it first becomes fully verifiable.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Monorepo + Shared Types** - Yarn workspaces, packages/shared type foundations, Swagger configured (completed 2026-03-16)
- [ ] **Phase 2: Database Schema + Prisma** - Full Prisma schema, migrations, seed data, household scoping enforced
- [x] **Phase 3: Backend Auth** - User sessions, API key auth, admin auth, setup wizard, password reset (completed 2026-03-16)
- [ ] **Phase 4: Backend Recipe CRUD** - Recipe, section, ingredient, step, image endpoints; full non-admin REST API
- [ ] **Phase 5: Backend Search, Sharing, Meal Plan** - Fuzzy search, filtering, sorting, share tokens, meal plan endpoints
- [ ] **Phase 6: Backend Admin Endpoints** - Admin CRUD for users, households, foods, units, tokens
- [ ] **Phase 7: Frontend Setup + App Shell + Auth Flows** - Project scaffold, responsive shell, login/logout, UX primitives
- [ ] **Phase 8: Frontend Recipe List + Detail + Cook Mode** - Recipe browsing, search, filter, sort, detail view, cook mode
- [ ] **Phase 9: Frontend Recipe Creation + Editing** - Create/edit form, ingredients, sections, steps, images, lock, landscape
- [ ] **Phase 10: Frontend Meal Planner** - Weekly/monthly calendar, assign recipes, drag-drop, edit/delete entries
- [ ] **Phase 11: Frontend Profile + Household + Shared Recipe** - Profile editing, household view, public shared recipe page
- [ ] **Phase 12: Frontend Admin Panel** - Admin login, setup wizard, user/household/foods/units/tokens management UI

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
- [ ] 01-01: Monorepo scaffold (Yarn v4 workspaces, root tsconfig, .yarnrc.yml, package.json per workspace)
- [ ] 01-02: packages/shared — all domain type files, enums, PaginatedResponse, ErrorResponse, barrel export
- [ ] 01-03: NestJS bootstrap — main.ts, AppModule, PrismaModule, global ValidationPipe, Swagger setup at /api/docs

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
- [ ] 02-01-PLAN.md — Wave 0 infrastructure + full Prisma schema (13 models, 2 enums, compound unique constraints)
- [ ] 02-02-PLAN.md — Initial migration (prisma migrate dev --name init) + seed script (50 foods, 13 units, idempotent upsert)

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
- [ ] 03-01-PLAN.md — Guards + decorators (SessionAuthGuard, ApiKeyAuthGuard, AnyAuthGuard as APP_GUARD, AdminAuthGuard, @Public(), @CurrentUser()) + unit tests
- [ ] 03-02-PLAN.md — Session middleware (express-session + connect-pg-simple), AuthService, AuthController (login/logout/me), AdminAuthService, AdminAuthController
- [ ] 03-03-PLAN.md — SetupModule (SetupGuard, SetupService, SetupController GET/POST /setup)
- [ ] 03-04-PLAN.md — AdminUsersService (password reset URL generation), AdminUsersController (POST /admin/users/:id/password-reset-url)

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
- [ ] 04-01-PLAN.md — Schema cleanup (remove isLocked) + shared recipe types + static serving + Wave-0 test scaffolds
- [ ] 04-02-PLAN.md — RecipesService (CRUD, slug, household scoping) + RecipesController + RecipesModule
- [ ] 04-03-PLAN.md — Sections sub-module (CRUD, reorder) + Ingredients sub-module (CRUD, reorder)
- [ ] 04-04-PLAN.md — Steps sub-module (CRUD, reorder) + Images sub-module (Multer upload, delete) + final RecipesModule

### Phase 5: Backend Search, Sharing, Meal Plan
**Goal**: Recipe search (fuzzy, filter, sort, paginate), public share tokens, and meal plan CRUD endpoints are all functional and Swagger-documented.
**Depends on**: Phase 4
**Requirements**: (none — infrastructure for Phases 8, 10, 11)
**Success Criteria** (what must be TRUE):
  1. `GET /recipes?search=choco&fuzzy=true` returns recipes matching the fuzzy query, filtered to the authenticated user's household
  2. `GET /recipes?food=<foodId>&sort=name&order=asc&page=1&pageSize=10` returns a correctly filtered, sorted, paginated response matching `PaginatedResponse<RecipeListItem>`
  3. `POST /recipes/:id/share` generates a unique share token; `GET /shared/:token` returns the full recipe detail with no auth required
  4. `POST /meal-plan/entries` creates a meal plan entry for the household; `PATCH` and `DELETE` on existing entries work correctly
**Plans**: TBD

Plans:
- [ ] 05-01: Recipe search — full-text/fuzzy search, food filter, sort, pagination (integrated into RecipesService/Controller)
- [ ] 05-02: Sharing sub-module — share token generation, public endpoint (@Public())
- [ ] 05-03: Meal plan module — MealPlanController, MealPlanService (CRUD for entries, household-scoped)

### Phase 6: Backend Admin Endpoints
**Goal**: All admin CRUD endpoints for users, households, foods, units, and API tokens are functional behind AdminAuthGuard and documented in Swagger.
**Depends on**: Phase 3
**Requirements**: (none — infrastructure for Phase 12)
**Success Criteria** (what must be TRUE):
  1. Admin can call `GET /admin/users` and receive a paginated list of all users; create, edit, delete endpoints work and enforce AdminAuthGuard
  2. Admin can call household CRUD endpoints (`GET/POST/PATCH/DELETE /admin/households`) successfully
  3. Admin can call foods and units CRUD endpoints; created foods and units appear in the seed-queryable lists used by recipe ingredient forms
  4. Admin can call `POST /admin/tokens` to create an API token tied to a user; the raw token is returned once; `GET /admin/tokens` and `DELETE /admin/tokens/:id` work correctly
**Plans**: TBD

Plans:
- [ ] 06-01: Admin module — AdminAuthGuard wired, admin-auth controller/service (login/logout)
- [ ] 06-02: Admin users sub-module (CRUD + password reset URL generation)
- [ ] 06-03: Admin households sub-module (CRUD)
- [ ] 06-04: Admin foods + units sub-modules (CRUD)
- [ ] 06-05: Admin tokens sub-module (create, list, delete; token shown once)

### Phase 7: Frontend Setup + App Shell + Auth Flows
**Goal**: The Next.js SPA scaffolds with a responsive app shell, all routes are in place, users can log in and log out, and the core UX primitives (loading states, toast notifications) are operational.
**Depends on**: Phase 3
**Requirements**: UX-01, UX-02, UX-03
**Success Criteria** (what must be TRUE):
  1. The app shell (top bar + drawer navigation) renders correctly on phone, tablet, and desktop without horizontal scroll or layout breakage
  2. An unauthenticated user visiting any protected route is redirected to `/login`; successful login redirects to `/recipes`
  3. Loading spinner/skeleton is visible while any TanStack Query fetch is in flight
  4. A toast notification appears and auto-dismisses for success, error, and informational states from anywhere in the app
**Plans**: TBD

Plans:
- [ ] 07-01: Next.js scaffold — Tailwind config, global CSS (design tokens), tsconfig, api-client.ts, query-keys.ts
- [ ] 07-02: App shell — AppShell layout, TopBar, Drawer, route groups ((auth), (app), (admin), shared/)
- [ ] 07-03: Auth flows — login page, AuthProvider/useAuth, session detection, protected route redirect
- [ ] 07-04: UX primitives — loading indicators (skeletons/spinners), toast/notification system, responsive layout validation

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
**Plans**: TBD

Plans:
- [ ] 08-01: Recipe list page — RecipeCard component, search input, food filter, sort controls, pagination
- [ ] 08-02: Recipe detail page — IngredientList, InstructionList, image carousel, recipe metadata display
- [ ] 08-03: Cook mode page — full-screen layout, large text rendering, step navigation (prev/next), exit button

### Phase 9: Frontend Recipe Creation + Editing
**Goal**: Users can create recipes from scratch, duplicate existing ones, and edit all recipe content (metadata, ingredients in sections, instruction steps, images) including locking and landscape view toggle.
**Depends on**: Phase 4, Phase 7
**Requirements**: RCP-01, RCP-02, RCP-03, RCP-04, RCP-05, RCP-06, ING-01, ING-02, ING-03, INS-01, INS-02, IMG-01, IMG-02
**Success Criteria** (what must be TRUE):
  1. A user can fill out the new recipe form and submit; the recipe appears in the list with a correct auto-generated slug
  2. A user can duplicate a recipe; the copy is independent with a new name and appears in the household list
  3. The ingredient editor allows adding ingredients (food picker, unit picker, quantity, note), organizing them into titled sections, and reordering within sections
  4. The step editor allows adding, editing, and reordering instruction steps via drag-and-drop
  5. A user can upload an image and see it on the recipe; deleting it removes it from the view
  6. A user can lock a recipe (edit controls disappear) and toggle landscape view; these states persist after page refresh
**Plans**: TBD

Plans:
- [ ] 09-01: Recipe form shell — create/edit route, form state, metadata fields (name, description, servings, times, source URL), slug preview
- [ ] 09-02: Ingredient editor — IngredientSection component, food/unit pickers (API-backed dropdowns), add/remove/reorder ingredients
- [ ] 09-03: Step editor — InstructionStep component, add/remove/reorder steps with drag-and-drop
- [ ] 09-04: Image management — image upload component, image grid, delete confirmation
- [ ] 09-05: Recipe settings — lock toggle, landscape view toggle, duplicate action

### Phase 10: Frontend Meal Planner
**Goal**: Users can view the household meal plan as a weekly or monthly calendar, assign recipes to dates and meal types, drag-drop entries to reorganize, and edit or delete entries.
**Depends on**: Phase 5, Phase 7
**Requirements**: PLAN-01, PLAN-02, PLAN-03, PLAN-04, HH-02
**Success Criteria** (what must be TRUE):
  1. The `/planner` page renders a calendar grid showing 1 week or 4 weeks, switchable by the user
  2. A user can assign a recipe to a date and meal type (breakfast, lunch, dinner, snack, dessert); the entry appears in the correct calendar cell
  3. Dragging a meal plan entry to a different date or meal type slot updates it on the server and reflects in the UI
  4. A user can edit an entry (change recipe or meal type) or delete it; changes are visible to all household members after refresh
**Plans**: TBD

Plans:
- [ ] 10-01: Planner layout — calendar grid component, 1-week/4-week toggle, MealPlanEntry display cards
- [ ] 10-02: Assign recipe — recipe picker modal/drawer, meal type selector, entry creation
- [ ] 10-03: Drag-and-drop reorganization — drag-drop library integration, optimistic update on drop
- [ ] 10-04: Edit/delete entry — entry edit modal, delete confirmation

### Phase 11: Frontend Profile + Household + Shared Recipe
**Goal**: Users can view and edit their own profile, see household membership, and anyone with a share link can view a recipe publicly without logging in.
**Depends on**: Phase 4, Phase 7
**Requirements**: PROF-01, SHR-01, SHR-02
**Success Criteria** (what must be TRUE):
  1. The `/profile` page displays the current user's name, email, and username; editing and saving updates the data and confirms with a toast
  2. A user can generate a shareable public link from a recipe detail page; copying the link is accessible in one click
  3. Visiting `/shared/:token` in an unauthenticated browser tab shows the full recipe detail (no login prompt, no app shell)
**Plans**: TBD

Plans:
- [ ] 11-01: Profile page — display and edit form, PATCH /profile integration, success/error toasts
- [ ] 11-02: Share link generation — share button on recipe detail, token generation, copy-to-clipboard
- [ ] 11-03: Public shared recipe page — /shared/:token route, public layout, full recipe detail (no auth)

### Phase 12: Frontend Admin Panel
**Goal**: Admins can log in, complete the setup wizard on first install, and manage all system data (users, households, foods, units, API tokens) through a dedicated admin panel.
**Depends on**: Phase 6, Phase 7
**Requirements**: ADM-01, ADM-02, ADM-03, ADM-04, ADM-05, ADM-06
**Success Criteria** (what must be TRUE):
  1. The `/setup` page is accessible when no Admin exists; completing the form creates the Admin and redirects to `/admin/login`; visiting `/setup` afterward shows a 404 or redirect
  2. The `/admin/panel` page shows tabs or sections for Users, Households, Foods, Units, and Tokens; all CRUD actions work end-to-end
  3. Admin can generate a password reset URL for any user from the Users section; the URL is displayed for out-of-band sharing
  4. Admin can create an API token tied to a user; the raw token is shown exactly once; existing tokens are listed with name and creation date; tokens can be deleted
**Plans**: TBD

Plans:
- [ ] 12-01: Admin login page (/admin/login), admin session handling, AdminAuthProvider
- [ ] 12-02: Setup wizard page (/setup) — first-time setup form, SetupGuard redirect logic
- [ ] 12-03: Admin panel shell — layout, tab/section navigation, admin API client
- [ ] 12-04: Users management — paginated user list, create/edit/delete user forms, password reset URL display
- [ ] 12-05: Households management — household list, create/edit/delete
- [ ] 12-06: Foods + Units management — CRUD tables for both
- [ ] 12-07: API Tokens management — create token (show raw token once), token list, delete

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 → 12

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Monorepo + Shared Types | 3/3 | Complete   | 2026-03-16 |
| 2. Database Schema + Prisma | 0/2 | Planned | - |
| 3. Backend Auth | 4/4 | Complete   | 2026-03-16 |
| 4. Backend Recipe CRUD | 1/4 | In Progress|  |
| 5. Backend Search, Sharing, Meal Plan | 0/3 | Not started | - |
| 6. Backend Admin Endpoints | 0/5 | Not started | - |
| 7. Frontend Setup + App Shell + Auth Flows | 0/4 | Not started | - |
| 8. Frontend Recipe List + Detail + Cook Mode | 0/3 | Not started | - |
| 9. Frontend Recipe Creation + Editing | 0/5 | Not started | - |
| 10. Frontend Meal Planner | 0/4 | Not started | - |
| 11. Frontend Profile + Household + Shared Recipe | 0/3 | Not started | - |
| 12. Frontend Admin Panel | 0/7 | Not started | - |
