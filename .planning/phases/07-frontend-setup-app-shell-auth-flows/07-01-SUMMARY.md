---
phase: 07-frontend-setup-app-shell-auth-flows
plan: 01
subsystem: frontend-infrastructure
tags: [tailwind-v4, tanstack-query, vitest, api-client, design-tokens]
dependency_graph:
  requires: []
  provides:
    - apps/web/src/app/globals.css (9 design tokens via @theme)
    - apps/web/src/lib/api-client.ts (typed fetch wrapper, credentials: include)
    - apps/web/src/lib/query-keys.ts (TanStack Query key factory)
    - apps/web/src/components/Providers.tsx (QueryClientProvider + Toaster)
    - apps/web/vitest.config.ts (Vitest test runner)
  affects:
    - apps/web/src/app/layout.tsx (root layout wired)
    - apps/web/next.config.ts (API proxy rewrite)
    - apps/web/package.json (dependencies added)
tech_stack:
  added:
    - tailwindcss@4.2.1
    - "@tailwindcss/postcss@4.2.1"
    - postcss@8.5.8
    - "@tanstack/react-query@5.90.21"
    - lucide-react@0.577.0
    - sonner@2.0.7
    - vitest@4.1.0
    - "@vitejs/plugin-react@6.0.1"
    - jsdom@29.0.0
    - "@testing-library/react@16.3.2"
    - "@testing-library/jest-dom@6.9.1"
    - "@testing-library/user-event@14.6.1"
  patterns:
    - Tailwind v4 CSS-first config via @theme (no tailwind.config.ts)
    - QueryClient instantiated in useState(() => ...) initializer to prevent re-render recreation
    - Next.js rewrite proxy /api/* -> localhost:3000/api/* eliminates CORS in dev
    - next/font/google self-hosted Outfit font (eliminates CDN dependency)
key_files:
  created:
    - apps/web/postcss.config.mjs
    - apps/web/src/app/globals.css
    - apps/web/src/components/Providers.tsx
    - apps/web/src/lib/api-client.ts
    - apps/web/src/lib/query-keys.ts
    - apps/web/vitest.config.ts
    - apps/web/src/test/setup.ts
    - apps/web/src/components/__tests__/AppShell.test.tsx
    - apps/web/src/components/__tests__/AuthProvider.test.tsx
    - apps/web/src/components/__tests__/Toast.test.tsx
  modified:
    - apps/web/package.json
    - apps/web/next.config.ts
    - apps/web/src/app/layout.tsx
decisions:
  - "next/font/google used instead of CDN link for Outfit — self-hosted font eliminates CDN dependency and improves LCP (per Research Pitfall 4)"
  - "BASE_URL defaults to /api (same-origin via Next.js rewrite) not absolute localhost:3000/api — CORS eliminated in dev"
  - "vite and @testing-library/dom installed as explicit devDeps to satisfy vitest + @vitejs/plugin-react peer requirements"
metrics:
  duration: 3 min
  completed_date: "2026-03-18"
  tasks_completed: 2
  files_created: 10
  files_modified: 3
---

# Phase 7 Plan 01: Frontend Infrastructure Setup Summary

Tailwind v4 design tokens, typed API client with proxy rewrite, QueryClient + Toaster providers, and Vitest Wave 0 test stubs fully wired into Next.js root layout.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Install deps, configure Tailwind v4, wire root layout | a8f5bb6 | package.json, postcss.config.mjs, globals.css, layout.tsx, Providers.tsx, api-client.ts, query-keys.ts |
| 2 | Create vitest config and Wave 0 test stubs | c47ff35 | vitest.config.ts, src/test/setup.ts, 3x __tests__/*.test.tsx |

## Verification Results

- `yarn workspace @recipe-manager/web build` — exits 0, compiled successfully in ~3s
- `yarn workspace @recipe-manager/web test --run` — exits 0, 3 test files skipped, 10 todos
- `--color-background: #FAFAF7` present in globals.css
- `credentials: 'include'` present in api-client.ts
- `rewrites` + `http://localhost:3000/api/:path*` present in next.config.ts

## Decisions Made

1. **next/font/google for Outfit**: Used `next/font/google` instead of CDN `<link>` — self-hosts the font, eliminates CDN dependency, improves LCP. This is Next.js best practice per Research Pitfall 4.

2. **BASE_URL defaults to `/api`**: The API client base URL defaults to `/api` (same-origin via Next.js rewrite) rather than absolute `http://localhost:3000/api`. Together with the next.config.ts rewrite, this eliminates CORS issues in development.

3. **Explicit peer deps installed**: `vite` and `@testing-library/dom` added as explicit devDependencies to satisfy peer requirements from `@vitejs/plugin-react` and `@testing-library/react` respectively.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing] Installed missing peer dependencies**
- **Found during:** Task 1 (yarn install output)
- **Issue:** `@vitejs/plugin-react` requires `vite` as a peer dep; `@testing-library/react` requires `@testing-library/dom` as a peer dep — both were not installed
- **Fix:** `yarn workspace @recipe-manager/web add -D vite @testing-library/dom`
- **Files modified:** apps/web/package.json
- **Commit:** a8f5bb6 (bundled with Task 1)

## Self-Check: PASSED

All 10 created files exist on disk. Both task commits (a8f5bb6, c47ff35) confirmed in git log.
