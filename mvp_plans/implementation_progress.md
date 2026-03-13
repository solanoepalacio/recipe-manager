# Implementation Progress

Tracks implementation milestones and tasks. Each task is independently verifiable, performed in its own branch, and follows the workflow defined in `implementation_workflow.md`.

**Branch naming:** `impl/{task-id}-{short-name}` (e.g., `impl/0.1-workspace-init`)
**Merge target:** `main`
**Rule:** No branch is merged without all tests passing.

---

## Milestone 0 — Monorepo Scaffolding

Bootstrap the Yarn v4 workspace with all three packages compiling and cross-referencing correctly.

| # | Task | Verification | Status |
|---|------|-------------|--------|
| 0.1 | Initialize Yarn v4 workspace root: `package.json`, `.yarnrc.yml`, `tsconfig.base.json` | `yarn install` succeeds | Complete |
| 0.2 | Scaffold `packages/shared`: `package.json` (`@recipe-manager/shared`), `tsconfig.json`, `src/index.ts` barrel | Package compiles with `tsc --noEmit` | Complete |
| 0.3 | Scaffold `apps/api`: NestJS app with `package.json` (`@recipe-manager/api`), `tsconfig.json`, `nest-cli.json`, minimal `main.ts` + `app.module.ts` | `yarn workspace @recipe-manager/api build` succeeds; app starts and responds on health endpoint | Complete |
| 0.4 | Scaffold `apps/web`: Next.js app with `package.json` (`@recipe-manager/web`), `tsconfig.json`, `next.config.ts`, minimal root layout + page | `yarn workspace @recipe-manager/web build` succeeds | Complete |
| 0.5 | Wire cross-workspace imports: `apps/api` and `apps/web` both import from `@recipe-manager/shared` | A dummy type exported from shared is consumed in both apps; both compile | Complete |

---

## Milestone 1 — Shared Types

Define all API boundary types in `packages/shared`. These are the source of truth for request/response shapes.

| # | Task | Verification | Status |
|---|------|-------------|--------|
| 1.1 | Common types: `PaginatedResponse<T>`, `ErrorResponse`, `ReorderRequest` | Compiles; exported from barrel | Complete |
| 1.2 | Enums: `Gender`, `MealType` | Compiles; exported from barrel | Complete |
| 1.3 | Auth types: `LoginRequest`, `LoginResponse`, `MeResponse`, `LogoutResponse` | Compiles; exported from barrel | Complete |
| 1.4 | Setup types: `SetupStatusResponse`, `CreateAdminRequest`, `CreateAdminResponse` | Compiles; exported from barrel | Complete |
| 1.5 | Profile types: `ProfileResponse`, `UpdateProfileRequest` | Compiles; exported from barrel | Complete |
| 1.6 | Household types: `HouseholdResponse`, `MemberResponse`, `CreateMemberRequest`, `UpdateMemberRequest` | Compiles; exported from barrel | Complete |
| 1.7 | Food types: `FoodResponse`, `FoodListResponse` | Compiles; exported from barrel | Complete |
| 1.8 | Unit types: `UnitResponse`, `UnitListResponse` | Compiles; exported from barrel | Complete |
| 1.9 | Recipe types: `RecipeListItemResponse`, `RecipeDetailResponse`, `CreateRecipeRequest`, `UpdateRecipeRequest`, `DuplicateRecipeResponse` | Compiles; exported from barrel | Complete |
| 1.10 | Recipe sub-resource types: `IngredientSectionResponse`, `RecipeIngredientResponse`, `CreateIngredientRequest`, `UpdateIngredientRequest`, `CreateSectionRequest`, `UpdateSectionRequest` | Compiles; exported from barrel | Complete |
| 1.11 | Instruction step types: `InstructionStepResponse`, `CreateStepRequest`, `UpdateStepRequest` | Compiles; exported from barrel | Complete |
| 1.12 | Recipe image types: `RecipeImageResponse`, `UploadImageResponse` | Compiles; exported from barrel | Complete |
| 1.13 | Recipe sharing types: `ShareRecipeResponse`, `SharedRecipeResponse` | Compiles; exported from barrel | Complete |
| 1.14 | Meal plan types: `MealPlanResponse`, `MealPlanEntryResponse`, `CreateMealPlanEntryRequest`, `UpdateMealPlanEntryRequest` | Compiles; exported from barrel | Complete |
| 1.15 | Admin types: `AdminLoginRequest`, `AdminUserResponse`, `AdminCreateUserRequest`, `AdminUpdateUserRequest`, `AdminHouseholdResponse`, `AdminCreateHouseholdRequest`, `AdminUpdateHouseholdRequest`, `AdminFoodRequest`, `AdminUnitRequest`, `AdminTokenResponse`, `AdminCreateTokenRequest`, `AdminCreateTokenResponse`, `PasswordResetUrlResponse` | Compiles; exported from barrel | Complete |

