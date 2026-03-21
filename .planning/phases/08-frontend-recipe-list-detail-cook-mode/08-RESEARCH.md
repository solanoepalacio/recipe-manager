# Phase 8: Frontend Recipe List + Detail + Cook Mode — Research

**Researched:** 2026-03-18
**Domain:** Next.js 15 SPA — TanStack Query data-fetching, debounced search, paginated list, recipe detail layout, cook mode UI
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| RCP-07 | User can view full recipe detail (ingredients, instructions, images) | `RecipeDetailResponse` type fully defined in `@recipe-manager/shared`; API endpoint `GET /api/recipes/:id` returns all nested data; detail page exists as stub at `app/(app)/recipes/[slug]/page.tsx` per project structure plan |
| RCP-08 | User can enter cook mode (full-screen, large text, step-by-step navigation) | Cook mode page stub at `app/(app)/recipes/[slug]/cook/page.tsx`; wireframe `05_cook_mode.html` fully defines the check-off-based step navigation UX; implemented as pure React state (no new library needed) |
| SRCH-01 | User can search recipes by name with fuzzy matching | Backend `GET /api/recipes?search=<q>` already implements fuzzy matching (Phase 5); frontend needs a controlled input + `useQuery` with query param; debounce prevents over-fetching |
| SRCH-02 | User can filter recipes by food/ingredient | Backend accepts `foodId` param; frontend needs food dropdown backed by `GET /api/foods`; `foodId` added to `useQuery` key |
| SRCH-03 | User can sort recipes by name, date created, date updated, or random (asc/desc) | Backend accepts `sort` + `order` params matching `RecipeQueryParams` type; frontend needs sort dropdown with 4 options × 2 directions |
| SRCH-04 | User can paginate recipe list with configurable page size | Backend returns `PaginatedResponse<RecipeListItem>`; frontend needs pagination controls (prev/next + page size selector) |
</phase_requirements>

---

## Summary

Phase 8 builds three pages on top of the shell established in Phase 7: the recipe list page (`/recipes`), the recipe detail page (`/recipes/:slug`), and the cook mode page (`/recipes/:slug/cook`). All three pages are pure client components in an existing Next.js 15 SPA. The backend API (Phases 4 and 5) delivers everything needed — recipe list with search/filter/sort/pagination, recipe detail with all sub-resources, and the shared-type contracts are already finalized in `packages/shared`.

The stack is completely locked: Next.js 15, React 19, TanStack Query v5, Tailwind v4, Lucide React, Sonner, Vitest + Testing Library. No new libraries are needed. The design system is fully specified in the hi-fi wireframes (`plans/01_App/hifi/`). The only state management needed is TanStack Query for server state and `useState` for local UI state (filter values, current cook step, accordion open/close).

One pre-existing failing test must be addressed in Plan 08-01: `AppShell.test.tsx` line 26 expects `Buscar recetas...` placeholder text inside AppShell, but that search UI was moved to `recipes/page.tsx` during Phase 7 post-checkpoint fixes. The test must be updated to remove or adjust this assertion before implementing the real search input in the recipes page.

**Primary recommendation:** Build the three pages in three sequential plans (list, detail, cook mode), treating the hi-fi wireframes as the pixel-level spec. Use `useQuery` with the full `RecipeQueryParams` object as the query key for automatic cache invalidation. Use `useDebounce` inline (no library — a simple `useEffect`-based hook) for the search input.

---

## Standard Stack

### Core (all already installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | ^15.0.0 | Routing, SPA shell, build | Project decision — pure SPA mode |
| React | ^19.0.0 | UI rendering | Project decision |
| TanStack Query | ^5.90.21 | Server state, caching, pagination | Project decision — already in `Providers.tsx` with `staleTime: 60_000` |
| Tailwind CSS | ^4.2.1 | Styling with project design tokens | Project decision — tokens in `globals.css` |
| Lucide React | ^0.577.0 | Icons | Project decision — already used across components |
| Sonner | ^2.0.7 | Toast notifications | Project decision — already wired in `Providers.tsx` |

### Testing (all already installed)

| Library | Version | Purpose |
|---------|---------|---------|
| Vitest | ^4.1.0 | Test runner | Already configured in `vitest.config.ts` |
| @testing-library/react | ^16.3.2 | Component testing | Already used in Phase 7 tests |
| @testing-library/user-event | ^14.6.1 | User interaction simulation | Already installed |
| jsdom | ^29.0.0 | DOM environment | Already configured via `environment: 'jsdom'` |

