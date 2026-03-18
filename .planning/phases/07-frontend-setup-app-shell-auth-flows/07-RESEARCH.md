# Phase 7: Frontend Setup + App Shell + Auth Flows — Research

**Researched:** 2026-03-18
**Domain:** Next.js 15 App Router, Tailwind CSS v4, TanStack Query v5, client-side session auth, toast notifications
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| UX-01 | Application has a responsive layout (phone, tablet, desktop) | App shell breakpoints documented; mobile-first Tailwind v4 patterns researched |
| UX-02 | Loading indicators are shown while data is being fetched | TanStack Query v5 `isPending` pattern + skeleton component pattern researched |
| UX-03 | Toast/notification system for success, error, and info states | Sonner library researched; auto-dismiss timing per UI-SPEC documented |
</phase_requirements>

---

## Summary

Phase 7 transforms the bare Next.js scaffold (`apps/web/src/app/layout.tsx` + `page.tsx`) into a working SPA with Tailwind v4 design tokens, an app shell (TopBar + Drawer), auth flows backed by the existing NestJS session-cookie API, and global UX primitives (loading skeletons, toast notifications).

The project structure is pre-designed in `mvp_plans/07_project_structure.md` and the visual contract is locked in `07-UI-SPEC.md`. No design decisions remain open. The implementation work is installing and configuring the correct libraries, wiring client-side auth detection against `GET /api/auth/me`, and implementing the components exactly as specified.

The critical architectural choice is **client-side-only auth detection**: because the backend uses HttpOnly express-session cookies (not readable by JS), the frontend must call `GET /api/auth/me` on mount to determine login state. This means the auth check is async, so every protected page shows a skeleton until the check resolves. There is no JWT token the frontend can read; middleware-based redirects cannot verify session validity without a token in a readable cookie.

**Primary recommendation:** Install Tailwind v4 (CSS-first config via `@theme` in globals.css — no `tailwind.config.ts` needed), TanStack Query v5 (`@tanstack/react-query`), `lucide-react`, and `sonner`. Implement auth via React Context + `useEffect` fetch of `/api/auth/me`. Use Next.js App Router route groups exactly as specified in `mvp_plans/07_project_structure.md`.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | ^15.0.0 (installed) | Routing, build, layouts | Already pinned in package.json |
| react / react-dom | ^19.0.0 (installed) | UI runtime | Already pinned in package.json |
| tailwindcss | ^4.x | Utility CSS + design tokens | v4 is stable (Jan 2025), CSS-first config, no tailwind.config.ts needed |
| @tailwindcss/postcss | ^4.x | PostCSS plugin for Tailwind v4 | Required v4 plugin (replaces postcss-based v3 setup) |
| postcss | ^8.x | Build pipeline | Required by @tailwindcss/postcss |
| @tanstack/react-query | ^5.x | Server state, caching, loading states | Project decision per mvp_plans/07_project_structure.md |
| lucide-react | latest | Icon set | Locked by UI-SPEC — all icons are lucide |
| sonner | latest | Toast notifications | Lightest (2-3KB), zero dependencies, call `toast()` from anywhere |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tanstack/react-query-devtools | ^5.x | Dev-time query inspection | devDependency, import conditionally in dev only |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| sonner | react-hot-toast | Both are ~equal size; sonner is slightly more recent, has richer default styles, adopted by shadcn ecosystem |
| sonner | react-toastify | react-toastify is heavier (~20KB); unnecessary for this design |
| Tailwind v4 | Tailwind v3 | v3 would require `tailwind.config.ts`; UI-SPEC was written expecting v4's CSS token system; v4 is the current stable release |
| TanStack Query | SWR | Project decision locked in mvp_plans/07_project_structure.md — use TanStack Query |

**Installation:**
```bash
yarn workspace @recipe-manager/web add tailwindcss @tailwindcss/postcss postcss @tanstack/react-query lucide-react sonner
yarn workspace @recipe-manager/web add -D @tanstack/react-query-devtools
```

---

## Architecture Patterns

### Recommended Project Structure

The full structure is pre-defined in `mvp_plans/07_project_structure.md`. Phase 7 creates these paths:

