# Step 1 — Tech Stack & Data Model

## Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Monorepo** | Yarn v4 workspaces | Single repo for `apps/api` and `apps/web`; enables shared tooling and potential shared types package |
| **Backend** | NestJS (TypeScript) | Opinionated, modular, predictable structure; excellent AI assistant coverage; guards/pipes handle dual-client auth cleanly |
| **Database** | PostgreSQL | Relational data, full-text search support, mature |
| **ORM** | Prisma | Best-in-class DX for NestJS, reliable migrations, schema as single source of truth, strong AI tooling support |
| **Frontend** | Next.js (TypeScript) | Separate SPA; used purely as a client app — no SSR, no API routes on the Next.js side |
| **API Validation** | NestJS `ValidationPipe` + `class-validator` | Global validation pipe on all endpoints; DTOs annotated with `class-validator` decorators; invalid requests rejected with 400 before reaching handlers |

---

## Data Model

### Entities & Fields

#### `Household`
| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | PK |
| `name` | String | Family name |
| `createdAt` | DateTime | |
| `updatedAt` | DateTime | |

#### `User`
| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | PK |
| `householdId` | UUID | FK → Household. Each user belongs to exactly one household. |
| `name` | String | |
| `email` | String? | Nullable — not required for no-login members |
| `username` | String? | Nullable — not required for no-login members |
| `passwordHash` | String? | Nullable — null means the user cannot log in |
| `gender` | Enum? | `male \| female \| other` — nullable |
| `dateOfBirth` | Date? | Nullable. Used by the agent to derive age and detect upcoming birthdays. "Is this a child?" is derived from age, not stored explicitly. |
| `createdAt` | DateTime | |
| `updatedAt` | DateTime | |

> No-login household members (e.g. children) are stored as `User` rows with `passwordHash = null`. They are visible to the agent for household-aware decisions.
> There is no `role` field — admin is a separate entity entirely (see `Admin`).

#### `Admin`
| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | PK |
| `name` | String | |
| `email` | String | Unique |
| `passwordHash` | String | |
| `createdAt` | DateTime | |
| `updatedAt` | DateTime | |

> Exactly one Admin record exists, created during the first-time setup wizard. Admin is not part of any household and manages all households system-wide.

#### `ApiToken`
| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | PK |
| `name` | String | Human-readable label |
| `tokenHash` | String | Hashed token value |
| `userId` | UUID | FK → User. The user this token authenticates as (the agent user). Actions taken via this token are attributed to this user. |
| `createdById` | UUID | FK → Admin. The admin who created the token. |
| `createdAt` | DateTime | |
| `lastUsedAt` | DateTime? | |

#### `Food`
| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | PK |
| `name` | String | Unique |
| `createdAt` | DateTime | |
| `updatedAt` | DateTime | |

> Admin-managed. Pre-populated via seed/migrations. Users select from existing foods when adding recipe ingredients.

#### `Unit`
| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | PK |
| `name` | String | e.g. "cup", "tablespoon" |
| `abbreviation` | String? | e.g. "tbsp" |
| `createdAt` | DateTime | |
| `updatedAt` | DateTime | |

> Admin-managed. Pre-populated via seed/migrations.

#### `Recipe`
| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | PK |
| `householdId` | UUID | FK → Household. Recipes are household-scoped. |
| `createdById` | UUID | FK → User. Record of who created it. Not used for access control in MVP. |
| `name` | String | |
| `slug` | String | URL-friendly, auto-generated from name, unique per household |
| `description` | String? | Plain text |
| `servingsQty` | Decimal? | e.g. 12 |
| `servingsUnit` | String? | e.g. "cookies" |
| `prepTime` | Int? | Minutes |
| `cookTime` | Int? | Minutes |
| `totalTime` | Int? | Minutes |
| `performTime` | Int? | Minutes |
| `sourceUrl` | String? | Original source URL |
| `isLocked` | Boolean | Default false. Prevents editing when true. |
| `landscapeView` | Boolean | Default false. |
| `shareToken` | String? | Unique token for public share link. Null = not shared. |
| `createdAt` | DateTime | |
| `updatedAt` | DateTime | |

