# Usage Analytics — Design Spec

**Date:** 2026-03-27
**Status:** Approved

---

## Overview

Add usage analytics to the Recipe Manager so the application manager can understand how the app is being used: page views, time spent on pages, and key user interactions.

Analytics are powered by **Umami** — self-hosted, open source, cookieless. No consent banner is required. Umami runs in a dedicated Proxmox LXC container (Debian 13, 2 CPU, 2 GB RAM, 12 GB disk, PostgreSQL 17 local to the container).

---

## Architecture

```
┌─────────────────────┐        script tag         ┌──────────────────┐
│   Next.js (web)     │ ────────────────────────► │  Umami LXC       │
│                     │                            │  (port 3000)     │
│  umami.track(event) │ ──── custom events ──────► │                  │
└─────────────────────┘                            │  PostgreSQL 17   │
                                                   │  (local, inside) │
┌─────────────────────┐   POST /api/send           │                  │
│   NestJS (api)      │ ──── share-link-view ────► │                  │
│   UmamiService      │      (fire-and-forget)     └──────────────────┘
└─────────────────────┘
```

- The Umami script embedded in Next.js handles page views and time-on-page automatically, including client-side route changes (SPA-compatible).
- Custom user interactions are tracked via `window.umami?.track()` calls at the relevant component interaction points.
- The NestJS backend has a `UmamiService` that calls Umami's `/api/send` endpoint when a shared recipe token is validated. This call is fire-and-forget — a Umami outage never breaks recipe access.
- No consent banner is required (Umami is cookieless by default).
- The frontend script and the backend `UmamiService` both send events to the **same Umami website** (same `WEBSITE_ID`), so all data is unified in a single Umami dashboard.

---

## Frontend Integration (`apps/web`)

### Script Tag

Added once to `app/layout.tsx` via Next.js's `<Script>` component. The tag is conditionally rendered — if `NEXT_PUBLIC_UMAMI_SCRIPT_URL` is not set, nothing is rendered and no broken request is made:

```tsx
{process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL && (
  <Script
    src={process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL}
    data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
    strategy="afterInteractive"
  />
)}
```

### TypeScript Declaration

A `umami.d.ts` file is added at `apps/web/src/umami.d.ts` with a minimal type declaration so `window.umami?.track()` call sites are type-checked:

```ts
// apps/web/src/umami.d.ts
declare global {
  interface Window {
    umami?: {
      track(eventName: string, data?: Record<string, string | number | boolean>): void;
    };
  }
}
export {};
```

All call sites use `window.umami?.track(...)` (optional chaining) so they are safe when the script has not loaded or is blocked by an ad blocker.

### Frontend Custom Events

The following events are fired from the frontend via `window.umami?.track(eventName, payload)`. The `share-link-view` event is backend-fired and is documented separately in the Backend Integration section.

| Event | Trigger | Payload |
|---|---|---|
| `cook-mode-start` | "Cocinar" button click on recipe detail | `{ recipeId: string, recipeName: string }` |
| `recipe-search` | Search submitted / debounced input | `{ query: string }` |
| `recipe-filter` | Filter chip applied | `{ filterType: string, filterValue: string }` |
| `recipe-create` | After successful recipe creation | `{ recipeId: string, recipeName: string }` |
| `recipe-edit` | After successful recipe save | `{ recipeId: string, recipeName: string }` |
| `meal-plan-add` | After recipe added to meal plan | `{ recipeId: string, recipeName: string }` |
| `meal-plan-remove` | After recipe removed from meal plan | `{ recipeId: string, recipeName: string }` |
| `share-link-generate` | After share link is generated | `{ recipeId: string, recipeName: string }` |

**Note on `recipe-search` payload:** The `query` field captures raw user-typed search text, which may contain personal information (e.g., ingredient names). This is acceptable: Umami is self-hosted, access is restricted to the application manager, and the household context makes this a low-risk, single-operator system.

### Shared Recipe Page — Dual Tracking (Intentional)

When a user views a shared recipe, two separate data points are recorded:

1. **Page view** (automatic, from the Umami script) — captures visit context: referrer, browser, country, time-on-page. The URL is the actual `/shared/<token>` path.
2. **`share-link-view` custom event** (backend-fired) — captures recipe identity: `recipeId` and `recipeName`. This is the authoritative count of shared recipe accesses.

