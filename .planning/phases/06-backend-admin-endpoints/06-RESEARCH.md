# Phase 6: Backend Admin Endpoints - Research

**Researched:** 2026-03-17
**Domain:** NestJS admin sub-modules behind AdminAuthGuard; Prisma CRUD for users, households, foods, units, API tokens
**Confidence:** HIGH

## Summary

Phase 6 extends the already-wired `AdminModule` with CRUD sub-modules for users, households, foods, units, and API tokens. The foundation is complete: `AdminAuthGuard` exists and is functional, `AdminAuthController` + `AdminAuthService` handle login/logout, and `AdminUsersController` + `AdminUsersService` already expose the password-reset-url endpoint. All five plan tasks add new sub-modules (or expand the existing `admin/users` sub-module) following the exact same pattern already in place.

All admin endpoints are protected by `@UseGuards(AdminAuthGuard)` at the controller level. The guard resolves `req.admin` from the admin session. No global guard wraps admin routes — `AnyAuthGuard` is the `APP_GUARD` but correctly reads the `@Public()` metadata; admin routes do not use `@Public()`, meaning `AnyAuthGuard` would attempt to authenticate them as users. The existing `AdminAuthController` handles this by placing `@Public()` only on the login endpoint and `@UseGuards(AdminAuthGuard)` on the logout endpoint — the same pattern is already established and must be followed consistently.

The key design constraint is that the `AdminModule` does not re-export `AnyAuthGuard` and admin routes must never use `@Public()` for their protected CRUD endpoints. The correct approach is `@UseGuards(AdminAuthGuard)` at the controller class level.

**Primary recommendation:** Follow the `admin/users` sub-module skeleton exactly. Each new sub-module gets its own `controller + service + dto/` triple, registered in `admin.module.ts`. Use `PrismaService` directly (injected via the global `PrismaModule`). Return `PaginatedResponse<T>` for list endpoints. Define shared types in `packages/shared/src/api/admin.ts` and export from the shared index.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@nestjs/common` | already installed | Controllers, guards, decorators | Project standard |
| `@nestjs/swagger` | already installed | `@ApiTags`, `@ApiOperation`, `@ApiResponse` on every endpoint | Required by CLAUDE.md rule |
| `class-validator` | already installed | DTO validation decorators (`@IsString`, `@IsUUID`, etc.) | Required by CLAUDE.md rule |
| `class-transformer` | already installed | `@Type(() => Number)` for query param coercion | Used in `RecipeQueryDto` |
| `bcrypt` | already installed | Hash passwords when creating/updating users | Same as auth module |
| `crypto` (node built-in) | n/a | `randomBytes` + `createHash` for API token generation | Same pattern as Phase 3 |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@nestjs/testing` + `jest` | already installed | Unit tests for each service | Per-plan spec files |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@UseGuards(AdminAuthGuard)` at class level | Per-method guard | Class-level is less error-prone — no risk of forgetting a method |
| Direct `PrismaService` injection in admin services | Intermediate repository layer | Project pattern for non-trivial operations is direct injection; repository layer is overkill for MVP |

**Installation:** No new packages needed — all dependencies are already installed.

## Architecture Patterns

### Recommended Project Structure

```
apps/api/src/admin/
├── admin.module.ts          # register all sub-module controllers + services
├── auth/
│   ├── admin-auth.controller.ts   # EXISTS
│   ├── admin-auth.service.ts      # EXISTS
│   └── dto/
│       └── admin-login.dto.ts     # EXISTS
├── users/
│   ├── admin-users.controller.ts  # EXISTS (partial) — add CRUD
│   ├── admin-users.service.ts     # EXISTS (partial) — add CRUD
│   ├── admin-users.service.spec.ts # EXISTS — expand
│   └── dto/
│       ├── password-reset-url.dto.ts  # EXISTS
│       ├── create-user.dto.ts         # NEW
│       └── update-user.dto.ts         # NEW
├── households/
│   ├── admin-households.controller.ts  # NEW
│   ├── admin-households.service.ts     # NEW
│   ├── admin-households.service.spec.ts # NEW
│   └── dto/
│       ├── create-household.dto.ts     # NEW
│       └── update-household.dto.ts     # NEW
├── foods/
│   ├── admin-foods.controller.ts   # NEW
│   ├── admin-foods.service.ts      # NEW
│   ├── admin-foods.service.spec.ts  # NEW
│   └── dto/
│       ├── create-food.dto.ts      # NEW
│       └── update-food.dto.ts      # NEW
├── units/
│   ├── admin-units.controller.ts   # NEW
│   ├── admin-units.service.ts      # NEW
│   ├── admin-units.service.spec.ts  # NEW
│   └── dto/
│       ├── create-unit.dto.ts      # NEW
│       └── update-unit.dto.ts      # NEW
└── tokens/
    ├── admin-tokens.controller.ts   # NEW
    ├── admin-tokens.service.ts      # NEW
    ├── admin-tokens.service.spec.ts  # NEW
    └── dto/
        └── create-token.dto.ts      # NEW