### No New Installations Required

All dependencies for Phase 8 are already in `apps/web/package.json`. No `yarn add` commands needed.

---

## Architecture Patterns

### Recommended Project Structure (additions in Phase 8)

```
apps/web/src/
├── app/(app)/
│   └── recipes/
│       ├── page.tsx                    # REPLACE stub — full recipe list
│       └── [slug]/
│           ├── page.tsx                # CREATE — recipe detail
│           └── cook/
│               └── page.tsx            # CREATE — cook mode
│
├── components/
│   └── recipes/                        # CREATE directory
│       ├── RecipeCard.tsx              # List item card
│       ├── RecipeListFilters.tsx       # Search + sort + food filter row
│       ├── PaginationControls.tsx      # Prev/next + page size
│       ├── IngredientSection.tsx       # Section accordion + ingredient rows
│       ├── InstructionList.tsx         # Numbered step list (detail view)
│       └── CookStep.tsx               # Single step in cook mode (pending/done state)
│
├── hooks/
│   └── useDebounce.ts                 # CREATE — debounce hook (no library)
│
└── lib/
    └── query-keys.ts                  # ALREADY EXISTS — recipes.list / recipes.detail keys ready
```

### Pattern 1: TanStack Query for Paginated Filtered List

**What:** `useQuery` with a `RecipeQueryParams` object as part of the query key. When any filter/sort/page param changes, TanStack Query automatically refetches because the key changes.

**When to use:** Any time server state depends on user-controlled parameters.

**Example:**
```typescript
// Source: TanStack Query v5 docs — useQuery with dynamic keys
import { useQuery } from '@tanstack/react-query';
import type { PaginatedResponse, RecipeListItem, RecipeQueryParams } from '@recipe-manager/shared';
import { api } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';

function buildQueryString(params: RecipeQueryParams): string {
  const qs = new URLSearchParams();
  if (params.search)   qs.set('search', params.search);
  if (params.foodId)   qs.set('foodId', params.foodId);
  if (params.sort)     qs.set('sort', params.sort);
  if (params.order)    qs.set('order', params.order);
  if (params.page)     qs.set('page', String(params.page));
  if (params.pageSize) qs.set('pageSize', String(params.pageSize));
  return qs.toString() ? `?${qs.toString()}` : '';
}

const { data, isLoading } = useQuery({
  queryKey: queryKeys.recipes.list(params),
  queryFn: () => api.get<PaginatedResponse<RecipeListItem>>(`/recipes${buildQueryString(params)}`),
});
```

**Note:** `queryKeys.recipes.list` already exists in `lib/query-keys.ts` and accepts `Record<string, unknown>`.

### Pattern 2: Debounced Search Input

**What:** A local `useDebounce` hook delays propagating the search input value to the query params, preventing a network request on every keystroke.

**When to use:** Text search inputs that drive server-side queries.

**Example:**
```typescript
// Source: standard React pattern — no library needed
// apps/web/src/hooks/useDebounce.ts
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
```

**Usage in recipe list page:**
```typescript
const [searchInput, setSearchInput] = useState('');
const debouncedSearch = useDebounce(searchInput, 300);
// debouncedSearch goes into queryParams — searchInput drives the controlled input
```

### Pattern 3: Recipe Detail with Slug Lookup

**What:** The API uses `id` for recipe lookup (`GET /api/recipes/:id`), but the URL uses `:slug`. The list response includes both `id` and `slug`. The detail page receives `slug` from the URL — it must look up by slug, not ID.

**Resolution:** The backend `GET /api/recipes/:id` endpoint accepts either UUID or slug (verify against actual API behavior). If not, the detail page must first fetch the list to resolve the slug to an ID, OR the API must support slug-based lookup.

**Check required:** Inspect `apps/api/src/recipes/recipes.service.ts` to confirm whether `findOne` accepts slug or only UUID.

**Safe pattern (slug passed to query, API client handles):**
```typescript
// app/(app)/recipes/[slug]/page.tsx
'use client';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { api } from '@/lib/api-client';
import type { RecipeDetailResponse } from '@recipe-manager/shared';

export default function RecipeDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.recipes.detail(slug),
    queryFn: () => api.get<RecipeDetailResponse>(`/recipes/${slug}`),
    enabled: Boolean(slug),
  });
  // ...
}
```

