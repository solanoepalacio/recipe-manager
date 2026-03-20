---
phase: 13-cli-scaffold
plan: 01
subsystem: cli
tags: [python, click, requests, pytest, pyproject, pip]

# Dependency graph
requires: []
provides:
  - rmapi pip-installable package at tools/rmapi/
  - rmapi binary entry point via pyproject.toml [project.scripts]
  - Config dataclass reading RMAPI_BASE_URL/RMAPI_TOKEN from env
  - RmapiError hierarchy (AuthError/NotFoundError/ValidationError/ApiError) with typed exit codes
  - raise_for_status() mapping HTTP status codes to exit codes 1/2/3/4
  - apply_fields() field projection utility for --fields option
  - require_yes() destructive-command guard using sys.stdin.isatty()
  - HTTP client wrapper (get/post/patch/delete/put) in http.py
  - Root CLI group with recipes sub-group placeholder
  - 28-test suite covering CLI-01 through CLI-05
affects: [14-cli-auth, 15-cli-recipes, 16-cli-images, 17-cli-meal-plan, 18-cli-foods-units]

# Tech tracking
tech-stack:
  added:
    - click 8.3.1 (installed in .venv via pip install -e tools/rmapi/[dev])
    - requests 2.32.3 (installed in .venv)
    - pytest 9.0.2 (dev dependency)
    - setuptools (build backend for pyproject.toml editable install)
  patterns:
    - Click groups-of-groups grammar: cli > recipes > list
    - ClickException subclass with custom show() for JSON stderr
    - Config dataclass from_env() for env-var credential loading
    - CliRunner() without mix_stderr (click 8.2+ always separates stderr into result.stderr)
    - result.stdout for pure stdout assertions (result.output mixes stdout+stderr in click 8.3.1)

key-files:
  created:
    - tools/rmapi/pyproject.toml
    - tools/rmapi/rmapi/__init__.py
    - tools/rmapi/rmapi/cli.py
    - tools/rmapi/rmapi/config.py
    - tools/rmapi/rmapi/errors.py
    - tools/rmapi/rmapi/utils.py
    - tools/rmapi/rmapi/http.py
    - tools/rmapi/rmapi/commands/__init__.py
    - tools/rmapi/rmapi/commands/recipes.py
    - tools/rmapi/tests/conftest.py
    - tools/rmapi/tests/test_config.py
    - tools/rmapi/tests/test_errors.py
    - tools/rmapi/tests/test_fields.py
    - tools/rmapi/tests/test_yes_guard.py
  modified: []

key-decisions:
  - "click 8.3.1 removes mix_stderr from CliRunner.__init__() — use CliRunner() with no args; stderr always in result.stderr; stdout in result.stdout (not result.output which mixes both)"
  - "recipes list placeholder calls Config.from_env() to validate credentials even without making HTTP requests — required for CLI-01 tests to pass"
  - "pip install uses .venv at repo root per project convention — system Python 3.13 has no pip module"

patterns-established:
  - "CliRunner() with no args (click 8.3.1+): result.stderr for errors, result.stdout for pure stdout"
  - "RmapiError.show() override writes JSON only — never calls super().show() to avoid 'Error:' prefix"
  - "Config.from_env() strips trailing slash from base_url to prevent double-slash in URLs"
  - "All placeholder commands call Config.from_env() to enforce auth even before Phase 15+ implementation"

requirements-completed: [CLI-01, CLI-02, CLI-03, CLI-04, CLI-05]

# Metrics
duration: 3min
completed: 2026-03-20
---

# Phase 13 Plan 01: CLI Scaffold Summary

**Installable Python CLI package at tools/rmapi/ with Click 8 grammar, env-var auth, typed JSON error taxonomy (exit codes 0/1/2/3/4), --fields projection, --yes guard, and 28 passing tests covering CLI-01 through CLI-05.**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-20T18:39:25Z
- **Completed:** 2026-03-20T18:42:30Z
- **Tasks:** 3
- **Files modified:** 14

## Accomplishments
- `pip install -e tools/rmapi/[dev]` installs rmapi binary and dev deps into .venv
- `rmapi --help` shows recipes sub-group; `rmapi recipes --help` shows list subcommand
- Missing env vars produce JSON to stderr with exit code 1; HTTP errors map to exit codes 2/3/4
- Full test suite (28 tests) green: config, error taxonomy, field projection, yes guard

## Task Commits

Each task was committed atomically:

