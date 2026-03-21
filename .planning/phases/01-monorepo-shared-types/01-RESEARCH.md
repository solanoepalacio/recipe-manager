# Phase 1: Monorepo + Shared Types - Research

**Researched:** 2026-03-16
**Domain:** Yarn v4 Workspaces, NestJS bootstrap, shared TypeScript types, Swagger/OpenAPI
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Phase boundary:** Set up the Yarn v4 monorepo with three workspaces (`apps/api`, `apps/web`, `packages/shared`), create the shared types package for Phase 1–3 domains with full field-level types, and bootstrap NestJS with Swagger accessible at `/api/docs`. `yarn build` must succeed across all three workspaces.

**Shared types coverage:**
- Only create type files for domains needed in Phase 1–3: `auth.ts`, `setup.ts`, `profile.ts`, `household.ts`, `common.ts`, `enums.ts`
- Type files for later domains (recipes, ingredients, steps, images, meal-plan, foods, units, admin) are omitted from the package and barrel export — they will be added by the phase that implements them
- Fields must be pulled from both `plans/01_App/01_tech_stack_and_data_model.md` (entity field names and types) and `plans/01_App/03_api_design.md` (request/response shapes). Both sources must be reconciled before writing types.
- `common.ts` exports `PaginatedResponse<T>` and `ErrorResponse` (needed universally)
- `enums.ts` exports `Gender` and `MealType`

**apps/web scaffold:**
- Minimal only — just enough for `yarn build` to succeed across workspaces
- Contents: `package.json`, `tsconfig.json`, `next.config.ts`, and a single placeholder `page.tsx`
- No Tailwind config, no `globals.css`, no `api-client.ts`, no route groups — all of that belongs in Phase 7

**AppModule wiring:**
- Minimal: `AppModule` imports only `PrismaModule`; global `ValidationPipe` registered; Swagger configured
- No feature module stubs — `AuthModule`, `RecipesModule`, etc. are created and imported in their respective phases
- Swagger document shows real metadata: title `"Recipe Manager API"`, version from root `package.json`, description

### Claude's Discretion
- Exact PrismaModule implementation (can be a minimal service wrapper that later phases extend)
- TypeScript `strict` settings in `tsconfig.base.json` (assume `strict: true` is appropriate)
- Exact NestJS package versions (use latest stable)
- Swagger bearer auth scheme setup (can be added in Phase 3 when auth is implemented)

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| API-03 | Interactive API documentation is available at `/api/docs` (Swagger UI) | NestJS Swagger setup via `@nestjs/swagger` + `swagger-ui-express`; `SwaggerModule.setup('api/docs', app, document)` pattern verified |
</phase_requirements>

---

## Summary

Phase 1 establishes the entire monorepo foundation: a Yarn v4 workspace root containing `apps/api` (NestJS), `apps/web` (Next.js minimal scaffold), and `packages/shared` (API boundary types). The shared package is pure TypeScript interfaces — no runtime code, no `class-validator`, no decorators — consumed by both apps through the `workspace:*` protocol and TypeScript path aliases. NestJS DTOs in `apps/api` will `implements` these interfaces, enforcing compiler-level type safety.

The critical path is: root config → shared package → api package → web package. The shared package must be built (or declared source-compatible via `tsconfig.json` paths) before the other two workspaces can compile. NestJS bootstraps with a global `ValidationPipe` and Swagger UI configured at `/api/docs`. The web scaffold is intentionally minimal — only what `yarn build` requires.

Key decisions already locked: `nodeLinker: node-modules` in `.yarnrc.yml` for NestJS/Next.js compatibility (Yarn PnP has known issues with both frameworks), `workspace:*` protocol for internal package cross-references, and a shared `tsconfig.base.json` extended by each workspace.

