# Phase 13: CLI Scaffold - Research

**Researched:** 2026-03-20
**Domain:** Python CLI tooling (Click 8), Python packaging (pyproject.toml), HTTP client (requests)
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CLI-01 | `rmapi` reads `RMAPI_BASE_URL` and `RMAPI_TOKEN` from environment variables; never accepts secrets via flags | `os.environ` read in a shared `Config` object; verified pattern excludes flags for secrets |
| CLI-02 | All successful output goes to stdout as JSON; all errors go to stderr as `{"code": "...", "message": "...", "status": N}` | `click.echo(json.dumps(...))` for stdout; `click.echo(..., err=True)` for stderr; verified with `CliRunner(mix_stderr=False)` |
| CLI-03 | Exit codes: 0 success, 1 API error, 2 auth failure, 3 not found, 4 validation error | Custom `ClickException` subclass with `exit_code` attribute; HTTP status → exit code mapping table verified |
| CLI-04 | All list and detail commands accept `--fields id,name,...` to strip response to named top-level fields only | `--fields` option parses comma-separated string; `{k: v for k, v in item.items() if k in field_set}` projection; verified on list and dict |
| CLI-05 | Destructive commands accept `--yes`; without `--yes` on non-TTY, fail immediately with exit code 4 | `sys.stdin.isatty()` returns `False` in CliRunner and piped contexts; `SystemExit(4)` with JSON stderr; verified |
</phase_requirements>

---

## Summary

Phase 13 creates the `rmapi` binary: a standalone Python CLI package installed via `pip install -e tools/rmapi/` that wraps the recipe manager REST API. It is intentionally thin — no business logic, no shared-type coupling with the TypeScript monorepo. The package lives at `tools/rmapi/` and is not a Yarn workspace.

The standard choice is **Click 8** (already installed at 8.1.8). Click provides multi-level command groups (`cli > recipes > list`), automatic `--help` generation, `ClickException` subclassing for typed exit codes, `click.echo(err=True)` for stderr routing, and a built-in `CliRunner` for isolated unit testing. The `requests` library (2.32.3) handles HTTP. The package is declared via `pyproject.toml` with `[project.scripts]` mapping `rmapi` to the Click entry point.

Phase 13 is scaffold-only: it installs the binary, wires auth from environment variables, normalizes errors, implements `--fields` projection as a reusable helper, and enforces the `--yes` guard. No real API commands are implemented here — those land in Phases 14–18. Phase 13 must produce the stable grammar and error taxonomy that all subsequent phases depend on.

**Primary recommendation:** Use Click 8 groups-of-groups with a shared `Config` dataclass and a `RmapiError(ClickException)` hierarchy. Implement `--fields` as a reusable `apply_fields(data, fields)` utility. Guard destructive commands with a `require_yes(yes)` utility that reads `sys.stdin.isatty()`.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| click | 8.1.8 (installed) | CLI framework: groups, options, args, help, ClickException | Industry standard for Python CLIs; multi-level groups, built-in testing via CliRunner |
| requests | 2.32.3 (installed) | HTTP client for REST API calls | Ubiquitous, simple API, raises HTTPError on 4xx/5xx, no async needed for CLI |
| Python | 3.13.7 (system) | Runtime | Already present on target system |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| pytest | latest | Test runner for CliRunner-based tests | Phase 13 test suite; install in package `dev` extras |
| setuptools | bundled with pip | Build backend for pyproject.toml editable install | Required by `pip install -e` |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| click | typer | Typer is not installed; Click is installed; Typer wraps Click anyway; no benefit for a plain Python 3.13 project |
| requests | httpx | httpx not installed; requests is sufficient for synchronous CLI; httpx adds async overhead irrelevant here |
| pytest | unittest | pytest is standard; CliRunner integrates naturally; unittest is verbose |

**Installation:**
```bash
# Inside tools/rmapi/ after pyproject.toml exists:
pip install -e "tools/rmapi/[dev]"
```

**Version verification (confirmed 2026-03-20):**
- click: 8.1.8 — `python3 -c "import click; print(click.__version__)"`
- requests: 2.32.3 — `python3 -c "import requests; print(requests.__version__)"`

---

## Architecture Patterns