### Pattern 4: Cook Mode State Machine

**What:** Cook mode is a step-by-step navigation UI. State is entirely local — no server calls needed. The current step index is tracked with `useState`. Steps behind the current step are "done" (collapsed, greyed), the current step is "pending + current" (highlighted left border), and future steps are "pending" (expanded text).

**When to use:** `/recipes/:slug/cook` page.

**Example:**
```typescript
// app/(app)/recipes/[slug]/cook/page.tsx
const [currentStep, setCurrentStep] = useState(0);

// Mark step as done = advance currentStep
const markDone = () => setCurrentStep(i => Math.min(i + 1, steps.length));

// Step rendering logic
steps.map((step, i) => {
  if (i < currentStep) return <DoneStep key={step.id} step={step} />;
  if (i === currentStep) return <PendingStep key={step.id} step={step} current onDone={markDone} />;
  return <PendingStep key={step.id} step={step} />;
});
```

**Note from wireframe:** The "done" state shows collapsed rows with checkmark + truncated text in `#C8C4BD`. The "current" step has a left border `2.5px solid #E0DCD5`. There are no prev/next buttons in the wireframe — the UX is tap-to-mark-done with all steps visible in a scrollable list. The success criteria says "step-by-step navigation controls" — interpret as the check-off-to-advance pattern from `05_cook_mode.html`.

### Pattern 5: Full-Screen Cook Mode Layout

**What:** Cook mode must NOT render the AppShell (TopBar + Drawer + FAB). It uses its own minimal top bar (exit button left, recipe title centered).

**Implementation:** Cook mode page is INSIDE the `(app)` route group, which wraps in AppShell. To avoid AppShell chrome, either:
- Option A: Move cook mode to its own route group `(cook)` with a minimal layout
- Option B: Pass a prop or context to AppShell to suppress chrome when in cook mode
- Option C: Cook mode page renders its own full-screen overlay over the AppShell

**Recommendation:** Option A — create a `(cook)` route group with a minimal layout that only provides the QueryClient (already provided by root layout via `Providers`). This keeps the AppShell clean and matches the wireframe which shows zero navigation chrome.

**Revised structure:**
```
app/
├── (app)/
│   └── recipes/
│       ├── page.tsx
│       └── [slug]/
│           └── page.tsx          # detail (inside AppShell)
└── (cook)/
    └── recipes/
        └── [slug]/
            └── cook/
                └── page.tsx      # cook mode (NO AppShell)
```

**Alternative (simpler):** Keep cook inside `(app)/recipes/[slug]/cook/` but use `position: fixed; inset: 0` overlay that covers the AppShell entirely. This is cleaner — no route group restructuring needed.

### Anti-Patterns to Avoid

- **Storing filter state in URL search params via `useSearchParams`:** The project is a pure SPA; local `useState` is sufficient and simpler. Don't add `router.push` on every filter change.
- **Fetching recipe detail before navigating:** Pre-fetching is not needed. TanStack Query caches the result after first load. Navigate to `/recipes/:slug` directly; let the query fetch on mount.
- **Using `imageCount` to build image URLs on the list page:** `RecipeListItem` has `imageCount` (not `images` array). Image thumbnails on recipe cards require either: (a) no image on cards (just a placeholder), or (b) a separate image URL field. The wireframe shows an image thumbnail — the plan must decide: use a placeholder or add a `thumbnailUrl` to `RecipeListItem`. See Open Questions.
- **Wrapping every page in its own `QueryClientProvider`:** The root `layout.tsx` already provides the `QueryClientProvider` via `Providers`. Never nest another one.
- **Using `useEffect` + `fetch` directly:** Always use `useQuery` for server data in this project.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Debounce | npm package like `lodash.debounce` | Simple `useEffect` hook (5 lines) | No library overhead; already a project pattern |
| Image carousel | Custom scroll/snap carousel | Single image display or native CSS scroll-snap | Only one image shown at a time on mobile per wireframe; Phase 9 handles image upload |
| Infinite scroll pagination | Custom IntersectionObserver | Simple prev/next buttons | The wireframe shows paginated controls, not infinite scroll |
| Toast | Custom toast component | `sonner` (already installed) | Already wired in `Providers.tsx` |