**Primary recommendation:** Use `nodeLinker: node-modules` in `.yarnrc.yml`, reference `packages/shared` from both apps via `"@recipe-manager/shared": "workspace:*"` in their `package.json`, and configure TypeScript path aliases in workspace `tsconfig.json` files. Build the shared package before the apps.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Yarn | v4 (latest) | Monorepo package management | Project decision; v4 is current stable |
| TypeScript | 5.x | Typed language across all workspaces | Entire stack is TypeScript |
| NestJS (`@nestjs/core`, `@nestjs/common`, `@nestjs/platform-express`) | 10.x or 11.x (latest stable) | Backend framework | Project decision |
| `@nestjs/swagger` | 8.x (latest stable) | OpenAPI/Swagger doc generation | Project decision; API-03 requirement |
| `swagger-ui-express` | latest | Serves Swagger UI HTML | Required peer for `@nestjs/swagger` |
| Next.js | 15.x (latest stable) | Frontend framework (SPA mode) | Project decision |
| Prisma (`@prisma/client`, `prisma`) | 6.x (latest stable) | ORM | Project decision |
| `class-validator` | latest | DTO validation decorators | Project decision for `apps/api` only |
| `class-transformer` | latest | Required peer for `class-validator` with NestJS | Required by ValidationPipe |
| `reflect-metadata` | latest | Required for NestJS decorators | NestJS dependency |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `rxjs` | 7.x | Required NestJS peer dependency | Included automatically with NestJS |
| `@nestjs/config` | latest | Environment config (needed for DATABASE_URL) | Include in Phase 1 for `main.ts` port config |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `nodeLinker: node-modules` | Yarn PnP | PnP is faster but has known NestJS + Next.js incompatibilities; node-modules is safe standard |
| Yarn v4 | pnpm | pnpm workspaces are equally capable; Yarn v4 is project decision, not revisited |
| Manual `tsconfig.paths` | TypeScript project references | Project references require incremental build setup; paths with workspace protocol is simpler for this size |

**Installation (root):**
```bash
yarn set version stable
```

**Installation (apps/api):**
```bash
yarn workspace @recipe-manager/api add @nestjs/core @nestjs/common @nestjs/platform-express @nestjs/swagger swagger-ui-express reflect-metadata rxjs
yarn workspace @recipe-manager/api add @nestjs/config class-validator class-transformer
yarn workspace @recipe-manager/api add prisma @prisma/client
yarn workspace @recipe-manager/api add -D @nestjs/cli @nestjs/schematics @types/node typescript ts-node
```

**Installation (apps/web — Phase 1 minimal):**
```bash
yarn workspace @recipe-manager/web add next react react-dom
yarn workspace @recipe-manager/web add -D typescript @types/node @types/react @types/react-dom
```

---

## Architecture Patterns

### Recommended Project Structure

```
recipe-manager/
├── package.json                  # "workspaces": ["apps/*", "packages/*"]
├── .yarnrc.yml                   # nodeLinker: node-modules
├── yarn.lock
├── tsconfig.base.json            # Base TS config extended by all workspaces
│
├── packages/
│   └── shared/
│       ├── src/
│       │   ├── index.ts          # Barrel export
│       │   ├── api/
│       │   │   ├── auth.ts
│       │   │   ├── setup.ts
│       │   │   ├── profile.ts
│       │   │   └── household.ts
│       │   ├── common.ts         # PaginatedResponse<T>, ErrorResponse
│       │   └── enums.ts          # Gender, MealType
│       ├── package.json          # name: @recipe-manager/shared, "main": "src/index.ts"
│       └── tsconfig.json
│
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   └── prisma/
│   │   │       ├── prisma.module.ts
│   │   │       └── prisma.service.ts
│   │   ├── nest-cli.json
│   │   ├── tsconfig.json
│   │   └── package.json          # depends on "@recipe-manager/shared": "workspace:*"
│   └── web/
│       ├── src/
│       │   └── app/
│       │       └── page.tsx      # placeholder page
│       ├── next.config.ts
│       ├── tsconfig.json
│       └── package.json          # depends on "@recipe-manager/shared": "workspace:*"
```

### Pattern 1: Root Workspace Configuration

**What:** Root `package.json` declares workspace globs; `.yarnrc.yml` sets `nodeLinker: node-modules` for framework compatibility.

**When to use:** Always — this is the monorepo foundation.

**Example:**
```json
// package.json (root)
{
  "name": "recipe-manager",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ]
}
```

```yaml
# .yarnrc.yml
nodeLinker: node-modules
yarnPath: .yarn/releases/yarn-4.x.x.cjs
```

### Pattern 2: Shared Package — Source-Mode (No Build Step)

**What:** `packages/shared` sets `"main": "src/index.ts"` in its `package.json`. Both apps resolve shared types directly from source TypeScript, eliminating a build step for the shared package.

**When to use:** When the shared package contains only type-level code (interfaces, enums, type aliases) — no runtime decorators or classes that need compilation.