packages/shared/src/api/
└── admin.ts                # NEW — shared response/request types for admin domain
```

### Pattern 1: Sub-Module Controller with AdminAuthGuard

**What:** Controller class decorated with `@UseGuards(AdminAuthGuard)` — no per-method guard needed. All endpoints in the class are admin-protected by default.
**When to use:** Every admin sub-module controller.

```typescript
// Source: apps/api/src/admin/users/admin-users.controller.ts (existing pattern)
@ApiTags('admin-users')
@UseGuards(AdminAuthGuard)
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}
  // methods...
}
```

### Pattern 2: Paginated List Endpoint

**What:** Service accepts `page` and `perPage` query params, returns `PaginatedResponse<T>` using Prisma `skip`/`take`.
**When to use:** All `GET /admin/:resource` list endpoints.

```typescript
// Source: apps/api/src/recipes/recipes.service.ts (existing pagination pattern)
async findAll(page = 1, perPage = 20): Promise<PaginatedResponse<AdminUserResponse>> {
  const [items, total] = await Promise.all([
    this.prisma.user.findMany({
      skip: (page - 1) * perPage,
      take: perPage,
      orderBy: { createdAt: 'desc' },
    }),
    this.prisma.user.count(),
  ]);
  return { items: items.map(toAdminUserResponse), total, page, perPage };
}
```

### Pattern 3: API Token — Create and Return Raw Token Once

**What:** Generate `randomBytes(32)`, store only the SHA-256 hash, return the raw hex string once in the response. This is the same pattern used in Phase 3 for password reset tokens.
**When to use:** `POST /admin/tokens` only.

```typescript
// Source: apps/api/src/admin/users/admin-users.service.ts (same crypto pattern)
const rawToken = randomBytes(32).toString('hex');
const tokenHash = createHash('sha256').update(rawToken).digest('hex');
await this.prisma.apiToken.create({
  data: { name: dto.name, userId: dto.userId, tokenHash, createdById: admin.id },
});
return { token: rawToken, ...metadata }; // raw token returned ONCE
```

### Pattern 4: Shared Types in packages/shared

**What:** Admin domain response/request interfaces defined in `packages/shared/src/api/admin.ts`, exported from `packages/shared/src/index.ts`. Backend DTOs implement these interfaces.
**When to use:** All admin response shapes and request bodies.

```typescript
// packages/shared/src/api/admin.ts
export interface AdminUserResponse {
  id: string;
  householdId: string;
  name: string;
  email: string | null;
  username: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  createdAt: string;
  updatedAt: string;
}
// ... AdminHouseholdResponse, AdminFoodResponse, AdminUnitResponse, AdminTokenResponse
```

### Pattern 5: `req.admin` Param Decorator

**What:** Admin controllers need the authenticated `Admin` entity (e.g. for `createdById` when creating API tokens). Create a `CurrentAdmin` param decorator parallel to `CurrentUser`.
**When to use:** `POST /admin/tokens` needs `admin.id` as `createdById`.

```typescript
// Pattern: parallel to apps/api/src/auth/decorators/current-user.decorator.ts
export const CurrentAdmin = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    return ctx.switchToHttp().getRequest().admin;
  },
);
```

### Anti-Patterns to Avoid

- **Never use `@Public()` on admin CRUD endpoints.** `@Public()` bypasses `AnyAuthGuard` but does NOT apply `AdminAuthGuard`. Admin CRUD endpoints without `@UseGuards(AdminAuthGuard)` would be fully public.
- **Never return raw API token hash from list endpoints.** `GET /admin/tokens` must omit `tokenHash` from the response — return only `id`, `name`, `userId`, `createdAt`, `lastUsedAt`.
- **Never delete households without cascade behavior.** The design says DELETE household deletes all its data. Prisma `onDelete: Cascade` is already set on the schema FK from `User.householdId` to `Household.id` is NOT set — the service must manually delete or use a Prisma `cascade` strategy. Verify in the schema before writing delete logic.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Password hashing for user creation | Custom crypto | `bcrypt.hash(password, 10)` | Same library already in auth module |
| API token generation | Custom UUID/random | `randomBytes(32).toString('hex')` + SHA-256 hash | Exact same pattern in `AdminUsersService.generatePasswordResetUrl` |
| Pagination math | Custom slice logic | `skip: (page-1)*perPage, take: perPage` in Prisma | Already established in `RecipesService.findAll` |
| Guard bypass check | Custom session read | `@UseGuards(AdminAuthGuard)` class decorator | Guard already implemented and tested |

## Common Pitfalls

### Pitfall 1: AnyAuthGuard vs AdminAuthGuard Confusion

**What goes wrong:** Admin CRUD endpoints are registered without `@UseGuards(AdminAuthGuard)`. `AnyAuthGuard` (the global `APP_GUARD`) attempts to authenticate them as regular users. A request with no session and no Bearer token returns 403 from `AnyAuthGuard` before `AdminAuthGuard` even runs — the endpoint appears protected but via the wrong guard. Conversely, if the route is marked `@Public()`, it is completely unprotected.
**Why it happens:** Misunderstanding the interaction between the global `AnyAuthGuard` and the per-controller `AdminAuthGuard`.
**How to avoid:** Apply `@UseGuards(AdminAuthGuard)` at the controller class level. Do NOT add `@Public()`. The global `AnyAuthGuard` will deny the request (no user session / API key), but the explicit `AdminAuthGuard` will override via NestJS guard composition order.
**Warning signs:** Integration test hitting `/admin/users` with valid admin session returns 403.

**Note:** The existing `AdminAuthController` correctly uses `@Public()` only on `POST /admin/auth/login` and `@UseGuards(AdminAuthGuard)` only on `POST /admin/auth/logout`. The CRUD controllers do NOT need `@Public()` on any endpoint.

### Pitfall 2: Cascade Delete on Households

**What goes wrong:** `DELETE /admin/households/:id` fails with a Prisma foreign key constraint error because users reference the household.
**Why it happens:** The Prisma schema does not declare `onDelete: Cascade` on `User.household` or other household relations. Prisma's default is `RESTRICT`.
**How to avoid:** The admin delete service method must delete in dependency order: MealPlanEntries → MealPlan → RecipeIngredients → IngredientSections → RecipeImages → InstructionSteps → Recipes → ApiTokens → Users → Household. Use a Prisma transaction (`this.prisma.$transaction([...])`) to keep it atomic.
**Warning signs:** Unit test for `deleteHousehold` passes but integration test fails with FK violation.

### Pitfall 3: Returning tokenHash in Token Responses

**What goes wrong:** `GET /admin/tokens` accidentally includes the `tokenHash` field in the JSON response.
**Why it happens:** Returning the raw Prisma model directly without a mapping function.
**How to avoid:** Always use a `toAdminTokenResponse(token)` mapper function that explicitly selects fields: `id`, `name`, `userId`, `createdById`, `createdAt`, `lastUsedAt`. Never spread a raw Prisma model.
**Warning signs:** Swagger response schema includes `tokenHash`.

### Pitfall 4: Missing admin.module.ts Registration

**What goes wrong:** New sub-module controllers/services work in isolation but NestJS throws "Nest can't resolve dependencies" at startup.
**Why it happens:** Forgot to add the new controller and service to `AdminModule`'s `controllers` and `providers` arrays.
**How to avoid:** Each plan task must end with updating `admin.module.ts` to register the new pieces.

### Pitfall 5: User Creation Without Household Assignment

**What goes wrong:** `POST /admin/users` requires a `householdId` — there's no implicit household from a session.
**Why it happens:** Forgetting that admin creates users on behalf of a household, unlike the household-member flow.
**How to avoid:** `CreateAdminUserDto` must include `householdId: string` as a required field with `@IsUUID()`. Validate the household exists before creating.

## Code Examples

Verified patterns from existing codebase:

### Pagination with Promise.all (both count and data in parallel)

```typescript
// Pattern from apps/api/src/recipes/recipes.service.ts
const [items, total] = await Promise.all([
  this.prisma.user.findMany({ skip: (page - 1) * perPage, take: perPage, orderBy: { createdAt: 'desc' } }),
  this.prisma.user.count(),
]);
return { items, total, page, perPage };
```

### Query DTO with page/perPage (from RecipeQueryDto pattern)

```typescript
import { IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AdminPaginationDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  perPage?: number = 20;
}
```

### Token creation — raw token returned once, hash stored

```typescript
// Pattern from apps/api/src/admin/users/admin-users.service.ts
import { randomBytes, createHash } from 'crypto';