---

## Milestone 2 — Database

Prisma schema, initial migration, and seed data.

| # | Task | Verification | Status |
|---|------|-------------|--------|
| 2.1 | Prisma schema: all models from `01_tech_stack_and_data_model.md` + password reset fields from `02_auth_design.md` + session table for `connect-pg-simple` | `npx prisma validate` passes | Complete |
| 2.2 | Initial migration: generate and apply migration against a local PostgreSQL | `npx prisma migrate dev` succeeds; all tables created | Complete |
| 2.3 | Seed script: populate foods (common ingredients), units (cup, tbsp, tsp, g, kg, ml, L, oz, lb, unit), and a dev admin account | `npx prisma db seed` succeeds; data queryable | Complete |

---

## Milestone 3 — API Core Infrastructure

Global middleware, pipes, filters, decorators, and Swagger setup. Everything that other modules depend on.

| # | Task | Verification | Status |
|---|------|-------------|--------|
| 3.1 | Prisma module + service: injectable `PrismaService` extending `PrismaClient` with `onModuleInit`/`onModuleDestroy` | Unit test: service connects and disconnects | Complete |
| 3.2 | Global validation pipe: `ValidationPipe` with `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true` | Unit test: invalid DTO rejected with 400; extra fields stripped | Complete |
| 3.3 | Global exception filter: catch Prisma known errors (not found, unique constraint) and map to appropriate HTTP status | Unit test: `P2025` → 404, `P2002` → 409 | Complete |
| 3.4 | Common decorators: `@CurrentUser()`, `@CurrentAdmin()`, `@Public()` | Unit test: decorators extract correct request properties | Complete |
| 3.5 | OpenAPI/Swagger setup: `SwaggerModule` configured in `main.ts`, served at `/api/docs` | App starts; `GET /api/docs` returns Swagger UI HTML | Complete |

---

## Milestone 4 — Authentication

Session store, all guards, and auth endpoints.

**Depends on:** M2 (database), M3 (core infra)

| # | Task | Verification | Status |
|---|------|-------------|--------|
| 4.1 | Session store: `express-session` with `connect-pg-simple`, cookie config (HttpOnly, SameSite) | Integration test: session created in DB after login simulation | Complete |
| 4.2 | `SessionAuthGuard`: validate session cookie, attach `req.user` | Unit test: valid session passes, missing/invalid session returns 401 | Complete |
| 4.3 | `ApiKeyAuthGuard`: validate `Authorization: Bearer <token>`, hash + lookup, attach `req.user`, update `lastUsedAt` | Unit test: valid token passes, invalid token returns 401, `lastUsedAt` updated | Complete |
| 4.4 | `AnyAuthGuard`: composite guard — either session or API key passes | Unit test: passes with session only, passes with API key only, 401 with neither | Complete |
| 4.5 | `AdminAuthGuard`: validate admin session cookie, attach `req.admin` | Unit test: valid admin session passes, user session rejected, no session returns 401 | Complete |
| 4.6 | Auth controller + service: `POST /api/auth/login` (email or username + password), `POST /api/auth/logout`, `GET /api/auth/me` | Integration test: login sets cookie, `/me` returns user, logout clears session | Complete |
| 4.7 | Admin auth controller + service: `POST /api/admin/auth/login`, `POST /api/admin/auth/logout` | Integration test: admin login sets cookie, logout clears session | Complete |

---

## Milestone 5 — Setup Wizard

