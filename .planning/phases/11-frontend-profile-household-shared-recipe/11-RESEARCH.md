# Phase 11: Frontend Profile + Household + Shared Recipe — Research

**Researched:** 2026-03-18
**Domain:** Next.js frontend — profile form, share token flow, public unauthenticated page
**Confidence:** HIGH

---

## Summary

Phase 11 is a pure-frontend phase wiring three small surfaces into an already-mature React/Next.js/TanStack Query codebase. The backend is complete and verified: `GET/PATCH /api/profile`, `POST /api/recipes/:id/share`, and `GET /api/shared/:token` all exist and return typed shapes from `@recipe-manager/shared`. The UI contract is finalized in `11-UI-SPEC.md` and has been approved.

The work divides cleanly into three independent plans. Plan 11-01 (profile page) and Plan 11-02 (share link) operate inside the `(app)` route group with standard `AppShell` + `AuthProvider` wrappers. Plan 11-03 (public shared recipe) sits outside that group in a standalone route with no auth guard — the routing isolation is the single most consequential structural decision of the phase.

No new packages are needed. Every pattern (TanStack Query mutation, Sonner toast, BottomSheet, Skeleton loading, Vitest/RTL test) is already established in Phases 7-10 and can be followed exactly.

**Primary recommendation:** Follow established patterns exactly. This phase adds no new libraries, no new global state, and no architectural changes. The risk surface is (a) placing `/shared/[token]` outside `ProtectedLayout` correctly, and (b) the `navigator.clipboard` API requiring HTTPS or localhost in browsers.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PROF-01 | User can view and edit their profile (name, email, username) | `GET /api/profile` returns `ProfileResponse`; `PATCH /api/profile` accepts `UpdateProfileRequest`. Both types in `packages/shared/src/api/profile.ts`. Password update supported via optional `password` field. |
| SHR-01 | User can generate a shareable public link for a recipe | `POST /api/recipes/:id/share` returns `{ shareToken: string }`. Token stored on `Recipe.shareToken`. Share button already rendered (inert) in recipe detail page at line 136. |
| SHR-02 | Anyone with the share link can view a recipe without logging in | `GET /api/shared/:token` is `@Public()` — no auth required. Returns full `RecipeDetailResponse`. Route must be outside `(app)` group to avoid `ProtectedLayout` redirect. |
</phase_requirements>

---

## Standard Stack

### Core (all established, no new installs)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | already installed | Page routing, layout groups | Established in Phase 7 |
| TanStack Query v5 | already installed | Data fetching, mutations, cache invalidation | Established in Phase 7 |
| Sonner | already installed | Toast notifications | Established in Phase 7 |
| `@recipe-manager/shared` | workspace | Typed API boundary | Source of truth — `ProfileResponse`, `UpdateProfileRequest` |
| lucide-react | already installed | Icons (Loader2, Utensils, Link, ExternalLink) | Established in Phases 7-10 |
| Vitest + @testing-library/react | already installed | Component tests | Established in Phases 7-10 |

### No new installs required

All dependencies for Phase 11 are already present. Running `npm install` or `yarn` is not needed.

---

## Architecture Patterns

### Routing — Critical: Public Route Placement

```
apps/web/src/app/
├── (app)/                    # protected — ProtectedLayout wraps all children
│   ├── layout.tsx            # AuthProvider + ProtectedLayout (redirects to /login if !user)
│   ├── profile/
│   │   └── page.tsx          # NEW — Plan 11-01
│   └── recipes/
│       └── [slug]/
│           └── page.tsx      # MODIFIED — Plan 11-02 (wire Compartir button)
└── shared/                   # PUBLIC — outside (app) group, NO ProtectedLayout
    └── [token]/
        ├── layout.tsx        # NEW PublicLayout (Plan 11-03) — minimal header only
        └── page.tsx          # NEW SharedRecipePage (Plan 11-03)
```

The `/shared/[token]` directory MUST be a sibling of `(app)`, not nested inside it. Placing it inside `(app)` would cause `ProtectedLayout` to redirect unauthenticated visitors to `/login` before the page renders. This matches the established decision recorded in STATE.md: "AnyAuthGuard applied globally; @Public() opt-out for login, setup, and shared recipe routes."

