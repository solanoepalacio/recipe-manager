# Step 7 — Project Structure & Conventions

## Monorepo Setup

| Aspect | Choice |
|--------|--------|
| Package manager | Yarn v4 with workspaces |
| Workspaces | `apps/api`, `apps/web`, `packages/shared` |
| Shared TS config | `tsconfig.base.json` at root, extended by each workspace |
| Package naming | `@recipe-manager/api`, `@recipe-manager/web`, `@recipe-manager/shared` |

---

## Directory Structure

```
recipe-manager/
├── package.json                    # Yarn v4 workspace root
├── .yarnrc.yml
├── yarn.lock
├── tsconfig.base.json
│
├── packages/
│   └── shared/                     # API boundary types (source of truth)
│       ├── src/
│       │   ├── index.ts            # Barrel export
│       │   ├── api/                # Request/response types per domain
│       │   │   ├── auth.ts
│       │   │   ├── setup.ts
│       │   │   ├── profile.ts
│       │   │   ├── household.ts
│       │   │   ├── recipes.ts
│       │   │   ├── ingredients.ts
│       │   │   ├── steps.ts
│       │   │   ├── images.ts
│       │   │   ├── meal-plan.ts
│       │   │   ├── foods.ts
│       │   │   ├── units.ts
│       │   │   └── admin.ts
│       │   ├── common.ts           # PaginatedResponse<T>, ErrorResponse, etc.
│       │   └── enums.ts            # Gender, MealType
│       ├── tsconfig.json
│       └── package.json
│
├── apps/
│   ├── api/                        # NestJS backend
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   │
│   │   │   ├── auth/
│   │   │   │   ├── auth.module.ts
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── guards/
│   │   │   │   │   ├── session-auth.guard.ts
│   │   │   │   │   ├── api-key-auth.guard.ts
│   │   │   │   │   ├── any-auth.guard.ts
│   │   │   │   │   └── admin-auth.guard.ts
│   │   │   │   └── dto/
│   │   │   │
│   │   │   ├── setup/
│   │   │   │   ├── setup.module.ts
│   │   │   │   ├── setup.controller.ts
│   │   │   │   ├── setup.service.ts
│   │   │   │   └── guards/
│   │   │   │       └── setup.guard.ts
│   │   │   │
│   │   │   ├── admin/
│   │   │   │   ├── admin.module.ts
│   │   │   │   ├── auth/
│   │   │   │   │   ├── admin-auth.controller.ts
│   │   │   │   │   └── admin-auth.service.ts
│   │   │   │   ├── users/
│   │   │   │   │   ├── admin-users.controller.ts
│   │   │   │   │   ├── admin-users.service.ts
│   │   │   │   │   └── dto/
│   │   │   │   ├── households/
│   │   │   │   │   ├── admin-households.controller.ts
│   │   │   │   │   ├── admin-households.service.ts
│   │   │   │   │   └── dto/
│   │   │   │   ├── foods/
│   │   │   │   │   ├── admin-foods.controller.ts
│   │   │   │   │   ├── admin-foods.service.ts
│   │   │   │   │   └── dto/
│   │   │   │   ├── units/
│   │   │   │   │   ├── admin-units.controller.ts
│   │   │   │   │   ├── admin-units.service.ts
│   │   │   │   │   └── dto/
│   │   │   │   └── tokens/
│   │   │   │       ├── admin-tokens.controller.ts
│   │   │   │       ├── admin-tokens.service.ts
│   │   │   │       └── dto/
│   │   │   │
│   │   │   ├── profile/
│   │   │   │   ├── profile.module.ts
│   │   │   │   ├── profile.controller.ts
│   │   │   │   ├── profile.service.ts
│   │   │   │   └── dto/
│   │   │   │
│   │   │   ├── household/
│   │   │   │   ├── household.module.ts
│   │   │   │   ├── household.controller.ts
│   │   │   │   ├── household.service.ts
│   │   │   │   ├── members/
│   │   │   │   │   ├── members.controller.ts
│   │   │   │   │   ├── members.service.ts
│   │   │   │   │   └── dto/
│   │   │   │   └── dto/
│   │   │   │
│   │   │   ├── foods/
│   │   │   │   ├── foods.module.ts
│   │   │   │   ├── foods.controller.ts
│   │   │   │   └── foods.service.ts
│   │   │   │
│   │   │   ├── units/
│   │   │   │   ├── units.module.ts
│   │   │   │   ├── units.controller.ts
│   │   │   │   └── units.service.ts
│   │   │   │
│   │   │   ├── recipes/
│   │   │   │   ├── recipes.module.ts
│   │   │   │   ├── recipes.controller.ts
│   │   │   │   ├── recipes.service.ts
│   │   │   │   ├── dto/
│   │   │   │   ├── sections/
│   │   │   │   │   ├── sections.controller.ts
│   │   │   │   │   ├── sections.service.ts
│   │   │   │   │   └── dto/
│   │   │   │   ├── ingredients/
│   │   │   │   │   ├── ingredients.controller.ts
│   │   │   │   │   ├── ingredients.service.ts
│   │   │   │   │   └── dto/
│   │   │   │   ├── steps/
│   │   │   │   │   ├── steps.controller.ts
│   │   │   │   │   ├── steps.service.ts
│   │   │   │   │   └── dto/
│   │   │   │   ├── images/
│   │   │   │   │   ├── images.controller.ts
│   │   │   │   │   ├── images.service.ts
│   │   │   │   │   └── dto/
│   │   │   │   └── sharing/
│   │   │   │       ├── sharing.controller.ts
│   │   │   │       └── sharing.service.ts
│   │   │   │
│   │   │   ├── meal-plan/
│   │   │   │   ├── meal-plan.module.ts
│   │   │   │   ├── meal-plan.controller.ts
│   │   │   │   ├── meal-plan.service.ts
│   │   │   │   └── dto/
│   │   │   │
│   │   │   ├── prisma/
│   │   │   │   ├── prisma.module.ts
│   │   │   │   └── prisma.service.ts
│   │   │   │
│   │   │   └── common/
│   │   │       ├── decorators/     # @CurrentUser(), @CurrentAdmin()
│   │   │       ├── filters/        # Global exception filters
│   │   │       ├── interceptors/   # Response serialization
│   │   │       └── pipes/          # Custom validation pipes (if any)
│   │   │
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   │
│   │   ├── tests/                  # Unit tests (mirrors src/ structure)
│   │   ├── integration_tests/      # Integration tests (real DB)
│   │   ├── nest-cli.json
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── web/                        # Next.js frontend (SPA)
│       ├── src/
│       │   ├── app/
│       │   │   ├── layout.tsx          # Root layout (providers, global styles)
│       │   │   ├── (auth)/
│       │   │   │   └── login/
│       │   │   │       └── page.tsx
│       │   │   ├── (app)/              # App shell group (drawer + top bar)
│       │   │   │   ├── layout.tsx      # AppShell layout
│       │   │   │   ├── today/
│       │   │   │   │   └── page.tsx
│       │   │   │   ├── recipes/
│       │   │   │   │   ├── page.tsx            # Recipe list
│       │   │   │   │   └── [slug]/
│       │   │   │   │       ├── page.tsx        # Recipe detail
│       │   │   │   │       └── cook/
│       │   │   │   │           └── page.tsx    # Cook mode
│       │   │   │   ├── planner/
│       │   │   │   │   └── page.tsx
│       │   │   │   ├── profile/
│       │   │   │   │   └── page.tsx
│       │   │   │   └── household/
│       │   │   │       └── page.tsx
│       │   │   ├── (admin)/
│       │   │   │   ├── layout.tsx          # Admin layout (no drawer)
│       │   │   │   ├── admin/
│       │   │   │   │   ├── login/
│       │   │   │   │   │   └── page.tsx
│       │   │   │   │   └── panel/
│       │   │   │   │       └── page.tsx
│       │   │   │   └── setup/
│       │   │   │       └── page.tsx
│       │   │   └── shared/
│       │   │       └── [token]/
│       │   │           └── page.tsx        # Public shared recipe
│       │   │
│       │   ├── components/
│       │   │   ├── ui/                 # Primitives: Button, Input, Modal, BottomSheet, Accordion, TabBar
│       │   │   ├── layout/             # AppShell, TopBar, Drawer
│       │   │   └── recipes/            # RecipeCard, IngredientList, StepEditor, etc.
│       │   │
│       │   ├── hooks/                  # useAuth, useRecipes, useMealPlan, etc.
│       │   │
│       │   ├── lib/
│       │   │   ├── api-client.ts       # Typed fetch wrapper
│       │   │   ├── auth.ts             # Auth context/provider
│       │   │   └── query-keys.ts       # TanStack Query key factory
│       │   │
│       │   └── styles/
│       │       └── globals.css         # Tailwind directives + CSS custom properties
│       │
│       ├── public/
│       ├── tailwind.config.ts
│       ├── next.config.ts
│       ├── tsconfig.json
│       ├── tests/                      # Unit tests
│       ├── integration_tests/          # Integration tests
│       └── package.json
│
└── plans/01_App/                          # Design artifacts (stays)
```