```
apps/web/src/
├── app/
│   ├── layout.tsx                   # Root layout — Providers (QueryClient + Toaster)
│   ├── globals.css                  # @import "tailwindcss"; + @theme design tokens
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx             # LoginPage component
│   └── (app)/
│       ├── layout.tsx               # AppShell — AuthProvider + TopBar + Drawer
│       ├── page.tsx                 # / → RecipeListShell (scaffold, Phase 8 populates)
│       └── planner/
│           └── page.tsx             # /planner → PlannerShell (scaffold)
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx             # Wraps TopBar + Drawer + children
│   │   ├── TopBar.tsx               # Page title + hamburger
│   │   └── Drawer.tsx               # Slide-in nav with scrim
│   └── ui/
│       ├── Skeleton.tsx             # Pulsing skeleton block
│       └── Toast.tsx                # (via sonner Toaster — minimal wrapper if needed)
├── hooks/
│   └── useAuth.ts                   # Consumes AuthContext
├── lib/
│   ├── api-client.ts                # Typed fetch wrapper (credentials: 'include')
│   ├── auth.ts                      # AuthContext + AuthProvider
│   └── query-keys.ts                # TanStack Query key factory
└── styles/                          # (globals.css lives in app/ per Next.js convention)
```

### Pattern 1: Tailwind v4 CSS-First Design Token Configuration

**What:** In v4, all Tailwind customization lives in `globals.css` via the `@theme` directive. No `tailwind.config.ts` is needed (though the project structure doc references one — skip it for v4).

**When to use:** Always — this is v4's only configuration mechanism.

```css
/* Source: https://tailwindcss.com/docs/theme */
/* apps/web/src/app/globals.css */
@import "tailwindcss";

@theme {
  --color-background: #FAFAF7;
  --color-foreground: #2C2C2A;
  --color-secondary: #8A8680;
  --color-placeholder: #C8C4BD;
  --color-border: #E0DCD5;
  --color-subtle: #F4F2ED;
  --color-sand: #E8E1D5;
  --color-accent: #5EBD6A;
  --color-destructive: #D94F4F;

  --font-family-sans: 'Outfit', sans-serif;

  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-2xl: 48px;
}
```

PostCSS config (`postcss.config.mjs` at `apps/web/`):
```javascript
// Source: https://tailwindcss.com/docs/guides/nextjs
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
export default config;
```

After this, Tailwind utilities like `bg-background`, `text-foreground`, `text-accent`, `border-border` are available automatically from the `@theme` tokens.

### Pattern 2: Root Layout — Providers Wrapper

**What:** Root `layout.tsx` is a Server Component that imports a `"use client"` Providers wrapper for QueryClientProvider + Toaster. Google Fonts are loaded via Next.js `<link>` in the `<head>`.

**When to use:** Always — QueryClient must be instantiated per browser session, not per server request.

```tsx
// Source: https://tanstack.com/query/v5/docs/framework/react/reference/QueryClientProvider
// apps/web/src/app/layout.tsx
import type { Metadata } from 'next';
import Providers from '@/components/Providers';
import './globals.css';

export const metadata: Metadata = { title: 'Robotina Cooks' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background text-foreground font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

```tsx
// apps/web/src/components/Providers.tsx
'use client';
import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 60_000 } },
  }));
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster position="top-center" richColors />
    </QueryClientProvider>
  );
}
```

Key: `useState(() => new QueryClient(...))` — the initializer function prevents recreating the client on re-renders.

### Pattern 3: Client-Side Auth Detection (AuthProvider)

**What:** Because the backend uses HttpOnly express-session cookies, client JS cannot read the cookie. Auth state is determined by calling `GET /api/auth/me` on mount. A 200 means authenticated; a 401 means not authenticated.

**When to use:** Only once, in `(app)/layout.tsx` which wraps all protected routes.

```tsx
// Source: pattern from https://nextjs.org/docs/app/building-your-application/authentication
// apps/web/src/lib/auth.ts
'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { MeResponse } from '@recipe-manager/shared';
import { api } from './api-client';

interface AuthState {
  user: MeResponse | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthState>({ user: null, isLoading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.get<MeResponse>('/auth/me')
      .then((u) => setUser(u))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
```

Protected route redirect logic in `(app)/layout.tsx`:
```tsx
// apps/web/src/app/(app)/layout.tsx
'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '@/lib/auth';
import AppShell from '@/components/layout/AppShell';

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) return <AppShellSkeleton />;
  if (!user) return null; // redirect in progress
  return <AppShell>{children}</AppShell>;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ProtectedLayout>{children}</ProtectedLayout>
    </AuthProvider>
  );
}
```

### Pattern 4: API Client (Typed Fetch Wrapper)

**What:** A thin typed `fetch` wrapper that always sends `credentials: 'include'` (required for session cookies to be sent cross-origin from Next.js dev server to NestJS API).

```typescript
// apps/web/src/lib/api-client.ts
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw Object.assign(new Error(err.message), { status: res.status });
  }
  return res.json() as Promise<T>;
}

