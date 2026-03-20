---
phase: 15-recipe-read-commands
plan: "01"
subsystem: cli
tags: [python, click, rmapi, tdd, pytest]

# Dependency graph
requires:
  - phase: 14-lookup-commands
    provides: test pattern (patch requests.get, CliRunner fixture, apply_fields utility)
  - phase: 13-cli-scaffold
    provides: rmapi package structure, http.get, errors.raise_for_status, cli.add_command(recipes)
provides:
  - rmapi recipes list command with 6 query param flags
  - rmapi recipes get <id> command with --fields projection
  - 9 passing tests covering RCP-01 and RCP-02
affects: [16-recipe-write-commands, skills/recipes.md]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - TDD RED/GREEN: write 9 failing tests against placeholder, then implement to pass
    - None-filtering params dict: {k:v for k,v in {...}.items() if v is not None}
    - Pagination wrapper preservation: {**data, "items": apply_fields(data["items"], fields)}

key-files:
  created:
    - tools/rmapi/tests/test_recipes.py
  modified:
    - tools/rmapi/rmapi/commands/recipes.py

key-decisions:
  - "food_id (--food-id) maps to foodId in params dict; per_page (--per-page) maps to pageSize — API expects camelCase"
  - "--fields on list applies apply_fields to data['items'] only, then rebuilds wrapper with {**data, 'items': projected} so pagination metadata is preserved"
  - "http.get calls raise_for_status internally — no explicit error handling in command; 404 automatically exits 3 via NotFoundError"
  - "--sort uses click.Choice(['name', 'createdAt', 'updatedAt', 'random']) for validation at CLI layer"

patterns-established:
  - "Param projection: Python snake_case CLI vars mapped to camelCase API params via explicit dict key names"
  - "Wrapper-preserving fields: {**data, 'items': apply_fields(data['items'], fields)} pattern for paginated endpoints"

requirements-completed: [RCP-01, RCP-02]

# Metrics
duration: 2min
completed: 2026-03-20
---

# Phase 15 Plan 01: Recipe Read Commands Summary

**rmapi recipes list (6 query flags) and recipes get <id> with --fields projection via TDD, 9 tests green**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-20T19:53:40Z
- **Completed:** 2026-03-20T19:55:10Z
- **Tasks:** 2 (TDD RED + GREEN)
- **Files modified:** 2

## Accomplishments
- `rmapi recipes list` with --search, --food-id, --sort, --order, --page, --per-page, --fields flags
- `rmapi recipes get <id>` with --fields top-level projection
- Correct camelCase param mapping (foodId, pageSize) and None-filtering
- Pagination wrapper preserved when --fields applied to list items
- 9 new tests + 34 existing = 43 total tests passing

## Task Commits

Each task was committed atomically:

1. **Task 1: Write failing tests for recipes list and recipes get** - `0304a96` (test)
2. **Task 2: Implement recipes list and recipes get commands** - `7a4e7f4` (feat)

_Note: TDD tasks have two commits (test RED → feat GREEN)_

## Files Created/Modified
- `tools/rmapi/tests/test_recipes.py` - 9 test functions covering RCP-01 (list) and RCP-02 (get)
- `tools/rmapi/rmapi/commands/recipes.py` - Full implementation replacing placeholder stub

## Decisions Made
- `food_id` CLI var maps to `"foodId"` param key; `per_page` maps to `"pageSize"` — API expects camelCase, Click normalizes hyphens to underscores
- `--fields` on `list` uses `{**data, "items": apply_fields(data["items"], fields)}` pattern to project items while preserving total/page/perPage wrapper keys
- No explicit `try/except` needed: `http.get` calls `raise_for_status` which raises `NotFoundError` (exit 3) on 404 automatically
- `--sort` and `--order` use `click.Choice` for validation — invalid values rejected at CLI layer before any HTTP call

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `recipes list` and `recipes get` are stable read commands that write commands (Phase 16) can reference for output shapes
- All 43 rmapi tests green; no blockers for Phase 16

---
*Phase: 15-recipe-read-commands*
*Completed: 2026-03-20*
