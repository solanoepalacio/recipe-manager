# Phase 14: Lookup Commands - Research

**Researched:** 2026-03-20
**Domain:** Python Click CLI (existing rmapi package), REST API endpoint shape, client-side filtering
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| LOOK-01 | Agent can resolve multiple food names to IDs in one call — `rmapi foods lookup --names "tomato,chicken"` returns `[{name, id}]` (one HTTP request, client-side filter) | `GET /api/foods` returns raw array `[{id, name}]`; client filters by name match; no API-side filter parameter exists |
| LOOK-02 | Agent can list all units — `rmapi units list` returns `[{id, name, abbreviation}]` | `GET /api/units` returns raw array `[{id, name, abbreviation}]`; pass-through with no filtering |
</phase_requirements>

---

## Summary

Phase 14 adds two new command groups (`foods` and `units`) to the existing `rmapi` CLI package. Both commands are thin wrappers over read-only API endpoints that already exist and are already authenticated via the `AnyAuthGuard` global guard.

The `foods lookup` command fetches all foods in one request to `GET /api/foods`, then filters client-side by the comma-separated names provided via `--names`. Non-matching names are silently omitted — the agent detects gaps by comparing input names to output names. The `units list` command is a pure pass-through of `GET /api/units` with no filtering or transformation.

Both commands follow the exact patterns established in Phase 13: `http.get()` for requests, `apply_fields()` for `--fields` projection, `json.dumps()` to stdout, typed exit codes via `raise_for_status()`. No new infrastructure is needed.

**Primary recommendation:** Create `tools/rmapi/rmapi/commands/foods.py` and `tools/rmapi/rmapi/commands/units.py` as Click command groups. Register both in `cli.py` alongside the existing `recipes` group. Use `unittest.mock.patch` to mock `requests.get` in tests — same pattern as Phase 13 error tests.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| click | 8.1.8 (installed) | CLI framework — command groups, options, CliRunner | Already in pyproject.toml; all Phase 13 modules use it |
| requests | 2.32.3 (installed) | HTTP client — `http.get()` wrapper | Already in pyproject.toml; `http.py` is the established wrapper |
| pytest | installed in dev extras | Test runner — CliRunner + mock.patch | Already configured in `tool.pytest.ini_options` |

No new dependencies needed for Phase 14.

**Installation:**
```bash
# No new packages needed — existing install covers everything
pip install -e "/home/solanoe/code/recipe-manager/tools/rmapi/[dev]"
```

---

## Architecture Patterns

### Existing Structure (Phase 13 output)
```
tools/rmapi/
├── pyproject.toml           # entry point: rmapi = "rmapi.cli:cli"
├── rmapi/
│   ├── __init__.py
│   ├── cli.py               # root Click group; registers command groups
│   ├── config.py            # Config.from_env() — reads RMAPI_BASE_URL, RMAPI_TOKEN
│   ├── errors.py            # RmapiError hierarchy + raise_for_status()
│   ├── http.py              # get/post/patch/delete/put wrappers
│   ├── utils.py             # apply_fields(), require_yes()
│   └── commands/
│       ├── __init__.py
│       └── recipes.py       # placeholder group (Phase 15 implements)
└── tests/
    ├── conftest.py           # CliRunner fixture
    ├── test_config.py
    ├── test_errors.py
    ├── test_fields.py
    └── test_yes_guard.py
```

### Phase 14 Additions
```
tools/rmapi/
└── rmapi/
    └── commands/
        ├── foods.py         # NEW: foods group + lookup subcommand
        └── units.py         # NEW: units group + list subcommand
```

And `cli.py` gains two `add_command` calls.

### Pattern 1: Command Group Registration
**What:** Each domain (`foods`, `units`) is a separate module with a Click `@group` and one or more subcommands. The root `cli.py` registers each group.

**Example (from Phase 13 — recipes.py):**
```python
# tools/rmapi/rmapi/commands/recipes.py
import click
from ..config import Config

@click.group()
def recipes() -> None:
    """Recipe commands."""
    pass

@recipes.command("list")
@click.option("--fields", default=None, help="Comma-separated fields to include")
def recipes_list(fields: str | None) -> None:
    Config.from_env()
    click.echo("[]")
```