#### `IngredientSection`
| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | PK |
| `recipeId` | UUID | FK → Recipe |
| `title` | String? | Nullable — a recipe may have unsectioned ingredients |
| `order` | Int | Display order |

#### `RecipeIngredient`
| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | PK |
| `sectionId` | UUID | FK → IngredientSection |
| `foodId` | UUID | FK → Food |
| `unitId` | UUID? | FK → Unit. Nullable (e.g. "2 eggs" has no unit). |
| `quantity` | Decimal? | Nullable (e.g. "salt to taste") |
| `note` | String? | e.g. "finely chopped" |
| `order` | Int | Display order within section |

#### `InstructionStep`
| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | PK |
| `recipeId` | UUID | FK → Recipe |
| `title` | String? | Optional section title |
| `body` | String | Step content |
| `order` | Int | Display order |

#### `RecipeImage`
| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | PK |
| `recipeId` | UUID | FK → Recipe |
| `url` | String | Stored image URL/path |
| `order` | Int | Display order |
| `createdAt` | DateTime | |

#### `MealPlan`
| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | PK |
| `householdId` | UUID | FK → Household. One meal plan per household. Unique constraint on householdId. |
| `createdAt` | DateTime | |
| `updatedAt` | DateTime | |

#### `MealPlanEntry`
| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | PK |
| `mealPlanId` | UUID | FK → MealPlan |
| `recipeId` | UUID | FK → Recipe |
| `date` | Date | |
| `mealType` | Enum | `breakfast \| lunch \| dinner \| snack \| dessert` |
| `createdAt` | DateTime | |
| `updatedAt` | DateTime | |

---

## Entity Relationship Summary

```
Household ──< User
Household ──< Recipe
Household ──1 MealPlan ──< MealPlanEntry >── Recipe
Recipe ──< IngredientSection ──< RecipeIngredient >── Food
                                RecipeIngredient >── Unit
Recipe ──< InstructionStep
Recipe ──< RecipeImage
ApiToken >── User (createdBy)
```

---

## Decisions Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Monorepo tooling | Yarn v4 workspaces | `apps/api` + `apps/web`; shared tooling; potential `packages/` for shared types later. Elaborated in Step 6. |
| Backend framework | NestJS | Opinionated structure, predictable, strong AI assistant support, handles dual-client auth well via guards |
| Frontend framework | Next.js | Separate SPA; pure client app pointing at NestJS API |
| Database | PostgreSQL | Relational model, full-text search, mature ecosystem |
| ORM | Prisma | Reliable migrations, best DX in NestJS ecosystem, schema as single source of truth |
| API validation | ValidationPipe + class-validator | NestJS standard; not a decision point — noted as a convention |
| No-login members | Nullable `passwordHash` on `User` | Simplest model; no-login household members (e.g. kids) are regular users the agent can query |
| Admin as separate entity | Separate `Admin` table, no `role` on `User` | Admin is not household-scoped; mixing admin into User creates edge cases in every household-scoped query. Exactly one Admin for MVP, created via setup wizard. |
| Agent access scope | Same as non-admin users | No additional endpoint restrictions on the agent for MVP |
| Recipe ownership | Household-scoped with `createdBy` ref | All household members can view/edit; creator recorded for potential future access control |
| Meal plan | One per household | Shared family meal plan; any member can edit |
| Rich text | Removed | Plain text descriptions for MVP |
| Gender | Enum: `male / female / other` | Simple, queryable by agent; more inclusive than binary |
| Age/child detection | Derived from `dateOfBirth` | No explicit flag needed; keeps the model clean |
| Ingredient sections | Always present | Every recipe has at least one `IngredientSection` (title nullable) to simplify the data model — no special-casing unsectioned ingredients |