First-time setup flow.

**Depends on:** M3 (core infra), M2 (database)

| # | Task | Verification | Status |
|---|------|-------------|--------|
| 5.1 | `SetupGuard`: allows access only when no `Admin` record exists | Unit test: passes when no admin, blocks when admin exists | Complete |
| 5.2 | Setup controller + service: `GET /api/setup` (returns `{ required: bool }`), `POST /api/setup` (creates admin) | Integration test: GET returns `required: true` on fresh DB; POST creates admin; subsequent GET returns `required: false`; second POST returns 404 | Complete |

---

## Milestone 6 — User-Facing API

All non-admin API modules. Each task includes controller, service, and DTOs.

**Depends on:** M4 (auth), M1 (shared types)

| # | Task | Verification | Status |
|---|------|-------------|--------|
| 6.1 | Profile module: `GET /api/profile`, `PATCH /api/profile` | Integration test: get returns user profile; patch updates name/email/username/password | Complete |
| 6.2 | Household module: `GET /api/household` (with members) | Integration test: returns household name + member list for authenticated user | Complete |
| 6.3 | Household members: `GET /api/household/members`, `POST`, `GET /:id`, `PATCH /:id`, `DELETE /:id` | Integration test: CRUD lifecycle for a no-login member; scoped to user's household | Complete |
| 6.4 | Foods module (read-only): `GET /api/foods` with optional `?q=` search | Integration test: returns food list; search filters correctly | Complete |
| 6.5 | Units module (read-only): `GET /api/units` | Integration test: returns unit list | Complete |
| 6.6 | Recipes module — core CRUD: `GET /api/recipes` (list with search, filter, sort, pagination), `POST` (create), `GET /:id` (detail), `PATCH /:id` (update), `DELETE /:id`, `POST /:id/duplicate` | Integration test: full CRUD lifecycle; list with search/filter/sort/pagination; duplicate creates independent copy; household-scoped | Complete |
| 6.7 | Recipe sections: `POST /api/recipes/:id/sections`, `PATCH /:sectionId`, `DELETE /:sectionId`, `PUT /reorder` | Integration test: CRUD + reorder lifecycle for ingredient sections | Complete |
| 6.8 | Recipe ingredients: `POST .../sections/:sectionId/ingredients`, `PATCH /:ingredientId`, `DELETE /:ingredientId`, `PUT /reorder` | Integration test: CRUD + reorder lifecycle for ingredients within a section | Complete |
| 6.9 | Recipe steps: `POST /api/recipes/:id/steps`, `PATCH /:stepId`, `DELETE /:stepId`, `PUT /reorder` | Integration test: CRUD + reorder lifecycle for instruction steps | Complete |
| 6.10 | Recipe images: `POST /api/recipes/:id/images` (multipart upload), `DELETE /:imageId` | Integration test: upload creates image record; delete removes it; file stored on disk | Complete |
| 6.11 | Recipe sharing: `POST /api/recipes/:id/share`, `DELETE /api/recipes/:id/share`, `GET /api/recipes/shared/:token` (public, no auth) | Integration test: share generates token + URL; public GET returns recipe; revoke invalidates token | Complete |
| 6.12 | Meal plan module: `GET /api/meal-plan` (with date range), `POST /api/meal-plan/entries`, `PATCH /:id`, `DELETE /:id` | Integration test: get returns entries grouped by date; add/move/remove entry lifecycle; household-scoped | Complete |

---

## Milestone 7 — Admin API

All admin-only endpoints. Protected by `AdminAuthGuard`.

**Depends on:** M4 (auth — admin guard), M1 (shared types)