1. **Task 1: Create pyproject.toml and package directory structure** - `c40c1ad` (chore)
2. **Task 2: Implement core modules** - `034c25e` (feat)
3. **Task 3: Create test suite and verify all tests pass** - `4f402e9` (test)

**Plan metadata:** (docs commit — this file)

## Files Created/Modified
- `tools/rmapi/pyproject.toml` - Package metadata, entry point `rmapi = "rmapi.cli:cli"`, click/requests/pytest deps
- `tools/rmapi/rmapi/cli.py` - Root Click group; registers recipes sub-group
- `tools/rmapi/rmapi/config.py` - Config dataclass; reads RMAPI_BASE_URL/RMAPI_TOKEN; strips trailing slash
- `tools/rmapi/rmapi/errors.py` - RmapiError hierarchy + raise_for_status(); JSON stderr, typed exit codes
- `tools/rmapi/rmapi/utils.py` - apply_fields() for --fields projection; require_yes() for destructive guards
- `tools/rmapi/rmapi/http.py` - HTTP client wrapper (get/post/patch/delete/put)
- `tools/rmapi/rmapi/commands/recipes.py` - Placeholder recipes group with list stub that validates credentials
- `tools/rmapi/tests/conftest.py` - CliRunner fixture (click 8.3.1 compatible)
- `tools/rmapi/tests/test_config.py` - CLI-01: env-var auth validation tests
- `tools/rmapi/tests/test_errors.py` - CLI-02+CLI-03: JSON stderr + exit code tests
- `tools/rmapi/tests/test_fields.py` - CLI-04: apply_fields() tests
- `tools/rmapi/tests/test_yes_guard.py` - CLI-05: require_yes() tests

## Decisions Made

- **click 8.3.1 CliRunner API change:** `mix_stderr` parameter was removed from `CliRunner.__init__()` in click 8.2+. In 8.3.1, stderr is always separated into `result.stderr` and also mixed into `result.output`. Fixed tests to use `result.stdout` for pure stdout assertions (only contains actual stdout).
- **Placeholder command auth validation:** The `recipes list` placeholder calls `Config.from_env()` even though it makes no HTTP requests. This ensures CLI-01 tests pass and the binary correctly rejects missing credentials before Phase 15 adds real implementation.
- **Venv for pip:** System Python 3.13 has no pip module. Used `.venv/bin/pip` per project convention (feedback_python_venv memory rule).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed click 8.3.1 CliRunner incompatibility**
- **Found during:** Task 3 (test suite creation)
- **Issue:** `CliRunner(mix_stderr=False)` raises `TypeError: unexpected keyword argument 'mix_stderr'` in click 8.3.1 — parameter was removed in click 8.2+
- **Fix:** Changed `conftest.py` to use `CliRunner()` with no args; updated `test_yes_guard.py` to use `result.stdout` instead of `result.output` for pure stdout assertion
- **Files modified:** `tools/rmapi/tests/conftest.py`, `tools/rmapi/tests/test_yes_guard.py`
- **Verification:** All 28 tests pass
- **Committed in:** `4f402e9` (Task 3 commit)

**2. [Rule 1 - Bug] Placeholder recipes list validates credentials**
- **Found during:** Task 3 (running test suite)
- **Issue:** `recipes list` placeholder echoed `[]` without calling `Config.from_env()` — tests expecting exit code 1 on missing env vars got exit code 0
- **Fix:** Added `Config.from_env()` call in placeholder before echoing `[]`
- **Files modified:** `tools/rmapi/rmapi/commands/recipes.py`
- **Verification:** test_missing_base_url_exits_1, test_missing_token_exits_1, test_missing_both_exits_1 all pass
- **Committed in:** `4f402e9` (Task 3 commit)

---

**Total deviations:** 2 auto-fixed (Rule 1 — bugs)
**Impact on plan:** Both fixes were necessary for correctness. No scope creep.

## Issues Encountered
- System Python 3.13 has no pip module — used `.venv/bin/pip` from project's existing virtualenv

## Next Phase Readiness
- rmapi binary installed and working in .venv; all 5 requirements (CLI-01 through CLI-05) verified
- Phase 14 (auth commands) and Phase 15 (recipe commands) can import and extend `rmapi.commands.recipes`
- HTTP client (http.py) ready for all Phases 14-18 to call API endpoints

---
*Phase: 13-cli-scaffold*
*Completed: 2026-03-20*
