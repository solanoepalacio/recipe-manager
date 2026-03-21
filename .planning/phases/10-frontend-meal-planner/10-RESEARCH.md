# Phase 10: Frontend Meal Planner — Research

**Researched:** 2026-03-18
**Domain:** React / Next.js frontend — calendar UI, accordion interaction, drag-and-drop across containers, optimistic mutation
**Confidence:** HIGH

---

## Summary

Phase 10 is a pure frontend implementation phase. The backend meal plan API (GET `/api/meal-plan`, POST/PATCH/DELETE `/api/meal-plan/entries`) was fully implemented in Phase 5. The shared types (`MealPlanEntryResponse`, `CreateMealPlanEntryRequest`, `UpdateMealPlanEntryRequest`, `MealType` enum) are already defined in `packages/shared/src/api/meal-plan.ts` and `src/enums.ts`. No new backend work is required.

The planner page replaces a stub at `apps/web/src/app/(app)/planner/page.tsx`. The component architecture is well-understood from the UI-SPEC: a 7-day accordion list (mobile), a week navigation row, a 1/4-week toggle, a recipe picker bottom sheet, and an edit entry bottom sheet. All infrastructure — `@dnd-kit/core` + `@dnd-kit/sortable`, TanStack Query v5, the `BottomSheet` component, the `ConfirmDialog` component, the `Skeleton` component, and the established test patterns — is already in place from prior phases.

The single non-trivial challenge is drag-and-drop across multiple accordion containers (cross-day drag), which is architecturally different from the within-list sort used in the recipe editor. The planner uses drag to move entries between different day rows (different droppable containers), not reorder within a single list.

**Primary recommendation:** Use `@dnd-kit/core` `DndContext` at the planner page level with custom `useDroppable` on each expanded day panel, and `useDraggable` on each `MealEntryRow`. Do NOT use `SortableContext`/`useSortable` for cross-container drag — those are for within-list reorder. On drop, PATCH the entry's `date` and/or `mealType` with optimistic update via TanStack Query's `setQueryData`.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PLAN-01 | User can view a weekly meal planner (1 or 4 weeks) | `WeekNav` + `WeekToggle` components; GET `/api/meal-plan?from=&to=` with TanStack Query; date-range computation logic |
| PLAN-02 | User can assign a recipe to a date and meal type (breakfast, lunch, dinner, snack, dessert) | `RecipePickerSheet` bottom sheet; POST `/api/meal-plan/entries`; `MealTypeChips` chip selector |
| PLAN-03 | User can drag-and-drop meal plan entries to reorganize | `@dnd-kit/core` `DndContext` + `useDraggable` + `useDroppable`; PATCH `/api/meal-plan/entries/:id`; optimistic update |
| PLAN-04 | User can edit or delete individual meal plan entries | `EditEntrySheet` bottom sheet; PATCH + DELETE `/api/meal-plan/entries/:id`; `ConfirmDialog` for edit-sheet delete |
| HH-02 | All household members share the same meal plan | No extra work — meal plan is household-scoped at the service layer; any member's mutation is visible to all on refetch |
</phase_requirements>

---

## Standard Stack

### Core (already installed — no new packages needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@dnd-kit/core` | ^6.3.1 | Drag-and-drop primitive (DndContext, useDraggable, useDroppable, sensors) | Already installed since Phase 09; used for cross-container drag |
| `@dnd-kit/sortable` | ^10.0.0 | Within-list sort (SortableContext, useSortable, arrayMove) | Already installed; NOT used for cross-day drag (within-day order has no meaning) |
| `@dnd-kit/utilities` | ^3.2.2 | CSS.Transform.toString helper | Already installed |
| `@tanstack/react-query` | ^5.90.21 | Server state — fetch, cache, optimistic update | Already installed; `useQuery` + `useMutation` + `setQueryData` |
| `lucide-react` | ^0.577.0 | Icons: GripVertical, ChevronRight, ChevronDown, ChevronLeft, X, Plus | Already installed |
| `sonner` | ^2.0.7 | Toast notifications on mutation error/success | Already installed |
| `next` | ^15.0.0 | Routing — `/planner` already in (app) group | Already installed |
| `tailwindcss` | ^4.2.1 | Styling — Tailwind v4 with custom `@theme` tokens | Already installed |

**No new packages need to be installed.** All libraries are already in `apps/web/package.json`.