### Pattern 1: Profile Page with PATCH mutation

Standard TanStack Query pattern already used in recipe editor. `useQuery` fetches profile on mount; `useMutation` fires on button click.

```typescript
// Source: established pattern from apps/web/src/app/(app)/recipes/[slug]/page.tsx
const { data: profile, isLoading } = useQuery({
  queryKey: queryKeys.profile.me,
  queryFn: () => api.get<ProfileResponse>('/profile'),
});

const updateMutation = useMutation({
  mutationFn: (data: UpdateProfileRequest) =>
    api.patch<ProfileResponse>('/profile', data),
  onSuccess: () => toast.success('Perfil actualizado'),
  onError: () => toast.error('Error al guardar. Intenta de nuevo.'),
});
```

Note: `queryKeys.profile.me` is already defined in `apps/web/src/lib/query-keys.ts` — no change needed there.

### Pattern 2: Share Token Mutation + BottomSheet

The share button on recipe detail calls `POST /api/recipes/:id/share`. The backend returns `{ shareToken: string }` (verified in `sharing.service.ts`). The frontend constructs the full URL as `window.location.origin + '/shared/' + shareToken`.

```typescript
// POST /api/recipes/:id/share returns { shareToken: string }
const shareMutation = useMutation({
  mutationFn: () => api.post<{ shareToken: string }>(`/recipes/${recipeId}/share`, {}),
  onSuccess: (data) => {
    setShareToken(data.shareToken);
    setShareSheetOpen(true);
  },
  onError: () => toast.error('No se pudo generar el enlace. Intenta de nuevo.'),
});
```

**Important:** The API design doc specifies `GET /api/recipes/shared/:token` but the actual backend implementation registers the route as `GET /api/shared/:token` (confirmed in `sharing.controller.ts` — `@Controller('shared')`). The frontend public page must call `/api/shared/:token`.

### Pattern 3: Public Page — no auth, standalone layout

```typescript
// apps/web/src/app/shared/[token]/page.tsx — no 'use client' auth dependency
// Fetches directly via api-client (credentials: 'include' is harmless for public routes)
const { data: recipe, isLoading, isError } = useQuery({
  queryKey: ['shared', token],
  queryFn: () => api.get<RecipeDetailResponse>(`/shared/${token}`),
});
```

The `PublicLayout` in `apps/web/src/app/shared/layout.tsx` renders a minimal header strip (Utensils icon + app name) with NO `AppShell`, NO `AuthProvider`, NO `ProtectedLayout`. It is a plain `<div>` wrapper.

### Pattern 4: Copy to clipboard

```typescript
// navigator.clipboard.writeText — requires HTTPS or localhost
// Fallback not required for this project (localhost dev + no deployment scope)
const [copied, setCopied] = useState(false);

const handleCopy = () => {
  navigator.clipboard.writeText(shareUrl).then(() => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  });
};
```

### Pattern 5: Password reveal field

The password field follows a "reveal on demand" pattern — a text button toggles a hidden input into view. Once revealed, the field stays visible (no re-hide). This avoids controlled-state complexity.

```typescript
const [showPasswordField, setShowPasswordField] = useState(false);

// In JSX:
{!showPasswordField ? (
  <button type="button" onClick={() => setShowPasswordField(true)}
    className="text-[13px] text-accent">
    Cambiar contraseña
  </button>
) : (
  <input type="password" ... />
)}
```

### Anti-Patterns to Avoid

