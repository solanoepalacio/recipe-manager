# Phase 9: Frontend Recipe Creation + Editing — Research

**Researched:** 2026-03-18
**Domain:** Next.js SPA — recipe creation and editing UI, drag-and-drop reordering, image upload, API-backed pickers, lock toggle, duplicate action
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| RCP-01 | User can create a new recipe from scratch | POST /api/recipes + name-prompt bottom sheet pattern (wireframe Screen 0) |
| RCP-02 | User can duplicate an existing recipe | POST /api/recipes/:id/duplicate + settings tab |
| RCP-03 | User can set recipe name with auto-generated URL slug | Name field in form + slug preview derived from name (slug generated server-side) |
| RCP-04 | User can set recipe description, servings, times, source URL | Basico tab form — UpdateRecipeRequest covers all fields |
| RCP-05 | User can lock a recipe to prevent editing | CRITICAL GAP: isLocked not in DB/API/shared types — needs backend addition before frontend can implement |
| ING-01 | User can add ingredients with quantity, unit, food, note | IngredientSection editor + food/unit pickers backed by GET /foods and GET /units |
| ING-02 | User can organize ingredients into titled sections | CreateSectionRequest exists; section title is nullable |
| ING-03 | User can reorder ingredients within a section | PUT /api/recipes/:id/sections/:sectionId/ingredients/reorder + ReorderRequest |
| INS-01 | User can add step-by-step instructions with optional title | CreateStepRequest: { title?, body } — both fields available |
| INS-02 | User can reorder instruction steps via drag-and-drop | PUT /api/recipes/:id/steps/reorder + ReorderRequest — drag library needed |
| IMG-01 | User can upload an image for a recipe | POST /api/recipes/:id/images — multipart/form-data; api-client needs multipart variant |
| IMG-02 | User can delete a recipe image | DELETE /api/recipes/:id/images/:imageId |
</phase_requirements>

---

## Summary

Phase 9 is the largest frontend phase in the roadmap. It implements a tabbed creation/editing flow across five plan areas: recipe form shell, ingredient editor, step editor, image management, and recipe settings (lock + duplicate). The existing codebase (Phases 7–8) establishes all the patterns this phase builds on: `useQuery`/`useMutation` via TanStack Query, Tailwind v4 design tokens, Sonner toasts, Lucide icons, and Vitest with Testing Library.

There is one critical backend gap: `isLocked` was explicitly removed from the Prisma schema in Phase 4 (STATE.md decision: "isLocked removed from Recipe model before service code written"). However, RCP-05 requires lock state to "persist after page refresh," meaning it cannot be localStorage-only. Plan 09-05 must add `isLocked` back to the Prisma schema, the shared types, and the PATCH endpoint before the frontend lock toggle can work.

