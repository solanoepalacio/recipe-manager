---
phase: quick
plan: 260318-jf3
subsystem: build
tags: [typescript, tsc, packages-shared, build-output, gitignore]

requires: []
provides:
  - packages/shared/src/ contains only .ts source files
  - packages/shared/dist/ contains compiled .js/.d.ts output after tsc
  - package.json main/types point to dist/ not src/
affects: [all-phases]

tech-stack:
  added: []
  patterns:
    - "packages/shared build: tsc emits to dist/; src/ is source-only"
    - "dist/ gitignored via bare dist/ entry in root .gitignore"

key-files:
  created: []
  modified:
    - packages/shared/package.json

key-decisions:
  - "Removed --noEmit from build script so tsc emits compiled output to dist/ per tsconfig outDir"
  - "package.json main/types updated from src/ to dist/ references"

patterns-established:
  - "Build artifacts belong in dist/, never alongside source in src/"

requirements-completed: []

duration: 1min
completed: 2026-03-18
---

# Quick Task 260318-jf3: Fix packages/shared Build Output to dist/ Summary

**Moved packages/shared compiled output from src/ to dist/ by deleting 20 stale build artifacts, removing --noEmit from the tsc build script, and updating package.json main/types to point at dist/**

## Performance

- **Duration:** ~1 min
- **Started:** 2026-03-18T17:00:38Z
- **Completed:** 2026-03-18T17:01:23Z
- **Tasks:** 2
- **Files modified:** 1 (packages/shared/package.json) + 20 deleted artifacts

## Accomplishments

- Deleted 20 stale .js/.d.ts build artifacts from packages/shared/src/ and src/api/
- Updated package.json: main `src/index.js` -> `dist/index.js`, types `src/index.d.ts` -> `dist/index.d.ts`
- Removed `--noEmit` from build script so `yarn workspace @recipe-manager/shared build` emits to dist/
- Confirmed dist/ is gitignored by the bare `dist/` entry at .gitignore:2

## Task Commits

1. **Task 1: Remove src/ build artifacts and fix package.json** - `1e86fbe` (fix)
2. **Task 2: Rebuild and verify dist/ output** - no separate commit (dist/ is gitignored; build verified only)

## Files Created/Modified

- `packages/shared/package.json` - Updated main/types to dist/, removed --noEmit from build script
- *(deleted)* `packages/shared/src/index.js`, `src/index.d.ts`, `src/common.js`, `src/common.d.ts`, `src/enums.js`, `src/enums.d.ts`, `src/api/admin.{js,d.ts}`, `src/api/auth.{js,d.ts}`, `src/api/household.{js,d.ts}`, `src/api/meal-plan.{js,d.ts}`, `src/api/profile.{js,d.ts}`, `src/api/recipes.{js,d.ts}`, `src/api/setup.{js,d.ts}`

## Decisions Made

- Removed `--noEmit` flag rather than adding a separate emit script — single build command that does what its name implies
- No tsconfig.json changes needed — outDir/rootDir were already correctly set to dist/src

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- packages/shared is now correctly structured: src/ for TypeScript source, dist/ for compiled output
- `yarn workspace @recipe-manager/shared build` exits 0 and populates dist/
- Editors will no longer see stale .js/.d.ts artifacts confusing the source/build boundary

## Self-Check

- [x] packages/shared/src/ has 0 .js or .d.ts files: `find packages/shared/src -name "*.js" -o -name "*.d.ts" | wc -l` returns 0
- [x] packages/shared/dist/index.js exists
- [x] packages/shared/dist/index.d.ts exists
- [x] packages/shared/dist/api/ exists with all compiled api files
- [x] git check-ignore confirms `.gitignore:2:dist/ packages/shared/dist/index.js`
- [x] Commit 1e86fbe exists

## Self-Check: PASSED

---
*Phase: quick*
*Completed: 2026-03-18*
