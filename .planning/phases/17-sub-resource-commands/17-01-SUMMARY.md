---
phase: 17-sub-resource-commands
plan: "01"
subsystem: cli
tags: [python, click, rmapi, tdd, sections, steps, ingredients]

# Dependency graph
requires:
  - phase: 16-recipe-write-commands
    provides: recipes write commands (create, update, delete, duplicate, add-image) in rmapi
provides:
  - sections CLI group with add, update, delete, reorder subcommands
  - steps CLI group with add, update, delete, reorder subcommands
  - ingredients stub CLI group (for Plan 02)
  - cli.py registers sections, ingredients, steps alongside existing groups
affects:
  - 17-02 (ingredients commands will build on the ingredients stub registered here)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "sparse body dict comprehension filters None values: {k:v for k,v in {...}.items() if v is not None}"
    - "step_body parameter rename avoids variable shadowing in sparse body comprehension"
    - "require_yes(yes) called before HTTP in delete commands"
    - "reorder commands use http.put and emit {ok: True} unconditionally (backend returns empty body)"

key-files:
  created:
    - tools/rmapi/rmapi/commands/sections.py
    - tools/rmapi/rmapi/commands/steps.py
    - tools/rmapi/rmapi/commands/ingredients.py
    - tools/rmapi/tests/test_sections.py
    - tools/rmapi/tests/test_steps.py
  modified:
    - tools/rmapi/rmapi/cli.py

key-decisions:
  - "step_body used as Python param name for --body option in steps to avoid shadowing the body dict variable in sparse comprehension"
  - "ingredients.py is a stub only — full implementation deferred to Plan 02"
  - "reorder emits {ok: True} unconditionally because PUT /reorder returns empty body on the backend"

patterns-established:
  - "Sub-resource commands follow same sparse body pattern as recipes: only supplied fields in PATCH body"
  - "Delete commands always guard with require_yes(yes) before any HTTP call"

requirements-completed: [SEC-01, SEC-02, SEC-03, SEC-04, STP-01, STP-02, STP-03, STP-04]

# Metrics
duration: 2min
completed: 2026-03-20
---

# Phase 17 Plan 01: Sub-Resource Commands (Sections + Steps) Summary

**8 Click subcommands for sections and steps (add/update/delete/reorder) with TDD, sparse bodies, and --yes guards; ingredients stub registered in cli.py for Plan 02**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-20T20:37:56Z
- **Completed:** 2026-03-20T20:39:36Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Created test_sections.py (6 tests) and test_steps.py (7 tests) covering SEC-01 through SEC-04 and STP-01 through STP-04
- Implemented sections.py with add, update, delete, reorder subcommands using sparse body, require_yes guard, and http.put for reorder
- Implemented steps.py with add, update, delete, reorder subcommands with step_body rename to prevent variable collision
- Created ingredients.py stub and updated cli.py to register all 3 new command groups
- Full rmapi test suite: 67/67 passing

## Task Commits

Each task was committed atomically:

1. **Task 1: Write failing tests, create stub files, register groups in cli.py** - `1d6e347` (test)
2. **Task 2: Implement sections and steps commands** - `82262cb` (feat)

_Note: TDD tasks — Task 1 is RED (failing tests + stubs), Task 2 is GREEN (full implementation)_

## Files Created/Modified
- `tools/rmapi/tests/test_sections.py` - 6 tests covering SEC-01 through SEC-04
- `tools/rmapi/tests/test_steps.py` - 7 tests covering STP-01 through STP-04
- `tools/rmapi/rmapi/commands/sections.py` - 4 subcommands: add, update, delete, reorder
- `tools/rmapi/rmapi/commands/steps.py` - 4 subcommands: add, update, delete, reorder
- `tools/rmapi/rmapi/commands/ingredients.py` - stub group for Plan 02
- `tools/rmapi/rmapi/cli.py` - registers sections, ingredients, steps command groups

## Decisions Made
- `step_body` used as Python parameter name for `--body` option in steps commands to avoid shadowing the `body` dict variable in the sparse comprehension
- `ingredients.py` is a stub only — full ingredient commands are Plan 02's scope
- Reorder commands emit `{"ok": True}` unconditionally because the backend PUT /reorder returns an empty body

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Plan 02 can immediately start implementing ingredients commands — the stub and cli registration are already in place
- All 8 sections/steps commands are ready for agent use once RMAPI_BASE_URL and RMAPI_TOKEN are configured

---
*Phase: 17-sub-resource-commands*
*Completed: 2026-03-20*
