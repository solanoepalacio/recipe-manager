# Phase 12: Frontend Admin Panel - Research

**Researched:** 2026-03-19
**Domain:** Next.js SPA — admin panel, route groups, auth context, data tables, TanStack Query CRUD
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- Each admin section is a **separate Next.js route**: `/admin/panel/users`, `/admin/panel/households`, `/admin/panel/foods`, `/admin/panel/units`, `/admin/panel/tokens`
- `/admin/panel` (root) redirects immediately to `/admin/panel/users`
- Unauthenticated admin navigating to any `/admin/panel/*` route redirects to `/admin/login`
- New route group `(admin)` under `apps/web/src/app/` — separate from `(app)` and `(auth)`
- Separate `apps/web/src/lib/admin-api-client.ts` — thin wrapper around `api-client.ts` that catches 401 and redirects to `/admin/login`; all admin data hooks import from `admin-api-client`, not `api-client` directly
- `AdminAuthProvider` calls `GET /admin/auth/me` on mount to verify the session
- `GET /admin/auth/me` does not exist yet — add to the backend in plan 12-01
- Returns `{ id, email, name }` when authenticated, 401 otherwise; mirrors `AuthProvider` → `GET /auth/me`
- Add `GET /admin/auth/me` route to `AdminAuthController` protected by `AdminAuthGuard`; add `AdminMeResponse` type to `packages/shared/src/api/admin.ts`; this is the **only backend change** in Phase 12
- `/setup` page calls `GET /api/setup` on mount; if `required: false` redirect to `/admin/login`; if `required: true` show the form
- UI spec: `.planning/phases/12-frontend-admin-panel/12-UI-SPEC.md` is the authoritative visual/interaction guide

### Claude's Discretion

- Exact `admin-api-client.ts` wrapper implementation (how 401 interception is done)
- Loading skeleton design for admin data tables
- `AdminAuthProvider` isLoading/isAuthenticated state shape
- Whether `AdminMeResponse` is a new type or reuses an existing admin type

### Deferred Ideas (OUT OF SCOPE)

- None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ADM-01 | Admin can view, create, edit, and delete user accounts | Admin API client + TanStack Query mutations + AdminTable pattern; `AdminUserResponse` shape already in shared |
| ADM-02 | Admin can view, create, edit, and delete households | Same pattern as ADM-01; `AdminHouseholdResponse` in shared; cascade delete is a UX concern (copy contract warns "Se eliminarán todas sus recetas y planes") |
| ADM-03 | Admin can manage the foods database (view, create, edit, delete) | Same pattern; `AdminFoodResponse` in shared; foods have no pagination in spec but `PaginationControls` is reused |
| ADM-04 | Admin can manage the units database (view, create, edit, delete) | Same pattern; `AdminUnitResponse` in shared |
| ADM-05 | Admin can create long-lived API tokens tied to a user account | `POST /admin/tokens` returns `AdminTokenCreatedResponse` with raw `token` field; `OneTimeDisplay` component renders immediately after success; raw token never shown again after dismiss |
| ADM-06 | Admin can view and delete existing API tokens | `GET /admin/tokens` returns `AdminTokenResponse[]` (no token field); `DELETE /admin/tokens/:id` revokes; `ConfirmDialog` inline for delete confirmation |
</phase_requirements>

---

## Summary

Phase 12 is a pure frontend phase with one small backend addition. Eleven phases of prior work have already established all the patterns this phase reuses: `AuthProvider` → `AdminAuthProvider`, `ProtectedLayout` → admin layout guard, `api-client.ts` → `admin-api-client.ts`, `(app)` route group → `(admin)` route group, and TanStack Query mutation loops from every prior data section.

The admin panel surfaces five resource sections (Users, Households, Foods, Units, Tokens) plus three distinct screens (setup wizard, admin login, panel shell). Each resource section follows an identical CRUD loop: paginated list query, create/edit form, inline delete confirmation. The only novel interaction is the `OneTimeDisplay` component for the raw API token and password reset URL — a single-use copyable value shown once then dismissed.