The UI design is fully specified in wireframes (`mvp_plans/05_ui_views.md` Screen 0–6). The core interaction model is: a floating action button (FAB) on the recipe list opens a name-prompt bottom sheet, the user enters a name, `POST /api/recipes` creates the recipe, and the app navigates to the creation view. Further editing uses this same view (the detail page's "Editar receta" button currently renders as a disabled placeholder). Drag-and-drop for ingredient reorder and step reorder is required — no drag library is currently installed in the web package, so one must be added.

**Primary recommendation:** Use `@dnd-kit/core` + `@dnd-kit/sortable` for drag-and-drop (lightweight, no global DOM event patching, excellent React/Next.js compatibility). Install it as part of Plan 09-03 (step editor) or earlier if needed for ingredient reorder in Plan 09-02.

---

## Standard Stack

### Core (already installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | ^15.0.0 | Routing, SPA shell | Already in use; pure client-side routes |
| React | ^19.0.0 | UI rendering | Already in use |
| TanStack Query | ^5.90.21 | Server state, mutations | Already in use; `useMutation` for all writes |
| Tailwind v4 | ^4.2.1 | Styling with design tokens | Already in use; tokens in globals.css |
| Sonner | ^2.0.7 | Toast notifications | Already in use; established in Phase 7 |
| Lucide React | ^0.577.0 | Icons | Already in use |
| Vitest + Testing Library | ^4.1.0 / ^16.3.2 | Unit tests | Already configured |

### To Install

| Library | Version | Purpose | Why This One |
|---------|---------|---------|-------------|
| @dnd-kit/core | ^6.x | Drag-and-drop primitives | Modular, accessibility-first, works with React 19, no global DOM mutation |
| @dnd-kit/sortable | ^8.x | Sortable list abstraction | Companion package, handles vertical list reorder with minimal code |
| @dnd-kit/utilities | ^3.x | CSS transform helpers | Required peer for sortable |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @dnd-kit | react-beautiful-dnd | rbd is deprecated/unmaintained; dnd-kit is the current standard |
| @dnd-kit | @hello-pangea/dnd | hello-pangea is a fork of rbd; dnd-kit is more actively developed |
| @dnd-kit | HTML5 drag-and-drop API | Native API has poor mobile support and accessibility gaps |

**Installation (Plan 09-02 or 09-03):**
```bash
yarn workspace @recipe-manager/web add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

---

## Architecture Patterns

### Recommended Route Structure

```
apps/web/src/app/(app)/
├── recipes/
│   ├── page.tsx              # existing: recipe list (add FAB here)
│   ├── new/
│   │   └── page.tsx          # Plan 09-01: create route (redirects to edit after POST)
│   └── [slug]/
│       ├── page.tsx          # existing: recipe detail (wire up "Editar receta" button)
│       ├── edit/
│       │   └── page.tsx      # Plan 09-01: edit route (same form, different mode)
│       └── cook/
│           └── page.tsx      # existing
```

**Note:** The wireframe description says "After initial creation, further editing uses the recipe detail view in edit mode (State C). No separate 'edit recipe' flow exists." This means there is no separate `/edit` route — instead, the detail page toggles into edit mode in place. The route for create is `/recipes/new` (or handled via the name-prompt bottom sheet + redirect), but editing happens inline on the detail page.

### Confirmed Route Strategy (from wireframes)

1. FAB on `/recipes` list page opens name-prompt **bottom sheet** (not a new route)
2. Bottom sheet posts to `POST /api/recipes`, then navigates to `/recipes/:slug?id=:id`
3. The detail page gains an **edit mode toggle** (wireframe State C)
4. Edit mode shows drag handles, delete buttons, inline editable fields
5. No separate `/recipes/:slug/edit` route needed

### Component Structure for Phase 9

```
apps/web/src/components/
├── recipes/                         # existing
│   ├── editor/                      # new for Phase 9
│   │   ├── RecipeNamePrompt.tsx     # bottom sheet: name entry before creation
│   │   ├── MetadataForm.tsx         # Basico tab: name, description, servings, times, sourceUrl
│   │   ├── IngredientSectionEditor.tsx  # one section with ingredients list
│   │   ├── IngredientRow.tsx        # single ingredient with drag handle + delete
│   │   ├── IngredientPicker.tsx     # full-screen food picker modal
│   │   ├── StepEditor.tsx           # steps list with drag-and-drop
│   │   ├── StepRow.tsx              # single step with drag handle + delete
│   │   ├── ImageUpload.tsx          # upload zone + image grid
│   │   └── RecipeSettings.tsx       # lock toggle + duplicate action
│   ├── CookStep.tsx                 # existing
│   ├── DetailTopBar.tsx             # existing (gains edit mode overflow menu)
│   └── ...                         # other existing components
└── ui/
    ├── Skeleton.tsx                 # existing
    ├── BottomSheet.tsx              # new: reusable bottom sheet overlay
    └── ConfirmDialog.tsx            # new: delete/destructive confirmation
```

### Pattern 1: Create → Edit Flow (Bottom Sheet + Redirect)

**What:** FAB on recipe list triggers bottom sheet with single name field. On submit, POST creates recipe, then navigate to detail page with edit mode active.
**When to use:** Recipe creation entry point (RCP-01, RCP-03)

```typescript
// Source: wireframes 05_ui_views.md Screen 0 + established api-client pattern
async function handleCreate(name: string) {
  const recipe = await api.post<RecipeDetailResponse>('/recipes', { name });
  router.push(`/recipes/${recipe.slug}?id=${recipe.id}&edit=1`);
}
```

The `?edit=1` query param triggers edit mode on landing in the detail page.

### Pattern 2: useMutation for Write Operations

**What:** All write operations (PATCH recipe, POST/PATCH/DELETE sections/ingredients/steps/images) use TanStack Query `useMutation` with `onSuccess` cache invalidation.
**When to use:** Every form submit, drag-drop completion, delete action

```typescript
// Source: TanStack Query v5 pattern established in Phase 7-8 codebase
const updateRecipe = useMutation({
  mutationFn: (data: UpdateRecipeRequest) =>
    api.patch<RecipeDetailResponse>(`/recipes/${recipeId}`, data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.recipes.detail(slug) });
    toast.success('Receta guardada');
  },
  onError: () => toast.error('Error al guardar'),
});
```

### Pattern 3: Drag-and-Drop Reorder with @dnd-kit

**What:** Sortable list that calls reorder API on drag end.
**When to use:** Ingredient reorder (ING-03), step reorder (INS-02)

```typescript
// Source: @dnd-kit/sortable standard pattern
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