---

## Shared Types Package (`packages/shared`)

The shared package is the **source of truth for the API boundary**. It defines every request body, response shape, and enum that crosses the wire between frontend and backend.

### What lives here

- **Response types** — One file per domain (`recipes.ts`, `household.ts`, etc.). Each exports interfaces for every response shape returned by the API.
- **Request types** — DTO shapes for POST/PATCH bodies. The NestJS DTOs (`class-validator` classes) in `apps/api` must conform to these interfaces.
- **Paginated wrapper** — `PaginatedResponse<T>` generic in `common.ts`.
- **Error shapes** — `ErrorResponse` matching NestJS default format.
- **Enums** — `Gender`, `MealType` in `enums.ts`. Used by both apps.

### What does NOT live here

- Prisma-generated types (those stay in `apps/api`)
- UI-specific types (component props, form state)
- Internal service types

### Type safety contract

```
Prisma schema (DB) ──generates──> Prisma types (apps/api only)
                                        │
                                        │ Service layer maps DB → API types
                                        ▼
                              @recipe-manager/shared types
                                   ▲              ▲
                                   │              │
                            NestJS DTOs      Frontend API client
                          (must implement)    (consumes directly)
```

- **Backend**: NestJS DTOs `implements` the shared request interfaces. Service methods return the shared response types. The compiler catches any drift.
- **Frontend**: The fetch wrapper is generic over shared types — `api.get<RecipeResponse>(...)` returns a typed result. TanStack Query hooks propagate these types to components.