This is intentional. The page view provides session/traffic context; the backend event provides recipe-level data. They serve different analytical purposes and are not double-counted as the same metric.

---

## Backend Integration (`apps/api`)

### Module Structure

A dedicated `UmamiModule` is created in `apps/api/src/umami/`. It imports `HttpModule` (from `@nestjs/axios`) and exports `UmamiService`. `UmamiModule` is imported in `AppModule`.

`HttpModule` is configured with a **2-second timeout** so that an unreachable Umami instance does not hold open connections on every shared recipe request:

```ts
HttpModule.register({ timeout: 2000 })
```

### UmamiService

`UmamiService` exposes a single public method:

```ts
trackEvent(eventName: string, data: Record<string, string | number | boolean>): void
```

The method is fire-and-forget and returns `void`. If `UMAMI_URL` or `UMAMI_WEBSITE_ID` are not configured, the method returns immediately without making any HTTP call. Errors (including timeouts) are explicitly suppressed via a no-op error handler to prevent unhandled RxJS errors:

```ts
this.httpService.post(`${umamiUrl}/api/send`, {
  type: 'event',
  payload: {
    website: websiteId,
    name: eventName,
    data,
    // Hardcoded literal string — do NOT substitute the actual token value.
    // All share-link views are grouped under this single canonical URL
    // in the Umami dashboard regardless of which token was used.
    url: '/shared/[token]',
    hostname: this.configService.get('APP_HOSTNAME'),
  }
}).subscribe({ error: () => {} })
```

### Integration Point

`RecipesService` calls `UmamiService.trackEvent('share-link-view', { recipeId, recipeName })` after a share token is successfully validated, before returning the recipe response.

### Backend Event

| Event | Trigger | Payload |
|---|---|---|
| `share-link-view` | Share token validated in `RecipesService` | `{ recipeId: string, recipeName: string }` |

---

## Configuration

The frontend script and the backend `UmamiService` target the **same Umami website** in each environment. `UMAMI_WEBSITE_ID` (backend) and `NEXT_PUBLIC_UMAMI_WEBSITE_ID` (frontend) must hold the same value. Each environment (local, production) uses a separate Umami site so data is isolated.

**`apps/api/.env`**
```
UMAMI_URL=http://<lxc-ip>:3000
UMAMI_WEBSITE_ID=<env-specific-site-id>
APP_HOSTNAME=localhost           # production: the actual domain, e.g. recipe-manager.example.com
```

**`apps/web/.env`**
```
NEXT_PUBLIC_UMAMI_SCRIPT_URL=http://<lxc-ip>:3000/script.js
NEXT_PUBLIC_UMAMI_WEBSITE_ID=<env-specific-site-id>   # same value as UMAMI_WEBSITE_ID above
```

`APP_HOSTNAME`, `UMAMI_URL`, and `UMAMI_WEBSITE_ID` are **new env vars introduced by this feature** and must be added to `apps/api/.env.example`. `NEXT_PUBLIC_UMAMI_SCRIPT_URL` and `NEXT_PUBLIC_UMAMI_WEBSITE_ID` must be added to `apps/web/.env.example`. All five vars should have placeholder values and comments in the example files.

`APP_HOSTNAME` must match the actual domain serving the app — it appears as the hostname dimension in the Umami dashboard. Setting it incorrectly (e.g., using `localhost` in production) groups events under the wrong hostname.

The app runs fully without analytics configured — all vars are optional.

---

## Documentation

As part of this feature, a new file `docs/user-analytics.md` is created at the **monorepo root** (i.e., `/docs/user-analytics.md`). It is operator-facing — intended for the application manager as a quick reference for all tracked events. It documents every event (frontend and backend) with: event name, whether it is frontend- or backend-fired, trigger description, and payload fields. It does not duplicate infrastructure or configuration details from this spec.

---

## Out of Scope

- Surfacing analytics data inside the app UI (the Umami dashboard is the interface)
- User-facing activity stats (the "Hoy" view placeholders remain marked "Proximamente")
- Admin-level per-user or per-household breakdowns inside the app
- Filtering bot traffic on shared recipe page views (handled by Umami's built-in bot filtering)