**Key insight:** This phase is 100% UI composition over already-built APIs. The only complexity is query param management and the cook mode state machine — both are trivial React `useState` patterns.

---

## Common Pitfalls

### Pitfall 1: Slug vs. ID in Recipe API Calls

**What goes wrong:** The recipe list returns `slug` and `id`. The URL uses slug. If the API's `GET /api/recipes/:id` only accepts UUID, calling it with a slug returns 404.

**Why it happens:** The API design uses `:id` in the path but the frontend navigates by slug.

**How to avoid:** Verify `RecipesService.findOne()` in `apps/api/src/recipes/recipes.service.ts` before Plan 08-02. If it only accepts UUID, the fix is trivial — the list page keeps `id` in a lookup map, or pass `id` in the card's link query param. The navigation approach (slug in URL) is correct for UX; the query must resolve it.

**Warning signs:** 404 responses on `/api/recipes/<slug>` when slug is non-UUID string.

### Pitfall 2: Stale AppShell Test (`Buscar recetas...`)

**What goes wrong:** `AppShell.test.tsx` line 26 asserts `screen.getByText('Buscar recetas...')` but AppShell no longer contains search UI (it was moved to the recipes page in Phase 7 post-checkpoint). This test is currently **failing**.

**Why it happens:** Phase 7 post-checkpoint moved search/filter from AppShell into the `/recipes` page only, but the test was not updated.

**How to avoid:** In Plan 08-01, delete or update the `renders search placeholder text` assertion in `AppShell.test.tsx`. The search input is now in `RecipeListPage`, so add a test there instead.

**Warning signs:** Running `yarn workspace @recipe-manager/web test` shows 1 failing test (`AppShell.test.tsx:26`) before any Phase 8 code is written.

### Pitfall 3: Cook Mode Route Group

**What goes wrong:** If cook mode page is inside `(app)/recipes/[slug]/cook/page.tsx`, it inherits the `(app)/layout.tsx` which renders AppShell (TopBar + Drawer + FAB). Cook mode needs a clean full-screen layout.

**Why it happens:** Next.js route groups apply the nearest parent layout recursively.

**How to avoid:** Either move cook mode to its own route group `(cook)` with a minimal layout, OR use a fixed full-screen overlay (`position: fixed; inset: 0; z-index: 100; background: #FAFAF7`) in the cook mode page itself. The overlay approach is simpler and does not require restructuring routes.

**Warning signs:** Cook mode page renders with TopBar and Drawer visible in the background.

### Pitfall 4: `RecipeListItem.imageCount` vs. Thumbnail URL

**What goes wrong:** The recipe card wireframe shows a `72×68px` thumbnail image. But `RecipeListItem` only has `imageCount: number` — no image URL. Attempting to show a thumbnail requires either a placeholder or a different data field.

**Why it happens:** The Phase 5 decision log notes: "RecipeListItem uses imageCount (_count.images) not full images array — avoids N+1 on list view." This was intentional but creates a gap for the card UI.

**How to avoid:** For Phase 8, render a placeholder (`bg-sand` colored box) when `imageCount === 0` and a placeholder when `imageCount > 0` (since no URL is available). Alternatively, add a `thumbnailUrl` field to `RecipeListItem` in `packages/shared` and update the backend query to include the first image URL. The simpler path for Phase 8 is placeholder-only; thumbnail support can be added in Phase 9 alongside image upload.

**Warning signs:** Trying to build `<img src={recipe.imageUrl} />` when the type has no `imageUrl`.

### Pitfall 5: Food Filter Dropdown Requires Separate Query

**What goes wrong:** The food filter for SRCH-02 requires populating a dropdown with all foods. This is a separate API call to `GET /api/foods`.

**Why it happens:** Foods are a separate domain resource (not part of the recipe list response).

**How to avoid:** Use a second `useQuery` in the recipe list page for the foods list. Use `queryKeys` pattern — add `foods.list` to `query-keys.ts`. The `GET /api/foods` endpoint is already live from Phase 5.

### Pitfall 6: Next.js `useParams` Returns Decoded String

**What goes wrong:** `useParams<{ slug: string }>()` returns the URL-decoded slug. If a recipe slug contains special characters, the API call may differ from what's in the URL.

**Why it happens:** Slug generation is already handled by the backend (Phase 4) and slugs are URL-safe lowercase strings with hyphens. This is low-risk but worth noting.