**Example:**
```json
// packages/shared/package.json
{
  "name": "@recipe-manager/shared",
  "version": "1.0.0",
  "main": "src/index.ts",
  "types": "src/index.ts"
}
```

```json
// apps/api/package.json (dependency declaration)
{
  "name": "@recipe-manager/api",
  "dependencies": {
    "@recipe-manager/shared": "workspace:*"
  }
}
```

```json
// apps/api/tsconfig.json (path alias to resolve the package)
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "paths": {
      "@recipe-manager/shared": ["../../packages/shared/src/index.ts"]
    }
  }
}
```

> **Note:** If NestJS build (via `tsc` or `nest build`) doesn't follow the `workspace:*` symlink at runtime, an explicit `paths` alias in `tsconfig.json` ensures compilation succeeds. Both the `package.json` dependency and the `tsconfig.json` path are needed.

### Pattern 3: Shared Type Contracts

**What:** `packages/shared` exports pure TypeScript interfaces. NestJS DTOs in `apps/api` use `implements` to declare they satisfy the shared contract. Frontend API client uses the shared types as generic type parameters.

**When to use:** For every API domain type.

**Example:**
```typescript
// packages/shared/src/api/auth.ts
export interface LoginRequest {
  email?: string;
  username?: string;
  password: string;
}

export interface MeResponse {
  id: string;
  householdId: string;
  name: string;
  email: string | null;
  username: string | null;
}

// apps/api/src/auth/dto/login.dto.ts
import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LoginRequest } from '@recipe-manager/shared';

export class LoginDto implements LoginRequest {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiProperty()
  @IsString()
  password: string;
}
```

### Pattern 4: NestJS Bootstrap (main.ts)

**What:** Standard NestJS main.ts with global `ValidationPipe` and Swagger configured. Port from environment with fallback.

**When to use:** This is the Phase 1 main.ts — minimal but complete for API-03.

**Example:**
```typescript
// apps/api/src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Recipe Manager API')
    .setDescription('REST API for the Recipe Manager application')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
```

### Pattern 5: Minimal PrismaModule

**What:** A NestJS module wrapping PrismaService, exported globally so all feature modules can inject it without re-importing the module.

**When to use:** Phase 1 creates this as the minimal foundation. Later phases use it as-is.

**Example:**
```typescript
// apps/api/src/prisma/prisma.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }
}

// apps/api/src/prisma/prisma.module.ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}

// apps/api/src/app.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule],
})
export class AppModule {}
```