### Supporting (existing project utilities)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@recipe-manager/shared` | workspace | `MealPlanEntryResponse`, `MealType` enum, request DTOs | Import types for all meal plan data — compiler-enforced boundary |
| `api-client` | internal | `api.get`, `api.post`, `api.patch`, `api.delete` | All HTTP calls |
| `query-keys` | internal | `queryKeys.mealPlan.week(from, to)` already defined | Cache key for meal plan query |

The `queryKeys.mealPlan.week` key is **already defined** in `apps/web/src/lib/query-keys.ts`.

---

## Architecture Patterns

### Recommended Project Structure

```
apps/web/src/
├── app/(app)/planner/
│   └── page.tsx                    # Replace stub — PlannerPage
├── components/planner/
│   ├── WeekNav.tsx                 # Week navigation row (prev/next arrows + label)
│   ├── WeekToggle.tsx              # "1 semana / 4 semanas" segmented control
│   ├── DayAccordion.tsx            # Collapsed/expanded day row + entry list
│   ├── MealEntryRow.tsx            # Single entry row (draggable)
│   ├── RecipePickerSheet.tsx       # Bottom sheet — search + meal type + recipe list
│   ├── MealTypeChips.tsx           # Horizontal chip row (Desayuno, Almuerzo, etc.)
│   └── EditEntrySheet.tsx          # Bottom sheet — edit recipe + meal type + delete
└── components/__tests__/
    └── PlannerPage.test.tsx        # Wave 0 test file
```

### Pattern 1: Cross-Container Drag with @dnd-kit/core

**What:** Dragging a `MealEntryRow` from one day accordion to another. Each expanded day panel is a separate droppable. A single `DndContext` at the `PlannerPage` level wraps everything.

**When to use:** Any time draggable items must move between distinct containers (not reorder within one list). Contrast with `SortableContext` which handles within-list reorder.

**Implementation approach:**
```typescript
// PlannerPage — single DndContext at root
<DndContext
  sensors={sensors}
  onDragEnd={handleDragEnd}
  onDragStart={handleDragStart}
>
  {days.map(day => (
    <DayAccordion
      key={day}
      date={day}
      entries={entriesByDate[day] ?? []}
      isExpanded={expandedDays.has(day)}
      onToggle={() => toggleDay(day)}
      onAddEntry={() => openPicker(day)}
    />
  ))}
</DndContext>

// DayAccordion panel — useDroppable
const { setNodeRef, isOver } = useDroppable({ id: `day-${date}` });
// highlight cell when isOver && dragging

// MealEntryRow — useDraggable
const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
  id: entry.id,
  data: { entry },  // carry entry data with the drag
});
```

**On drag end — optimistic PATCH:**
```typescript
function handleDragEnd(event: DragEndEvent) {
  const { active, over } = event;
  if (!over) return;
  const entry = active.data.current?.entry as MealPlanEntryResponse;
  const newDate = over.id.toString().replace('day-', '');
  if (entry.date === newDate) return;  // no change

  // Optimistic update
  queryClient.setQueryData(queryKeys.mealPlan.week(from, to), (old: MealPlanResponse) => ({
    entries: old.entries.map(e =>
      e.id === entry.id ? { ...e, date: newDate } : e
    ),
  }));

  // Server PATCH
  patchEntryMutation.mutate(
    { id: entry.id, body: { date: newDate } },
    { onError: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.mealPlan.week(from, to) });
        toast.error('No se pudo mover la receta. Intentalo de nuevo.');
    }}
  );
}
```

**Note on mealType on drop:** The UI-SPEC specifies drag changes the `date` (moving to a different day). The `mealType` does NOT change on cross-day drag — the entry keeps its meal type. If the user wants to change meal type, they use the Edit sheet.

### Pattern 2: Week Date Range Computation

**What:** Computing the 7-day window for the current week view, and advancing +/-7 days on nav.

```typescript
// utils/plannerDates.ts
function getWeekRange(anchor: Date): { from: string; to: string; days: string[] } {
  // anchor to Monday of the week
  const monday = new Date(anchor);
  monday.setDate(anchor.getDate() - ((anchor.getDay() + 6) % 7));

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().slice(0, 10); // YYYY-MM-DD
  });

  return { from: days[0], to: days[6], days };
}
```

**4-week view:** Render 4 consecutive week blocks. The API query uses a 28-day `from`/`to` range. Each week block is an independent accordion set.

### Pattern 3: TanStack Query for Meal Plan Data

**What:** Fetching entries for the current date range; scoped to `queryKeys.mealPlan.week(from, to)`.

