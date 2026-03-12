# Step 3 — API Design (REST Contract)

## Conventions

| Convention | Decision |
|------------|----------|
| Base path | `/api` — no versioning for MVP |
| Single resource response | Bare resource object |
| List response | `{ "items": [...], "total": 0, "page": 1, "perPage": 20 }` |
| Error response | NestJS defaults (`statusCode`, `message`, `error`) |
| Sub-resources | Fully nested (e.g. `/recipes/:id/sections/:sectionId/ingredients`) |
| Reordering | `PUT .../reorder` with body `{ "ids": ["uuid", ...] }` in desired order |
| Household scoping | Implicit — derived from session/token. No household ID in URL for user-facing routes. |
| Auth header (agent) | `Authorization: Bearer <token>` |
| Validation errors | `class-validator` via global `ValidationPipe` — 400 with message array |

---

## Endpoint Reference

### Setup

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/setup` | None | Returns `{ "required": true/false }`. Used by UI to redirect to setup wizard on fresh install. |
| POST | `/api/setup` | None | Create the Admin account. Only accessible when no Admin record exists (enforced by `SetupGuard`). |

---

### Authentication

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/login` | None | Login with `email`/`username` + `password`. Sets session cookie. |
| POST | `/api/auth/logout` | Session | Destroy session, clear cookie. |
| GET | `/api/auth/me` | Session or API key | Returns the authenticated user. |

---

### Admin — Authentication

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/admin/auth/login` | None | Admin login with `email` + `password`. Sets admin session cookie. |
| POST | `/api/admin/auth/logout` | Admin session | Destroy admin session. |

---

### Admin — Users

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/users` | Admin | Paginated list of all users. |
| POST | `/api/admin/users` | Admin | Create a new user (assigned to a household). |
| GET | `/api/admin/users/:id` | Admin | Get a single user. |
| PATCH | `/api/admin/users/:id` | Admin | Edit a user's profile. |
| DELETE | `/api/admin/users/:id` | Admin | Delete a user. |
| POST | `/api/admin/users/:id/password-reset-url` | Admin | Generate a one-time password reset URL for the user. |

---

### Admin — Households

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/households` | Admin | Paginated list of all households. |
| POST | `/api/admin/households` | Admin | Create a new household. |
| GET | `/api/admin/households/:id` | Admin | Get a single household with its members. |
| PATCH | `/api/admin/households/:id` | Admin | Edit household name. |
| DELETE | `/api/admin/households/:id` | Admin | Delete a household and all its data. |

---

### Admin — Foods

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/foods` | Admin | Paginated list of all foods. |
| POST | `/api/admin/foods` | Admin | Create a food. |
| PATCH | `/api/admin/foods/:id` | Admin | Edit a food. |
| DELETE | `/api/admin/foods/:id` | Admin | Delete a food. |

---

### Admin — Units

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/units` | Admin | Paginated list of all units. |
| POST | `/api/admin/units` | Admin | Create a unit. |
| PATCH | `/api/admin/units/:id` | Admin | Edit a unit. |
| DELETE | `/api/admin/units/:id` | Admin | Delete a unit. |

---

### Admin — API Tokens

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/tokens` | Admin | List all API tokens (name, createdAt, lastUsedAt — never the raw token). |
| POST | `/api/admin/tokens` | Admin | Create a new API token. Returns the raw token once — never again. |
| DELETE | `/api/admin/tokens/:id` | Admin | Revoke an API token. |

---

### Profile

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/profile` | Session or API key | Get the authenticated user's profile. |
| PATCH | `/api/profile` | Session or API key | Update name, email, username, password. |

---

### Household

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/household` | Session or API key | Get the authenticated user's household (name, members). |
| GET | `/api/household/members` | Session or API key | List all members of the household. |
| POST | `/api/household/members` | Session or API key | Add a no-login member (e.g. a child). |
| GET | `/api/household/members/:id` | Session or API key | Get a single household member. |
| PATCH | `/api/household/members/:id` | Session or API key | Edit a household member's profile. |
| DELETE | `/api/household/members/:id` | Session or API key | Remove a member from the household. |

---

### Foods & Units (read-only, for ingredient picker)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/foods` | Session or API key | List all foods (unpaginated or paginated with search). |
| GET | `/api/units` | Session or API key | List all units. |

---