**In cli.py:**
```python
from .commands.recipes import recipes
from .commands.foods import foods    # Phase 14
from .commands.units import units    # Phase 14

cli.add_command(recipes)
cli.add_command(foods)
cli.add_command(units)
```

### Pattern 2: HTTP GET + stdout JSON
**What:** Call `http.get(path)`, apply `--fields` projection if provided, emit `json.dumps(result)` to stdout via `click.echo()`.

**Example:**
```python
import json
import click
from .. import http
from ..utils import apply_fields

@units.command("list")
@click.option("--fields", default=None, help="Comma-separated fields to include")
def units_list(fields: str | None) -> None:
    """List all units."""
    data = http.get("/api/units")
    result = apply_fields(data, fields)
    click.echo(json.dumps(result))
```

### Pattern 3: Client-side Name Filtering (LOOK-01)
**What:** `GET /api/foods` returns all foods as a flat array. The `--names` flag is a comma-separated string. Filter in Python: keep only items whose `name` matches one of the requested names (case-insensitive).

**Key design decision from requirement:** "one HTTP request, client-side filter" — do NOT add query params to the API URL.

**Example:**
```python
@foods.command("lookup")
@click.option("--names", required=True, help="Comma-separated food names to resolve")
@click.option("--fields", default=None, help="Comma-separated fields to include")
def foods_lookup(names: str, fields: str | None) -> None:
    """Resolve food names to IDs."""
    all_foods = http.get("/api/foods")
    name_set = {n.strip().lower() for n in names.split(",") if n.strip()}
    matched = [f for f in all_foods if f["name"].lower() in name_set]
    result = apply_fields(matched, fields)
    click.echo(json.dumps(result))
```

**No error on missing names** — the agent detects gaps by comparing input names to the returned `name` fields. This is explicitly specified in LOOK-01 success criterion 3.

### Pattern 4: Test with CliRunner + mock.patch
**What:** Invoke commands via `CliRunner.invoke()` and mock `requests.get` to avoid live HTTP. This is how Phase 13 tests `raise_for_status` — create a `FakeResponse` and patch at the `requests` level.

**Example test structure:**
```python
import json
from unittest.mock import patch, MagicMock
from rmapi.cli import cli

def test_units_list_returns_json_array(runner):
    fake_units = [
        {"id": "u1", "name": "gram", "abbreviation": "g"},
        {"id": "u2", "name": "cup", "abbreviation": "cup"},
    ]
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = fake_units

    with patch("requests.get", return_value=mock_resp):
        result = runner.invoke(cli, ["units", "list"], env={
            "RMAPI_BASE_URL": "http://localhost:3001",
            "RMAPI_TOKEN": "test-token",
        })

    assert result.exit_code == 0
    data = json.loads(result.stdout)
    assert data == fake_units
```