function SortableItem({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <button {...listeners} aria-label="Arrastrar">⠿</button>
      {children}
    </div>
  );
}

function handleDragEnd(event: DragEndEvent, ids: string[]) {
  const { active, over } = event;
  if (active.id !== over?.id) {
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over!.id));
    const newOrder = arrayMove(ids, oldIndex, newIndex);
    reorderMutation.mutate({ ids: newOrder });
  }
}
```

### Pattern 4: Image Upload (multipart/form-data)

**What:** The existing `api-client.ts` only handles JSON. Image upload requires a multipart request. Add a `postForm` method to api-client or use fetch directly.
**When to use:** IMG-01

```typescript
// Source: existing api-client.ts pattern — needs multipart variant
async function uploadImage(recipeId: string, file: File): Promise<ImageResponse> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`/api/recipes/${recipeId}/images`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
    // Note: do NOT set Content-Type header — browser sets it with boundary automatically
  });
  if (!res.ok) throw new Error('Upload failed');
  return res.json();
}
```

### Pattern 5: isLocked — Backend Addition Required

**What:** `isLocked` must be added to the Prisma schema, migration, shared types, and PATCH DTO before the frontend lock toggle works. This is a prerequisite for Plan 09-05.
**When to use:** Plan 09-05 is blocked until this is done.

The Prisma schema addition:
```prisma
// In prisma/schema.prisma — Recipe model
isLocked  Boolean  @default(false)
```

The shared type addition:
```typescript
// In packages/shared/src/api/recipes.ts
// Add to RecipeDetailResponse:
isLocked: boolean;