```typescript
const { data, isLoading } = useQuery({
  queryKey: queryKeys.mealPlan.week(from, to),
  queryFn: () =>
    api.get<MealPlanResponse>(`/meal-plan?from=${from}&to=${to}`),
});

// Group entries by date for rendering
const entriesByDate = useMemo(() => {
  const map: Record<string, MealPlanEntryResponse[]> = {};
  data?.entries.forEach(e => {
    if (!map[e.date]) map[e.date] = [];
    map[e.date].push(e);
  });
  return map;
}, [data]);
```

### Pattern 4: Today Auto-Expand

**What:** On initial render, expand today's accordion row.

```typescript
const [expandedDays, setExpandedDays] = useState<Set<string>>(() => {
  const today = new Date().toISOString().slice(0, 10);
  return new Set([today]);
});
```

### Pattern 5: Existing BottomSheet Component

The `BottomSheet` component at `components/ui/BottomSheet.tsx` is already implemented with:
- Scrim (`rgba(44,44,42,0.35)`)
- Body scroll lock
- Escape key close
- Drag handle bar (36x4px)
- Optional `title` prop

Use it directly for `RecipePickerSheet` and `EditEntrySheet`:
```typescript
<BottomSheet
  isOpen={isPickerOpen}
  onClose={closePicker}
  title={`Anadir receta a ${dayLabel}`}
>
  {/* search, chips, recipe list */}
</BottomSheet>
```

**Limitation:** The existing `BottomSheet` does not have `max-height` or scroll built in. `RecipePickerSheet` needs an inner scrollable div: `className="max-h-[60vh] overflow-y-auto"` on the list container.

### Pattern 6: Existing ConfirmDialog Component

The `ConfirmDialog` at `components/ui/ConfirmDialog.tsx` renders inline (not a modal overlay). Use the `confirmDeleteId` pattern from Phase 09:

```typescript
const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
// ...
{showDeleteConfirm && (
  <ConfirmDialog
    message="¿Eliminar esta entrada del planificador?"
    confirmLabel="Eliminar entrada"
    onConfirm={handleDelete}
    onCancel={() => setShowDeleteConfirm(false)}
  />
)}
```

**Note:** The `ConfirmDialog` component has a cancel button hardcoded as "Cancelar". The UI-SPEC requires "Mantener entrada" for the cancel label. The component does not expose a `cancelLabel` prop. The executor must either add `cancelLabel` to `ConfirmDialog`, or render a custom inline confirm section in `EditEntrySheet` directly.

### Anti-Patterns to Avoid

- **Using SortableContext for cross-day drag:** `SortableContext`/`useSortable` are for within-container reorder (e.g., ingredient reorder). Do not use them for moving entries between different day rows.
- **Fetching recipe list at page level:** The recipe picker only needs the list when open. Fetch inside `RecipePickerSheet` with a separate query so the planner page does not load all recipes on mount.
- **Debouncing week navigation without invalidation:** When week advances, update the `from`/`to` state; TanStack Query handles cache keying automatically. Do not manually invalidate — just let the key change drive a new fetch.
- **Storing expanded days as array:** Use `Set<string>` for O(1) lookup. Accordion rows check `expandedDays.has(date)`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drag-and-drop | Custom mouse/touch event handling | `@dnd-kit/core` (already installed) | Touch, keyboard, screen reader support; pointer capture; drag overlay |
| Toast notifications | Custom toast state | `sonner` (already installed) | Already integrated in Phase 07; consistent UX |
| Bottom sheet | Custom overlay/portal | `BottomSheet` component (already exists) | Scrim, scroll lock, keyboard close already implemented |
| Inline confirm | Global modal system | `ConfirmDialog` component (already exists) | Inline pattern established in Phase 09 |
| Date arithmetic | Moment.js or date-fns | Native `Date` + ISO string slicing | Only need week boundary calculation; no timezone conversion needed (dates are YYYY-MM-DD strings, server-agnostic) |
| Server state | Local useState for entries | TanStack Query `useQuery` + `setQueryData` | Optimistic update, cache invalidation, loading/error states built in |

**Key insight:** Every infrastructure piece for this phase was intentionally pre-installed in prior phases. The only new code is planner-specific React components.

---

## Common Pitfalls