---

## Backend Conventions (NestJS)

### Module structure

Every feature module follows the same pattern:

```
feature/
├── feature.module.ts       # Module declaration
├── feature.controller.ts   # Route handlers (thin — validate + delegate)
├── feature.service.ts      # Business logic, Prisma queries
└── dto/                    # class-validator DTOs (implement shared interfaces)
    ├── create-feature.dto.ts
    └── update-feature.dto.ts
```

Controllers never access Prisma directly. Services own all data access and return `@recipe-manager/shared` types.

### Nested sub-modules

Recipe sub-resources (sections, ingredients, steps, images, sharing) are nested inside `recipes/` and registered as part of `RecipesModule`. Their controllers handle the nested routes (e.g., `/api/recipes/:id/sections/:sectionId/ingredients`).

### Guards

| Guard | Attaches | Routes |
|-------|----------|--------|
| `AnyAuthGuard` | `req.user` | Default for all non-admin endpoints |
| `AdminAuthGuard` | `req.admin` | All `/api/admin/*` routes |
| `SetupGuard` | — | `/api/setup` only |

`AnyAuthGuard` is applied globally. Endpoints that need no auth (login, setup, shared recipe) use `@Public()` decorator to bypass.

### Custom decorators

| Decorator | Purpose |
|-----------|---------|
| `@CurrentUser()` | Extract `req.user` (typed as shared `User` subset) |
| `@CurrentAdmin()` | Extract `req.admin` |
| `@Public()` | Mark route as unauthenticated |

### Validation

Global `ValidationPipe` with `whitelist: true` and `forbidNonWhitelisted: true`. All DTOs use `class-validator` decorators. Invalid requests are rejected with 400 before reaching handlers.

### Household scoping

Enforced at the **service layer**, not guards. Every service method that touches household-scoped data filters by `req.user.householdId`. This is not optional — services receive the `householdId` as a required parameter.

### API documentation

| Aspect | Choice |
|--------|--------|
| Spec format | OpenAPI 3.0 via `@nestjs/swagger` |
| Swagger UI | Served at `/api/docs` in development |
| DTO documentation | `@ApiProperty()` decorators on all DTO fields |
| Response documentation | `@ApiResponse()` on controller methods |
| Grouping | `@ApiTags()` per controller matching module name |

Swagger decorators are added alongside `class-validator` decorators on DTOs. Every endpoint documents its request body, response shape, and possible error codes.

---

## Frontend Conventions (Next.js)

### Rendering strategy

Pure SPA — no SSR, no server components for data fetching. All pages are client components that fetch data via the API client. Next.js is used for routing, layouts, and build tooling only.

### URL structure

All URL paths are in English:

| View | URL |
|------|-----|
| Login | `/login` |
| Today | `/today` |
| Recipe list | `/recipes` |
| Recipe detail | `/recipes/:slug` |
| Cook mode | `/recipes/:slug/cook` |
| Meal planner | `/planner` |
| Profile | `/profile` |
| Household | `/household` |
| Admin login | `/admin/login` |
| Admin panel | `/admin/panel` |
| Setup wizard | `/setup` |
| Shared recipe | `/shared/:token` |

### Route groups