The sole backend addition is `GET /admin/auth/me`, which mirrors `/auth/me` exactly and enables `AdminAuthProvider` session verification on mount. All other backend endpoints are fully implemented from Phase 6.

**Primary recommendation:** Build in five plans — (1) backend me endpoint + admin auth shell + setup wizard, (2) Users section, (3) Households section, (4) Foods + Units sections, (5) Tokens section. Each plan ships one independently testable vertical slice.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | ^15.0.0 | Routing, layouts, build | Already in use; `(admin)` route group follows established pattern |
| React | ^19.0.0 | UI rendering | Already in use |
| TanStack Query | ^5.90.21 | Server state, caching, mutations | Already in use for all user-facing data sections |
| Tailwind CSS v4 | ^4.2.1 | Styling with existing design tokens | All tokens (`accent`, `destructive`, `sand`, etc.) already configured in `globals.css` |
| lucide-react | ^0.577.0 | Icons | Already in use in TopBar, Drawer |
| sonner | ^2.0.7 | Toast notifications | Already wired in root layout; used in prior phases for success/error feedback |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@recipe-manager/shared` | workspace:* | Typed request/response shapes | All API calls — `AdminUserResponse`, `AdminHouseholdResponse`, etc. |
| vitest + @testing-library/react | ^4.1.0 / ^16.3.2 | Unit tests | All new components per nyquist_validation requirement |

### No New Installations Required

All dependencies are already in `apps/web/package.json`. Phase 12 does not add any new npm packages.

---

## Architecture Patterns

### Recommended Project Structure

```
apps/web/src/
├── app/
│   ├── (admin)/
│   │   ├── layout.tsx                    # AdminAuthProvider + admin shell (new)
│   │   ├── admin/
│   │   │   ├── login/page.tsx            # Admin login screen (new)
│   │   │   └── panel/
│   │   │       ├── page.tsx              # Redirects to /admin/panel/users (new)
│   │   │       ├── users/page.tsx        # Users CRUD section (new)
│   │   │       ├── households/page.tsx   # Households CRUD section (new)
│   │   │       ├── foods/page.tsx        # Foods CRUD section (new)
│   │   │       ├── units/page.tsx        # Units CRUD section (new)
│   │   │       └── tokens/page.tsx       # Tokens section (new)
│   │   └── setup/page.tsx                # First-time setup wizard (new)
│
├── components/
│   └── admin/                            # New admin-specific components
│       ├── AdminAuthProvider.tsx
│       ├── AdminSidebar.tsx
│       ├── AdminTable.tsx
│       ├── AdminForm.tsx
│       └── OneTimeDisplay.tsx
│
├── lib/
│   ├── api-client.ts                     # Existing — no changes
│   └── admin-api-client.ts               # New — wraps api-client, adds 401 redirect
│
└── query-keys.ts                         # Extend with admin.* keys
```

Backend addition:
```
apps/api/src/admin/auth/
└── admin-auth.controller.ts              # Add GET /admin/auth/me endpoint

packages/shared/src/api/
└── admin.ts                              # Add AdminMeResponse interface
```

### Pattern 1: AdminAuthProvider (mirrors AuthProvider)

**What:** React context that calls `GET /admin/auth/me` on mount, exposes `{ admin, isLoading }`.
**When to use:** Wraps the `(admin)` layout; all admin components call `useAdminAuth()`.

```typescript
// Source: apps/web/src/lib/auth.tsx (mirror pattern)
'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import type { AdminMeResponse } from '@recipe-manager/shared';
import { adminApi } from './admin-api-client';

export interface AdminAuthState {
  admin: AdminMeResponse | null;
  isLoading: boolean;
}