### Recommended Project Structure
```
tools/rmapi/
├── pyproject.toml          # package metadata + entry point + deps
├── rmapi/
│   ├── __init__.py         # empty or version string
│   ├── cli.py              # root Click group + all sub-groups registered
│   ├── config.py           # Config dataclass (reads RMAPI_BASE_URL, RMAPI_TOKEN)
│   ├── errors.py           # RmapiError hierarchy + HTTP-to-exit-code mapping
│   ├── http.py             # HTTP client wrapper (calls requests, raises RmapiError)
│   ├── utils.py            # apply_fields(), require_yes() helpers
│   └── commands/
│       ├── __init__.py
│       └── recipes.py      # placeholder recipes group (Phase 14+ fills this)
└── tests/
    ├── conftest.py         # shared runner fixture (CliRunner(mix_stderr=False))
    ├── test_cli.py         # --help, config validation tests
    ├── test_errors.py      # HTTP status → exit code + JSON stderr format
    ├── test_fields.py      # apply_fields() unit tests
    └── test_yes_guard.py   # require_yes() TTY detection tests
```

### Pattern 1: Root CLI Group + Sub-groups
**What:** Click group registered at top level; each domain (recipes, foods, etc.) is its own group attached to the root.
**When to use:** Always — this is the grammar for all `rmapi <domain> <command>` calls.
**Example:**
```python
# rmapi/cli.py
import click
from .commands.recipes import recipes

@click.group()
def cli() -> None:
    """rmapi — Recipe Manager API CLI."""
    pass

cli.add_command(recipes)

# rmapi/commands/recipes.py
import click

@click.group()
def recipes() -> None:
    """Recipe commands."""
    pass

@recipes.command("list")
@click.option("--fields", default=None, help="Comma-separated fields to include (e.g. id,name)")
def recipes_list(fields: str | None) -> None:
    """List recipes. (Placeholder — implemented in Phase 15)"""
    click.echo("[]")
```

### Pattern 2: Config via Environment Variables
**What:** A `Config` dataclass reads `RMAPI_BASE_URL` and `RMAPI_TOKEN` from `os.environ` at call time. Missing vars produce a descriptive error to stderr.
**When to use:** Every command that makes an HTTP request calls `Config.from_env()`.
**Example:**
```python
# rmapi/config.py
import os
import dataclasses

@dataclasses.dataclass
class Config:
    base_url: str
    token: str

    @classmethod
    def from_env(cls) -> "Config":
        base_url = os.environ.get("RMAPI_BASE_URL")
        token = os.environ.get("RMAPI_TOKEN")
        if not base_url:
            _fail_config("RMAPI_BASE_URL")
        if not token:
            _fail_config("RMAPI_TOKEN")
        return cls(base_url=base_url.rstrip("/"), token=token)

def _fail_config(var: str) -> None:
    import json, sys
    print(json.dumps({"code": "config_error", "message": f"{var} environment variable is not set", "status": 0}), file=sys.stderr)
    raise SystemExit(1)
```

### Pattern 3: Typed Error Taxonomy (RmapiError)
**What:** `RmapiError` subclasses `click.ClickException`. Its `show()` method writes JSON to stderr. Each subclass has a fixed `exit_code`.
**When to use:** Every HTTP error path; every config error path.
**Example:**
```python
# rmapi/errors.py
import click
import json

class RmapiError(click.ClickException):
    def __init__(self, code: str, message: str, status: int, exit_code: int) -> None:
        super().__init__(message)
        self.code = code
        self.status = status
        self.exit_code = exit_code

    def show(self) -> None:
        payload = json.dumps({"code": self.code, "message": self.message, "status": self.status})
        click.echo(payload, err=True)


class AuthError(RmapiError):
    def __init__(self, message: str = "Authentication failed") -> None:
        super().__init__("auth_failed", message, 401, 2)


class NotFoundError(RmapiError):
    def __init__(self, message: str = "Resource not found") -> None:
        super().__init__("not_found", message, 404, 3)


class ValidationError(RmapiError):
    def __init__(self, message: str = "Validation failed") -> None:
        super().__init__("validation_error", message, 422, 4)


class ApiError(RmapiError):
    def __init__(self, message: str = "API error", status: int = 500) -> None:
        super().__init__("api_error", message, status, 1)


def raise_for_status(response) -> None:
    """Map requests.Response HTTP errors to typed RmapiError exceptions."""
    if response.status_code < 400:
        return
    try:
        body = response.json()
        message = body.get("message", response.text)
    except Exception:
        message = response.text or "Unknown error"

    code = response.status_code
    if code in (401, 403):
        raise AuthError(message)
    elif code == 404:
        raise NotFoundError(message)
    elif code in (400, 422):
        raise ValidationError(message)
    else:
        raise ApiError(message, code)
```