| # | Task | Verification | Status |
|---|------|-------------|--------|
| 7.1 | Admin users: `GET /api/admin/users`, `POST`, `GET /:id`, `PATCH /:id`, `DELETE /:id` | Integration test: CRUD lifecycle; paginated list | Complete |
| 7.2 | Admin password reset: `POST /api/admin/users/:id/password-reset-url` | Integration test: generates hashed token + expiry on user; returns URL; token is one-time use | Complete |
| 7.3 | Admin households: `GET /api/admin/households`, `POST`, `GET /:id`, `PATCH /:id`, `DELETE /:id` | Integration test: CRUD lifecycle; GET /:id includes members; delete cascades | Complete |
| 7.4 | Admin foods: `GET /api/admin/foods`, `POST`, `PATCH /:id`, `DELETE /:id` | Integration test: CRUD lifecycle; paginated list | Complete |
| 7.5 | Admin units: `GET /api/admin/units`, `POST`, `PATCH /:id`, `DELETE /:id` | Integration test: CRUD lifecycle; paginated list | Complete |
| 7.6 | Admin tokens: `GET /api/admin/tokens`, `POST` (returns raw token once), `DELETE /:id` | Integration test: create returns raw token; list shows metadata only; delete revokes | Complete |

---

## Milestone 8 — Password Reset Flow

The user-facing side of admin-generated password resets.

**Depends on:** M7.2 (admin password reset)

| # | Task | Verification | Status |
|---|------|-------------|--------|
| 8.1 | Password reset endpoint: `POST /api/auth/reset-password` — accepts token + new password, validates expiry, updates password, clears token | Integration test: valid token resets password; expired token returns 400; reused token returns 400 | Complete |

---

## Milestone 9 — Frontend Foundation

Tailwind, API client, auth, query setup, and design system components.

**Depends on:** M0.4 (web scaffold), M1 (shared types)

| # | Task | Verification | Status |
|---|------|-------------|--------|
| 9.1 | Tailwind config: design tokens (colors, fonts, border-radius) from hi-fi wireframes; `globals.css` with Tailwind directives + Outfit font | Build succeeds; tokens available in utility classes | Not Started |
| 9.2 | API client: typed `fetch` wrapper with `credentials: 'include'`; generic `get<T>`, `post<T>`, `patch<T>`, `delete<T>` methods; error handling | Unit test: correct URL construction, headers, error parsing; types propagate from `@recipe-manager/shared` | Not Started |
| 9.3 | Auth context + provider: `AuthProvider` wrapping app; `useAuth()` hook returning user/loading/login/logout; redirect to `/login` when unauthenticated | Unit test: provider exposes auth state; hook returns correct values | Not Started |
| 9.4 | TanStack Query setup: `QueryClientProvider` in root layout; `query-keys.ts` factory for all domains | Unit test: query key factory produces correct keys | Not Started |
| 9.5 | UI primitive — Button: filled, outline, destructive variants; sizes; loading state | Unit test: renders each variant; click handler fires; loading disables | Not Started |
| 9.6 | UI primitive — Input: text, password, textarea, number variants; underline and bordered styles; labels; error state | Unit test: renders variants; value changes propagate; error message shown | Not Started |
| 9.7 | UI primitive — Modal: full-screen modal with top bar (close/back + title); animated entry/exit | Unit test: opens/closes; renders title and children; close callback fires | Not Started |
| 9.8 | UI primitive — BottomSheet: scrim overlay, drag handle, sheet content; animated slide-up | Unit test: opens/closes; scrim click dismisses; children rendered | Not Started |
| 9.9 | UI primitive — Accordion: collapsible sections with chevron toggle; multiple open; expanded bg | Unit test: toggle open/close; renders children when open; chevron rotates | Not Started |
| 9.10 | UI primitive — TabBar: equal-width tabs; active tab with green underline; callback on tab change | Unit test: renders tabs; active styling applied; change callback fires | Not Started |
| 9.11 | Layout — TopBar: standard variant (hamburger + title) and detail variant (back arrow + title + overflow) | Unit test: renders both variants; hamburger/back click fires callback | Not Started |
| 9.12 | Layout — Drawer: slide-from-left; header with greeting + household link; nav items; active state with green underline | Unit test: opens/closes; nav items render; active item styled; click callbacks fire | Not Started |
| 9.13 | Layout — AppShell: combines TopBar + Drawer; manages drawer open/close state; wraps page content | Unit test: renders children; drawer toggles; title updates | Not Started |

---

## Milestone 10 — Frontend Auth & Setup Pages

Login, admin login, setup wizard.

**Depends on:** M9 (foundation)