### Pitfall 1: Cross-Day Drag — Wrong @dnd-kit API Choice
**What goes wrong:** Developer uses `useSortable` and `SortableContext` for meal entries (mirroring the ingredient/step editor), but those primitives assume a single ordered list. Cross-day drag requires independent droppable containers.
**Why it happens:** The recipe editor (Phase 09) uses `useSortable` for within-list reorder, so it looks like the pattern to copy.
**How to avoid:** Use `useDraggable` on `MealEntryRow` and `useDroppable` on each `DayAccordion` panel. A single `DndContext` at the page level governs all.
**Warning signs:** If drag-and-drop only works within a single day's entries or throws "items must be unique" errors across days.

### Pitfall 2: Auto-Expand on Drag Hover — State Complexity
**What goes wrong:** The UI-SPEC says "on drag start, auto-expand target day after 500ms hover." Implementing this correctly requires knowing which day is being hovered while dragging, then using a timeout that clears on drag end or hover change.
**Why it happens:** `isOver` from `useDroppable` only tells you the current drop target; tracking hover duration requires a ref-based timeout.
**How to avoid:** Track hover start time in a `useRef`. On `DragMoveEvent` (from `onDragMove` on DndContext), detect which droppable is active and start/clear a 500ms timeout to expand that day.
**Alternative:** If auto-expand proves complex, the executor can simplify to: user manually expands the target day before dragging. The UI-SPEC says "auto-expand target day" — this is desirable but not a hard requirement for any of PLAN-01 through PLAN-04.

### Pitfall 3: Optimistic Update Race Condition
**What goes wrong:** Optimistic update sets the entry in the local cache, but then `invalidateQueries` in `onSuccess` overwrites it with the server response before the server has processed — or the server response differs from what was optimistically set.
**Why it happens:** Calling both `setQueryData` optimistically AND `invalidateQueries` on success without cancelling in-flight queries.
**How to avoid:** In `onSuccess`, call `queryClient.invalidateQueries` to get the authoritative server state. On `onError`, call `invalidateQueries` to revert the optimistic update. Do not call both simultaneously. The TanStack Query v5 pattern:
```typescript
mutationFn: ...,
onMutate: async () => {
  await queryClient.cancelQueries({ queryKey });
  const snapshot = queryClient.getQueryData(queryKey);
  queryClient.setQueryData(queryKey, optimisticData);
  return { snapshot };
},
onError: (_, __, ctx) => {
  queryClient.setQueryData(queryKey, ctx?.snapshot);
  toast.error('...');
},
onSettled: () => queryClient.invalidateQueries({ queryKey }),
```

### Pitfall 4: ConfirmDialog cancelLabel Mismatch
**What goes wrong:** The UI-SPEC requires "Mantener entrada" as the cancel label, but `ConfirmDialog` hardcodes "Cancelar" with no `cancelLabel` prop.
**Why it happens:** `ConfirmDialog` was built for a single use case. The spec for this phase requires a different label.
**How to avoid:** Add `cancelLabel?: string` prop to `ConfirmDialog` before using it in `EditEntrySheet`. This is a small, safe change to an existing component.

### Pitfall 5: Recipe Picker Fetches All Recipes on Page Load
**What goes wrong:** If the recipe list query is triggered at `PlannerPage` level, all recipes load when the user visits `/planner`, even if they never open the picker.
**Why it happens:** Over-eager query placement.
**How to avoid:** Put the recipe list `useQuery` inside `RecipePickerSheet`. It only fetches when the sheet is rendered (i.e., `isOpen`). Use `enabled: isOpen` to further prevent background refetches.

### Pitfall 6: MealType Display in Entry Rows — Uppercase Transform
**What goes wrong:** Displaying `entry.mealType` directly as "breakfast" or "lunch" instead of the Spanish label.
**Why it happens:** The enum value is the English key; the display label must come from the mapping table.
**How to avoid:** Define a lookup object:
```typescript
const MEAL_TYPE_LABELS: Record<MealType, string> = {
  [MealType.Breakfast]: 'Desayuno',
  [MealType.Lunch]: 'Almuerzo',
  [MealType.Dinner]: 'Cena',
  [MealType.Snack]: 'Merienda',
  [MealType.Dessert]: 'Postre',
};
```
Use `MEAL_TYPE_LABELS[entry.mealType]` everywhere the meal type label is rendered.

---

## Code Examples

### @dnd-kit Cross-Container Setup (verified pattern)

```typescript
// PlannerPage.tsx — root DndContext
import { DndContext, DragEndEvent, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';

const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: { distance: 8 }, // prevent accidental drags on tap
  })
);

<DndContext sensors={sensors} onDragEnd={handleDragEnd}>
  {/* day accordions */}
</DndContext>
```

