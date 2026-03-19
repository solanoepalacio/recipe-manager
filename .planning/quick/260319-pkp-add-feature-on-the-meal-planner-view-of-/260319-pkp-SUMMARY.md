---
phase: quick
plan: 260319-pkp
subsystem: frontend-meal-planner
tags: [calendar, modal, navigation, week-jump, planner]
dependency_graph:
  requires: []
  provides: [WeekCalendarModal component, getCalendarGrid helper]
  affects: [apps/web/src/app/(app)/planner/page.tsx, apps/web/src/components/planner/WeekNav.tsx]
tech_stack:
  added: []
  patterns: [BottomSheet modal, pure calendar grid, state-driven month navigation]
key_files:
  created:
    - apps/web/src/components/planner/WeekCalendarModal.tsx
    - apps/web/tests/components/planner/WeekCalendarModal.test.tsx
  modified:
    - apps/web/src/lib/planner-dates.ts
    - apps/web/src/components/planner/WeekNav.tsx
    - apps/web/src/app/(app)/planner/page.tsx
decisions:
  - getCalendarGrid fills complete weeks with prev/next month overflow days — consistent with standard calendar rendering
  - WeekNav label changed from span to button with dotted underline decoration to signal interactivity
  - handleCalendarSelect expands the selected date's day accordion immediately for quick access
metrics:
  duration: 5 min
  completed_date: "2026-03-19"
  tasks_completed: 2
  files_changed: 5
---

# Quick Task 260319-pkp: Add Calendar Jump to Meal Planner Summary

**One-liner:** Month-grid calendar modal wired to WeekNav label so users can jump to any week by tapping the current week label.

## What Was Built

Previously, users could only navigate the planner week by week using the prev/next arrows in WeekNav. This task adds a "jump to any week" feature:

1. The week label in WeekNav is now a tappable button with a dotted underline
2. Tapping it opens a BottomSheet calendar modal showing the current month
3. Users can navigate between months with chevron buttons
4. Tapping a day closes the modal and jumps the planner to the week containing that date
5. The selected date's day accordion is auto-expanded for immediate access

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create WeekCalendarModal component | f031bef | WeekCalendarModal.tsx, planner-dates.ts, WeekCalendarModal.test.tsx |
| 2 | Wire calendar modal into WeekNav and PlannerPage | f2e03d8 | WeekNav.tsx, planner/page.tsx |

## Key Decisions

1. **Pure implementation** — no external calendar library. `getCalendarGrid(year, month)` helper added to `planner-dates.ts` generates the full 7-column week-row grid with overflow days from adjacent months.

2. **BottomSheet container** — reuses existing `BottomSheet` component for the calendar modal. Provides consistent scroll-lock, scrim dismiss, and keyboard escape behavior.

3. **Current week row highlight** — the entire row containing `currentDate` receives `bg-subtle` background using the CSS variable theme color, matching the app's warm neutral palette.

4. **Today highlight** — `ring-2 ring-accent rounded-full` on today's date cell, consistent with the accent green color used throughout the app.

5. **onLabelClick prop** — WeekNav interface extended with `onLabelClick: () => void` so the label-to-modal wiring is clean and testable without coupling the modal state to WeekNav.

## Tests

7 tests added in `WeekCalendarModal.test.tsx`:
- renders month name and year in header
- renders day-of-week abbreviations (D L M M J V S)
- clicking a day calls onSelectDate with correct Date object
- clicking a day calls onClose
- prev month button navigates to February 2026
- next month button navigates to April 2026
- does not render when isOpen=false

All 26 test files / 142+ tests pass in the full web suite.

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- apps/web/src/components/planner/WeekCalendarModal.tsx: FOUND
- apps/web/tests/components/planner/WeekCalendarModal.test.tsx: FOUND
- apps/web/src/lib/planner-dates.ts (getCalendarGrid added): FOUND
- Commit f031bef: FOUND
- Commit f2e03d8: FOUND