### Pattern 4: --fields Projection Helper
**What:** `apply_fields(data, fields)` strips any dict or list-of-dicts to the named top-level keys. Returns data unchanged if fields is None.
**When to use:** Every command that supports `--fields`.
**Example:**
```python
# rmapi/utils.py
def apply_fields(data, fields: str | None):
    """Project data to named top-level fields only."""
    if fields is None:
        return data
    field_set = {f.strip() for f in fields.split(",") if f.strip()}
    if isinstance(data, list):
        return [{k: v for k, v in item.items() if k in field_set} for item in data]
    if isinstance(data, dict):
        return {k: v for k, v in data.items() if k in field_set}
    return data
```

### Pattern 5: --yes Guard for Destructive Commands
**What:** `require_yes(yes)` checks the `--yes` flag; if False and stdin is not a TTY, emits JSON error to stderr and exits 4.
**When to use:** Every delete/remove command.
**Example:**
```python
# rmapi/utils.py
import sys
import json
import click

def require_yes(yes: bool) -> None:
    """Guard destructive commands: --yes flag OR interactive TTY required."""
    if yes:
        return
    if not sys.stdin.isatty():
        click.echo(
            json.dumps({
                "code": "confirmation_required",
                "message": "Use --yes to confirm destructive operation in non-interactive context",
                "status": 400,
            }),
            err=True,
        )
        raise SystemExit(4)
    click.confirm("Are you sure?", abort=True)
```

### Pattern 6: pyproject.toml Package Declaration
```toml
# tools/rmapi/pyproject.toml
[project]
name = "rmapi"
version = "0.1.0"
description = "Recipe Manager API CLI"
requires-python = ">=3.11"
dependencies = [
    "click>=8.1",
    "requests>=2.32",
]

[project.optional-dependencies]
dev = ["pytest>=8"]

[project.scripts]
rmapi = "rmapi.cli:cli"

[build-system]
requires = ["setuptools"]
build-backend = "setuptools.build_meta"
```

### Anti-Patterns to Avoid
- **Accepting secrets via CLI flags:** Never `--token <value>` — shell history exposure. Always read from environment.
- **Mixing stdout and stderr:** Success JSON must go to stdout; error JSON must go to stderr. Never mix. CliRunner(mix_stderr=True) is the wrong default for testing.
- **Using `print()` directly:** Always use `click.echo()` — it handles encoding edge cases and is mockable in tests.
- **Using `sys.exit()` in command body:** Raise `RmapiError` subclasses instead; let Click's exception handling call `sys.exit(e.exit_code)` cleanly via `show()`.
- **Hardcoding base URL:** `RMAPI_BASE_URL` env var only. Never a default value for the URL.
- **Using `shell=True` in subprocess calls:** The project decision (STATE.md) requires `shell=False` (argument vectors) to prevent shell injection. But Phase 13 has no subprocess calls — this matters in Phase 16 for image download.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Argument parsing | Custom `sys.argv` parser | Click groups/options/arguments | Click handles type coercion, `--help` generation, error messages |
| TTY detection | Custom terminal probe | `sys.stdin.isatty()` | Standard POSIX API, works in CliRunner tests when `input=` is provided |
| HTTP client | Raw `urllib` or `http.client` | `requests` | Connection pooling, auth headers, response parsing, exception hierarchy |
| Exit code routing | `sys.exit()` scattered in commands | `ClickException.exit_code` + `show()` | Centralized; Click calls `sys.exit` once after `show()` in standalone mode |
| Test isolation | Monkey-patching `sys.argv` | `CliRunner.invoke()` | Isolated process simulation, captures stdout/stderr independently |

**Key insight:** Click's `CliRunner(mix_stderr=False)` is the only way to assert separately on stdout and stderr in tests. This is non-obvious — `mix_stderr=True` is the default. All test fixtures must pass `mix_stderr=False`.

---