const rawToken = randomBytes(32).toString('hex');
const tokenHash = createHash('sha256').update(rawToken).digest('hex');
await this.prisma.apiToken.create({
  data: { name: dto.name, userId: dto.userId, tokenHash, createdById: adminId },
});
return { id, name, userId, createdAt, token: rawToken }; // token: raw, one-time
```

### Unit test scaffold for admin service

```typescript
// Pattern from apps/api/src/admin/users/admin-users.service.spec.ts
describe('AdminXxxService', () => {
  let service: AdminXxxService;
  let prisma: { xxx: { findMany: jest.Mock; count: jest.Mock; ... } };

  beforeEach(() => {
    prisma = { xxx: { findMany: jest.fn(), count: jest.fn() } };
    service = new AdminXxxService(prisma as any);
  });

  it('returns paginated list', async () => {
    prisma.xxx.findMany.mockResolvedValue([/* items */]);
    prisma.xxx.count.mockResolvedValue(2);
    const result = await service.findAll(1, 20);
    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
    expect(result.perPage).toBe(20);
  });
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `AdminModule` with stub controllers | AdminAuthController + AdminUsersController (partial) in place | Phase 3 | 06-01 (admin auth) is already done — plan 06-01 needs to confirm completeness and wire up any gaps only |

**Existing in the codebase:**
- `AdminAuthGuard` — complete, tested (3 tests)
- `AdminAuthController` — complete (login + logout)
- `AdminAuthService` — complete (validateAdmin)
- `AdminUsersController` — partial (password-reset-url only — no CRUD)
- `AdminUsersService` — partial (generatePasswordResetUrl only — no CRUD)
- `AdminUsersService.spec.ts` — exists with 3 tests

**Plan 06-01 implication:** The admin module and auth wiring already exist. Plan 06-01 should confirm correctness of existing auth wiring and implement any missing pieces (e.g. `CurrentAdmin` decorator, confirm `@UseGuards` pattern is correct for sub-modules), rather than building from scratch.

## Open Questions

1. **Cascade delete for Household**
   - What we know: Prisma schema has no `onDelete: Cascade` on household relations
   - What's unclear: Whether the planner should add schema migrations or handle in service
   - Recommendation: Handle cascade delete in service code using `$transaction` with ordered deletes. Do NOT add Prisma schema changes in Phase 6 (Phase 2 owns the schema).

2. **`GET /admin/users/:id` — which fields to expose**
   - What we know: `MeResponse` omits `passwordHash`; admin response should also omit it
   - What's unclear: Whether admin should see `resetToken`/`resetTokenExpiry` fields
   - Recommendation: Omit `passwordHash`, `resetToken`, `resetTokenExpiry` from admin user responses — these are internal fields. Expose: `id`, `householdId`, `name`, `email`, `username`, `gender`, `dateOfBirth`, `createdAt`, `updatedAt`.

3. **`POST /admin/users` — password handling**
   - What we know: Some users have `passwordHash = null` (no-login members)
   - What's unclear: Whether admin can create a user with no password
   - Recommendation: Make `password` optional in `CreateAdminUserDto` — if omitted, `passwordHash` is `null`.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest (NestJS default) |
| Config file | `apps/api/package.json` (jest key) |
| Quick run command | `cd apps/api && yarn test --testPathPattern="admin"` |
| Full suite command | `cd apps/api && yarn test` |

### Phase Requirements → Test Map

Phase 6 has no formal requirement IDs (it is infrastructure for Phase 12). The success criteria map to service-level unit tests:

| Success Criterion | Behavior | Test Type | Automated Command | File Exists? |
|-------------------|----------|-----------|-------------------|-------------|
| Admin users CRUD works | `findAll`, `findOne`, `create`, `update`, `remove` | unit | `yarn test --testPathPattern="admin-users"` | Partial (admin-users.service.spec.ts exists, needs expansion) |
| AdminAuthGuard enforced | Controller returns 401 without admin session | unit (guard) | `yarn test --testPathPattern="admin-auth.guard"` | YES |
| Households CRUD works | `findAll`, `findOne`, `create`, `update`, `remove` | unit | `yarn test --testPathPattern="admin-households"` | No — Wave 0 |
| Foods CRUD works | `findAll`, `create`, `update`, `remove` | unit | `yarn test --testPathPattern="admin-foods"` | No — Wave 0 |
| Units CRUD works | `findAll`, `create`, `update`, `remove` | unit | `yarn test --testPathPattern="admin-units"` | No — Wave 0 |
| Token create/list/delete | token shown once, hash stored, list omits hash | unit | `yarn test --testPathPattern="admin-tokens"` | No — Wave 0 |

### Sampling Rate

- **Per task commit:** `cd /home/solanoe/code/recipe-manager/apps/api && yarn test --testPathPattern="admin" --passWithNoTests`
- **Per wave merge:** `cd /home/solanoe/code/recipe-manager/apps/api && yarn test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `apps/api/src/admin/households/admin-households.service.spec.ts` — covers households CRUD
- [ ] `apps/api/src/admin/foods/admin-foods.service.spec.ts` — covers foods CRUD
- [ ] `apps/api/src/admin/units/admin-units.service.spec.ts` — covers units CRUD
- [ ] `apps/api/src/admin/tokens/admin-tokens.service.spec.ts` — covers token creation (raw vs hash), list, delete
- [ ] Expand `apps/api/src/admin/users/admin-users.service.spec.ts` to cover full CRUD (findAll pagination, findOne, create, update, delete)

## Sources

### Primary (HIGH confidence)

- Existing codebase — `apps/api/src/admin/` — direct inspection of all existing admin module files
- Existing codebase — `apps/api/src/auth/guards/admin-auth.guard.ts` — guard implementation
- Existing codebase — `apps/api/src/recipes/recipes.service.ts` — pagination pattern
- Existing codebase — `apps/api/prisma/schema.prisma` — full data model
- `mvp_plans/02_auth_design.md` — admin auth design decisions
- `mvp_plans/03_api_design.md` — full admin endpoint contract

### Secondary (MEDIUM confidence)

- NestJS documentation (guard application, module registration) — knowledge confirmed by existing working code patterns in this codebase

### Tertiary (LOW confidence)

None — all findings are supported by direct codebase inspection.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed and in use
- Architecture: HIGH — existing patterns are unambiguous; verified directly in source files
- Pitfalls: HIGH for guard/cascade/token pitfalls (verified from schema and auth design); MEDIUM for cascade delete execution order (not verified against a live DB)

**Research date:** 2026-03-17
**Valid until:** 2026-04-17 (stable — NestJS + Prisma patterns very unlikely to change within 30 days)