**How to avoid:** No action needed — slugs generated by the backend are URL-safe. Pass `slug` directly to the API call.

---

## Code Examples

Verified patterns from the existing codebase:

### Existing Query Client Setup (Providers.tsx)
```typescript
// Source: apps/web/src/components/Providers.tsx
new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000 } },
});
```

### API Client Usage Pattern
```typescript
// Source: apps/web/src/lib/api-client.ts
const data = await api.get<PaginatedResponse<RecipeListItem>>(`/recipes?search=foo&page=1`);
```

### Existing Query Keys (query-keys.ts)
```typescript
// Source: apps/web/src/lib/query-keys.ts
queryKeys.recipes.list(params)    // accepts Record<string, unknown>
queryKeys.recipes.detail(slug)    // accepts string
```

### Mock Setup Pattern for Tests (from AppShell.test.tsx)
```typescript
// Source: apps/web/src/components/__tests__/AppShell.test.tsx
vi.mock('next/navigation', () => ({
  usePathname: () => '/recipes',
  useRouter: () => ({ push: vi.fn() }),
}));
```

### TanStack Query Mock for Component Tests
```typescript
// Pattern established in AuthProvider.test.tsx
vi.mock('@/lib/api-client', () => ({
  api: { get: vi.fn(), post: vi.fn() },
}));
```

### Design Token Reference (Tailwind classes)
```
bg-background   → #FAFAF7   (page background)
bg-subtle       → #F4F2ED   (section headers, search bar, done steps)
bg-sand         → #E8E1D5   (top bar variant on detail page)
text-secondary  → #8A8680   (labels, meta text)
text-placeholder → #C8C4BD  (input placeholders, done step text)
border-border   → #E0DCD5   (dividers)
text-accent / bg-accent → #5EBD6A  (links, FAB, active state)
text-destructive → #D94F4F  (destructive actions)
text-foreground → #2C2C2A   (primary text)
```

### Cook Mode Step States (from wireframe 05_cook_mode.html)
```
Done step:    height 52px, bg-subtle, text-placeholder, truncated, check circle (bg #C8C4BD)
Current step: border-l-[2.5px] border-border, padding-left adjusted, step-number circle bg-foreground
Pending step: full text visible, step-number circle bg-foreground, border-b border-subtle
```