## Common Pitfalls

### Pitfall 1: mix_stderr=True in tests
**What goes wrong:** `result.stderr` raises `AttributeError` and stdout contains interleaved error output — tests cannot assert on exit codes vs stderr content independently.
**Why it happens:** `CliRunner(mix_stderr=True)` is the default; stderr flows into `result.output` alongside stdout.
**How to avoid:** Always instantiate `CliRunner(mix_stderr=False)` in `conftest.py` as a shared fixture.
**Warning signs:** `AttributeError: 'Result' object has no attribute 'stderr'` or tests passing when they should fail.

### Pitfall 2: Environment Variables Leaking Into Tests
**What goes wrong:** Tests use the developer's real `RMAPI_BASE_URL` and `RMAPI_TOKEN`, making real HTTP calls.
**Why it happens:** `os.environ` is global state shared across the test process.
**How to avoid:** Use `CliRunner.invoke(env={"RMAPI_BASE_URL": "http://localhost:9999", "RMAPI_TOKEN": "test"})` to scope env vars to the invocation. Or `monkeypatch.delenv("RMAPI_TOKEN", raising=False)` in pytest.
**Warning signs:** Tests pass on the developer machine but fail in CI where env vars are unset.

### Pitfall 3: Destructive Command TTY Guard Bypassed in Tests
**What goes wrong:** `sys.stdin.isatty()` returns `True` in some test environments (e.g., when pytest is run from an interactive terminal), causing the `--yes` guard to show an interactive prompt instead of failing fast.
**Why it happens:** CliRunner does not always simulate a non-TTY stdin unless `input` is not provided.
**How to avoid:** The CliRunner always simulates non-TTY stdin when no `input=` is given. Verify with `runner.invoke(cli, ['delete', 'id'])` without `input=` — this reliably triggers non-TTY path.
**Warning signs:** Test for `--yes` guard passes interactively but hangs in CI.

### Pitfall 4: --fields Applied to Nested Structures
**What goes wrong:** `--fields sections` on a recipe includes `sections` but the value is a nested array. The projection only strips top-level keys — it does not deep-project.
**Why it happens:** Requirement CLI-04 says "strip response to named top-level fields only." This is correct behavior, not a bug.
**How to avoid:** Document in test that `--fields id,name` on `rmapi recipes get` preserves the full value of any included field — only top-level key selection, not sub-field projection.
**Warning signs:** Confusion in Phase 15+ when agent uses `--fields sections` expecting stripped section objects.

### Pitfall 5: RMAPI_BASE_URL Trailing Slash
**What goes wrong:** `base_url + "/api/recipes"` produces `http://localhost:3001//api/recipes` — double slash causes 404 on some servers.
**Why it happens:** Users often include a trailing slash in the env var value.
**How to avoid:** `Config.from_env()` calls `.rstrip("/")` on the base URL before storing it.
**Warning signs:** 404 errors that vanish when the trailing slash is manually removed.

### Pitfall 6: ClickException show() Writes "Error: " Prefix by Default
**What goes wrong:** `RmapiError.show()` inherited from `ClickException` would output `Error: <message>` — not valid JSON.
**Why it happens:** `ClickException.show()` default implementation prepends "Error: ".
**How to avoid:** Override `show()` completely in `RmapiError` to write only the JSON payload via `click.echo(json.dumps(...), err=True)`. Never call `super().show()`.
**Warning signs:** stderr contains `Error: {"code": ...}` — invalid JSON because of the prefix.

---

## Code Examples

Verified patterns from live execution (2026-03-20):

### Exit Code + JSON Stderr via ClickException
```python
# Source: verified with click 8.1.8 + CliRunner(mix_stderr=False)
import click, json

class RmapiError(click.ClickException):
    def __init__(self, code, message, status, exit_code):
        super().__init__(message)
        self.code = code
        self.status = status
        self.exit_code = exit_code

    def show(self):
        click.echo(json.dumps({"code": self.code, "message": self.message, "status": self.status}), err=True)

# Result: exit_code=2, stdout='', stderr='{"code":"auth_failed","message":"...","status":401}'
```