export const api = {
  get:    <T>(path: string)                  => request<T>('GET', path),
  post:   <T>(path: string, body: unknown)   => request<T>('POST', path, body),
  patch:  <T>(path: string, body: unknown)   => request<T>('PATCH', path, body),
  delete: <T>(path: string)                  => request<T>('DELETE', path),
};
```

### Pattern 5: TanStack Query v5 Loading State — Skeleton Pattern

**What:** `isPending` (not `isLoading`) is the correct v5 flag for "first fetch, no cached data." Use it to show skeleton placeholders per UI-SPEC (not spinners overlaid on real data).

```tsx
// Source: https://tanstack.com/query/v5/docs/framework/react/guides/queries
const { isPending, isError, data } = useQuery({
  queryKey: queryKeys.recipes.list(params),
  queryFn: () => api.get<PaginatedResponse<RecipeListItem>>('/recipes'),
});

if (isPending) return <RecipeListSkeleton />;
if (isError) return <ErrorState />;
return <RecipeList data={data} />;
```

Skeleton component pattern (UI-SPEC: `#F4F2ED` bg, pulse animation):
```tsx
// apps/web/src/components/ui/Skeleton.tsx
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-subtle animate-pulse rounded ${className}`} />
  );
}
```

### Pattern 6: Toast Notifications via Sonner

**What:** Sonner's `toast()` function can be called from anywhere — no hook required.

```tsx
// Source: https://github.com/emilkowalski/sonner
import { toast } from 'sonner';

// From any component or mutation handler:
toast.success('Receta guardada');
toast.error('No se pudo conectar. Intenta de nuevo.');
toast.info('Sesión iniciada');
```

Auto-dismiss timing aligns with UI-SPEC: success/info at 4s, error at 6s. Configure on the `<Toaster>` component in `Providers.tsx`:
```tsx
<Toaster
  position="top-center"
  richColors
  toastOptions={{
    duration: 4000,  // default for success/info
  }}