```typescript
// DayAccordion.tsx — droppable panel
import { useDroppable } from '@dnd-kit/core';

const { setNodeRef, isOver } = useDroppable({ id: `day-${date}` });

<div
  ref={setNodeRef}
  className={`transition-colors ${isOver ? 'border border-accent' : ''}`}
>
  {/* entries */}
</div>
```

```typescript
// MealEntryRow.tsx — draggable item
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

const { attributes, listeners, setNodeRef, transform, isDragging } =
  useDraggable({
    id: entry.id,
    data: { entry },
  });

const style = {
  transform: CSS.Translate.toString(transform), // Translate not Transform for draggable
  opacity: isDragging ? 0.9 : 1,
};
```

### TanStack Query Optimistic Mutation (v5 pattern)

```typescript
const queryClient = useQueryClient();
const weekKey = queryKeys.mealPlan.week(from, to);

const patchEntryMutation = useMutation({
  mutationFn: ({ id, body }: { id: string; body: UpdateMealPlanEntryRequest }) =>
    api.patch<MealPlanEntryResponse>(`/meal-plan/entries/${id}`, body),
  onMutate: async ({ id, body }) => {
    await queryClient.cancelQueries({ queryKey: weekKey });
    const snapshot = queryClient.getQueryData<MealPlanResponse>(weekKey);
    queryClient.setQueryData<MealPlanResponse>(weekKey, old => ({
      entries: (old?.entries ?? []).map(e =>
        e.id === id ? { ...e, ...body } : e
      ),
    }));
    return { snapshot };
  },
  onError: (_, __, ctx) => {
    if (ctx?.snapshot) queryClient.setQueryData(weekKey, ctx.snapshot);
    toast.error('No se pudo mover la receta. Intentalo de nuevo.');
  },
  onSettled: () => queryClient.invalidateQueries({ queryKey: weekKey }),
});
```

### Recipe Picker Inside Sheet (lazy load)

```typescript
// RecipePickerSheet.tsx
const { data: recipesData, isLoading } = useQuery({
  queryKey: queryKeys.recipes.list({ search: debouncedSearch }),
  queryFn: () =>
    api.get<PaginatedResponse<RecipeListItem>>(
      `/recipes?search=${encodeURIComponent(debouncedSearch)}&perPage=50`
    ),
  enabled: isOpen,  // only fetch when sheet is visible
});
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| React DnD | @dnd-kit | 2021+ | Accessible, touch-first, no HTML5 DnD API limitations |
| Class components with state | TanStack Query v5 mutations with onMutate | 2023+ | Optimistic update pattern is now first-class |
| SortableContext for all D&D | useDraggable/useDroppable for cross-container | Always true in dnd-kit | SortableContext is only for within-list sort |

**Deprecated/outdated:**
- `react-beautiful-dnd`: Unmaintained, no longer recommended. Project already uses `@dnd-kit`.
- `CSS.Transform.toString()` for draggables: Use `CSS.Translate.toString()` when using `useDraggable` (not `useSortable`) — `Transform` includes scale which is not needed for pure translation.

---

## Open Questions

1. **Auto-expand on drag hover complexity**
   - What we know: dnd-kit `onDragMove` fires continuously during drag; `useDroppable`'s `isOver` tells current target.
   - What's unclear: Whether 500ms hover-expand is worth the state complexity vs. user manually pre-expanding the target day.
   - Recommendation: Executor may simplify to "drag only works into already-expanded days" if the timeout logic adds significant complexity. The spec says it's desired but none of PLAN-01 through PLAN-04 explicitly require it.

2. **4-week view query strategy**
   - What we know: The API accepts `from`/`to` query params. The query key `queryKeys.mealPlan.week(from, to)` supports any range.
   - What's unclear: Whether to fetch 28 days in one request or 4 separate weekly requests.
   - Recommendation: Single 28-day fetch. Simpler, fewer requests, and TanStack Query caches the entire range together. The key `queryKeys.mealPlan.week(from, to)` works correctly for any range width.

---

## Validation Architecture

Nyquist validation is enabled (`workflow.nyquist_validation: true` in `.planning/config.json`).

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest + @testing-library/react (already configured) |
| Config file | `apps/web/vitest.config.ts` |
| Quick run command | `cd /home/solanoe/code/recipe-manager && yarn workspace @recipe-manager/web test` |
| Full suite command | `cd /home/solanoe/code/recipe-manager && yarn workspace @recipe-manager/web test` |

Test files live in `apps/web/src/components/__tests__/`. The `@dnd-kit` mock pattern (passthrough `DndContext`, stub `useSortable`/`useDraggable`) is established in `StepEditor.test.tsx` and `IngredientEditor.test.tsx`.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PLAN-01 | Planner page renders 7 accordion rows for the current week; week nav advances dates; toggle switches between 1/4 week | unit | `yarn workspace @recipe-manager/web test --reporter=verbose` | ❌ Wave 0 |
| PLAN-02 | Tapping "+ Anadir receta" opens picker sheet; selecting a recipe creates entry and closes sheet | unit | same | ❌ Wave 0 |
| PLAN-03 | DragEnd with new target day triggers PATCH with new date; optimistic update reflected in UI | unit | same | ❌ Wave 0 |
| PLAN-04 | Edit sheet opens on entry tap; save triggers PATCH; delete from accordion triggers DELETE immediately; delete from edit sheet shows ConfirmDialog | unit | same | ❌ Wave 0 |
| HH-02 | No specific test needed — household scoping is enforced server-side; existing tests cover auth boundary | — | — | — |

### Sampling Rate

- **Per task commit:** `yarn workspace @recipe-manager/web test`
- **Per wave merge:** `yarn workspace @recipe-manager/web test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `apps/web/src/components/__tests__/PlannerPage.test.tsx` — covers PLAN-01, PLAN-02, PLAN-03, PLAN-04