### Recipe Detail Top Bar Variant (from wireframe 03_recipe_detail.html)
```
bg-sand top bar, back-arrow left, recipe name centered, overflow-menu right
Sticky behavior: recipe header locks below top bar on scroll (CSS position:sticky)
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| `useSearchParams` + URL params for filters | `useState` for filter values | Simpler, no router push on every keystroke |
| TanStack Query v4 `isLoading / data` | TanStack Query v5 — same API, `isPending` is the new `isLoading` for no-data state | Both work; prefer `isLoading` for queries that may have cached data |
| Next.js Pages Router | Next.js App Router (already in use) | Route groups, layouts, `useParams` from `next/navigation` |

---

## Open Questions

1. **Does `GET /api/recipes/:id` accept slug or only UUID?**
   - What we know: The API path is `GET /api/recipes/:id`; `RecipeListItem` provides both `id` and `slug`
   - What's unclear: Whether `RecipesService.findOne()` does a slug lookup or only UUID lookup
   - Recommendation: Plan 08-02 author must read `apps/api/src/recipes/recipes.service.ts` before implementing the detail page query. If slug-only lookup is needed, either pass `id` in the link (as query param) from the list page, or add slug support to the backend (small change to the `WHERE` clause).

2. **Recipe card image thumbnail: placeholder or real URL?**
   - What we know: `RecipeListItem.imageCount` is a count; no URL is available; wireframe shows a 72×68px image thumbnail
   - What's unclear: Whether to show a placeholder for all cards in Phase 8 or add `thumbnailUrl` to the shared type
   - Recommendation: Phase 8 shows a sand-colored placeholder (`bg-sand rounded-[10px]`) for all cards. If `imageCount > 0`, show a subtle indicator (e.g., small image icon). Adding `thumbnailUrl` is a 3-line backend change but creates a cross-phase dependency — defer to Phase 9 alongside image upload work.

3. **Sort: "random" should re-randomize on each click or stay stable per session?**
   - What we know: Backend generates random sort by shuffling IDs in JS per request; no seed parameter
   - What's unclear: UX expectation — does clicking "Random" again re-shuffle?
   - Recommendation: Yes, re-shuffle on each click. Implement by invalidating the query (`queryClient.invalidateQueries`) or by changing a `randomSeed` param in the query key (e.g., `Date.now()`). The `invalidateQueries` approach is simpler.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest ^4.1.0 |
| Config file | `apps/web/vitest.config.ts` |
| Quick run command | `yarn workspace @recipe-manager/web test` |
| Full suite command | `yarn workspace @recipe-manager/web test --coverage` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SRCH-01 | Search input updates query params; debounced value drives useQuery | unit | `yarn workspace @recipe-manager/web test -- --testNamePattern="RecipeListPage"` | ❌ Wave 0 |
| SRCH-02 | Food filter dropdown populates from /api/foods; selecting filters list | unit | same | ❌ Wave 0 |
| SRCH-03 | Sort dropdown emits correct sort+order params | unit | same | ❌ Wave 0 |
| SRCH-04 | Pagination controls render total pages; prev/next navigate; page size changes perPage | unit | same | ❌ Wave 0 |
| RCP-07 | Recipe detail renders name, sections, ingredients, steps, images placeholder | unit | `yarn workspace @recipe-manager/web test -- --testNamePattern="RecipeDetailPage"` | ❌ Wave 0 |
| RCP-08 | Cook mode: tapping current step advances to next; done steps collapse; exit navigates back | unit | `yarn workspace @recipe-manager/web test -- --testNamePattern="CookModePage"` | ❌ Wave 0 |

**Pre-existing failing test to fix in Wave 0:**
- `src/components/__tests__/AppShell.test.tsx:26` — `renders search placeholder text` — remove this assertion (search was moved out of AppShell per Phase 7 post-checkpoint)

### Sampling Rate
- **Per task commit:** `yarn workspace @recipe-manager/web test`
- **Per wave merge:** `yarn workspace @recipe-manager/web test --coverage`
- **Phase gate:** Full suite green (0 failing) before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `apps/web/src/components/__tests__/RecipeListPage.test.tsx` — covers SRCH-01, SRCH-02, SRCH-03, SRCH-04
- [ ] `apps/web/src/components/__tests__/RecipeDetailPage.test.tsx` — covers RCP-07
- [ ] `apps/web/src/components/__tests__/CookModePage.test.tsx` — covers RCP-08
- [ ] Fix `apps/web/src/components/__tests__/AppShell.test.tsx:26` — remove stale `Buscar recetas...` assertion

---

## Sources

### Primary (HIGH confidence)

- Direct codebase inspection — `apps/web/src/`, `packages/shared/src/api/recipes.ts`, `apps/web/package.json`
- `plans/01_App/hifi/02_app_shell.html` — recipe list card layout, search bar, filter actions
- `plans/01_App/hifi/03_recipe_detail.html` — detail page top bar (sand variant), section accordion, info grid, sticky header
- `plans/01_App/hifi/05_cook_mode.html` — cook mode step states (done/current/pending), top bar exit, step check-off UX
- `plans/01_App/06_hifi_wireframes.md` — design system tokens, component patterns
- `plans/01_App/07_project_structure.md` — frontend conventions, URL structure, route groups, component organization
- `plans/01_App/03_api_design.md` — API endpoints, `RecipeQueryParams`, `PaginatedResponse` shape
- `.planning/STATE.md` — Phase 7 post-checkpoint decision: search/filter moved from AppShell to /recipes page only
- `apps/web/src/components/__tests__/AppShell.test.tsx` — confirmed failing test at line 26

### Secondary (MEDIUM confidence)

- TanStack Query v5 documentation patterns (verified against installed version `^5.90.21`)
- Next.js App Router `useParams` from `next/navigation` (confirmed pattern in existing `Drawer.tsx` using `usePathname`)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — fully verified from `package.json` and existing implementation
- Architecture: HIGH — patterns derived directly from existing Phase 7 code + hi-fi wireframes
- Pitfalls: HIGH — confirmed from codebase inspection (failing test confirmed by running vitest) and API design decisions log
- Open questions: MEDIUM — slug vs. ID lookup requires code verification, image thumbnail is a known gap

**Research date:** 2026-03-18
**Valid until:** 2026-04-18 (stable stack, no fast-moving dependencies)