### Recipes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/recipes` | Session or API key | Search, filter, and paginate recipes within the household. Query params: `q` (text/fuzzy), `foodId`, `sort` (`name/createdAt/updatedAt/random`), `order` (`asc/desc`), `page`, `perPage`. |
| POST | `/api/recipes` | Session or API key | Create a new recipe. |
| GET | `/api/recipes/:id` | Session or API key | Get a recipe with all its sections, ingredients, steps, and images. |
| PATCH | `/api/recipes/:id` | Session or API key | Update recipe fields (name, description, times, settings, etc.). |
| DELETE | `/api/recipes/:id` | Session or API key | Delete a recipe. |
| POST | `/api/recipes/:id/duplicate` | Session or API key | Duplicate a recipe (creates an independent copy). |

**Recipe sharing**

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/recipes/:id/share` | Session or API key | Generate a share token. Returns `{ "shareUrl": "..." }`. |
| DELETE | `/api/recipes/:id/share` | Session or API key | Revoke the share token. |
| GET | `/api/recipes/shared/:token` | None | View a shared recipe publicly. No auth required. |

---

### Recipe — Ingredient Sections

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/recipes/:id/sections` | Session or API key | Add an ingredient section. |
| PATCH | `/api/recipes/:id/sections/:sectionId` | Session or API key | Edit a section title. |
| DELETE | `/api/recipes/:id/sections/:sectionId` | Session or API key | Delete a section and its ingredients. |
| PUT | `/api/recipes/:id/sections/reorder` | Session or API key | Reorder sections. Body: `{ "ids": [...] }`. |

---

### Recipe — Ingredients

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/recipes/:id/sections/:sectionId/ingredients` | Session or API key | Add an ingredient to a section. |
| PATCH | `/api/recipes/:id/sections/:sectionId/ingredients/:ingredientId` | Session or API key | Edit an ingredient (quantity, unit, food, note). |
| DELETE | `/api/recipes/:id/sections/:sectionId/ingredients/:ingredientId` | Session or API key | Remove an ingredient. |
| PUT | `/api/recipes/:id/sections/:sectionId/ingredients/reorder` | Session or API key | Reorder ingredients within a section. Body: `{ "ids": [...] }`. |

---

### Recipe — Instruction Steps

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/recipes/:id/steps` | Session or API key | Add an instruction step. |
| PATCH | `/api/recipes/:id/steps/:stepId` | Session or API key | Edit a step (title, body). |
| DELETE | `/api/recipes/:id/steps/:stepId` | Session or API key | Delete a step. |
| PUT | `/api/recipes/:id/steps/reorder` | Session or API key | Reorder steps. Body: `{ "ids": [...] }`. |

---

### Recipe — Images

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/recipes/:id/images` | Session or API key | Upload an image for a recipe (multipart/form-data). |
| DELETE | `/api/recipes/:id/images/:imageId` | Session or API key | Delete a recipe image. |

---

### Meal Plan

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/meal-plan` | Session or API key | Get the household meal plan. Query params: `from` (date), `to` (date). Returns entries grouped by date and mealType. |
| POST | `/api/meal-plan/entries` | Session or API key | Add a recipe to the meal plan. Body: `{ recipeId, date, mealType }`. |
| PATCH | `/api/meal-plan/entries/:id` | Session or API key | Move an entry to a different date and/or mealType. |
| DELETE | `/api/meal-plan/entries/:id` | Session or API key | Remove a meal plan entry. |

---

## Guard Summary

| Guard | Applies to |
|-------|------------|
| `SetupGuard` | `GET /api/setup`, `POST /api/setup` |
| `AdminAuthGuard` | All `/api/admin/...` routes |
| `AnyAuthGuard` | All other authenticated routes (session OR API key) |
| No guard | `POST /api/auth/login`, `POST /api/admin/auth/login`, `GET /api/recipes/shared/:token` |

---

## Decisions Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Versioning | None for MVP | Single controlled API consumer; add versioning only when breaking changes are needed |
| Response shape | Bare object / `{ items, total, page, perPage }` | Clean, standard; no envelope overhead |
| Error format | NestJS defaults | Well-known, consistent, works out of the box with `ValidationPipe` |
| Route nesting | Fully nested for recipe sub-resources | Self-documenting, RESTful, clear ownership |
| Reordering | `PUT .../reorder` with `{ ids }` | Single request for any reorder operation |
| Meal plan ordering | No reorder endpoint — entries grouped by mealType | No meaningful ordering within a slot; drag-and-drop = PATCH date/mealType |
| Household scoping | Implicit from session | Users have one household; explicit ID in URL is redundant and a security risk |
| Public share route | No auth, separate path `/recipes/shared/:token` | Must be accessible without login |