### --fields Projection (verified)
```python
# Source: verified in Python 3.13.7
def apply_fields(data, fields: str | None):
    if fields is None:
        return data
    field_set = {f.strip() for f in fields.split(",") if f.strip()}
    if isinstance(data, list):
        return [{k: v for k, v in item.items() if k in field_set} for item in data]
    if isinstance(data, dict):
        return {k: v for k, v in data.items() if k in field_set}
    return data
# apply_fields([{"id":"1","name":"Pasta","description":"yummy"}], "id,name")
# → [{"id": "1", "name": "Pasta"}]
```

### Non-TTY --yes Guard (verified)
```python
# Source: verified — CliRunner provides non-TTY stdin by default
def require_yes(yes: bool) -> None:
    if yes:
        return
    if not sys.stdin.isatty():
        click.echo(json.dumps({"code": "confirmation_required",
                               "message": "Use --yes to confirm",
                               "status": 400}), err=True)
        raise SystemExit(4)
    click.confirm("Are you sure?", abort=True)
# Without --yes: exit_code=4, stderr=JSON error, stdout=''
```

### HTTP Status to Exit Code Mapping (verified)
```python
# Source: verified mapping against CLI-03 spec
def raise_for_status(response) -> None:
    if response.status_code < 400:
        return
    try:
        message = response.json().get("message", response.text)
    except Exception:
        message = response.text or "Unknown error"
    code = response.status_code
    if code in (401, 403):
        raise AuthError(message)       # exit 2
    elif code == 404:
        raise NotFoundError(message)   # exit 3
    elif code in (400, 422):
        raise ValidationError(message) # exit 4
    else:
        raise ApiError(message, code)  # exit 1
```

### CliRunner Test Pattern (verified)
```python
# Source: verified with click.testing.CliRunner in click 8.1.8
from click.testing import CliRunner

# In conftest.py:
import pytest
@pytest.fixture
def runner():
    return CliRunner(mix_stderr=False)  # CRITICAL: must be False

# In test file:
def test_auth_error_exit_code(runner):
    result = runner.invoke(cli, ['recipes', 'list'],
                           env={"RMAPI_BASE_URL": "http://localhost:9999",
                                "RMAPI_TOKEN": "bad-token"})
    assert result.exit_code == 2
    import json
    error = json.loads(result.stderr)
    assert error["code"] == "auth_failed"
    assert error["status"] == 401
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| setup.py for packaging | pyproject.toml only | PEP 517/518 (2018), mainstream 2023+ | No `setup.py` needed; `pip install -e .` works with just `pyproject.toml` |
| argparse for CLIs | Click 8 | Click 8.0 (2021) | Multi-level groups, decorators, CliRunner testing |
| `print()` to stderr | `click.echo(err=True)` | Click 2.0+ | Handles encoding; testable with CliRunner |
| mix_stderr=True (old default) | mix_stderr=False for testable CLIs | Click 8.0+ | Separate stdout/stderr in Result object |

**Deprecated/outdated:**
- `setup.py`: Avoid. pyproject.toml is the standard.
- `typer`: Not installed; adds no value over Click here; would require an extra pip install.
- `distutils`: Removed in Python 3.12. Never reference it.

---

## Open Questions

1. **pytest installation scope**
   - What we know: pytest is not installed globally; Click's CliRunner is available as part of click.
   - What's unclear: Whether to install pytest into the system Python or declare it as a `[dev]` extra in pyproject.toml and install with `pip install -e "tools/rmapi/[dev]"`.
   - Recommendation: Declare as `[project.optional-dependencies] dev = ["pytest>=8"]`; the Wave 0 plan installs with `pip install -e "tools/rmapi/[dev]"`. This keeps test deps isolated to the package.

2. **HTTP client for image download (Phase 16)**
   - What we know: Phase 13 does not implement image upload. `requests` handles binary downloads via `response.content`.
   - What's unclear: Nothing for Phase 13 — defer to Phase 16 research.
   - Recommendation: Not a Phase 13 concern.

3. **Base URL path prefix**
   - What we know: The backend mounts all routes under `/api` (from main.ts global prefix).
   - What's unclear: Whether `RMAPI_BASE_URL` should point to the host root (e.g., `http://localhost:3001`) and the CLI appends `/api/`, or whether the user sets the full base (e.g., `http://localhost:3001/api`).
   - Recommendation: Convention should be `RMAPI_BASE_URL=http://localhost:3001` (no `/api` suffix); the HTTP client module prepends `/api/` to all paths. This is simpler for users and consistent with how the frontend env var is set.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | pytest (install via `pip install -e "tools/rmapi/[dev]"`) |
