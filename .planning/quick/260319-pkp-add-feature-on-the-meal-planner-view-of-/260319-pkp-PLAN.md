---
phase: quick
plan: 260319-pkp
type: execute
wave: 1
depends_on: []
files_modified:
  - apps/web/src/components/planner/WeekCalendarModal.tsx
  - apps/web/src/components/planner/WeekNav.tsx
  - apps/web/src/app/(app)/planner/page.tsx
  - apps/web/src/lib/planner-dates.ts
  - apps/web/tests/components/planner/WeekCalendarModal.test.tsx
autonomous: true
requirements: []

must_haves:
  truths:
    - "Tapping the week label text in WeekNav opens a calendar modal"
    - "The calendar modal displays a month grid with selectable days"
    - "Selecting a day in the calendar jumps the planner to the week containing that date"
    - "The modal closes after a day is selected"
    - "The user can navigate between months in the calendar modal"
  artifacts:
    - path: "apps/web/src/components/planner/WeekCalendarModal.tsx"
      provides: "Calendar modal component with month grid"
      min_lines: 60
    - path: "apps/web/src/components/planner/WeekNav.tsx"
      provides: "Updated WeekNav with clickable label that opens calendar"
  key_links:
    - from: "apps/web/src/components/planner/WeekNav.tsx"
      to: "apps/web/src/components/planner/WeekCalendarModal.tsx"
      via: "onLabelClick callback opens modal"
      pattern: "onLabelClick"
    - from: "apps/web/src/components/planner/WeekCalendarModal.tsx"
      to: "apps/web/src/app/(app)/planner/page.tsx"
      via: "onSelectDate sets anchor to selected date"
      pattern: "onSelectDate"
---

<objective>
Add a calendar modal to the meal planner's WeekNav so users can jump to any week by tapping the current week label ("Semana del X al Y"). Tapping a day in the calendar navigates the planner to the week containing that date.

Purpose: Currently users can only navigate week-by-week with prev/next arrows. This lets them jump directly to any week.
Output: WeekCalendarModal component, updated WeekNav with clickable label, wired into PlannerPage.
</objective>

<execution_context>
@/home/solanoe/code/recipe-manager/.claude/get-shit-done/workflows/execute-plan.md
@/home/solanoe/code/recipe-manager/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@apps/web/src/components/planner/WeekNav.tsx
@apps/web/src/app/(app)/planner/page.tsx
@apps/web/src/lib/planner-dates.ts
@apps/web/src/components/ui/BottomSheet.tsx
@apps/web/src/app/globals.css

<interfaces>
<!-- Existing planner-dates utilities the executor needs -->

From apps/web/src/lib/planner-dates.ts:
```typescript
export function localDateString(d: Date): string;
export function getWeekRange(anchor: Date): { from: string; to: string; days: string[] };
export function formatWeekLabel(from: string, to: string): string;
```

From apps/web/src/components/planner/WeekNav.tsx:
```typescript
interface WeekNavProps {
  label: string;
  onPrev: () => void;
  onNext: () => void;
}
```

From apps/web/src/components/ui/BottomSheet.tsx:
```typescript
interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}
```