- **Nesting `/shared` inside `(app)`:** Will cause `ProtectedLayout` to redirect unauthenticated visitors to `/login`. The route MUST be outside the route group.
- **Using `useAuth()` in `SharedRecipePage`:** The public page has no `AuthProvider`. Calling `useAuth()` will throw a context error. Keep the page entirely free of auth dependencies.
- **Calling `navigator.clipboard` without user gesture:** The Clipboard API requires a user gesture (button click). It is already in the correct place (onClick handler).
- **Constructing share URL on the server:** `window.location.origin` is browser-only. The public URL is built client-side in the share sheet, not server-side.
- **Forgetting `isLocked` on PATCH profile:** The `UpdateProfileRequest` type does not include `isLocked` — that's recipe-scoped. Profile fields: name, email, username, password only.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Toast notifications | Custom toast component | `sonner` (already installed) | Established in Phase 7 |
| Bottom sheet | Custom modal/drawer | `BottomSheet` component (`components/ui/BottomSheet.tsx`) | Already exists, handles scroll lock + Escape |
| Skeleton loading | Custom shimmer | `Skeleton` component (`components/ui/Skeleton.tsx`) | Already exists |
| Recipe detail display | Custom ingredient/step rendering | `SectionAccordion`, `InfoGrid`, `IngredientList`, `InstructionList` | All exist, reused verbatim on public page |
| Query key factory | Inline string arrays | `queryKeys` in `lib/query-keys.ts` | `queryKeys.profile.me` already defined |
| API client | Raw `fetch` calls | `api` from `lib/api-client.ts` | Handles credentials, JSON, error parsing |

---

## Common Pitfalls

### Pitfall 1: Public Route Inside Protected Group
**What goes wrong:** Placing `shared/[token]/page.tsx` inside `(app)/` causes `ProtectedLayout` to catch all unauthenticated visits and redirect to `/login` before the page ever renders.
**Why it happens:** Next.js App Router applies nested layouts hierarchically. `(app)/layout.tsx` runs for all routes inside the `(app)` group.
**How to avoid:** Create `apps/web/src/app/shared/[token]/page.tsx` as a top-level route (sibling to `(app)/`, not child).
**Warning signs:** Visiting `/shared/:token` in an incognito tab immediately redirects to `/login`.

### Pitfall 2: AuthProvider Not Available in Public Page
**What goes wrong:** Calling `useAuth()` from a component rendered under `PublicLayout` throws "useContext must be used within an AuthProvider" error (or returns the initial `{ user: null, isLoading: true }` state indefinitely).
**Why it happens:** `AuthProvider` is only mounted inside `(app)/layout.tsx`. `PublicLayout` does not render it.
**How to avoid:** `SharedRecipePage` and `PublicLayout` must have zero imports of `useAuth`, `AuthProvider`, or any component that calls `useAuth` internally.

### Pitfall 3: API URL Mismatch for Shared Route
**What goes wrong:** Calling `/api/recipes/shared/:token` returns 404. The API design doc (`03_api_design.md`) says `/api/recipes/shared/:token` but the implemented route is `/api/shared/:token`.
**Why it happens:** The design doc was written before implementation. The actual `@Controller('shared')` in `sharing.controller.ts` registers at `/shared`, not `/recipes/shared`.
**How to avoid:** Use `/api/shared/:token` in the frontend query function.
**Warning signs:** 404 response when fetching shared recipe on public page.

### Pitfall 4: navigator.clipboard Requires HTTPS or Localhost
**What goes wrong:** `navigator.clipboard.writeText()` is `undefined` or throws `NotAllowedError` on HTTP origins that are not localhost.
**Why it happens:** The Clipboard API is restricted to secure contexts.
**How to avoid:** This project runs on localhost in development and has no deployment scope — the risk is low. No fallback needed per CLAUDE.md constraints.

### Pitfall 5: Stale Recipe Cache After Share Token Generation
**What goes wrong:** After `POST /api/recipes/:id/share`, the recipe detail page still shows the old inert "Compartir" button (shareToken is null in cached data) even though a token was generated.
**Why it happens:** TanStack Query cache for `queryKeys.recipes.detail(slug)` is not invalidated after the share mutation.
**How to avoid:** After successful share mutation, either call `queryClient.invalidateQueries({ queryKey: queryKeys.recipes.detail(slug) })` or update the cache with `queryClient.setQueryData`. Since the share token is only shown in the sheet (not in the button), the simpler option is to hold the returned token in local state and not rely on the recipe cache to reflect it.

