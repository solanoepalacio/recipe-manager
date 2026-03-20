# Summary: 260320-mb4 — Fix Hoy page showing hardcoded empty state

## Status: COMPLETE

## Root Cause

The Hoy page (`apps/web/src/app/(app)/page.tsx`) was a static placeholder that never fetched any data. It always displayed "No hay recetas para hoy" regardless of what was scheduled in the meal plan.

## Changes Made

### Task 1: Implement the Hoy page to fetch and display today's meal plan entries

**Files modified:**

- `apps/web/src/app/(app)/page.tsx` — Rewrote from static placeholder to live client component that:
  - Computes today's date using `localDateString(new Date())`
  - Fetches `GET /meal-plan?from={today}&to={today}` via TanStack Query
  - Renders entries with Spanish meal type labels (`MEAL_TYPE_LABELS`)
  - Links each entry to the recipe detail page
  - Shows loading skeleton while fetching
  - Shows empty state text only when there are genuinely no entries
  - Shows user's first name in greeting via `useAuth()`

- `apps/web/src/lib/query-keys.ts` — Added `mealPlan.today(date)` query key:
  ```ts
  today: (date: string) => ['meal-plan', 'today', date] as const,
  ```

- `apps/web/src/components/__tests__/HoyPage.test.tsx` — New test file covering:
  - Greeting renders with user name
  - Empty state when no entries
  - Entry list renders recipe names
  - Meal type labels in Spanish
  - API called with correct `from`/`to` params
  - "Recetas de hoy" section heading present

## Commits

1. `fc2d1fb` — `test(hoy): add tests for Hoy page meal plan data fetching`
2. `180dc66` — `feat(hoy): implement Hoy page to fetch and display today's meal plan entries`

## Test Results

All 6 new HoyPage tests pass. No regressions introduced (pre-existing 11 failures in other test files are unrelated to this task).