const AdminAuthContext = createContext<AdminAuthState>({ admin: null, isLoading: true });

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminMeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    adminApi
      .get<AdminMeResponse>('/admin/auth/me')
      .then((a) => setAdmin(a))
      .catch(() => setAdmin(null))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <AdminAuthContext.Provider value={{ admin, isLoading }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth(): AdminAuthState {
  return useContext(AdminAuthContext);
}
```

### Pattern 2: Admin Layout Guard (mirrors ProtectedLayout)

**What:** Component inside `(admin)/layout.tsx` that reads `{ admin, isLoading }` from `AdminAuthProvider`, redirects to `/admin/login` when not authenticated.
**When to use:** Wraps all `/admin/panel/*` routes.

```typescript
// Source: apps/web/src/app/(app)/layout.tsx (mirror pattern)
function AdminGuard({ children }: { children: React.ReactNode }) {
  const { admin, isLoading } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !admin) {
      router.replace('/admin/login');
    }
  }, [admin, isLoading, router]);

  if (isLoading) return <AdminSkeleton />;
  if (!admin) return null; // redirect in flight
  return <>{children}</>;
}
```

### Pattern 3: admin-api-client.ts (wraps api-client)

**What:** Thin wrapper that adds 401 interception — redirects to `/admin/login` on 401 instead of throwing to the caller.
**When to use:** All admin data hooks import `adminApi` from this module, not `api` from `api-client.ts`.

```typescript
// Source: apps/web/src/lib/api-client.ts (wrap pattern)
import { api } from './api-client';

async function adminRequest<T>(
  method: keyof typeof api,
  ...args: Parameters<typeof api[typeof method]>
): Promise<T> {
  try {
    // @ts-expect-error -- forwarding variadic args
    return await (api[method] as (...a: unknown[]) => Promise<T>)(...args);
  } catch (err: unknown) {
    if ((err as { status?: number }).status === 401) {
      window.location.replace('/admin/login');
      return new Promise(() => {}); // never resolves — redirect pending
    }
    throw err;
  }
}

export const adminApi = {
  get:    <T>(path: string)                => adminRequest<T>('get', path),
  post:   <T>(path: string, body: unknown) => adminRequest<T>('post', path, body),
  patch:  <T>(path: string, body: unknown) => adminRequest<T>('patch', path, body),
  delete: <T>(path: string)                => adminRequest<T>('delete', path),
};
```

Note: The exact 401-interception strategy is marked Claude's Discretion. This pattern uses a try/catch wrapper. An alternative is a direct re-implementation that calls `fetch` internally. Either works; the wrapper is simpler to maintain since `api-client.ts` handles base URL and headers.

### Pattern 4: TanStack Query CRUD Loop (admin sections)

**What:** Standard `useQuery` for list + `useMutation` for create/edit/delete, with `queryClient.invalidateQueries` on success.
**When to use:** Every admin resource section (users, households, foods, units, tokens).

```typescript
// Source: established pattern from Phase 08-11 hooks
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/admin-api-client';
import type { AdminUserResponse } from '@recipe-manager/shared';
import type { PaginatedResponse } from '@recipe-manager/shared';

export function useAdminUsers(page: number, perPage: number) {
  return useQuery({
    queryKey: queryKeys.admin.users.list({ page, perPage }),
    queryFn: () =>
      adminApi.get<PaginatedResponse<AdminUserResponse>>(
        `/admin/users?page=${page}&perPage=${perPage}`
      ),
  });
}

export function useDeleteAdminUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.delete(`/admin/users/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.admin.users.all }),
  });
}
```

### Pattern 5: Setup Wizard Guard (client-side)

**What:** `/setup` page calls `GET /api/setup` on mount; redirects to `/admin/login` if `required: false`.
**When to use:** The setup page only — this is not a shared component.

```typescript
// Source: packages/shared/src/api/setup.ts — SetupStatusResponse
useEffect(() => {
  api.get<SetupStatusResponse>('/setup').then(({ required }) => {
    if (!required) router.replace('/admin/login');
    else setReady(true);
  }).catch(() => setReady(true)); // show form on network error (fail open)
}, []);
```

### Pattern 6: OneTimeDisplay Component

**What:** Shows a sensitive value (raw token or password reset URL) exactly once with a copy button and a dismiss action. After dismiss the component is removed from the DOM.
**When to use:** Post-`POST /admin/tokens` success callback; post-`POST /admin/users/:id/password-reset-url` success callback.

```typescript
// Surface: bg-sand border border-border rounded-[8px] p-4
// Copy: navigator.clipboard.writeText(value)
// Dismiss: calls onDismiss() — parent removes from state
interface OneTimeDisplayProps {
  value: string;
  label: string;     // e.g. "Copia este token ahora. No se mostrará de nuevo."
  onDismiss: () => void;
}
```

### Anti-Patterns to Avoid

- **Importing `api` from `api-client.ts` in admin hooks:** Admin hooks must use `adminApi` from `admin-api-client.ts` so the 401 redirect goes to `/admin/login` not `/login`.
- **Sharing AdminAuthProvider with AuthProvider:** These are separate contexts for separate sessions (admin uses `admin.sid` cookie, user uses `connect.sid`). Do not merge them.
- **Putting admin components in `components/ui/` or `components/layout/`:** Admin-specific components go in `components/admin/`. Shared primitives (`ConfirmDialog`, `Skeleton`, `BottomSheet`, `PaginationControls`) are imported from their existing locations without copying.
- **Triggering `GET /admin/auth/me` before the route group is entered:** `AdminAuthProvider` must live in `(admin)/layout.tsx`, not the root layout — it should not run on user-facing routes.
- **Showing the raw token after dismiss:** `AdminTokenCreatedResponse.token` must be stored in local component state and set to `null` on dismiss. Do not cache it in TanStack Query or persist it.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Toast notifications | Custom toast state | `sonner` (already installed) | Edge cases in positioning, stacking, accessibility; already wired in root layout |
| Loading skeletons | Custom shimmer | `Skeleton` component (`components/ui/Skeleton.tsx`) | Already matches design tokens; consistent animation |
| Delete confirmation | Custom modal | `ConfirmDialog` (`components/ui/ConfirmDialog.tsx`) | Established inline pattern; reused in Phase 09 and 10 |
| Bottom sheet on mobile | Custom drawer | `BottomSheet` (`components/ui/BottomSheet.tsx`) | Already handles scroll lock, backdrop, animation |
| Pagination UI | Custom prev/next | `PaginationControls` (`components/recipes/PaginationControls.tsx`) | Already wired with `perPage` options 10/20/50 |
| Clipboard copy | Custom button | `navigator.clipboard.writeText()` | Native API; no library needed |
| Form field validation | Custom validation library | HTML `required` attribute + inline error state | Forms are simple (1-4 fields each); no complex validation logic needed |

**Key insight:** Every UI primitive this phase needs already exists in the codebase. Phase 12 adds no new npm packages.

---

## Common Pitfalls

### Pitfall 1: PaginationControls page-size mismatch

**What goes wrong:** `PaginationControls` currently renders options 10/20/50 but the UI spec requires 10/25/50 for admin sections.
**Why it happens:** The shared component was built for the recipe list (20 default). Admin sections use different page sizes per the spec.
**How to avoid:** Either pass `pageSizeOptions` as a prop to `PaginationControls` (requires a minor component update), or hardcode admin-specific pagination controls inline. Choose the prop-based approach to stay DRY.
**Warning signs:** Admin section shows 20 as a page size option instead of 25.

### Pitfall 2: Admin layout wrapping setup and login routes

**What goes wrong:** `(admin)/layout.tsx` applies `AdminAuthProvider` + `AdminGuard` which redirects unauthenticated users to `/admin/login`. If `/admin/login` and `/setup` are inside this route group, they create an infinite redirect loop.
**Why it happens:** The guard fires before login/setup pages can render.
**How to avoid:** The guard in `(admin)/layout.tsx` must NOT redirect for `/admin/login` or `/setup` paths. Pattern: check `pathname` and skip guard, OR structure the layout so the guard only wraps `/admin/panel/*` sub-routes (e.g., a nested layout in `admin/panel/`).
**Warning signs:** Navigating to `/admin/login` causes an immediate redirect back to `/admin/login`.

### Pitfall 3: Raw token leaked into TanStack Query cache

**What goes wrong:** Storing `AdminTokenCreatedResponse` (which includes the raw `token` field) in the query cache makes the raw token accessible to any code that reads the cache after the `OneTimeDisplay` is dismissed.
**Why it happens:** Developers cache the POST response for optimistic UI convenience.
**How to avoid:** Raw token display state lives in local `useState` only — not in TanStack Query. After `useMutation.onSuccess`, save the `token` to local state and immediately invalidate the tokens list query (which uses `GET /admin/tokens` — no token field).
**Warning signs:** `queryClient.getQueryData(queryKeys.admin.tokens.list(...))` contains a `token` string field.

### Pitfall 4: `window.location.replace` in admin-api-client called during SSR/build

**What goes wrong:** `window` is not defined in the Node.js environment used during Next.js build. If `admin-api-client.ts` references `window.location` at module scope (not inside a function), the build fails.
**Why it happens:** Next.js builds pages server-side even for pure SPA mode.
**How to avoid:** The `window.location.replace` call must be inside the error handler function, not at module initialization. Mark the file with `'use client'` if needed, though since it's a lib (not a component), the function-scope placement is the safe approach.
**Warning signs:** `ReferenceError: window is not defined` during `next build`.

### Pitfall 5: Query key namespace collision with user foods/units

**What goes wrong:** Admin foods/units queries use `queryKeys.foods.list()` — the same key as the user-facing foods picker. A mutation in the admin panel silently invalidates the user foods cache (or vice versa).
**Why it happens:** `query-keys.ts` already has `foods.list` and `units.list` keys. Admin CRUD mutations call `invalidateQueries` without a distinct namespace.
**How to avoid:** Admin query keys must be namespaced under `queryKeys.admin.*`. Add an `admin` subtree to `query-keys.ts`:
```typescript
admin: {
  users:      { all: ['admin', 'users'] as const, list: (p) => ['admin', 'users', 'list', p] as const },
  households: { all: ['admin', 'households'] as const, list: (p) => ['admin', 'households', 'list', p] as const },
  foods:      { all: ['admin', 'foods'] as const, list: (p) => ['admin', 'foods', 'list', p] as const },
  units:      { all: ['admin', 'units'] as const, list: (p) => ['admin', 'units', 'list', p] as const },
  tokens:     { all: ['admin', 'tokens'] as const, list: (p) => ['admin', 'tokens', 'list', p] as const },
}
```
**Warning signs:** Adding a food in the admin panel clears the ingredient picker's food search cache on the recipe editing page.

---

## Code Examples

Verified patterns from existing codebase:

### AdminMeResponse (to add to packages/shared/src/api/admin.ts)

```typescript
// Source: packages/shared/src/api/admin.ts (add alongside existing types)
/** Returned by GET /admin/auth/me — authenticated admin info */
export interface AdminMeResponse {
  id: string;
  email: string;
  name: string;
}
```

### Backend GET /admin/auth/me (to add to admin-auth.controller.ts)

```typescript
// Source: apps/api/src/admin/auth/admin-auth.controller.ts (add after logout)
import { Get } from '@nestjs/common';
import { CurrentAdmin } from '../../common/decorators/current-admin.decorator';
import type { Admin } from '@prisma/client';
import type { AdminMeResponse } from '@recipe-manager/shared';

@UseGuards(AdminAuthGuard)
@Get('me')
@ApiOperation({ summary: 'Get current admin' })
@ApiResponse({ status: 200 })
@ApiResponse({ status: 401, description: 'Not authenticated' })
getMe(@CurrentAdmin() admin: Admin): AdminMeResponse {
  return { id: admin.id, email: admin.email, name: admin.name };
}
```

### (admin)/layout.tsx shell structure

```typescript
// Source: apps/web/src/app/(app)/layout.tsx (mirror pattern)
// IMPORTANT: Guard must not redirect /admin/login or /setup
'use client';
import { usePathname } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      <AdminGuardedShell>{children}</AdminGuardedShell>
    </AdminAuthProvider>
  );
}

function AdminGuardedShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublicAdminRoute = pathname === '/admin/login' || pathname === '/setup';

  if (isPublicAdminRoute) return <>{children}</>;
  return <AdminProtectedLayout>{children}</AdminProtectedLayout>;
}
```

### Token one-time display state pattern

```typescript
// Source: Phase 09-04 confirmDeleteId pattern (string|null for single active state)
const [createdToken, setCreatedToken] = useState<string | null>(null);

const { mutate: createToken } = useMutation({
  mutationFn: (body: CreateTokenBody) =>
    adminApi.post<AdminTokenCreatedResponse>('/admin/tokens', body),
  onSuccess: (data) => {
    setCreatedToken(data.token);              // show OneTimeDisplay
    qc.invalidateQueries({ queryKey: queryKeys.admin.tokens.all });
    // do NOT cache data.token anywhere else
  },
});

// In JSX:
{createdToken && (
  <OneTimeDisplay
    value={createdToken}
    label="Copia este token ahora. No se mostrará de nuevo."
    onDismiss={() => setCreatedToken(null)}
  />
)}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Sharing a single auth context for admin and user | Separate `AdminAuthProvider` and `AuthProvider` | Phase 7 decision | Admin session (`admin.sid`) and user session (`connect.sid`) are independent; must not share context |
| Inline route-level guards | Route group layout guards (Next.js App Router) | Phase 7 (introduced `(app)/layout.tsx`) | Guard logic lives in layout, not per-page `useEffect` — cleaner, less duplication |
| Global modal for delete confirmation | Inline `ConfirmDialog` below the triggering row | Phase 9-04 decision | No portal, no z-index stacking, mobile-first |
| TanStack Query v4 | TanStack Query v5 | Phase 7 onwards | `isPending` replaces `isLoading` on mutations; `queryKey` is required on `invalidateQueries` |