| # | Task | Verification | Status |
|---|------|-------------|--------|
| 10.1 | Login page (`/login`): centered form, email/username + password, submit, inline error | Unit test: form renders; submit calls API client; error displayed on failure | Not Started |
| 10.2 | Setup wizard page (`/setup`): checks `GET /api/setup`; form with email + password + confirm; creates admin; redirects to admin login | Unit test: redirects if setup not required; form validates confirm match; submit calls API | Not Started |
| 10.3 | Admin login page (`/admin/login`): standalone form; sets admin session; redirects to panel | Unit test: form renders; submit calls admin auth API | Not Started |
| 10.4 | Password reset page (`/reset-password`): accepts token from URL; new password + confirm; submit | Unit test: form renders; submit calls reset API; success redirects to login | Not Started |

---

## Milestone 11 — Frontend Main Views

All authenticated user-facing pages.

**Depends on:** M9 (foundation), M10 (auth pages)

| # | Task | Verification | Status |
|---|------|-------------|--------|
| 11.1 | Recipe card component: image thumbnail + title + total time | Unit test: renders data; click callback fires | Not Started |
| 11.2 | Today page (`/today`): greeting, today's recipes list (from meal plan), stat boxes placeholder | Unit test: renders greeting with user name; renders recipe links; renders empty state | Not Started |
| 11.3 | Recipe list page (`/recipes`): search bar, sort/filter chips, recipe cards grid, FAB | Unit test: renders cards from query; search filters; sort changes; FAB click callback | Not Started |
| 11.4 | Recipe list — new recipe flow: FAB opens BottomSheet with name input; submit creates recipe via API; navigates to detail | Unit test: bottom sheet opens; submit calls create API; navigates on success | Not Started |
| 11.5 | Recipe detail page (`/recipes/:slug`) — view mode: hero image, sticky header, times, ingredient sections (accordion), instruction steps | Unit test: renders recipe data; sections collapsible; scroll behavior | Not Started |
| 11.6 | Recipe detail — edit mode: toggle via "Edit"/"Done" button; drag handles + delete buttons appear; inline name editing; add ingredient/step buttons | Unit test: edit toggle shows/hides affordances; delete calls API; name editable | Not Started |
| 11.7 | Recipe detail — share dialog: share button generates/shows link; copy to clipboard; revoke | Unit test: share calls API; link displayed; copy works; revoke calls delete | Not Started |
| 11.8 | Recipe creation — tab navigation: Ingredients, Instructions, Basic, Photos tabs; tab bar switches content; save button | Unit test: tabs render; switching shows correct panel; save calls API | Not Started |
| 11.9 | Recipe creation — ingredients tab: list of ingredients with drag/delete; "Add ingredient" opens picker | Unit test: renders ingredient list; reorder calls API; delete calls API | Not Started |
| 11.10 | Recipe creation — ingredient picker modal: full-screen; search bar; food list with selection; "+ Create [term]" row; quantity/unit/note fields after selection; confirm | Unit test: search filters foods; selection highlights; create inline calls food API; confirm adds ingredient | Not Started |
| 11.11 | Recipe creation — instructions tab: numbered steps with optional title + textarea; drag reorder; delete; add step | Unit test: renders steps; add creates new; reorder calls API; delete calls API | Not Started |
| 11.12 | Recipe creation — basic info tab: name, description, servings (qty + unit), prep time, cook time fields | Unit test: fields render with values; changes tracked; save persists via API | Not Started |
| 11.13 | Recipe creation — photos tab: upload zone; image preview; delete button | Unit test: upload calls API with FormData; preview shows image; delete calls API | Not Started |
| 11.14 | Cook mode page (`/recipes/:slug/cook`): full-screen step list; tap to check/collapse step; "you are here" hint; exit button | Unit test: renders steps; tap checks + collapses; exit navigates back | Not Started |
| 11.15 | Meal planner page (`/planner`): week nav (prev/next); 7 day accordion rows; summary text when collapsed; expanded shows recipe entries + add/delete | Unit test: week navigation changes date range; days expand/collapse; add opens picker; delete removes entry | Not Started |
| 11.16 | Meal planner — recipe picker: BottomSheet with search; recipe list with time; tap assigns recipe to day | Unit test: search filters recipes; tap calls add entry API; sheet closes | Not Started |
| 11.17 | Profile page (`/profile`): user name heading, email, logout button | Unit test: renders user data; logout calls API and redirects | Not Started |
| 11.18 | Household page (`/household`): household name heading, member list with "(you)" and admin badge | Unit test: renders household name; marks current user; shows all members | Not Started |
| 11.19 | Shared recipe page (`/shared/:token`): public layout with branding banner/footer; recipe detail read-only; cook mode button; no edit | Unit test: renders recipe from public API; no edit button; branding visible; cook mode accessible | Not Started |