// Add to UpdateRecipeRequest:
isLocked?: boolean;
```

### Pattern 6: Inline Edit Mode Toggle

**What:** The detail page reads a `?edit=1` query param (or URL hash) on load to start in edit mode. An "Editar receta" button on the detail page sets edit mode state. In edit mode, mutation functions are wired up and drag handles appear.
**When to use:** Switching between view and edit mode without a route change

The existing `DetailTopBar` component gains an edit mode prop. The "Editar receta" placeholder span in the detail page becomes a functional button.

### Anti-Patterns to Avoid

- **Uncontrolled form inputs for recipe metadata:** Use controlled React state with `onChange` handlers — the form must show the current API value and track user changes before auto-save or explicit save.
- **Setting Content-Type on FormData requests:** Omit `Content-Type` for multipart uploads — the browser must set it with the boundary string.
- **Mutating TanStack Query cache directly instead of invalidating:** Always use `invalidateQueries` after mutations — the detail response is the source of truth.
- **Building a custom drag implementation:** Use @dnd-kit — accessibility, touch, and keyboard support are non-trivial to implement correctly.
- **Saving every keystroke to the API:** Debounce text field changes (300ms) or save only on field blur / explicit save button.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drag-and-drop reorder | Custom mouse event handlers | @dnd-kit/sortable | Touch support, keyboard a11y, scroll containers, auto-scroll all require significant work |
| Multipart image upload with progress | Custom XHR | Native fetch + FormData | Sufficient for MVP; no progress indicator required in spec |
| Slug generation/preview | Client-side slug generator | Server-generated (just show the slug from the API response) | Slug uniqueness is enforced server-side per household |
| Food search with debounce | Custom search hook | useDebounce (already in codebase) + client-side filter on `GET /foods` result | Foods list is small (50 items), full-text API search is overkill |
| Confirmation dialogs | Custom modal | Simple inline state-managed dialog using existing Tailwind patterns | No dialog library needed; the spec shows only one confirmation (delete image) |

**Key insight:** The foods list returns all items (~50) in one shot — client-side filtering with `useDebounce` is sufficient. Do not add a server-side search query param to the foods endpoint.

---

## Common Pitfalls

### Pitfall 1: isLocked Not in the Database

**What goes wrong:** Plan 09-05 tries to PATCH `isLocked` on a recipe but the API returns a 400 validation error and the Prisma write silently ignores it.
**Why it happens:** STATE.md Phase 4 decision: "isLocked removed from Recipe model before service code written." The field exists in the data model doc but was never added to the actual schema.
**How to avoid:** Plan 09-05 MUST include a mini backend task: add `isLocked Boolean @default(false)` to schema.prisma, run `prisma migrate dev --name add-recipe-is-locked`, add `isLocked` to `RecipeDetailResponse` and `UpdateRecipeRequest` in `packages/shared`, update `UpdateRecipeDto` with the field.
**Warning signs:** TypeScript error on `recipe.isLocked` — the field doesn't exist on the shared type.

### Pitfall 2: Recipe ID vs. Slug in Edit Mode

**What goes wrong:** The edit route tries to call `PATCH /api/recipes/:slug` but the API expects the UUID.
**Why it happens:** The detail page already established the pattern of passing `?id=<uuid>` as a query param alongside the slug in the URL (Phase 8 decision in STATE.md).
**How to avoid:** All API mutation calls in edit mode use the `recipeId` (UUID from `?id=` search param), not the slug. The slug is display-only.

### Pitfall 3: Reorder Race Condition

**What goes wrong:** User drags two items in quick succession; the second reorder overwrites a stale order before the first API call resolves.
**Why it happens:** Each drag-end fires a mutation without waiting for the previous one.
**How to avoid:** Use optimistic updates in TanStack Query for the local list state, OR disable the drag handles while a reorder mutation is in flight (`useMutation` exposes `isPending`).

### Pitfall 4: Bottom Sheet Scroll Lock

**What goes wrong:** When the name-prompt bottom sheet is open, the background recipe list scrolls.
**Why it happens:** No scroll lock on the body when the sheet is active.
**How to avoid:** Add `document.body.style.overflow = 'hidden'` on sheet open and restore it on close (or use a useEffect cleanup).

### Pitfall 5: Image URL Construction

**What goes wrong:** Uploaded images display as broken `<img>` because the URL stored is a relative path (e.g., `/uploads/uuid.jpg`) without the API base.
**Why it happens:** The backend stores the relative file path. The frontend renders it as-is.
**How to avoid:** The Next.js proxy rewrites `/api/...` to the backend, but static uploads are served directly. Verify that the existing recipe detail page correctly renders uploaded images — the URL in `ImageResponse.url` should already be a full path that the Next.js proxy handles.

### Pitfall 6: Foods Endpoint Returns No Search Support

**What goes wrong:** Plan 09-02 tries to add `?search=` query param to `GET /foods` for the ingredient picker but the backend ignores it and returns all foods regardless.
**Why it happens:** `FoodsController.findAll()` has no query param handling — it always returns all foods.
**How to avoid:** Filter foods client-side using the `useDebounce` hook already in the codebase. The seed has ~50 foods — client-side filter is fast enough.

---

## Code Examples

Verified patterns from existing codebase:

### Existing useMutation Pattern (from Phase 7-8)
```typescript
// Source: established codebase pattern — auth.tsx uses similar pattern
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const queryClient = useQueryClient();
const mutation = useMutation({
  mutationFn: (data: UpdateRecipeRequest) =>
    api.patch<RecipeDetailResponse>(`/recipes/${recipeId}`, data),
  onSuccess: (updated) => {
    queryClient.setQueryData(queryKeys.recipes.detail(slug), updated);
    toast.success('Guardado');
  },
  onError: () => toast.error('Error al guardar'),
});
```

### Existing Toast Usage (Sonner v2)
```typescript
// Source: apps/web/src/components/__tests__/Toast.test.tsx pattern
import { toast } from 'sonner';
toast.success('Receta creada');
toast.error('Error al crear la receta');
```

### Existing API Client Pattern
```typescript
// Source: apps/web/src/lib/api-client.ts
import { api } from '@/lib/api-client';
await api.post<RecipeDetailResponse>('/recipes', { name });
await api.patch<RecipeDetailResponse>(`/recipes/${id}`, data);
await api.delete<void>(`/recipes/${id}/images/${imageId}`);
```

### Query Key Pattern for Mutations
```typescript
// Source: apps/web/src/lib/query-keys.ts — extend with units key
export const queryKeys = {
  // existing keys...
  units: {
    all: ['units'] as const,
    list: () => ['units', 'list'] as const,
  },
};
```

### @dnd-kit/sortable Minimal Working Example
```typescript
// Source: @dnd-kit official docs — standard sortable pattern
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableStep({ step }: { step: StepResponse }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: step.id });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}>
      <button {...listeners} aria-label="Arrastrar paso">⠿</button>
      <span>{step.body}</span>
    </div>
  );
}