/>
// For error, pass duration: 6000 per individual toast:
toast.error('message', { duration: 6000 });
```

### Pattern 7: Next.js App Router Route Groups

**What:** Parenthesized folder names create layout boundaries without affecting URLs.

```
app/
├── (auth)/login/page.tsx   → URL: /login   (minimal centered layout)
├── (app)/page.tsx          → URL: /         (AppShell layout, protected)
├── (app)/planner/page.tsx  → URL: /planner  (AppShell layout, protected)
├── (admin)/...             → URL: /admin/.. (admin layout, Phase 12)
└── shared/[token]/page.tsx → URL: /shared/x (public layout, Phase 11)
```

Each group has its own `layout.tsx`. The `(auth)` layout is minimal (centered form, no shell). The `(app)` layout wraps `AuthProvider` + `AppShell`.

### Anti-Patterns to Avoid

- **Instantiating QueryClient outside `useState`:** Creates a single shared instance across server renders and can leak state between users. Always use `useState(() => new QueryClient())`.
- **Using `isLoading` instead of `isPending` in v5:** `isLoading` was renamed to `isPending` in TanStack Query v5. Using `isLoading` still works (it's an alias) but `isPending` is the canonical v5 name.
- **Reading session cookies in middleware:** The backend sets HttpOnly cookies that JS cannot read. A `middleware.ts` check for the session cookie name presence would be an unreliable heuristic — the session may be expired. The only reliable check is calling `GET /api/auth/me`.
- **Creating `tailwind.config.ts`:** With Tailwind v4, all config lives in `globals.css` via `@theme`. A separate config file is not needed and would conflict.
- **Defining `"use client"` on `app/layout.tsx`:** The root layout should be a Server Component. Client providers go in a separate `Providers.tsx` wrapper component.
- **Forgetting `credentials: 'include'` on fetch:** Without it, the session cookie is not sent from the Next.js dev server (port 3001) to the NestJS API (port 3000), and every request returns 401.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Toast notifications | Custom toast state + portal | `sonner` | Position stacking, auto-dismiss, aria-live regions, max-stack management — all edge cases |
| Icon components | SVG files or custom icon components | `lucide-react` | Locked by UI-SPEC; consistent sizing/stroke API |
| Query deduplication and caching | Manual fetch + useEffect + useState | TanStack Query | Race conditions, deduplication, background refetch, stale-while-revalidate — all solved |
| Skeleton animation | Custom CSS animation | Tailwind `animate-pulse` | Already in Tailwind core; consistent with design token system |

**Key insight:** The session-cookie auth pattern is the one area where a library (like next-auth) is NOT used by design. The project decisions explicitly chose plain fetch + React Context because the backend owns the session — no token to decode, just an API call to check.

---

## Common Pitfalls

### Pitfall 1: CORS Cookie Issue in Development

**What goes wrong:** `credentials: 'include'` fetch requests fail with CORS errors or cookies aren't sent because the Next.js dev server (`localhost:3001`) and NestJS API (`localhost:3000`) are different origins.

**Why it happens:** CORS `credentials: 'include'` requires the server to respond with `Access-Control-Allow-Credentials: true` AND `Access-Control-Allow-Origin` must be the exact requesting origin (not `*`).

**How to avoid:** Verify the NestJS CORS config includes the Next.js origin and `credentials: true`. Use Next.js `rewrites` in `next.config.ts` to proxy API calls to the same origin in development, eliminating the cross-origin problem entirely:
```typescript
// next.config.ts
const nextConfig = {
  async rewrites() {
    return [{ source: '/api/:path*', destination: 'http://localhost:3000/api/:path*' }];
  },
};
```
If rewrites are used, `api-client.ts` BASE_URL becomes `/api` (same origin, no CORS).

**Warning signs:** Browser console shows "CORS error" or "has been blocked by CORS policy" for `/api/auth/me`.

### Pitfall 2: Infinite Redirect Loop on Session Check

**What goes wrong:** Page shows blank or flickers between the app shell and `/login` repeatedly.

**Why it happens:** The `isLoading` state isn't respected — the redirect fires before `GET /api/auth/me` returns, treating `user === null` (initial state) as unauthenticated.

**How to avoid:** Guard the redirect with `!isLoading && !user`. While `isLoading` is `true`, render a skeleton, not a redirect.

**Warning signs:** Network tab shows repeated calls to `/api/auth/me`; URL flickers between `/` and `/login`.

### Pitfall 3: Tailwind v4 Classes Not Working

**What goes wrong:** Custom color classes like `bg-background` or `text-accent` have no effect.

**Why it happens:** Either `globals.css` is not imported in `layout.tsx`, the `@import "tailwindcss"` directive is missing, or PostCSS is not configured with `@tailwindcss/postcss`.

**How to avoid:** Ensure all three are present: (1) `postcss.config.mjs` with `@tailwindcss/postcss`, (2) `globals.css` starts with `@import "tailwindcss"`, (3) `globals.css` is imported in `app/layout.tsx`.

**Warning signs:** No Tailwind classes have any effect; browser shows unstyled HTML.

### Pitfall 4: Google Fonts Not Loading in Production

**What goes wrong:** Font shows as fallback sans-serif instead of Outfit.

**Why it happens:** Direct `<link>` to Google Fonts CDN may be blocked by CSP or slow in production; or font weights not preloaded.

**How to avoid:** For Phase 7, a direct `<link>` import is acceptable. For robustness, use Next.js `next/font/google`:
```typescript
import { Outfit } from 'next/font/google';
const outfit = Outfit({ subsets: ['latin'], weight: ['400', '600'] });
// Apply: <body className={outfit.className}>
```
This self-hosts the font and eliminates the CDN dependency.

**Warning signs:** Font flickering on load; `font-family` shows as system font in devtools.

### Pitfall 5: Drawer Slide Animation with Tailwind v4

**What goes wrong:** Drawer transition doesn't animate smoothly, or Tailwind `transition` + `translate` classes don't apply to the custom drawer.

**Why it happens:** Tailwind v4 requires explicit `transition-property` classes; arbitrary transitions need specific setup.

**How to avoid:** Use Tailwind's built-in transition utilities: `transition-transform duration-300 ease-in-out`. For the drawer: `translate-x-0` (open) vs `-translate-x-full` (closed), toggled by a state variable.

---

## Code Examples

### Query Keys Factory

```typescript
// Source: mvp_plans/07_project_structure.md
// apps/web/src/lib/query-keys.ts
export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  recipes: {
    all:    ['recipes'] as const,
    list:   (params: Record<string, unknown>) => ['recipes', 'list', params] as const,
    detail: (slug: string) => ['recipes', 'detail', slug] as const,
  },
  mealPlan: {
    week: (from: string, to: string) => ['meal-plan', from, to] as const,
  },
  profile: {
    me: ['profile', 'me'] as const,
  },
};
```

### Login Form Mutation

```tsx
// Source: TanStack Query v5 useMutation + api-client pattern
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import type { LoginRequest, MeResponse } from '@recipe-manager/shared';

