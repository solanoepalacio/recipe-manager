---
phase: 16-recipe-write-commands
plan: "01"
subsystem: cli
tags: [python, click, requests, rmapi, tdd, multipart]

# Dependency graph
requires:
  - phase: 15-recipe-read-commands
    provides: recipes list/get subcommands and test infrastructure
provides:
  - rmapi recipes create: POST /api/recipes with sparse body (name required, 8 optional fields)
  - rmapi recipes update: PATCH /api/recipes/:id with sparse body (all optional)
  - rmapi recipes delete: DELETE /api/recipes/:id with require_yes guard
  - rmapi recipes duplicate: POST /api/recipes/:id/duplicate
  - rmapi recipes add-image: downloads via requests.get then uploads multipart via requests.post
affects: [skills, agent-usage, recipe-management-skill-chain]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Sparse body dict comprehension: {k:v for k,v in {...}.items() if v is not None} for create/update
    - Multipart upload bypasses http.py wrapper (uses req_lib.post directly) to avoid JSON Content-Type collision
    - require_yes called BEFORE any HTTP in destructive commands

key-files:
  created: []
  modified:
    - tools/rmapi/rmapi/commands/recipes.py
    - tools/rmapi/tests/test_recipes.py

key-decisions:
  - "add-image uses requests.post directly (not http.post) because multipart/form-data conflicts with http.py's json= kwarg; only Authorization header set, Content-Type left to requests (multipart boundary auto-set)"
  - "Sparse body dict comprehension filters None values from both create and update bodies to avoid nulling fields not supplied by caller"
  - "require_yes(yes) called before http.delete to ensure non-TTY exit 4 before any network I/O"

patterns-established:
  - "Write commands follow same CLI conventions as read commands (snake_case function, kebab-case Click name)"
  - "TDD RED then GREEN per task: failing tests committed separately from implementation"

requirements-completed: [RCP-03, RCP-04, RCP-05, RCP-06, RCP-07]

# Metrics
duration: 2min
completed: 2026-03-20
---

# Phase 16 Plan 01: Recipe Write Commands Summary

**5 write subcommands (create/update/delete/duplicate/add-image) completing full recipe lifecycle over CLI with sparse-body mutation and multipart image upload**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-20T20:14:41Z
- **Completed:** 2026-03-20T20:15:59Z
- **Tasks:** 2 (TDD: RED + GREEN)
- **Files modified:** 2

## Accomplishments
- 11 new failing tests appended to test_recipes.py covering all 5 write commands (RED phase)
- 5 commands implemented: create, update, delete, duplicate, add-image (GREEN phase)
- Sparse body filtering ensures None-valued options are never sent to API
- add-image correctly downloads via requests.get then uploads multipart with Authorization header only (no Content-Type)
- Full rmapi test suite: 54 tests passing

## Task Commits

Each task was committed atomically:

1. **Task 1: Write failing tests (RED)** - `24b5227` (test)
2. **Task 2: Implement commands (GREEN)** - `523684a` (feat)

**Plan metadata:** _(docs commit follows)_

_Note: TDD tasks have two commits (test RED then feat GREEN)_

## Files Created/Modified
- `tools/rmapi/rmapi/commands/recipes.py` - Added 5 subcommands (create, update, delete, duplicate, add-image) plus new imports (io, requests as req_lib, Config, raise_for_status, require_yes)
- `tools/rmapi/tests/test_recipes.py` - Appended 11 test functions + 3 mock helpers + FAKE_IMAGE_RESPONSE constant

## Decisions Made
- `add-image` uses `requests.post` directly instead of `http.post` because multipart upload must not set `Content-Type: application/json` — only `Authorization` header is set manually; requests sets `multipart/form-data; boundary=...` automatically
- Sparse body pattern `{k: v for k, v in {...}.items() if v is not None}` used in both create and update to avoid sending fields the user did not provide
- `require_yes(yes)` called before `http.delete` so non-TTY exits with code 4 before any HTTP I/O

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Full recipe lifecycle now available over CLI: list, get, create, update, delete, duplicate, add-image
- Phase 16 complete — recipe write commands skill chain unlocked for agent usage

---
*Phase: 16-recipe-write-commands*
*Completed: 2026-03-20*