function StepList({ steps, onReorder }: { steps: StepResponse[]; onReorder: (ids: string[]) => void }) {
  const ids = steps.map((s) => s.id);
  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (over && active.id !== over.id) {
      const old = ids.indexOf(String(active.id));
      const next = ids.indexOf(String(over.id));
      onReorder(arrayMove(ids, old, next));
    }
  }
  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {steps.map((s) => <SortableStep key={s.id} step={s} />)}
      </SortableContext>
    </DndContext>
  );
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-beautiful-dnd | @dnd-kit | 2022 (rbd deprecated) | dnd-kit is the current community standard for React drag-and-drop |
| FormData with axios | fetch + FormData (no Content-Type) | Always | Native fetch is sufficient; no upload library needed |
| Custom slug generation client-side | Server-generated slug (unique per household) | Phase 4 design | Never re-implement slugs on the frontend |

**Deprecated/outdated:**
- `react-beautiful-dnd`: deprecated, last release 2022, known React 18+ issues
- `react-dnd`: older, more complex setup, dnd-kit is preferred for new projects

---

## Open Questions

1. **isLocked backend addition — which plan owns it?**
   - What we know: isLocked is in the original data model, was removed in Phase 4, and is required for RCP-05
   - What's unclear: Does Plan 09-05 include the backend migration + API change as its first task, or should this be a separate mini-task before Phase 9 begins?
   - Recommendation: Plan 09-05 owns the full vertical slice: schema migration + shared type update + PATCH DTO update + frontend lock toggle. This keeps the feature atomic.