export function useLogin() {
  const router = useRouter();
  return useMutation({
    mutationFn: (body: LoginRequest) => api.post<MeResponse>('/auth/login', body),
    onSuccess: () => router.replace('/'),
    onError: (err: Error & { status?: number }) => {
      const msg = err.status === 401
        ? 'Correo o contraseña incorrectos'
        : 'No se pudo conectar. Intenta de nuevo.';
      toast.error(msg, { duration: 6000 });
    },
  });
}
```

### Drawer Component Shell

```tsx
// apps/web/src/components/layout/Drawer.tsx
'use client';
import { X } from 'lucide-react';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: { name: string; household: string } | null;
}

export function Drawer({ isOpen, onClose, user }: DrawerProps) {
  return (
    <>
      {/* Scrim */}
      <div
        className={`fixed inset-0 bg-[rgba(44,44,42,0.3)] transition-opacity duration-300 z-40
          ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Panel */}
      <aside
        className={`fixed left-0 top-0 h-full w-[280px] bg-background z-50
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Header, nav items, logout per UI-SPEC */}
      </aside>
    </>
  );
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `tailwind.config.js` / `.ts` | `@theme` in `globals.css` | Tailwind v4 (Jan 2025) | No config file; tokens are CSS variables automatically |
| `isLoading` in TanStack Query | `isPending` | TanStack Query v5 | `isLoading` is kept as alias but `isPending` is canonical |
| `import type { GetServerSideProps }` for auth | `useEffect` fetch for pure SPA | Phase decision | No SSR; auth check is client-side only |
| `tailwindcss` PostCSS plugin directly | `@tailwindcss/postcss` | Tailwind v4 | Separate plugin package replaces inline config |
| `middleware.ts` | `proxy.ts` (Next.js 16+) | Not yet (Next.js 15 still uses middleware.ts) | No impact for this project — we use client-side auth check anyway |

**Deprecated/outdated:**
- `tailwind.config.ts` with JavaScript `theme.extend.colors`: Superseded by `@theme` in CSS in v4. Still works in v4 with a compat layer but unnecessary for new projects.
- `isLoading` in TanStack Query v5: Renamed to `isPending`; the alias is still present but flag documentation uses `isPending`.

---

## Open Questions

1. **CORS configuration in NestJS**
   - What we know: The backend is running at `localhost:3000`; the frontend dev server runs at a different port. CORS with `credentials: true` requires explicit origin whitelist.
   - What's unclear: Whether the existing NestJS `main.ts` has CORS configured for the Next.js origin.
   - Recommendation: Plan 07-01 should add a `next.config.ts` rewrite to proxy `/api/*` to `localhost:3000/api/*`. This eliminates CORS entirely in development and production (when deployed behind the same reverse proxy). The api-client BASE_URL becomes `process.env.NEXT_PUBLIC_API_URL ?? '/api'`.

2. **`next/font/google` vs. CDN link for Outfit**
   - What we know: UI-SPEC requires Outfit 400/600. Both `next/font/google` (self-hosted) and a CDN `<link>` work.
   - What's unclear: Whether self-hosting is required or preferred.
   - Recommendation: Use `next/font/google` — it eliminates the CDN dependency, improves LCP, and Next.js handles preloading. This is the current Next.js best practice.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None currently — Wave 0 must set up Vitest + React Testing Library |
| Config file | `apps/web/vitest.config.ts` (to be created in Wave 0) |
| Quick run command | `yarn workspace @recipe-manager/web vitest run --reporter=verbose` |
| Full suite command | `yarn workspace @recipe-manager/web vitest run` |

Vitest is preferred over Jest for Next.js 15 + React 19: fewer compatibility issues, faster (ES modules native), better TypeScript support out of the box. The backend already uses Jest (NestJS default); the frontend uses Vitest independently.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| UX-01 | App shell renders without horizontal scroll at 375px, 768px, 1024px | unit (RTL render + className assertion) | `vitest run tests/layout/AppShell.spec.tsx` | Wave 0 |
| UX-02 | `isPending` shows skeleton; resolved shows content | unit (RTL + mock useQuery) | `vitest run tests/components/RecipeListSkeleton.spec.tsx` | Wave 0 |
| UX-03 | `toast.success/error/info` renders Toaster notification | unit (RTL + sonner mock or real Toaster) | `vitest run tests/components/Toast.spec.tsx` | Wave 0 |
| AUTH (login redirect) | Unauthenticated access to `(app)` redirects to `/login` | unit (RTL + mock useAuth returning null) | `vitest run tests/layout/ProtectedLayout.spec.tsx` | Wave 0 |
| AUTH (login flow) | Successful login calls `POST /api/auth/login` and redirects | unit (RTL + msw or fetch mock) | `vitest run tests/hooks/useLogin.spec.tsx` | Wave 0 |

### Sampling Rate

- **Per task commit:** `yarn workspace @recipe-manager/web vitest run --reporter=verbose`
- **Per wave merge:** `yarn workspace @recipe-manager/web vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `apps/web/vitest.config.ts` — Vitest config with jsdom environment
- [ ] `apps/web/tests/setup.ts` — RTL + jsdom setup file
- [ ] `apps/web/tests/layout/AppShell.spec.tsx` — covers UX-01
- [ ] `apps/web/tests/layout/ProtectedLayout.spec.tsx` — covers auth redirect
- [ ] `apps/web/tests/components/RecipeListSkeleton.spec.tsx` — covers UX-02
- [ ] `apps/web/tests/hooks/useLogin.spec.tsx` — covers auth login flow
- [ ] Framework install: `yarn workspace @recipe-manager/web add -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom`

---

## Sources

### Primary (HIGH confidence)

- [Tailwind CSS Guides: Next.js](https://tailwindcss.com/docs/guides/nextjs) — v4 install steps, PostCSS config, @import directive
- [Tailwind CSS Theme Variables](https://tailwindcss.com/docs/theme) — @theme directive, CSS custom properties as utility tokens
- [TanStack Query v5 useQuery](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery) — isPending flag semantics
- [Sonner GitHub](https://github.com/emilkowalski/sonner) — install and usage
- [Next.js Authentication Guide](https://nextjs.org/docs/app/building-your-application/authentication) — HttpOnly cookie auth pattern
- [Next.js Route Groups](https://nextjs.org/docs/app/api-reference/file-conventions/route-groups) — (auth)/(app)/(admin) layout pattern
- `mvp_plans/07_project_structure.md` — canonical project structure, component locations, query key factory pattern, api-client design
- `07-UI-SPEC.md` — design tokens, component specs, interaction contracts, breakpoints

### Secondary (MEDIUM confidence)

- [Tailwind v4.0 Release Blog](https://tailwindcss.com/blog/tailwindcss-v4) — CSS-first config confirmed, Jan 2025 stable release
- [LogRocket: React Toast Libraries 2025](https://blog.logrocket.com/react-toast-libraries-compared-2025/) — Sonner vs react-hot-toast comparison
- [TanStack Query v5 Migration Guide](https://tanstack.com/query/v5/docs/framework/react/guides/migrating-to-v5) — isLoading → isPending rename

### Tertiary (LOW confidence)

- [Detecting Auth Client-Side with HttpOnly Cookie](https://dev.to/justincy/detecting-authentication-client-side-in-next-js-with-an-httponly-cookie-when-using-ssr-4d3e) — supports useEffect fetch pattern for SPA auth

---

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — versions confirmed from package.json; Tailwind v4 stable confirmed; library choices locked by project design docs
- Architecture: HIGH — project structure is pre-designed in mvp_plans/07_project_structure.md; patterns verified against official docs
- Auth pattern: HIGH — HttpOnly cookie + fetch `/api/auth/me` is the canonical approach for this backend; confirmed by auth design doc
- Pitfalls: MEDIUM — CORS pitfall based on dev experience cross-verified with Next.js rewrite docs; other pitfalls from official docs
- Test setup: MEDIUM — Vitest recommendation from Next.js 15 docs; specific file structure is by convention

**Research date:** 2026-03-18
**Valid until:** 2026-06-18 (stable stack; Tailwind v4 and TanStack Query v5 APIs are stable)