---

## Open Questions

1. **`AdminForm` generic vs. per-section forms**
   - What we know: UI spec calls for a generic `AdminForm` shell with title + field slots
   - What's unclear: Whether AdminForm is a layout wrapper (takes JSX children for fields) or a data-driven config component (takes field definitions)
   - Recommendation: Implement as a layout wrapper accepting `children` — simpler, less magic, TypeScript-friendly, aligns with the project's component style

2. **PaginationControls page-size option 25 vs 20**
   - What we know: `PaginationControls` currently renders 10/20/50; the admin spec requires 10/25/50
   - What's unclear: Whether to update the shared component (affects recipe list) or use a prop
   - Recommendation: Add optional `pageSizeOptions?: number[]` prop to `PaginationControls` with default `[10, 20, 50]`; admin sections pass `[10, 25, 50]`; recipe list is unaffected

3. **`AdminTable` generic column config vs per-section tables**
   - What we know: UI spec names a generic `AdminTable` component with "columns config, rows, actions column"
   - What's unclear: The complexity tradeoff — typed generic vs. inline per-section
   - Recommendation: Light generic with `columns: { key, label, render? }[]` and a fixed actions slot; avoids TypeScript generics complexity while reducing duplication across 5 sections

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | vitest 4.1.0 + @testing-library/react 16.3.2 |
| Config file | `apps/web/vitest.config.ts` (exists) |
| Quick run command | `cd apps/web && yarn test` |
| Full suite command | `cd apps/web && yarn test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ADM-01 | Users section renders list, create form, edit, delete confirmation | unit | `cd apps/web && yarn test` | ❌ Wave 0 |
| ADM-02 | Households section renders list, create form, edit, delete confirmation | unit | `cd apps/web && yarn test` | ❌ Wave 0 |
| ADM-03 | Foods section renders list, create form, edit, delete | unit | `cd apps/web && yarn test` | ❌ Wave 0 |
| ADM-04 | Units section renders list, create form, edit, delete | unit | `cd apps/web && yarn test` | ❌ Wave 0 |
| ADM-05 | Token creation shows OneTimeDisplay with raw token; token not shown after dismiss | unit | `cd apps/web && yarn test` | ❌ Wave 0 |
| ADM-06 | Token list renders; delete fires revoke mutation + ConfirmDialog | unit | `cd apps/web && yarn test` | ❌ Wave 0 |
| (auth) | AdminAuthProvider calls /admin/auth/me; redirects to /admin/login on 401 | unit | `cd apps/web && yarn test` | ❌ Wave 0 |
| (auth) | Setup wizard redirects to /admin/login when required=false | unit | `cd apps/web && yarn test` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `cd apps/web && yarn test`
- **Per wave merge:** `cd apps/web && yarn test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `apps/web/tests/admin/AdminAuthProvider.test.tsx` — covers admin session check + redirect
- [ ] `apps/web/tests/admin/setup-page.test.tsx` — covers setup guard redirect logic
- [ ] `apps/web/tests/admin/admin-login-page.test.tsx` — covers login form + error display
- [ ] `apps/web/tests/admin/users-section.test.tsx` — covers ADM-01 list/create/edit/delete
- [ ] `apps/web/tests/admin/households-section.test.tsx` — covers ADM-02
- [ ] `apps/web/tests/admin/foods-section.test.tsx` — covers ADM-03
- [ ] `apps/web/tests/admin/units-section.test.tsx` — covers ADM-04
- [ ] `apps/web/tests/admin/tokens-section.test.tsx` — covers ADM-05 + ADM-06 (one-time display + revoke)
- [ ] `apps/web/tests/admin/OneTimeDisplay.test.tsx` — covers copy + dismiss behavior