2. **Edit mode routing — query param vs. URL segment?**
   - What we know: Wireframe says editing uses the detail page in State C (no separate route). Phase 8 detail page already reads `?id=` from search params.
   - What's unclear: Should `?edit=1` be a search param (stateful in URL, shareable, browser-back-aware) or local React state (simpler, but lost on refresh)?
   - Recommendation: Use local React state for edit mode toggle. The wireframe shows "Editar" / "Listo" as a toggle — it does not imply a bookmarkable edit URL.

3. **Auto-save vs. explicit save for metadata?**
   - What we know: Wireframe shows a "Guardar" pill button fixed at bottom-right (visible on all tabs). This implies explicit save, not auto-save.
   - What's unclear: Should individual section/ingredient/step changes also require the Guardar button, or should sub-resource mutations fire immediately?
   - Recommendation: Sub-resource mutations (add/remove/reorder ingredients, steps) fire immediately via API calls. The "Guardar" button only applies to metadata fields (name, description, times) on the Basico tab that need batching into one PATCH call.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 + @testing-library/react 16.3.2 |
| Config file | `apps/web/vitest.config.ts` |
| Quick run command | `yarn workspace @recipe-manager/web test` |
| Full suite command | `yarn workspace @recipe-manager/web test:coverage` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| RCP-01 | Name prompt renders and submits | unit | `yarn workspace @recipe-manager/web test` | ❌ Wave 0 |
| RCP-02 | Duplicate action calls POST /recipes/:id/duplicate | unit | `yarn workspace @recipe-manager/web test` | ❌ Wave 0 |
| RCP-03 | Slug preview shown after name entry | unit | `yarn workspace @recipe-manager/web test` | ❌ Wave 0 |
| RCP-04 | Metadata form fields render with correct labels | unit | `yarn workspace @recipe-manager/web test` | ❌ Wave 0 |
| RCP-05 | Lock toggle shows/hides edit controls | unit | `yarn workspace @recipe-manager/web test` | ❌ Wave 0 |
| ING-01 | Add ingredient form submits to API | unit | `yarn workspace @recipe-manager/web test` | ❌ Wave 0 |
| ING-02 | Section title is editable | unit | `yarn workspace @recipe-manager/web test` | ❌ Wave 0 |
| ING-03 | Drag end calls reorder mutation | unit | `yarn workspace @recipe-manager/web test` | ❌ Wave 0 |
| INS-01 | Add step form with title and body | unit | `yarn workspace @recipe-manager/web test` | ❌ Wave 0 |
| INS-02 | Step drag end calls reorder mutation | unit | `yarn workspace @recipe-manager/web test` | ❌ Wave 0 |
| IMG-01 | File input triggers upload fetch | unit | `yarn workspace @recipe-manager/web test` | ❌ Wave 0 |
| IMG-02 | Delete button calls DELETE endpoint | unit | `yarn workspace @recipe-manager/web test` | ❌ Wave 0 |

**Note on @dnd-kit testing:** dnd-kit drag interactions require `@dnd-kit/core` testing utilities or manual pointer event simulation. In unit tests, mock the `onDragEnd` handler and test the reorder logic directly rather than simulating pointer events.

### Sampling Rate

