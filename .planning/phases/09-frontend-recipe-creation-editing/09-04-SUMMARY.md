---
phase: 09-frontend-recipe-creation-editing
plan: 04
subsystem: ui
tags: [react, next.js, tanstack-query, formdata, multipart-upload, image-management]

# Dependency graph
requires:
  - phase: 09-01
    provides: detail page with tab editor and edit mode infrastructure
  - phase: 04-backend-recipe-crud
    provides: POST /api/recipes/:id/images and DELETE /api/recipes/:id/images/:imageId endpoints
provides:
  - ConfirmDialog primitive (inline confirmation for destructive actions)
  - ImageUpload component (FormData multipart upload, image grid, delete with confirmation)
  - Fotos tab wired in recipe detail page editor
affects:
  - 09-05 (settings tab, same detail page)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - FormData multipart upload via raw fetch (not api-client) — avoid setting Content-Type to allow browser boundary
    - Inline ConfirmDialog (not modal overlay) rendered below triggering element
    - confirmDeleteId state pattern for showing per-item confirm dialogs without a global modal

key-files:
  created:
    - apps/web/src/components/ui/ConfirmDialog.tsx
    - apps/web/src/components/recipes/editor/ImageUpload.tsx
    - apps/web/src/components/__tests__/ImageManagement.test.tsx
  modified:
    - apps/web/src/app/(app)/recipes/[slug]/page.tsx

key-decisions:
  - "FormData upload uses raw fetch (not api-client) — browser must set Content-Type with multipart boundary"
  - "confirmDeleteId is a string | null in ImageUpload state — null means no dialog, string means show dialog for that image ID"
  - "ConfirmDialog is inline (renders below trigger element) not a modal — avoids portal complexity and matches mobile patterns"
  - "getByRole('img') unreliable in test environment due to overflow-hidden container — use container.querySelector('img') instead"

patterns-established:
  - "Inline confirm dialogs: store pendingId in state, render ConfirmDialog adjacent to the triggering item"
  - "Multipart file upload: always use raw fetch with FormData, credentials: 'include', never set Content-Type"

requirements-completed: [IMG-01, IMG-02]

# Metrics
duration: 2min
completed: 2026-03-18
---

# Phase 09 Plan 04: Image Upload and Management Summary

**ImageUpload component with FormData multipart upload, 2-column image grid, and inline ConfirmDialog for delete — wired into Fotos tab of recipe detail editor**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-18T21:20:31Z
- **Completed:** 2026-03-18T21:21:57Z
- **Tasks:** 1
- **Files modified:** 4

## Accomplishments
- Created ConfirmDialog primitive (inline, not modal) with cancel/confirm buttons and destructive styling
- Created ImageUpload component: dashed upload zone (empty state), 2-column grid (images present), FormData multipart upload via raw fetch, delete with inline confirmation
- Wired Fotos tab in recipe detail page to use real ImageUpload component (replaced placeholder div)
- Added 7 tests covering all behaviors: empty state, image grid, confirm dialog, fetch call with FormData, callback invocations

## Task Commits

1. **Task 1: Create ConfirmDialog, ImageUpload components, tests, and wire into detail page** - `6cca7f2` (feat)

## Files Created/Modified
- `apps/web/src/components/ui/ConfirmDialog.tsx` - Inline confirmation dialog for destructive actions
- `apps/web/src/components/recipes/editor/ImageUpload.tsx` - Upload zone, image grid, delete with confirmation
- `apps/web/src/app/(app)/recipes/[slug]/page.tsx` - Fotos tab now renders ImageUpload instead of placeholder
- `apps/web/src/components/__tests__/ImageManagement.test.tsx` - 7 tests for ImageUpload and ConfirmDialog

## Decisions Made
- FormData upload uses raw fetch (not api-client) so the browser can set the correct multipart Content-Type with boundary
- confirmDeleteId state pattern (string | null) used for per-image confirm dialogs without a global modal
- ConfirmDialog is inline (not a modal overlay) — simpler, no portal, matches mobile-first design
- Fixed test: `getByRole('img')` was unreliable in jsdom with overflow-hidden container; switched to `container.querySelector('img')`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed failing test selector**
- **Found during:** Task 1 (verification)
- **Issue:** `screen.getByRole('img')` failed to find img element in jsdom when rendered inside overflow-hidden container
- **Fix:** Changed to `container.querySelector('img')` which directly queries the DOM
- **Files modified:** apps/web/src/components/__tests__/ImageManagement.test.tsx
- **Verification:** All 54 tests pass
- **Committed in:** 6cca7f2 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - bug in test selector)
**Impact on plan:** Minimal — test selector fix only, no behavior changes.

## Issues Encountered
None beyond the test selector issue documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Image management complete — Fotos tab fully functional in editor
- Ready for Plan 09-05: recipe settings tab (delete recipe, share link management)

---
*Phase: 09-frontend-recipe-creation-editing*
*Completed: 2026-03-18*