> **Note:** Prisma schema does not exist yet in Phase 1 (that's Phase 2). `PrismaService extends PrismaClient` compiles without a schema in place if `@prisma/client` is installed — it will fail at runtime if `prisma generate` hasn't run, but `yarn build` will succeed.

### Pattern 6: Next.js Minimal Scaffold

**What:** Absolute minimum for `yarn build` to succeed — `package.json`, `tsconfig.json`, `next.config.ts`, and a single `page.tsx`.

**When to use:** Phase 1 only. All real content comes in Phase 7.

**Example:**
```typescript
// apps/web/next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {};

export default nextConfig;
```

```tsx
// apps/web/src/app/page.tsx
export default function Page() {
  return <div>Recipe Manager</div>;
}
```

> **Note:** Next.js 15 App Router requires `src/app/layout.tsx` in addition to `page.tsx`. Without a root layout, `next build` will fail. The layout can be a minimal wrapper.

```tsx
// apps/web/src/app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
```

### Pattern 7: tsconfig.base.json

**What:** Root TypeScript config extended by all workspaces. Sets strict mode and common compiler options.

**Example:**
```json
// tsconfig.base.json (root)
{
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "target": "ES2020",
    "lib": ["ES2020"],
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

> **Critical:** `experimentalDecorators` and `emitDecoratorMetadata` are required for NestJS decorators. These must be in `tsconfig.base.json` or explicitly in `apps/api/tsconfig.json`.

### Anti-Patterns to Avoid

- **Enabling Yarn PnP with NestJS/Next.js:** Both frameworks have ecosystem dependencies that don't work with PnP. Always set `nodeLinker: node-modules`.
- **Building `packages/shared` to `dist/`:** Adds unnecessary build complexity. Use source-mode (`"main": "src/index.ts"`) since it's pure types.
- **Importing Prisma types in `packages/shared`:** Prisma-generated types (`Prisma.UserCreateInput`, etc.) belong only in `apps/api`. The shared package must have zero runtime dependencies.
- **Putting `class-validator` decorators in shared types:** The shared package is framework-agnostic interfaces only. Decorators belong in `apps/api/src/*/dto/`.
- **Missing `emitDecoratorMetadata: true`:** NestJS dependency injection and `class-validator` both require this at compile time. Without it, DI breaks silently.
- **Omitting `reflect-metadata` import in main.ts:** Must be imported before any NestJS module. Usually included as the first import.
- **Using `nest build` monorepo mode:** NestJS CLI has its own monorepo mode (configured in `nest-cli.json`), but for a Yarn workspaces setup it's simpler to treat `apps/api` as a standalone NestJS app with `nest-cli.json` pointing to `src/main.ts`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| OpenAPI spec generation | Custom swagger.json | `@nestjs/swagger` with `DocumentBuilder` | Auto-generates from decorators; maintains itself as API grows |
| DTO validation | Manual request checking | `class-validator` + global `ValidationPipe` | Handles all edge cases; consistent 400 format |
| Workspace symlinks | Manual symlinks | `workspace:*` protocol | Yarn manages symlinks in `node_modules`; cross-platform |
| TypeScript strict checking | Custom eslint rules | `strict: true` in tsconfig | Catches null/undefined errors, unused locals, strict function types |
| Prisma connection lifecycle | Manual pool management | `PrismaService extends PrismaClient` with `onModuleInit` | Handles reconnects; follows NestJS lifecycle hooks |

**Key insight:** The Yarn workspace protocol + TypeScript paths combination is the entire shared-package resolution story. No build tool, no symlink scripts, no Turborepo needed.

---

## Common Pitfalls

### Pitfall 1: Prisma Client Not Generated
**What goes wrong:** `yarn build` on `apps/api` fails with `Cannot find module '@prisma/client'` or type errors because `PrismaClient` has no schema yet.
**Why it happens:** `@prisma/client` stub types are empty before `prisma generate` runs. In Phase 1, there's no `schema.prisma` yet.
**How to avoid:** Create a minimal `schema.prisma` with just the datasource/generator block (no models) and run `prisma generate` as part of Phase 1 setup. The generated client will be empty but the package will resolve.
**Warning signs:** TypeScript error `Module '@prisma/client' has no exported member 'PrismaClient'`.

### Pitfall 2: Missing Root Layout in Next.js App Router
**What goes wrong:** `next build` fails with an error about missing root layout.
**Why it happens:** Next.js 15 App Router requires `src/app/layout.tsx` as the mandatory root layout wrapping all pages.
**How to avoid:** Create both `page.tsx` and `layout.tsx` in `src/app/`. The layout can be minimal (2-3 lines).
**Warning signs:** `next build` error mentioning "Missing root layout" or "You're missing a root layout".

### Pitfall 3: Workspace Package Not Resolving at Build Time
**What goes wrong:** `@recipe-manager/shared` imports resolve correctly in the IDE but fail during `nest build` or `next build`.
**Why it happens:** The NestJS compiler (`tsc` via `nest build`) may not follow workspace symlinks unless `tsconfig.json` paths are explicitly set. The `package.json` dependency declares the relationship; the `tsconfig.json` path alias makes the compiler find it.
**How to avoid:** Always set both: `"@recipe-manager/shared": "workspace:*"` in `package.json` AND `"@recipe-manager/shared": ["../../packages/shared/src/index.ts"]` in `tsconfig.json` paths.
**Warning signs:** `Cannot find module '@recipe-manager/shared'` during build but not in IDE.

### Pitfall 4: Missing `emitDecoratorMetadata`
**What goes wrong:** NestJS dependency injection fails at runtime; `class-validator` validators don't run; no compile error.
**Why it happens:** `emitDecoratorMetadata: true` is required for TypeScript to emit design-time type information used by NestJS's DI container and by Swagger's type inference. It is not in TypeScript's default config.
**How to avoid:** Include `"experimentalDecorators": true` and `"emitDecoratorMetadata": true` in `tsconfig.base.json` or in `apps/api/tsconfig.json`.
**Warning signs:** Dependency injection errors at startup; `@ApiProperty()` types showing as `Object` in Swagger UI.

### Pitfall 5: Shared Package Has Runtime Dependencies
**What goes wrong:** Frontend bundle includes unnecessary server-side code; or `apps/web` fails to build because it tries to import NestJS or Prisma.
**Why it happens:** If `packages/shared/package.json` has `@nestjs/swagger` or `class-validator` as dependencies, the frontend will pull them in.
**How to avoid:** `packages/shared/package.json` must have zero `dependencies`. Only `devDependencies: { typescript }` if needed. All validation decorators live only in `apps/api`.
**Warning signs:** Frontend bundle size including unexpected NestJS packages; `yarn build` on web including `@nestjs/*`.

### Pitfall 6: `nest-cli.json` Monorepo Mode Conflict
**What goes wrong:** Running `nest build` from `apps/api` fails or generates output in unexpected locations if `nest-cli.json` is misconfigured.
**Why it happens:** NestJS CLI has its own "monorepo mode" concept (`"monorepo": true` in `nest-cli.json`) which conflicts with Yarn workspaces structure.
**How to avoid:** Use standard (non-monorepo) NestJS CLI config in `apps/api/nest-cli.json`. Keep `"monorepo": false` (default). Run `nest build` from within `apps/api`.
**Warning signs:** `nest build` generating output in wrong directory; "Cannot find entrypoint" errors.

---

## Code Examples

Verified patterns from official sources and project design artifacts:

### PaginatedResponse and ErrorResponse (common.ts)
```typescript
// packages/shared/src/common.ts
// Response shape from plans/01_App/03_api_design.md: { items, total, page, perPage }
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
}

// NestJS default error format
export interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error?: string;
}
```

### Enums (enums.ts)
```typescript
// packages/shared/src/enums.ts
// From plans/01_App/01_tech_stack_and_data_model.md
export enum Gender {
  Male = 'male',
  Female = 'female',
  Other = 'other',
}

export enum MealType {
  Breakfast = 'breakfast',
  Lunch = 'lunch',
  Dinner = 'dinner',
  Snack = 'snack',
  Dessert = 'dessert',
}
```

### Barrel Export (index.ts)
```typescript
// packages/shared/src/index.ts
export * from './api/auth';
export * from './api/setup';
export * from './api/profile';
export * from './api/household';
export * from './common';
export * from './enums';
```

### Swagger Setup in main.ts
```typescript
// Source: https://docs.nestjs.com/openapi/introduction
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

const config = new DocumentBuilder()
  .setTitle('Recipe Manager API')
  .setDescription('REST API for the Recipe Manager application')
  .setVersion('1.0')
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api/docs', app, document);
// Swagger UI accessible at: /api/docs
// OpenAPI JSON at: /api/docs-json
```

### Global ValidationPipe
```typescript
// Source: https://docs.nestjs.com/techniques/validation
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,           // strips unknown properties
    forbidNonWhitelisted: true, // 400 if unknown properties sent
  }),
);
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Yarn v1 classic `node_modules` | Yarn v4 with explicit `nodeLinker: node-modules` | Yarn v2+ | Must opt-in to node-modules; PnP is now default |
| `PrismaService` with `enableShutdownHooks(app)` in main.ts | `OnModuleInit` lifecycle hook | Prisma 5.x | The `enableShutdownHooks` pattern still works but `OnModuleInit` is the recommended NestJS pattern |
| Next.js `pages/` router | App Router with `src/app/` | Next.js 13+ | App Router is standard in Next.js 15; requires `layout.tsx` at root |
| `DocumentBuilder().setExternalDoc()` for Swagger JSON | Auto-available at `{path}-json` | `@nestjs/swagger` v6+ | No manual config needed; JSON spec auto-served |

**Deprecated/outdated:**
- `enableShutdownHooks(app)` in `main.ts` for Prisma: replaced by `OnModuleInit` hook in service
- Yarn `nohoist`: not needed with `nodeLinker: node-modules`; was a workaround for PnP mode

---

## Open Questions

1. **Prisma schema.prisma in Phase 1**
   - What we know: Phase 2 owns the Prisma schema and migrations. Phase 1 needs `@prisma/client` installed and `prisma generate` run for the build to succeed.
   - What's unclear: Whether a zero-model `schema.prisma` (datasource + generator only) is enough for `prisma generate` to produce a usable client stub.
   - Recommendation: Create a minimal `schema.prisma` with only datasource/generator blocks in Phase 1. Phase 2 will add models. The planner should include this as an explicit task.

2. **Next.js App Router with `'use client'` and no SSR**
   - What we know: The project is a pure SPA; all pages will be client components. Next.js 15 still pre-renders pages during `next build` even when `'use client'` is declared.
   - What's unclear: Whether the placeholder `page.tsx` needs `'use client'` to avoid any SSR behavior during build.
   - Recommendation: Keep the placeholder as a server component (no `'use client'`). The full SPA setup (no SSR, dynamic imports, etc.) is Phase 7's responsibility.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest (via NestJS default) + ts-jest for `apps/api`; Jest + React Testing Library for `apps/web` |
| Config file | `apps/api/package.json` (jest config section) — none yet, Wave 0 creates it |
| Quick run command | `yarn workspace @recipe-manager/api test` |
| Full suite command | `yarn workspaces foreach run test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| API-03 | Swagger UI reachable at `/api/docs` | smoke / integration | `yarn workspace @recipe-manager/api test:e2e` (or manual: `curl http://localhost:3001/api/docs`) | ❌ Wave 0 |

> **Note:** API-03 is a runtime/smoke concern — Swagger being reachable is verified by starting the server, not a unit test. A minimal integration/e2e test that starts the NestJS app and asserts a 200 at `/api/docs` is the correct automated check. Wave 0 must create this test file.

### Additional Build Verification (not unit tests)
- `yarn workspaces foreach run build` — verifies all three workspaces compile with no type errors (the primary success criterion for this phase)
- `yarn workspace @recipe-manager/shared tsc --noEmit` — verifies shared types are valid TypeScript

### Sampling Rate
- **Per task commit:** `yarn workspace @recipe-manager/api test` (unit tests for the task)
- **Per wave merge:** `yarn workspaces foreach run build` (full compile check)
- **Phase gate:** Full build green + Swagger UI manually verified at `/api/docs` before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `apps/api/test/app.e2e-spec.ts` — smoke test for API-03: GET `/api/docs` returns 200
- [ ] `apps/api/jest.config.ts` or jest section in `apps/api/package.json` — unit test config
- [ ] `apps/api/test/jest-e2e.json` — e2e test config (NestJS CLI default path)
- [ ] Framework install: `yarn workspace @recipe-manager/api add -D jest @nestjs/testing ts-jest supertest @types/supertest`

---

## Sources

### Primary (HIGH confidence)
- [docs.nestjs.com/openapi/introduction](https://docs.nestjs.com/openapi/introduction) — Swagger setup, DocumentBuilder, SwaggerModule
- [docs.nestjs.com/techniques/validation](https://docs.nestjs.com/techniques/validation) — ValidationPipe configuration
- [nextjs.org/docs/app/guides/single-page-applications](https://nextjs.org/docs/app/guides/single-page-applications) — Next.js 15 SPA guidance; fetched directly 2026-03-16
- [yarnpkg.com/features/workspaces](https://yarnpkg.com/features/workspaces) — workspace protocol, glob patterns; fetched directly 2026-03-16
- `plans/01_App/07_project_structure.md` — Authoritative directory structure and conventions for this project
- `plans/01_App/01_tech_stack_and_data_model.md` — Entity fields for shared type derivation
- `plans/01_App/03_api_design.md` — Request/response shapes for shared type derivation

### Secondary (MEDIUM confidence)
- [prisma.io/docs/guides/nestjs](https://www.prisma.io/docs/guides/nestjs) — PrismaService implementation pattern (fetched; confirmed `PrismaClient` extension + `OnModuleInit`)
- [github.com/yarnpkg/berry/issues/5083](https://github.com/yarnpkg/berry/issues/5083) — NestJS + Yarn Berry PnP incompatibility; confirms `nodeLinker: node-modules` as fix
- [yarnpkg.com/configuration/yarnrc](https://yarnpkg.com/configuration/yarnrc) — `.yarnrc.yml` settings reference

### Tertiary (LOW confidence — marked for validation)
- WebSearch: NestJS `nohoist` for Yarn workspaces — may be outdated; `nodeLinker: node-modules` renders this unnecessary in v4

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages are project decisions already locked; versions from npm current stable
- Architecture: HIGH — all patterns derived directly from `plans/01_App/07_project_structure.md` (authoritative) + verified from official docs
- Pitfalls: HIGH — Prisma/NestJS/Yarn interactions are well-documented; direct source confirmation for key items

**Research date:** 2026-03-16
**Valid until:** 2026-09-16 (stable ecosystem; NestJS/Yarn/Next.js major versions change slowly)