---

## Sources

### Primary (HIGH confidence)

- `apps/web/src/lib/auth.tsx` — AuthProvider implementation; AdminAuthProvider mirrors exactly
- `apps/web/src/app/(app)/layout.tsx` — ProtectedLayout guard pattern; admin layout follows identically
- `apps/web/src/lib/api-client.ts` — base request helper; admin-api-client wraps this
- `packages/shared/src/api/admin.ts` — all existing admin response types; AdminMeResponse to be added
- `packages/shared/src/api/setup.ts` — SetupStatusResponse, CreateAdminRequest shapes
- `apps/api/src/admin/auth/admin-auth.controller.ts` — existing controller; GET /admin/auth/me added here
- `mvp_plans/03_api_design.md` — all admin endpoint shapes verified
- `mvp_plans/07_project_structure.md` — route group conventions and folder structure
- `.planning/phases/12-frontend-admin-panel/12-UI-SPEC.md` — authoritative visual + interaction spec
- `apps/web/src/components/ui/ConfirmDialog.tsx` — confirmed inline (not modal), prop signature
- `apps/web/src/components/recipes/PaginationControls.tsx` — confirmed 10/20/50 options (mismatch with spec's 25)
- `apps/web/src/lib/query-keys.ts` — confirmed no admin namespace exists yet; must be added

### Secondary (MEDIUM confidence)

- Phase 09-04 decisions in STATE.md: `confirmDeleteId string|null` pattern for inline per-row ConfirmDialogs
- Phase 11 decisions in STATE.md: `QueryClientProvider` in layouts for mutation callbacks

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed and in use
- Architecture: HIGH — all patterns are verified mirrors of existing code
- Pitfalls: HIGH — identified from codebase inspection (actual PaginationControls options mismatch, query key namespace gap, admin.sid vs connect.sid separation in STATE.md)
- Test infrastructure: HIGH — vitest.config.ts confirmed, setup.ts confirmed, no existing admin tests (Wave 0 gaps listed)

**Research date:** 2026-03-19
**Valid until:** 2026-04-19 (stable stack, 30-day window)
