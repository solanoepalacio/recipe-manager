---
phase: 14-lookup-commands
plan: "01"
subsystem: cli
tags: [python, click, pytest, rmapi, foods, units]

# Dependency graph
requires:
  - phase: 13-cli-scaffold
    provides: rmapi package scaffold with http.py, utils.py, cli.py, and recipes placeholder command
provides:
  - foods Click group with lookup subcommand (client-side case-insensitive name filtering)
  - units Click group with list subcommand (full array passthrough)
  - Both commands registered in cli.py
  - LOOK-01 and LOOK-02 test coverage (6 tests)
affects:
  - 15-recipe-commands (uses food IDs and unit IDs resolved by these lookup commands)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Client-side filtering: fetch full list from API, filter in Python, emit matched subset
    - Case-insensitive set membership via .lower() normalization on both sides
    - apply_fields() projection applied after filtering — consistent with recipes.py pattern

key-files:
  created:
    - tools/rmapi/rmapi/commands/foods.py
    - tools/rmapi/rmapi/commands/units.py
    - tools/rmapi/tests/test_foods.py
    - tools/rmapi/tests/test_units.py
  modified:
    - tools/rmapi/rmapi/cli.py

key-decisions:
  - "Client-side name filtering: fetch all foods from GET /api/foods and filter by name_set — API has no name filter query param"
  - "Case-insensitive match via .lower() on both query names and API response names — agent names may differ in case from stored values"
  - "Non-matching names silently omitted with exit code 0 — empty array is valid result, not an error"

patterns-established:
  - "Lookup command pattern: http.get() -> filter/transform -> apply_fields() -> json.dumps() -> click.echo()"
  - "TDD red-green: write failing tests first, confirm failure, then implement to pass"

requirements-completed:
  - LOOK-01
  - LOOK-02

# Metrics
duration: 2min
completed: 2026-03-20
---

# Phase 14 Plan 01: Lookup Commands Summary

**foods lookup (client-side case-insensitive name filter against GET /api/foods) and units list (full GET /api/units passthrough) with --fields projection and 6 passing tests**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-20T19:06:48Z
- **Completed:** 2026-03-20T19:08:48Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- LOOK-01: `rmapi foods lookup --names "tomato,chicken"` resolves food names to IDs with case-insensitive matching; unmatched names silently omitted
- LOOK-02: `rmapi units list` returns full `{id, name, abbreviation}` array from GET /api/units
- Both commands support `--fields` projection via shared `apply_fields()` utility
- All 34 tests pass including Phase 13 tests

## Task Commits

Each task was committed atomically:

1. **Task 1: Write failing test scaffolds for foods lookup and units list** - `0cd45e7` (test)
2. **Task 2: Implement foods and units commands + register in cli.py** - `930bbcc` (feat)

**Plan metadata:** (docs commit — see below)

_Note: TDD tasks committed separately — test (RED) then feat (GREEN)_

## Files Created/Modified
- `tools/rmapi/rmapi/commands/foods.py` - foods Click group with lookup subcommand; client-side filtering by --names, case-insensitive, with --fields projection
- `tools/rmapi/rmapi/commands/units.py` - units Click group with list subcommand; full GET /api/units passthrough with --fields projection
- `tools/rmapi/rmapi/cli.py` - registered foods and units command groups alongside recipes
- `tools/rmapi/tests/test_foods.py` - 4 tests: match, omit, case-insensitive, fields projection (LOOK-01)
- `tools/rmapi/tests/test_units.py` - 2 tests: all items, fields projection (LOOK-02)

## Decisions Made
- Client-side filtering chosen because GET /api/foods has no server-side name filter param; fetching full list and filtering in Python is the correct approach
- Case-insensitive match via `.lower()` on both sides ensures agent-provided names (which may vary in case) reliably resolve to stored food records
- Non-matching names return empty array with exit code 0 — consistent with "lookup, not validate" semantics

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `rmapi foods lookup` and `rmapi units list` are complete and tested
- Phase 15 (recipe commands) can now use food IDs and unit IDs resolved by these commands as building blocks for ingredient creation

---
*Phase: 14-lookup-commands*
*Completed: 2026-03-20*