| Config file | `tools/rmapi/pyproject.toml` (pytest section) or none |
| Quick run command | `cd tools/rmapi && python -m pytest tests/ -x -q` |
| Full suite command | `cd tools/rmapi && python -m pytest tests/ -v` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CLI-01 | `RMAPI_BASE_URL` and `RMAPI_TOKEN` read from env; missing env var → JSON error to stderr exit 1 | unit | `python -m pytest tests/test_config.py -x` | Wave 0 |
| CLI-02 | Successful output to stdout as JSON; errors to stderr as JSON object | unit | `python -m pytest tests/test_errors.py -x` | Wave 0 |
| CLI-03 | Exit codes 0/1/2/3/4 map to correct HTTP status classes | unit | `python -m pytest tests/test_errors.py::test_exit_codes -x` | Wave 0 |
| CLI-04 | `--fields id,name` strips response to named fields; no `--fields` returns full response | unit | `python -m pytest tests/test_fields.py -x` | Wave 0 |
| CLI-05 | Without `--yes` on non-TTY stdin: exit 4 + JSON stderr; with `--yes`: proceeds | unit | `python -m pytest tests/test_yes_guard.py -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `cd tools/rmapi && python -m pytest tests/ -x -q`
- **Per wave merge:** `cd tools/rmapi && python -m pytest tests/ -v`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tools/rmapi/pyproject.toml` — package declaration with entry point and deps
- [ ] `tools/rmapi/rmapi/__init__.py` — empty init
- [ ] `tools/rmapi/rmapi/cli.py` — root Click group skeleton
- [ ] `tools/rmapi/rmapi/config.py` — Config.from_env()
- [ ] `tools/rmapi/rmapi/errors.py` — RmapiError hierarchy + raise_for_status()
- [ ] `tools/rmapi/rmapi/utils.py` — apply_fields() + require_yes()
- [ ] `tools/rmapi/rmapi/commands/__init__.py` — empty init
- [ ] `tools/rmapi/rmapi/commands/recipes.py` — placeholder recipes group
- [ ] `tools/rmapi/tests/conftest.py` — shared `runner` fixture with `mix_stderr=False`
- [ ] `tools/rmapi/tests/test_config.py` — CLI-01 tests
- [ ] `tools/rmapi/tests/test_errors.py` — CLI-02, CLI-03 tests
- [ ] `tools/rmapi/tests/test_fields.py` — CLI-04 tests
- [ ] `tools/rmapi/tests/test_yes_guard.py` — CLI-05 tests

---

## Sources

### Primary (HIGH confidence)
- click 8.1.8 installed locally — verified all patterns with live `python3 -c` execution
- `python3 -c "from click.testing import CliRunner; ..."` — verified mix_stderr, exit_code, stdout, stderr attributes
- Click official docs (https://click.palletsprojects.com/en/stable/exceptions/) — exception hierarchy, show() method
- Click official docs (https://click.palletsprojects.com/en/latest/entry-points/) — pyproject.toml [project.scripts] format
- Click official docs (https://click.palletsprojects.com/en/stable/testing/) — CliRunner.invoke() signature
- requests 2.32.3 installed locally — verified header pattern

### Secondary (MEDIUM confidence)
- https://til.simonwillison.net/python/pyproject — minimal pyproject.toml without setup.py
- https://packaging.python.org/en/latest/guides/writing-pyproject-toml/ — [project.scripts] format
- STATE.md [v1.1 Milestone] decisions — shell=False requirement, tools/rmapi/ location, env-var-only credentials

### Tertiary (LOW confidence)
- None — all critical findings verified against installed libraries or official docs

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — click 8.1.8 and requests 2.32.3 confirmed installed; all patterns verified live
- Architecture: HIGH — all code patterns executed and asserted against in Python 3.13.7
- Pitfalls: HIGH — mix_stderr, ClickException.show() prefix, TTY guard all verified via live execution
- Packaging: HIGH — pyproject.toml format confirmed from official docs + Simon Willison reference

**Research date:** 2026-03-20
**Valid until:** 2026-09-20 (Click 8.x stable; no breaking changes expected in 6 months)