Theme colors (globals.css):
- --color-background: #FAFAF7
- --color-foreground: #2C2C2A
- --color-accent: #5EBD6A
- --color-secondary: #8A8680
- --color-border: #E0DCD5
- --color-subtle: #F4F2ED
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Create WeekCalendarModal component</name>
  <files>apps/web/src/components/planner/WeekCalendarModal.tsx, apps/web/src/lib/planner-dates.ts, apps/web/tests/components/planner/WeekCalendarModal.test.tsx</files>
  <behavior>
    - Renders a month grid (7 columns, Su-Sa header row, day cells) for the month containing `currentDate`
    - Prev/next month navigation buttons update the displayed month
    - Clicking a day cell calls `onSelectDate` with that Date object
    - Today's date is visually highlighted (accent ring)
    - The week containing `currentDate` has a subtle background highlight on its row
    - Days outside the current month are dimmed (text-placeholder)
    - Modal closes (calls onClose) after day selection
  </behavior>
  <action>
    1. Add a helper to `planner-dates.ts`: `getCalendarGrid(year: number, month: number): Date[][]` that returns an array of week-rows (each row is 7 Date objects), starting from Sunday. Include leading days from the previous month and trailing days from the next month to fill complete weeks.

    2. Create `WeekCalendarModal.tsx` — a pure component (no external calendar library):
       - Props: `isOpen: boolean`, `onClose: () => void`, `currentDate: Date`, `onSelectDate: (date: Date) => void`
       - Uses BottomSheet as the modal container with title showing month+year in Spanish (e.g., "Marzo 2026")
       - Month nav: left/right chevron buttons (lucide-react ChevronLeft/ChevronRight) to change displayed month
       - Day-of-week header row: "D L M M J V S" (Spanish abbreviations)
       - Day grid: 7-column CSS grid. Each cell is a button.
         - Current month days: `text-foreground`
         - Other month days: `text-placeholder`
         - Today: `ring-2 ring-accent rounded-full`
         - Days in the same week as `currentDate`: `bg-subtle` on the entire row
       - On day click: call `onSelectDate(clickedDate)` then `onClose()`
       - Max height with overflow-y-auto for months with 6 rows

    3. Write test file `apps/web/tests/components/planner/WeekCalendarModal.test.tsx`:
       - Test: renders month name and year in header
       - Test: renders day-of-week abbreviations
       - Test: clicking a day calls onSelectDate with correct Date
       - Test: prev/next month buttons change displayed month
       - Test: does not render when isOpen=false

    Spanish month names array: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
  </action>
  <verify>
    <automated>cd /home/solanoe/code/recipe-manager && npx vitest run apps/web/tests/components/planner/WeekCalendarModal.test.tsx --reporter=verbose</automated>
  </verify>
  <done>WeekCalendarModal renders a navigable month grid, calls onSelectDate on day click, tests pass</done>
</task>

<task type="auto">
  <name>Task 2: Wire calendar modal into WeekNav and PlannerPage</name>
  <files>apps/web/src/components/planner/WeekNav.tsx, apps/web/src/app/(app)/planner/page.tsx</files>
  <action>
    1. Update `WeekNav` props interface — add `onLabelClick: () => void`:
       ```typescript
       interface WeekNavProps {
         label: string;
         onPrev: () => void;
         onNext: () => void;
         onLabelClick: () => void;
       }
       ```
       Change the label `<span>` to a `<button>` with `onClick={onLabelClick}`. Style it as a transparent button with an underline-on-tap feel: add `underline decoration-dotted decoration-secondary underline-offset-4` classes so users see the label is tappable. Keep the existing text styling.

    2. Update `PlannerPage`:
       - Add state: `const [calendarOpen, setCalendarOpen] = useState(false);`
       - Import WeekCalendarModal
       - Pass `onLabelClick={() => setCalendarOpen(true)}` to WeekNav
       - Add `handleCalendarSelect` callback:
         ```typescript
         const handleCalendarSelect = useCallback((date: Date) => {
           setAnchor(date);
           // Expand the selected date's day accordion
           setExpandedDays(new Set([localDateString(date)]));
         }, []);
         ```
       - Render `<WeekCalendarModal isOpen={calendarOpen} onClose={() => setCalendarOpen(false)} currentDate={anchor} onSelectDate={handleCalendarSelect} />` after the EditEntrySheet
  </action>
  <verify>
    <automated>cd /home/solanoe/code/recipe-manager && npx vitest run apps/web/tests/components/planner/ --reporter=verbose</automated>
  </verify>
  <done>Clicking the week label in WeekNav opens the calendar modal. Selecting a day jumps the planner to the week containing that date and expands that day's accordion.</done>
</task>

</tasks>

<verification>
- Open the planner page in the browser
- The week label ("Semana del X al Y") appears with a dotted underline indicating it is clickable
- Tapping the label opens a bottom sheet calendar showing the current month
- Navigating months with prev/next arrows works
- Tapping a day closes the modal and the planner shows the week containing that day
- Today's date has an accent ring highlight
- All existing planner tests still pass
</verification>

<success_criteria>
- WeekCalendarModal component exists and renders a functional month calendar grid
- Week label in WeekNav is clickable and opens the calendar
- Selecting any day navigates to the correct week
- No external calendar library added (pure implementation using planner-dates utilities)
- All planner tests pass
</success_criteria>

<output>
After completion, create `.planning/quick/260319-pkp-add-feature-on-the-meal-planner-view-of-/260319-pkp-SUMMARY.md`
</output>
