---
phase: quick
plan: 260319-qsa
subsystem: ui
tags: [react, nextjs, tailwind, forms, gender, dateOfBirth]

requires:
  - phase: quick/260319-qas
    provides: gender and dateOfBirth required on backend User model and shared types

provides:
  - Profile edit form with gender dropdown and date-of-birth input wired to PATCH /api/profile
  - Admin create-member form with required gender and dateOfBirth fields
  - Admin edit-member form pre-filled with user gender and dateOfBirth

affects: []

tech-stack:
  added: []
  patterns:
    - Gender enum values used as <option value> in <select> elements
    - Shared type enum imported in frontend for type-safe select binding

key-files:
  created: []
  modified:
    - apps/web/src/app/(app)/profile/page.tsx
    - apps/web/src/app/(admin)/admin/panel/households/page.tsx

key-decisions:
  - "Gender select uses Gender enum values as <option value> attributes — ensures type-safe binding and API-compatible payloads without runtime conversion"
  - "formMemberGender typed as string (not Gender enum) in admin page — matches AdminUserResponse.gender: string from shared types"

patterns-established: []

requirements-completed: []

duration: 2min
completed: 2026-03-19
---

# Quick Task 260319-qsa Summary

**Gender dropdown (Masculino/Femenino/Otro) and date-of-birth date input added to profile edit page and admin create/edit member forms, wired to their respective API mutation payloads**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-19T19:47:36Z
- **Completed:** 2026-03-19T19:49:30Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Profile edit page now shows gender select and date-of-birth input pre-filled from profile data; saving includes both fields in PATCH /api/profile payload
- Admin create-member form requires gender and dateOfBirth (both marked required); fields sent in POST /admin/users body
- Admin edit-member form pre-fills gender and dateOfBirth from existing user data; fields sent in PATCH /admin/users/:id body

## Task Commits

Each task was committed atomically:

1. **Task 1: Add gender and dateOfBirth to profile edit form** - `4a60dbb` (feat)
2. **Task 2: Add gender and dateOfBirth to admin create/edit member forms** - `44e0ffb` (feat)

## Files Created/Modified
- `apps/web/src/app/(app)/profile/page.tsx` - Added Gender import, gender/dateOfBirth state, two form fields, updated handleSave payload
- `apps/web/src/app/(admin)/admin/panel/households/page.tsx` - Added Gender import, formMemberGender/formMemberDateOfBirth state, reset in closeForm, populate in handleOpenEditMember, gender select + date input in JSX, updated mutation payloads

## Decisions Made
- Gender select uses Gender enum values directly as `<option value>` — no runtime conversion needed, values match API expectations exactly
- Admin page types `formMemberGender` as `string` (not `Gender` enum) to match `AdminUserResponse.gender: string` — avoids unnecessary casting

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All three forms now send gender and dateOfBirth to the API
- Backend was already accepting these fields; UI was the only gap