- **Per task commit:** `yarn workspace @recipe-manager/web test`
- **Per wave merge:** `yarn workspace @recipe-manager/web test:coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

All test files for Phase 9 are new. Each plan creates its own test file in `apps/web/src/components/__tests__/`:

- [ ] `RecipeNamePrompt.test.tsx` — covers RCP-01, RCP-03
- [ ] `MetadataForm.test.tsx` — covers RCP-04
- [ ] `IngredientEditor.test.tsx` — covers ING-01, ING-02, ING-03
- [ ] `StepEditor.test.tsx` — covers INS-01, INS-02
- [ ] `ImageManagement.test.tsx` — covers IMG-01, IMG-02
- [ ] `RecipeSettings.test.tsx` — covers RCP-02, RCP-05

No new framework install needed — Vitest and Testing Library are already configured.

---

## API Reference (Phase 9 Endpoints)

All endpoints already exist in the backend (Phase 4). No new backend work required except for the `isLocked` addition.

| Endpoint | Method | Req Body / Notes | Phase 9 Plan |
|----------|--------|------------------|-------------|
| `POST /recipes` | POST | `{ name }` — creates recipe with auto-slug | 09-01 |
| `PATCH /recipes/:id` | PATCH | `UpdateRecipeRequest` fields | 09-01, 09-05 |
| `POST /recipes/:id/duplicate` | POST | no body — creates independent copy | 09-05 |
| `POST /recipes/:id/sections` | POST | `{ title? }` | 09-02 |
| `PATCH /recipes/:id/sections/:sid` | PATCH | `{ title? }` | 09-02 |
| `DELETE /recipes/:id/sections/:sid` | DELETE | — | 09-02 |
| `PUT /recipes/:id/sections/reorder` | PUT | `{ ids: string[] }` | 09-02 |
| `POST /recipes/:id/sections/:sid/ingredients` | POST | `CreateIngredientRequest` | 09-02 |
| `PATCH /recipes/:id/sections/:sid/ingredients/:iid` | PATCH | `UpdateIngredientRequest` | 09-02 |
| `DELETE /recipes/:id/sections/:sid/ingredients/:iid` | DELETE | — | 09-02 |
| `PUT /recipes/:id/sections/:sid/ingredients/reorder` | PUT | `{ ids: string[] }` | 09-02 |
| `POST /recipes/:id/steps` | POST | `{ title?, body }` | 09-03 |
| `PATCH /recipes/:id/steps/:stepId` | PATCH | `{ title?, body? }` | 09-03 |
| `DELETE /recipes/:id/steps/:stepId` | DELETE | — | 09-03 |
| `PUT /recipes/:id/steps/reorder` | PUT | `{ ids: string[] }` | 09-03 |
| `POST /recipes/:id/images` | POST | multipart/form-data, field: `file` | 09-04 |
| `DELETE /recipes/:id/images/:imageId` | DELETE | — | 09-04 |
| `GET /foods` | GET | returns `{ id, name }[]` — no search param | 09-02 |
| `GET /units` | GET | returns `{ id, name, abbreviation }[]` | 09-02 |

---

## Sources

### Primary (HIGH confidence)

- Existing codebase — `apps/web/src/`, `packages/shared/src/api/recipes.ts`, `apps/api/src/recipes/` — direct code inspection
- `mvp_plans/05_ui_views.md` — authoritative wireframe spec for Recipe Creation screens
- `mvp_plans/03_api_design.md` — REST contract reference
- `.planning/STATE.md` — accumulated decisions, including the isLocked removal decision

### Secondary (MEDIUM confidence)

- @dnd-kit documentation (https://docs.dndkit.com) — drag-and-drop library selection and pattern
- TanStack Query v5 docs — useMutation pattern (consistent with installed version ^5.90.21)

### Tertiary (LOW confidence — not needed, stack is fully known)

None — all required libraries are either already installed or well-documented.

---

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — all libraries directly inspected in package.json; @dnd-kit confirmed as current community standard
- Architecture patterns: HIGH — route structure and component breakdown derived from existing codebase + wireframe spec
- API endpoints: HIGH — directly inspected from backend source
- isLocked gap: HIGH — directly confirmed via grep across schema, API, and shared types; STATE.md decision noted
- Pitfalls: HIGH (most) / MEDIUM (race condition) — all grounded in codebase inspection

**Research date:** 2026-03-18
**Valid until:** 2026-04-18 (stable stack; @dnd-kit API stable since v6)