The established mock pattern for `@dnd-kit` in this codebase:
```typescript
vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useDraggable: vi.fn(() => ({ attributes: {}, listeners: {}, setNodeRef: vi.fn(), transform: null, isDragging: false })),
  useDroppable: vi.fn(() => ({ setNodeRef: vi.fn(), isOver: false })),
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
  PointerSensor: vi.fn(),
  closestCenter: vi.fn(),
}));

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useSortable: vi.fn(() => ({ attributes: {}, listeners: {}, setNodeRef: vi.fn(), transform: null, transition: null, isDragging: false })),
  verticalListSortingStrategy: vi.fn(),
  arrayMove: vi.fn((arr: unknown[], from: number, to: number) => {
    const result = [...arr]; const [item] = result.splice(from, 1); result.splice(to, 0, item); return result;
  }),
}));
```

---

## Sources

### Primary (HIGH confidence)

- Codebase scan — `apps/web/src/components/ui/BottomSheet.tsx`, `ConfirmDialog.tsx`, `Skeleton.tsx` — confirmed API signatures
- Codebase scan — `apps/web/src/lib/api-client.ts`, `query-keys.ts` — confirmed API client and existing `mealPlan.week` key
- Codebase scan — `apps/web/src/components/recipes/editor/IngredientRow.tsx`, `StepEditor.tsx` — confirmed existing dnd-kit patterns (`useSortable`, `DndContext`, `closestCenter`)
- Codebase scan — `apps/web/src/components/__tests__/StepEditor.test.tsx` — confirmed dnd-kit mock patterns for tests
- `packages/shared/src/api/meal-plan.ts` — confirmed `MealPlanEntryResponse`, `CreateMealPlanEntryRequest`, `UpdateMealPlanEntryRequest`
- `packages/shared/src/enums.ts` — confirmed `MealType` enum values
- `apps/web/vitest.config.ts` — confirmed test framework (Vitest + jsdom)
- `.planning/phases/10-frontend-meal-planner/10-UI-SPEC.md` — full component and interaction contract
- `plans/01_App/03_api_design.md` — confirmed meal plan endpoint signatures

### Secondary (MEDIUM confidence)

- @dnd-kit documentation patterns (cross-container drag using `useDraggable` + `useDroppable` is the documented approach for multi-container scenarios vs. `useSortable` for within-list)
- TanStack Query v5 optimistic update pattern using `onMutate`/`onError`/`onSettled` with `cancelQueries` + `setQueryData` + `invalidateQueries`

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages confirmed in `package.json`; no new installs needed
- Architecture: HIGH — UI-SPEC is fully detailed; existing component patterns are verified in codebase
- Pitfalls: HIGH — cross-container dnd-kit distinction is well-established; ConfirmDialog limitation found by direct code inspection
- Test patterns: HIGH — exact mock patterns found in existing test files

**Research date:** 2026-03-18
**Valid until:** 2026-04-18 (stable stack; no fast-moving dependencies)
