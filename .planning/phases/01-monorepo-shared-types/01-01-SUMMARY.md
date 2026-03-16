---
phase: 01-monorepo-shared-types
plan: 01
subsystem: infra
tags: [yarn, typescript, nestjs, nextjs, prisma, monorepo, workspaces]

# Dependency graph
requires: []
provides:
  - Yarn v4 monorepo root with apps/* and packages/* workspaces
  - packages/shared barrel (@recipe-manager/shared) as compiler-enforced API boundary
  - apps/api workspace with NestJS + Prisma + shared dependency
  - apps/web workspace with Next.js 15 + shared dependency
  - tsconfig.base.json with strict mode and decorator support
  - Minimal schema.prisma stub (prisma generate succeeds)
  - Wave 0 test infra: jest.config.ts, test/jest-e2e.json, tests/app.e2e-spec.ts
affects: [02-shared-types, 03-nestjs-bootstrap, all-subsequent-phases]

# Tech tracking
tech-stack:
  added: [yarn@4.9.1, typescript@5, nestjs@11, nextjs@15, react@19, prisma@6, ts-jest@29, jest@29]
  patterns: [workspace:* protocol for local package refs, tsconfig paths for monorepo resolution, tsconfig.base.json shared base extended by each workspace]

key-files:
  created:
    - package.json (workspace root, packageManager pinned to yarn@4.9.1)
    - .yarnrc.yml (nodeLinker node-modules)
    - tsconfig.base.json (strict + decorator support)
    - packages/shared/package.json
    - packages/shared/tsconfig.json
    - packages/shared/src/index.ts
    - apps/api/package.json
    - apps/api/tsconfig.json
    - apps/api/nest-cli.json
    - apps/api/prisma/schema.prisma
    - apps/api/jest.config.ts
    - apps/api/test/jest-e2e.json
    - apps/api/tests/app.e2e-spec.ts
    - apps/web/package.json
    - apps/web/tsconfig.json
    - apps/web/next.config.ts
    - apps/web/src/app/layout.tsx
    - apps/web/src/app/page.tsx
  modified:
    - .gitignore (added dist/, .next/, .env patterns)

key-decisions:
  - "Used Yarn v4 via corepack (not the system default Yarn v1) — pinned packageManager: yarn@4.9.1 in root package.json"
  - "nodeLinker: node-modules in .yarnrc.yml for NestJS and Next.js compatibility (not PnP)"
  - "Both apps resolve @recipe-manager/shared via tsconfig paths to packages/shared/src/index.ts — no build step needed for shared package during development"

patterns-established:
  - "Pattern: workspace:* in package.json + compilerOptions.paths in tsconfig.json for inter-workspace imports"
  - "Pattern: tsconfig.base.json extended by each workspace tsconfig.json"
  - "Pattern: Wave 0 test infra scaffold exists in apps/api — e2e spec is wired to AppModule in Plan 03"

requirements-completed: [API-03]

# Metrics
duration: 3min
completed: 2026-03-16
---

# Phase 1 Plan 01: Monorepo Scaffold Summary

**Yarn v4 monorepo with three workspaces (api/web/shared), tsconfig paths for @recipe-manager/shared, and Wave 0 test infra — yarn install and prisma generate both succeed**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-16T03:36:38Z
- **Completed:** 2026-03-16T03:39:31Z
- **Tasks:** 3 completed
- **Files modified:** 19

## Accomplishments
- Yarn v4 monorepo root with workspace declarations for apps/* and packages/*
- All three workspaces scaffolded with correct @recipe-manager/* package names and workspace:* cross-references
- tsconfig.base.json with strict mode, decorator support, and ES2020 target — extended by each workspace
- Minimal schema.prisma stub so prisma generate succeeds without any models
- Wave 0 test infrastructure: unit jest config, e2e jest config, and e2e smoke test scaffold

## Task Commits

Each task was committed atomically:

1. **Task 1: Root monorepo config** - `45bcc1d` (chore)
2. **Task 2: Three workspace scaffolds** - `4f5d0aa` (chore)
3. **Task 3: Wave 0 test infrastructure** - `2a6469c` (chore)

**Plan metadata:** _(docs commit follows)_

## Files Created/Modified
- `package.json` - Yarn v4 workspace root with packageManager pinned
- `.yarnrc.yml` - nodeLinker node-modules
- `tsconfig.base.json` - Shared TS config: strict, decorators, ES2020
- `.gitignore` - Added dist/, .next/, .env patterns
- `packages/shared/package.json` - @recipe-manager/shared barrel
- `packages/shared/tsconfig.json` - Extends tsconfig.base.json
- `packages/shared/src/index.ts` - Empty barrel (types added in Plan 02)
- `apps/api/package.json` - @recipe-manager/api with all NestJS + Prisma deps
- `apps/api/tsconfig.json` - Paths pointing to ../../packages/shared/src/index.ts
- `apps/api/nest-cli.json` - NestJS CLI build config
- `apps/api/prisma/schema.prisma` - Minimal datasource + generator stub
- `apps/api/jest.config.ts` - Unit test config with shared moduleNameMapper
- `apps/api/test/jest-e2e.json` - E2e test config
- `apps/api/tests/app.e2e-spec.ts` - Smoke test scaffold (wired in Plan 03)
- `apps/web/package.json` - @recipe-manager/web with Next.js 15 + React 19
- `apps/web/tsconfig.json` - ESNext module, bundler resolution, shared paths
- `apps/web/next.config.ts` - Minimal Next.js config
- `apps/web/src/app/layout.tsx` - Next.js App Router root layout (lang="es")
- `apps/web/src/app/page.tsx` - Minimal placeholder page

## Decisions Made
- **Yarn v4 via corepack:** System had Yarn v1; activated Yarn v4.9.1 via corepack and pinned `packageManager` in root package.json. The `workspace:*` protocol requires Yarn v4+.
- **nodeLinker: node-modules:** Required for NestJS and Next.js compatibility (PnP incompatible with many Node.js-native packages).
- **tsconfig paths instead of build:** Both apps point tsconfig paths directly to packages/shared/src/index.ts. No build step needed for shared types during development.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Activated Yarn v4 via corepack and pinned packageManager**
- **Found during:** Task 2 (yarn install)
- **Issue:** System default was Yarn v1 (1.22.22) which does not support the `workspace:*` protocol. `yarn install` failed with "Couldn't find package @recipe-manager/shared@workspace:*".
- **Fix:** Ran `corepack enable && corepack prepare yarn@4.9.1 --activate`, then added `"packageManager": "yarn@4.9.1"` to root package.json.
- **Files modified:** package.json
- **Verification:** `yarn --version` returns 4.9.1; `yarn install` exits 0.
- **Committed in:** `4f5d0aa` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Fix was necessary to unblock yarn install. No scope creep — packageManager pin is the standard practice for Yarn v4 projects.

## Issues Encountered
- Yarn v1/v4 version mismatch: resolved via corepack activation (see Deviations above).

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Monorepo structure complete; Plans 02 and 03 can proceed in parallel
- Plan 02 (shared types) can add type files to packages/shared/src/
- Plan 03 (NestJS bootstrap) can create apps/api/src/ and wire up AppModule
- The e2e smoke test scaffold in apps/api/tests/app.e2e-spec.ts will be completed in Plan 03

---
*Phase: 01-monorepo-shared-types*
*Completed: 2026-03-16*