| Group | Layout | Purpose |
|-------|--------|---------|
| `(auth)` | Minimal (centered form) | Login page |
| `(app)` | App shell (top bar + drawer) | All authenticated user views |
| `(admin)` | Admin layout (no drawer) | Admin login, panel, setup |
| `shared/` | Public layout (branding banner) | Shared recipe (no auth) |

### CSS — Tailwind

Design tokens from the hi-fi wireframes mapped to Tailwind config:

```ts
// tailwind.config.ts (simplified)
{
  theme: {
    extend: {
      colors: {
        background: '#FAFAF7',
        foreground: '#2C2C2A',
        secondary: '#8A8680',
        placeholder: '#C8C4BD',
        border: '#E0DCD5',
        subtle: '#F4F2ED',
        sand: '#E8E1D5',
        accent: '#5EBD6A',
        destructive: '#D94F4F',
        canvas: '#22201C',
      },
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
      },
    },
  },
}
```

### API client

A typed `fetch` wrapper in `lib/api-client.ts`. All requests include `credentials: 'include'` for session cookies. Generic over `@recipe-manager/shared` types:

```ts
// Usage pattern
const recipe = await api.get<RecipeDetailResponse>(`/recipes/${id}`);
const created = await api.post<CreateRecipeResponse>('/recipes', body);
```

### State management

| Concern | Tool |
|---------|------|
| Server state | TanStack Query (caching, refetching, mutations) |
| Auth state | React Context (`AuthProvider` wrapping `(app)` layout) |
| Local UI state | `useState` / `useReducer` (form state, modals, accordion open/close) |

Query key factory in `lib/query-keys.ts` ensures consistent cache keys:

```ts
export const queryKeys = {
  recipes: {
    all: ['recipes'] as const,
    list: (params: RecipeListParams) => ['recipes', 'list', params] as const,
    detail: (id: string) => ['recipes', 'detail', id] as const,
  },
  mealPlan: {
    week: (from: string, to: string) => ['meal-plan', from, to] as const,
  },
  // ...
};
```

### Component organization

| Directory | Contents | Examples |
|-----------|----------|---------|
| `components/ui/` | Design system primitives | `Button`, `Input`, `Modal`, `BottomSheet`, `Accordion`, `TabBar` |
| `components/layout/` | App structure | `AppShell`, `TopBar`, `Drawer` |
| `components/recipes/` | Recipe-specific | `RecipeCard`, `IngredientList`, `StepEditor`, `IngredientPicker` |

Components are functional, use TypeScript interfaces for props, and are co-located with their styles (Tailwind utility classes inline).

---

## Testing

### Structure

| Location | Type | Scope |
|----------|------|-------|
| `apps/api/tests/` | Unit | Service logic, guards, pipes — mocked Prisma |
| `apps/api/integration_tests/` | Integration | Full request cycle with real PostgreSQL |
| `apps/web/tests/` | Unit | Component rendering, hooks, utils |
| `apps/web/integration_tests/` | Integration | Page-level tests with mocked API |

### Conventions

- Test files mirror source structure: `tests/recipes/recipes.service.spec.ts` tests `src/recipes/recipes.service.ts`
- Integration tests use a test database, reset between runs
- Frontend tests use React Testing Library

---

## Language Convention

| Layer | Language |
|-------|----------|
| Code (variables, functions, classes) | English |
| File/directory names | English |
| URL paths | English |
| Git branches and commit messages | English |
| API field names | English |
| Comments | English |
| UI text (labels, copy, error messages) | Spanish |

---

## Decisions Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| CSS framework | Tailwind CSS | Small fixed token set maps cleanly to config; utility classes avoid naming debates; fast to build |
| State management | TanStack Query + React Context | Predictable server state management with caching; Context for auth; no Redux overhead |
| API client | Typed `fetch` wrapper | Session cookies just need `credentials: 'include'`; no library needed; generic over shared types |
| Shared types package | `packages/shared` as API boundary source of truth | Compiler-enforced type safety between backend DTOs and frontend API calls |
| API documentation | OpenAPI 3.0 + Swagger UI at `/api/docs` | Standard, auto-generated from decorators, useful for development and agent consumers |
| Recipe sub-modules | Nested inside `recipes/` | Mirrors API route nesting; clear ownership |
| Test layout | Separate `tests/` and `integration_tests/` folders per app | Clear separation of fast unit tests from slow DB-dependent tests |
| URL paths | English | Code-facing concern; consistent with "everything except UI strings is English" rule |
| Frontend rendering | Pure SPA (no SSR) | API handles all data; Next.js used for routing and build tooling only |
| Global auth guard | `AnyAuthGuard` applied globally, `@Public()` to opt out | Secure by default; new endpoints require auth unless explicitly marked public |