### Anti-Patterns to Avoid
- **Adding query params to `GET /api/foods`:** The requirement specifies one request + client-side filter. The backend `FoodsController` has no search/filter params — it always returns all foods.
- **Wrapping the response in `{items: [...]}` on the CLI side:** The API returns a raw array; the CLI should emit a raw array (matching LOOK-01's `[{name, id}]` contract). The `FoodListResponse` type in `packages/shared` is not used by the backend endpoint.
- **Case-sensitive name matching:** Agent-provided names may differ in case; lowercase both sides.
- **Raising an error for unmatched names:** Requirement explicitly states "no match are omitted from the result (not an error)."
- **Skipping `--fields` on lookup/list:** Every list and detail command must support `--fields` per CLI-04.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTTP auth headers | Custom header dict in each command | `http.get()` from `rmapi.http` | Already wires `Config.from_env()` + Bearer header |
| Error handling | Try/except in each command | `raise_for_status()` via `http.get()` | Already maps all HTTP error codes to typed exit codes |
| Field projection | Custom strip logic | `apply_fields(data, fields)` from `rmapi.utils` | Handles dict, list, edge cases; tested |
| Config validation | Inline env var checks | `Config.from_env()` via `http.get()` | Called automatically inside `http.get()`; exits 1 on missing vars |

---

## Common Pitfalls

### Pitfall 1: API Response Shape Mismatch
**What goes wrong:** Developer assumes `GET /api/foods` returns `{items: [...]}` (matching the `FoodListResponse` shared type) and indexes `data["items"]`.
**Why it happens:** `packages/shared/src/api/foods.d.ts` defines `FoodListResponse` with an `items` field, but the actual `FoodsController.findAll()` returns `this.prisma.food.findMany(...)` directly — a raw array.
**How to avoid:** Confirmed by reading `apps/api/src/shared/foods.controller.ts`. The controller does NOT use `FoodListResponse`. Treat the response as a plain `list[dict]`.
**Warning signs:** `TypeError: list indices must be integers or slices, not str` when accessing `data["items"]`.

### Pitfall 2: Same for Units
**What goes wrong:** Same assumption for `GET /api/units` — it also returns a raw array, not `{items: [...]}`.
**Why it happens:** `UnitsController.findAll()` also returns `this.prisma.unit.findMany(...)` directly.
**How to avoid:** Same — treat as plain `list[dict]` with keys `{id, name, abbreviation}`.

### Pitfall 3: Forgetting to Register Command Groups in cli.py
**What goes wrong:** `rmapi foods lookup --names "tomato"` raises `No such command 'foods'`.
**Why it happens:** New command modules exist but `cli.py` was not updated to call `cli.add_command(foods)`.
**How to avoid:** Update `cli.py` as part of the same plan that creates the command modules. Verify with `rmapi --help` in tests.

### Pitfall 4: CliRunner `env` Parameter
**What goes wrong:** Tests fail with config error because `RMAPI_BASE_URL`/`RMAPI_TOKEN` are not set in the test process environment.
**Why it happens:** `Config.from_env()` reads `os.environ` — not inherited in CliRunner by default.
**How to avoid:** Pass `env={"RMAPI_BASE_URL": "...", "RMAPI_TOKEN": "..."}` to `runner.invoke()`. CliRunner merges this with the process env.

### Pitfall 5: mock.patch Target Must Match Where `requests` Is Used
**What goes wrong:** `patch("requests.get", ...)` does not intercept calls made inside `rmapi.http`.
**Why it happens:** Python mock patches the name where it is looked up. Since `http.py` does `import requests` and then calls `requests.get(...)`, the correct patch target is `requests.get` (the module-level name).
**How to avoid:** Use `patch("requests.get", return_value=mock_resp)`. This is consistent with how `test_errors.py` uses `FakeResponse` — the http module always goes through `requests.get`.

---

## Code Examples

### foods.py — complete module
```python
"""Foods commands."""

import json
import click
from .. import http
from ..utils import apply_fields


@click.group()
def foods() -> None:
    """Food lookup commands."""
    pass


@foods.command("lookup")
@click.option("--names", required=True, help="Comma-separated food names to resolve to IDs")
@click.option("--fields", default=None, help="Comma-separated top-level fields to include")
def foods_lookup(names: str, fields: str | None) -> None:
    """Resolve food names to IDs. Non-matching names are omitted (not an error)."""
    all_foods = http.get("/api/foods")
    name_set = {n.strip().lower() for n in names.split(",") if n.strip()}
    matched = [f for f in all_foods if f["name"].lower() in name_set]
    result = apply_fields(matched, fields)
    click.echo(json.dumps(result))
```

### units.py — complete module
```python
"""Units commands."""

import json
import click
from .. import http
from ..utils import apply_fields


@click.group()
def units() -> None:
    """Unit commands."""
    pass


@units.command("list")
@click.option("--fields", default=None, help="Comma-separated top-level fields to include")
def units_list(fields: str | None) -> None:
    """List all units."""
    data = http.get("/api/units")
    result = apply_fields(data, fields)
    click.echo(json.dumps(result))
```

### cli.py — updated registration
```python
"""Root CLI entry point for rmapi."""

import click

from .commands.recipes import recipes
from .commands.foods import foods
from .commands.units import units


@click.group()
def cli() -> None:
    """rmapi -- Recipe Manager API CLI."""
    pass


cli.add_command(recipes)
cli.add_command(foods)
cli.add_command(units)
```

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | pytest 8.x |
| Config file | `tools/rmapi/pyproject.toml` — `[tool.pytest.ini_options] testpaths = ["tests"]` |
| Quick run command | `cd /home/solanoe/code/recipe-manager && .venv/bin/pytest tools/rmapi/tests/ -x -q` |
| Full suite command | `cd /home/solanoe/code/recipe-manager && .venv/bin/pytest tools/rmapi/tests/ -v` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LOOK-01 | `foods lookup --names "tomato,chicken"` returns `[{name, id}]` filtered from full foods list | unit | `.venv/bin/pytest tools/rmapi/tests/test_foods.py -x` | Wave 0 |
| LOOK-01 | Unmatched names omitted silently (not an error) | unit | `.venv/bin/pytest tools/rmapi/tests/test_foods.py::test_lookup_unmatched_omitted -x` | Wave 0 |
| LOOK-01 | `--fields` projection works on lookup result | unit | `.venv/bin/pytest tools/rmapi/tests/test_foods.py::test_lookup_fields_projection -x` | Wave 0 |
| LOOK-02 | `units list` returns raw array with `{id, name, abbreviation}` | unit | `.venv/bin/pytest tools/rmapi/tests/test_units.py -x` | Wave 0 |
| LOOK-02 | `--fields` projection works on units list | unit | `.venv/bin/pytest tools/rmapi/tests/test_units.py::test_units_list_fields -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `.venv/bin/pytest tools/rmapi/tests/ -x -q`
- **Per wave merge:** `.venv/bin/pytest tools/rmapi/tests/ -v`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tools/rmapi/tests/test_foods.py` — covers LOOK-01 (lookup + no-match omit + fields projection + auth error propagation)
- [ ] `tools/rmapi/tests/test_units.py` — covers LOOK-02 (list + fields projection + auth error propagation)

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `CliRunner(mix_stderr=False)` | `CliRunner()` — stderr separate by default | click 8.2+ | Use `result.stderr` for error assertions, `result.stdout` for success output |

**No deprecated items** for this phase. All patterns are established and current.

---

## Open Questions

None. The API endpoints are implemented, the response shapes are confirmed from source code, and the CLI patterns are established by Phase 13.

---

## Sources

### Primary (HIGH confidence)
- `apps/api/src/shared/foods.controller.ts` — confirmed `GET /api/foods` returns raw `findMany` array (not wrapped)
- `apps/api/src/shared/units.controller.ts` — confirmed `GET /api/units` returns raw `findMany` array with `{id, name, abbreviation}`
- `packages/shared/src/api/foods.d.ts` — `FoodResponse {id, name}` shape
- `packages/shared/src/api/units.d.ts` — `UnitResponse {id, name, abbreviation}` shape
- `tools/rmapi/rmapi/http.py` — `http.get()` wrapper pattern; `raise_for_status()` integration
- `tools/rmapi/rmapi/utils.py` — `apply_fields()` projection utility
- `tools/rmapi/rmapi/cli.py` — `cli.add_command()` registration pattern
- `tools/rmapi/rmapi/commands/recipes.py` — command group module structure
- `tools/rmapi/tests/conftest.py` — `CliRunner` fixture (no `mix_stderr` arg)
- `tools/rmapi/tests/test_errors.py` — `FakeResponse` mock + `runner.invoke()` pattern
- `.planning/REQUIREMENTS.md` — LOOK-01, LOOK-02 exact specifications

### Secondary (MEDIUM confidence)
- `packages/shared/src/api/foods.d.ts` defines `FoodListResponse {items, total}` — this type is NOT used by the controller; the controller returns the raw array. Confirmed by direct controller source read.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed, versions confirmed
- Architecture: HIGH — all patterns taken directly from Phase 13 source code
- API response shapes: HIGH — confirmed by reading controller source; Prisma `findMany` always returns a plain array
- Pitfalls: HIGH — identified from source code discrepancies (shared type vs. actual controller return)

**Research date:** 2026-03-20
**Valid until:** 2026-09-20 (stable — no fast-moving dependencies)