### Pitfall 6: Profile Form Submission Without Dirty-Field Filtering
**What goes wrong:** `PATCH /api/profile` sends empty fields (e.g., `password: ""`) which may cause validation errors or clear data unexpectedly.
**Why it happens:** Submitting a form without filtering unmodified or empty fields.
**How to avoid:** Before calling `updateMutation.mutate(data)`, strip undefined/empty values from the payload. The `UpdateProfileRequest` type uses optional fields — omit rather than send empty strings. Specifically: if `password` field is not shown or is empty, exclude it from the payload.

---

## Code Examples

### Profile Page skeleton loading state (established pattern)

```typescript
// Source: established pattern from apps/web/src/app/(app)/recipes/[slug]/page.tsx
if (isLoading) {
  return (
    <div className="px-5 py-6 space-y-4 animate-pulse">
      <div className="h-[48px] w-[48px] bg-subtle rounded-full" />
      <div className="h-[20px] bg-subtle rounded-lg w-1/2" />
      <div className="h-[20px] bg-subtle rounded-lg w-3/4" />
      <div className="h-[20px] bg-subtle rounded-lg w-3/4" />
      <div className="h-[20px] bg-subtle rounded-lg w-3/4" />
    </div>
  );
}
```

### Input field style (established in LoginPage, confirmed by UI-SPEC)

```typescript
// Source: apps/web/src/app/(auth)/login/page.tsx pattern
<input
  type="text"
  className="w-full bg-subtle border-[1.5px] border-border rounded-[12px] py-4 px-4 text-[15px] text-foreground placeholder:text-placeholder focus:outline-none focus:border-foreground"
/>
```

### Save button with loading state (established pattern)

```typescript
// Source: established pattern from MetadataForm, RecipeSettings
<button
  type="button"
  onClick={handleSave}
  disabled={updateMutation.isPending}
  className="w-full bg-foreground text-background rounded-[20px] py-4 text-[15px] font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
>
  {updateMutation.isPending ? (
    <>
      <Loader2 size={16} className="animate-spin" />
      Guardando...
    </>
  ) : 'Guardar cambios'}
</button>
```

### BottomSheet usage (established pattern from Phase 10)

```typescript
// Source: apps/web/src/components/ui/BottomSheet.tsx — accepts isOpen, onClose, title, children
<BottomSheet
  isOpen={shareSheetOpen}
  onClose={() => setShareSheetOpen(false)}
  title="Enlace para compartir"
>
  <div className="px-5 pb-6 space-y-3">
    {/* URL display + copy button */}
  </div>
</BottomSheet>
```

### Public page — no-auth layout