---

## Milestone 12 — Frontend Admin

Admin panel views.

**Depends on:** M9 (foundation), M10.3 (admin login)

| # | Task | Verification | Status |
|---|------|-------------|--------|
| 12.1 | Admin layout: top bar with "Administration" + logout button; no drawer | Unit test: renders title; logout calls admin auth API | Not Started |
| 12.2 | Admin panel — household list: accordion of households with member count; expand shows members with action icons | Unit test: renders households; expand shows members; collapse works | Not Started |
| 12.3 | Admin panel — create household: form in modal; submit creates household | Unit test: modal opens; form validates; submit calls API | Not Started |
| 12.4 | Admin panel — edit user modal: full-screen; name, email, DOB, gender, household fields; save + delete actions | Unit test: modal opens with user data; save calls PATCH; delete calls DELETE with confirmation | Not Started |
| 12.5 | Admin panel — API tokens modal: full-screen; token list with delete; create button; one-time token display + copy | Unit test: lists tokens; create shows raw token; copy works; delete calls API | Not Started |
| 12.6 | Admin panel — password reset modal: full-screen; generate link button; URL display + copy | Unit test: generate calls API; URL displayed; copy works | Not Started |
| 12.7 | Admin panel — foods management: list with search; create/edit/delete inline or modal | Unit test: CRUD lifecycle via UI; search filters | Not Started |
| 12.8 | Admin panel — units management: list with search; create/edit/delete inline or modal | Unit test: CRUD lifecycle via UI; search filters | Not Started |

---

## Milestone 13 — Integration & Polish

End-to-end flows, responsive design, loading/error/empty states.

**Depends on:** All previous milestones

| # | Task | Verification | Status |
|---|------|-------------|--------|
| 13.1 | Loading states: skeleton/spinner for all data-fetching views | Visual review: every page shows loading indicator before data arrives | Not Started |
| 13.2 | Error states: inline error messages for form validation; toast/notification for API errors | Unit test: validation errors shown inline; API errors trigger notification | Not Started |
| 13.3 | Empty states: all views per `05_ui_views.md` empty states section | Unit test: correct empty message for each view when data is absent | Not Started |
| 13.4 | Responsive — tablet breakpoint (768px): semi-persistent drawer; 2-column recipe grid; 2-column recipe detail | Visual review at 768px viewport | Not Started |
| 13.5 | Responsive — desktop breakpoint (1024px+): persistent sidebar; 3-column recipe grid; max-width constraints | Visual review at 1280px viewport | Not Started |
| 13.6 | E2E smoke test — user flow: login → create recipe (name → ingredients → steps → photo) → view detail → cook mode → share → meal plan | Integration test: full flow with real API | Not Started |
| 13.7 | E2E smoke test — admin flow: setup wizard → admin login → create household → create user → generate token → password reset | Integration test: full flow with real API | Not Started |

---

## Summary

| Milestone | Tasks | Description |
|-----------|-------|-------------|
| M0 | 5 | Monorepo scaffolding |
| M1 | 15 | Shared types |
| M2 | 3 | Database schema + seed |
| M3 | 5 | API core infrastructure |
| M4 | 7 | Authentication |
| M5 | 2 | Setup wizard |
| M6 | 12 | User-facing API |
| M7 | 6 | Admin API |
| M8 | 1 | Password reset flow |
| M9 | 13 | Frontend foundation |
| M10 | 4 | Frontend auth pages |
| M11 | 19 | Frontend main views |
| M12 | 8 | Frontend admin |
| M13 | 7 | Integration & polish |
| **Total** | **107** | |
