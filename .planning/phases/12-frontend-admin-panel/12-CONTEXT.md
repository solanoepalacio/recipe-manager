# Phase 12: Frontend Admin Panel - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the full frontend admin panel: admin login at `/admin/login`, first-time setup wizard at `/setup`, and a dedicated admin panel at `/admin/panel/*` covering Users, Households, Foods, Units, and API Tokens management. Includes a small backend addition (`GET /admin/auth/me`) needed to support the `AdminAuthProvider` session check.

</domain>

<decisions>
## Implementation Decisions

### Admin panel section routing
- Each section is a **separate Next.js route**: `/admin/panel/users`, `/admin/panel/households`, `/admin/panel/foods`, `/admin/panel/units`, `/admin/panel/tokens`
- `/admin/panel` (root) redirects immediately to `/admin/panel/users`
- Unauthenticated admin navigating to any `/admin/panel/*` route redirects to `/admin/login` (same guard pattern as user `ProtectedLayout`)
- New route group `(admin)` under `apps/web/src/app/` — separate from `(app)` and `(auth)`

### Admin API client
- Separate `apps/web/src/lib/admin-api-client.ts` — thin wrapper around the base `api-client.ts` request helper that catches 401 responses and redirects to `/admin/login`
- All admin data hooks import from `admin-api-client`, not `api-client` directly
- Keeps admin error handling centralized; no risk of mixing user/admin redirect logic

### Admin auth check
- `AdminAuthProvider` calls `GET /admin/auth/me` on mount to verify the session
- This endpoint does **not exist yet** — add `GET /admin/auth/me` to the backend in plan 12-01 alongside the admin login work
- Returns `{ id, email, name }` when authenticated, 401 otherwise
- Pattern mirrors `AuthProvider` → `GET /auth/me` exactly

### Backend addition (scoped to plan 12-01)
- Add `GET /admin/auth/me` route to `AdminAuthController` protected by `AdminAuthGuard`
- Add `AdminMeResponse` type to `packages/shared/src/api/admin.ts`
- This is the only backend change in Phase 12

### Setup wizard guard (client-side)
- `/setup` page calls `GET /api/setup` (`{ required: boolean }`) on mount
- If `required: false` → redirect to `/admin/login` (admin already exists)
- If `required: true` → show the setup form
- SetupGuard on the backend also returns 404 for POST if admin exists (double protection)

### Claude's Discretion
- Exact `admin-api-client.ts` wrapper implementation (how 401 interception is done)
- Loading skeleton design for admin data tables
- `AdminAuthProvider` isLoading/isAuthenticated state shape
- Whether `AdminMeResponse` is a new type or reuses an existing admin type

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### UI design contract
- `.planning/phases/12-frontend-admin-panel/12-UI-SPEC.md` — Complete visual and interaction spec: shell layout, components, copy, color, spacing, interaction contracts for every admin screen. Status: draft (checker sign-off pending but content is the authoritative design guide).

### API contract
- `mvp_plans/03_api_design.md` — All admin endpoints: `/admin/auth/login`, `/admin/auth/logout`, `/admin/users`, `/admin/households`, `/admin/foods`, `/admin/units`, `/admin/tokens`. Also `/setup` (GET + POST). Route shapes, guards, query params.

### Shared types
- `packages/shared/src/api/admin.ts` — Existing admin response types (`AdminUserResponse`, `AdminHouseholdResponse`, `AdminFoodResponse`, `AdminUnitResponse`, `AdminTokenResponse`, `AdminTokenCreatedResponse`). `AdminMeResponse` must be added here in plan 12-01.
- `packages/shared/src/api/setup.ts` — `SetupStatusResponse`, `CreateAdminRequest`, `SetupResponse`

### Existing auth patterns (reference for admin equivalents)
- `apps/web/src/lib/auth.tsx` — `AuthProvider` + `useAuth` implementation pattern; `AdminAuthProvider` mirrors this
- `apps/web/src/lib/api-client.ts` — Base request helper; `admin-api-client.ts` wraps this
- `apps/web/src/app/(app)/layout.tsx` — `ProtectedLayout` redirect pattern; admin layout guard follows the same shape

### Project conventions
- `mvp_plans/07_project_structure.md` — Folder structure, naming conventions, test layout

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ConfirmDialog` (`components/ui/ConfirmDialog.tsx`) — all delete confirmations in admin tables
- `Skeleton` (`components/ui/Skeleton.tsx`) — loading states for admin data tables
- `BottomSheet` (`components/ui/BottomSheet.tsx`) — create/edit forms on mobile breakpoint
- `TopBar` (`components/layout/TopBar.tsx`) — admin top bar on mobile
- `PaginationControls` (`components/recipes/PaginationControls.tsx`) — paginated admin lists (users, households, tokens); page size options 10, 25, 50

### Established Patterns
- **Auth provider pattern**: `AuthProvider` in `lib/auth.tsx` calls `/auth/me` on mount, exposes `{ user, isLoading }` via context. `AdminAuthProvider` follows the same shape with `/admin/auth/me`.
- **Protected layout**: `ProtectedLayout` in `(app)/layout.tsx` reads `{ user, isLoading }` from `AuthProvider`, shows skeleton while loading, redirects on `!user`. Admin layout guard is identical.
- **API client**: `lib/api-client.ts` — `credentials: 'include'`, throws `Error` with `.status` on non-OK. Does not redirect. `admin-api-client.ts` wraps this and adds redirect on 401.
- **Route groups**: `(app)` = authenticated user routes, `(auth)` = login/signup. `(admin)` is a new group.
- **ConfirmDialog usage**: inline below table rows, not a portal/overlay modal. Delete tap → confirm dialog appears in DOM below the row.

### Integration Points
- `apps/web/src/app/(admin)/layout.tsx` — new admin layout wrapping `AdminAuthProvider` + admin shell
- `packages/shared/src/api/admin.ts` — add `AdminMeResponse` here
- `apps/api/src/admin/auth/admin-auth.controller.ts` — add `GET /admin/auth/me` here
- `apps/api/src/admin/admin.module.ts` — already wires all admin controllers; no new wiring needed beyond the me endpoint

</code_context>

<specifics>
## Specific Ideas

- No specific product references — UI-SPEC covers all visual decisions; standard Next.js nested routing for section pages

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 12-frontend-admin-panel*
*Context gathered: 2026-03-19*