```typescript
// apps/web/src/app/shared/layout.tsx — plain layout, no AuthProvider
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Page-level `getServerSideProps` for auth | `ProtectedLayout` client-side redirect via `useAuth()` | Phase 7 (pure SPA) | Public pages must opt OUT of the layout group, not opt out of SSR |
| Separate `ShareUrl` response type | Inline `{ shareToken: string }` from `generateToken` | Phase 5 backend | Frontend must construct the full URL from `window.location.origin + '/shared/' + token` |

**Key API discrepancy (verified):**

The design doc (`03_api_design.md` line 154) specifies `GET /api/recipes/shared/:token` but the implemented controller (`sharing.controller.ts`) uses `@Controller('shared')` making the real route `GET /api/shared/:token`. The frontend must use `/api/shared/:token`.

---

## Open Questions

1. **Profile navigation entry — where to link to `/profile`?**
   - What we know: `AppShell` contains a `Drawer` with nav items (Hoy, Recetas, Planificador). No "Perfil" nav item exists yet.
   - What's unclear: The UI-SPEC says "Standard app shell (TopBar + Drawer). Page title: 'Perfil'" but doesn't specify whether a new drawer nav item is added or if the profile is linked from the user name shown in the drawer.
   - Recommendation: Check `Drawer.tsx` — the user name is likely rendered in the drawer header. A tap on the user name / a "Perfil" link in the drawer is the natural UX. Plan 11-01 should include this routing wire-up.

2. **Email validation — client-side only or server-enforced?**
   - What we know: The UI-SPEC says "email format error shown inline below field in text-destructive". The backend has `class-validator` on the DTO.
   - What's unclear: Should the frontend use a regex or the HTML `type="email"` native validation?
   - Recommendation: Use `type="email"` input + optional manual pattern check on submit. Server 400 errors should be surfaced to the user via the generic error toast.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest + @testing-library/react |
| Config file | `apps/web/vitest.config.ts` |
| Quick run command | `cd apps/web && yarn test` |
| Full suite command | `cd apps/web && yarn test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PROF-01 | Profile page loads user data and displays fields | unit | `cd apps/web && yarn test --reporter=verbose` | ❌ Wave 0 |
| PROF-01 | "Guardar cambios" fires PATCH /profile with form values | unit | `cd apps/web && yarn test --reporter=verbose` | ❌ Wave 0 |
| PROF-01 | Success toast "Perfil actualizado" shown on save | unit | `cd apps/web && yarn test --reporter=verbose` | ❌ Wave 0 |
| SHR-01 | "Compartir" button calls POST /recipes/:id/share | unit | `cd apps/web && yarn test --reporter=verbose` | ❌ Wave 0 |
| SHR-01 | Share sheet opens with URL and copy button after token generated | unit | `cd apps/web && yarn test --reporter=verbose` | ❌ Wave 0 |
| SHR-02 | SharedRecipePage fetches GET /api/shared/:token without auth | unit | `cd apps/web && yarn test --reporter=verbose` | ❌ Wave 0 |
| SHR-02 | Invalid token shows "Este enlace no es válido o ha expirado." | unit | `cd apps/web && yarn test --reporter=verbose` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `cd apps/web && yarn test`
- **Per wave merge:** `cd apps/web && yarn test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `apps/web/src/components/__tests__/ProfilePage.test.tsx` — covers PROF-01
- [ ] `apps/web/src/components/__tests__/ShareLinkFlow.test.tsx` — covers SHR-01
- [ ] `apps/web/src/components/__tests__/SharedRecipePage.test.tsx` — covers SHR-02

*(Framework install: none needed — Vitest already configured)*

---

## Sources

### Primary (HIGH confidence)
- `apps/api/src/recipes/sharing/sharing.controller.ts` — verified actual route paths (`POST /recipes/:id/share`, `GET /shared/:token`)
- `apps/api/src/recipes/sharing/sharing.service.ts` — verified `generateToken` returns `{ shareToken: string }`, `findByToken` returns `RecipeDetailResponse`
- `packages/shared/src/api/profile.ts` — verified `ProfileResponse` and `UpdateProfileRequest` types
- `packages/shared/src/api/recipes.ts` — verified `RecipeDetailResponse` includes `shareToken: string | null`
- `apps/web/src/lib/api-client.ts` — verified `api.get`, `api.post`, `api.patch` signatures
- `apps/web/src/lib/query-keys.ts` — verified `queryKeys.profile.me` already defined
- `apps/web/src/app/(app)/layout.tsx` — verified `ProtectedLayout` redirect behavior
- `apps/web/src/components/ui/BottomSheet.tsx` — verified component interface
- `apps/web/src/app/(app)/recipes/[slug]/page.tsx` lines 135-139 — verified inert "Compartir" button exists
- `.planning/phases/11-frontend-profile-household-shared-recipe/11-UI-SPEC.md` — approved visual + interaction contract

### Secondary (MEDIUM confidence)
- `mvp_plans/03_api_design.md` — design doc; API route for public recipe (`/api/recipes/shared/:token`) differs from implementation; implementation wins
- STATE.md accumulated decisions — routing and auth patterns established in Phases 7-10

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries verified in existing source files
- Architecture: HIGH — routing pattern verified by reading actual layout files; route discrepancy verified in controller source
- Pitfalls: HIGH — most are verified by reading actual implementation files, not hypothetical

**Research date:** 2026-03-18
**Valid until:** Stable — no fast-moving dependencies; valid until Phase 11 implementation completes
