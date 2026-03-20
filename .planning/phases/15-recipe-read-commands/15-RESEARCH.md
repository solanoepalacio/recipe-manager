# Phase 15: Recipe Read Commands - Research

**Researched:** 2026-03-20
**Domain:** Python CLI (Click) + REST API integration (recipes list + detail)
**Confidence:** HIGH

## Summary

Phase 15 adds two `rmapi recipes` subcommands on top of the already-scaffolded `recipes` Click group: `list` (with six query-string flags mapping to `GET /api/recipes`) and `get <id>` (mapping to `GET /api/recipes/:id`). Both commands follow the exact same pattern as the Phase 14 `units list` and `foods lookup` commands: call `http.get()`, optionally apply `--fields` projection via `apply_fields()`, print JSON to stdout.

The API response shapes are fully known from the backend source and shared types. `GET /api/recipes` returns a `PaginatedResponse<RecipeListItem>` object — a dict with `items`, `total`, `page`, and `perPage` keys — not a raw array. `GET /api/recipes/:id` returns a full `RecipeDetailResponse` dict. Field projection on `list` applies to each item in the `items` array. Field projection on `get` applies to the top-level response dict (per CLI-04 design and the `apply_fields` utility which handles both dict and list targets).

The `recipes.py` command module is already registered in `cli.py` and has a placeholder `list` subcommand. Phase 15 replaces that placeholder and adds the `get` subcommand. The test pattern (mock `requests.get`, invoke via CliRunner, assert `result.stdout` JSON) is identical to what Phases 13 and 14 established.

**Primary recommendation:** Replace the placeholder `recipes_list` function and add `recipes_get`; map all six `--*` flags to query-string params; keep the `apply_fields` call for `--fields` projection.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| RCP-01 | Agent can search and list recipes — `rmapi recipes list` with `--search`, `--food-id`, `--sort`, `--order`, `--page`, `--per-page` | API query params confirmed in `RecipeQueryDto`; response shape confirmed as `PaginatedResponse<RecipeListItem>`; http.get() accepts params dict |
| RCP-02 | Agent can get full recipe detail — `rmapi recipes get <id>` with `--fields` projection to strip images/timestamps | API endpoint is `GET /api/recipes/:id`; response shape confirmed as `RecipeDetailResponse`; `apply_fields` handles dict projection |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| click | 8.3.x (already installed) | CLI framework | Already in use for all rmapi commands |
| requests | (already installed) | HTTP client | Already wrapped in `http.py` |
| pytest | (already installed) | Test runner | Already used across all phases |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| unittest.mock | stdlib | Mock `requests.get` in tests | All CLI tests mock HTTP at the requests level |

**No new packages required.** All dependencies are already present in the venv.

**Version verification:** 34 existing tests pass with the installed versions. No changes needed.

## Architecture Patterns

### Recommended Project Structure
No new files needed beyond replacing the placeholder content in the existing module:

```
tools/rmapi/rmapi/commands/
├── recipes.py        # Phase 15: replace placeholder list + add get
├── foods.py          # Phase 14 (complete)
└── units.py          # Phase 14 (complete)

tools/rmapi/tests/
├── test_recipes.py   # Phase 15: new test file (does not exist yet)
├── test_foods.py     # Phase 14 (complete)
└── test_units.py     # Phase 14 (complete)
```

### Pattern 1: Click command with query-string params forwarded to http.get()

`http.get()` already accepts an optional `params` dict and passes it to `requests.get`. The pattern is to build a params dict from the Click option values, omitting None values, then pass it to `http.get`.

```python
# Source: tools/rmapi/rmapi/http.py
def get(path: str, params: dict | None = None) -> dict | list:
    ...
    response = requests.get(url, headers=_headers(config), params=params)
```

Build params dict omitting None values:
```python
params = {k: v for k, v in {
    "search": search,
    "foodId": food_id,
    "sort": sort,
    "order": order,
    "page": page,
    "per_page": per_page,
}.items() if v is not None}
```

### Pattern 2: Paginated response — apply_fields to items array, not the wrapper

The `list` endpoint returns `{"items": [...], "total": N, "page": N, "perPage": N}`. Field projection applies to each item in `items`, not to the top-level wrapper. The approach is to apply `apply_fields` to `data["items"]` and then reassemble the wrapper, OR to treat `--fields` as projecting only the items. Based on the requirement text ("strips the response to only the named top-level fields") and the `apply_fields` utility behavior (handles both list and dict), the correct behavior is:

- Without `--fields`: emit the full paginated object as-is
- With `--fields`: apply projection to `data["items"]` and emit the reassembled object with projected items

```python
data = http.get("/api/recipes", params=params)
if fields:
    data = {**data, "items": apply_fields(data["items"], fields)}
click.echo(json.dumps(data))
```

### Pattern 3: get <id> uses click.argument() not click.option()

The `id` is a positional argument in the command grammar (`rmapi recipes get <id>`), not a flag. Click uses `@click.argument("id")` for positional parameters.

```python
@recipes.command("get")
@click.argument("id")
@click.option("--fields", default=None, help="Comma-separated top-level fields to include")
def recipes_get(id: str, fields: str | None) -> None:
    data = http.get(f"/api/recipes/{id}")
    result = apply_fields(data, fields)
    click.echo(json.dumps(result))
```

### Pattern 4: --per-page flag maps to pageSize query param

The API query parameter is `pageSize` (camelCase), but the CLI flag convention uses kebab-case `--per-page`. The requirement spec lists `--per-page` explicitly. The mapping is:

```python
@click.option("--per-page", default=None, type=int, ...)
# passes as params["pageSize"] = per_page
```

The `--food-id` flag similarly maps to `foodId` query param.

### Anti-Patterns to Avoid
- **Passing None values as query params:** Requests serializes `None` as the string "None". Always filter out `None` values before building the params dict.
- **Applying --fields to the list wrapper object:** Field projection on `list` must operate on items, not the `{items, total, page, perPage}` wrapper.
- **Using click.argument for optional positional:** `id` in `recipes get <id>` is required — `click.argument` is correct (not `click.option`).
- **Mocking at the wrong level in tests:** Always mock `requests.get` (not `rmapi.http.get`) — the `http.py` wrapper calls `requests.get` directly.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Field projection | Custom dict filtering logic | `apply_fields()` in `rmapi/utils.py` | Already handles both list and dict; tested in Phase 13 |
| HTTP error mapping | Status code conditionals | `raise_for_status()` in `rmapi/errors.py` | Already maps 401→AuthError, 404→NotFoundError, etc. |
| Query param building | Manual URL string concatenation | `params` dict to `http.get()` | `requests` handles encoding |
| Exit codes | Manual `sys.exit()` calls | `RmapiError` subclasses | `click.ClickException` sets `exit_code` automatically |

## Common Pitfalls

### Pitfall 1: pageSize vs per_page naming mismatch
**What goes wrong:** The API expects `pageSize` (camelCase) but the CLI flag is `--per-page` (kebab, stored as `per_page` in Python). If you pass `per_page` directly in the params dict, the API receives `per_page` which it ignores (unknown param), and uses the default of 20.
**Why it happens:** Click converts `--per-page` to the Python variable `per_page` automatically; the API uses `pageSize`.
**How to avoid:** Explicitly map `per_page -> pageSize` when building the params dict.
**Warning signs:** Pagination does not respond to `--per-page` flag changes.

### Pitfall 2: foodId vs food_id naming mismatch
**What goes wrong:** Same as above — CLI flag `--food-id` → Python variable `food_id`, but API expects `foodId`.
**How to avoid:** Map `food_id -> foodId` in params dict construction.

### Pitfall 3: Fields projection on list applies to items, not wrapper
**What goes wrong:** Calling `apply_fields(data, fields)` where `data` is the paginated wrapper dict strips the wrapper to only named fields (e.g., `--fields id,name` would strip `total`, `page`, `perPage` too).
**How to avoid:** Apply fields to `data["items"]` and reconstruct the wrapper.

### Pitfall 4: click 8.3+ CliRunner stdout/stderr separation
**What goes wrong:** Asserting on `result.output` which mixes stdout and stderr. Error messages from wrong exit codes can contaminate what looks like valid JSON.
**How to avoid:** Always assert on `result.stdout` for success path; assert on `result.stderr` for error path. This is already the established pattern from Phase 13.

## Code Examples

Verified patterns from project source:

### recipes list — full implementation pattern
```python
# Source: tools/rmapi/rmapi/commands/foods.py (Phase 14 pattern)
@recipes.command("list")
@click.option("--search", default=None, help="Case-insensitive name substring search")
@click.option("--food-id", default=None, help="Filter by food ID")
@click.option("--sort", default=None, type=click.Choice(["name", "createdAt", "updatedAt", "random"]))
@click.option("--order", default=None, type=click.Choice(["asc", "desc"]))
@click.option("--page", default=None, type=int, help="Page number (1-based)")
@click.option("--per-page", default=None, type=int, help="Items per page")
@click.option("--fields", default=None, help="Comma-separated fields to include on each item")
def recipes_list(search, food_id, sort, order, page, per_page, fields):
    """List recipes with optional search, filter, sort, and pagination."""
    params = {k: v for k, v in {
        "search": search,
        "foodId": food_id,
        "sort": sort,
        "order": order,
        "page": page,
        "pageSize": per_page,
    }.items() if v is not None}
    data = http.get("/api/recipes", params=params)
    if fields:
        data = {**data, "items": apply_fields(data["items"], fields)}
    click.echo(json.dumps(data))
```

### recipes get — full implementation pattern
```python
# Source: derived from tools/rmapi/rmapi/commands/units.py (Phase 14 pattern)
@recipes.command("get")
@click.argument("id")
@click.option("--fields", default=None, help="Comma-separated top-level fields to include")
def recipes_get(id: str, fields: str | None) -> None:
    """Get full recipe detail by ID."""
    data = http.get(f"/api/recipes/{id}")
    result = apply_fields(data, fields)
    click.echo(json.dumps(result))
```

### Test mock pattern (established in Phase 14)
```python
# Source: tools/rmapi/tests/test_foods.py
def _mock_get(payload):
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = payload
    return mock_resp

def test_something(runner):
    with patch("requests.get", return_value=_mock_get(FAKE_DATA)):
        result = runner.invoke(cli, ["recipes", "list"], env=ENV)
    assert result.exit_code == 0
    data = json.loads(result.stdout)
```

### Paginated response mock structure
```python
FAKE_LIST_RESPONSE = {
    "items": [
        {"id": "r1", "name": "Pasta Bolognese", "slug": "pasta-bolognese",
         "description": None, "servingsQty": 4, "servingsUnit": "portions",
         "shareToken": None, "createdAt": "2026-03-20T00:00:00.000Z",
         "updatedAt": "2026-03-20T00:00:00.000Z", "imageCount": 0, "coverImageUrl": None},
    ],
    "total": 1,
    "page": 1,
    "perPage": 20,
}

FAKE_DETAIL_RESPONSE = {
    "id": "r1",
    "householdId": "h1",
    "createdById": "u1",
    "name": "Pasta Bolognese",
    "slug": "pasta-bolognese",
    "description": None,
    "servingsQty": 4,
    "servingsUnit": "portions",
    "prepTime": 15,
    "cookTime": 30,
    "totalTime": 45,
    "performTime": None,
    "sourceUrl": None,
    "isLocked": False,
    "shareToken": None,
    "createdAt": "2026-03-20T00:00:00.000Z",
    "updatedAt": "2026-03-20T00:00:00.000Z",
    "sections": [
        {"id": "s1", "title": None, "order": 0,
         "ingredients": [
             {"id": "i1", "foodId": "f1", "foodName": "tomato", "unitId": "u1",
              "unitName": "gram", "quantity": 200.0, "note": None, "order": 0}
         ]}
    ],
    "steps": [
        {"id": "st1", "title": None, "body": "Boil water", "order": 0}
    ],
    "images": [],
}
```

## API Endpoint Reference

Confirmed from `apps/api/src/recipes/recipes.controller.ts` and `recipes.service.ts`:

### GET /api/recipes
- **Auth:** Bearer token required
- **Query params:** `search` (string), `foodId` (string), `sort` (name|createdAt|updatedAt|random), `order` (asc|desc), `page` (int, default 1), `pageSize` (int, default 20)
- **Response:** `{"items": RecipeListItem[], "total": number, "page": number, "perPage": number}`
- **RecipeListItem fields:** `id`, `name`, `slug`, `description`, `servingsQty`, `servingsUnit`, `shareToken`, `createdAt`, `updatedAt`, `imageCount`, `coverImageUrl`

### GET /api/recipes/:id
- **Auth:** Bearer token required
- **Response:** Full `RecipeDetailResponse` — includes `sections` (with nested `ingredients`), `steps`, `images`
- **404:** Recipe not found
- **403:** Recipe belongs to a different household

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | pytest (already installed in `.venv`) |
| Config file | `tools/rmapi/pyproject.toml` (testpaths configured) |
| Quick run command | `cd /home/solanoe/code/recipe-manager && .venv/bin/pytest tools/rmapi/tests/ -x -q` |
| Full suite command | `cd /home/solanoe/code/recipe-manager && .venv/bin/pytest tools/rmapi/tests/ -v` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| RCP-01 | `rmapi recipes list` returns paginated object | unit | `pytest tools/rmapi/tests/test_recipes.py::test_recipes_list_returns_paginated_response -x` | ❌ Wave 0 |
| RCP-01 | `--search` passed as `search` query param | unit | `pytest tools/rmapi/tests/test_recipes.py::test_recipes_list_search_flag -x` | ❌ Wave 0 |
| RCP-01 | `--food-id` passed as `foodId` query param | unit | `pytest tools/rmapi/tests/test_recipes.py::test_recipes_list_food_id_flag -x` | ❌ Wave 0 |
| RCP-01 | `--sort` and `--order` passed through | unit | `pytest tools/rmapi/tests/test_recipes.py::test_recipes_list_sort_order_flags -x` | ❌ Wave 0 |
| RCP-01 | `--page` and `--per-page` map to page/pageSize | unit | `pytest tools/rmapi/tests/test_recipes.py::test_recipes_list_pagination_flags -x` | ❌ Wave 0 |
| RCP-01 | `--fields` projects items array (not wrapper) | unit | `pytest tools/rmapi/tests/test_recipes.py::test_recipes_list_fields_projection -x` | ❌ Wave 0 |
| RCP-02 | `rmapi recipes get <id>` returns full detail | unit | `pytest tools/rmapi/tests/test_recipes.py::test_recipes_get_returns_detail -x` | ❌ Wave 0 |
| RCP-02 | `--fields` strips top-level keys | unit | `pytest tools/rmapi/tests/test_recipes.py::test_recipes_get_fields_projection -x` | ❌ Wave 0 |
| RCP-02 | 404 from API → exit code 3 + JSON stderr | unit | `pytest tools/rmapi/tests/test_recipes.py::test_recipes_get_not_found -x` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `cd /home/solanoe/code/recipe-manager && .venv/bin/pytest tools/rmapi/tests/test_recipes.py -x -q`
- **Per wave merge:** `cd /home/solanoe/code/recipe-manager && .venv/bin/pytest tools/rmapi/tests/ -v`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tools/rmapi/tests/test_recipes.py` — covers RCP-01 and RCP-02 (9 test functions listed above)

*(All other infrastructure — conftest.py, pytest config, http.py, errors.py, utils.py — already exists from Phases 13 and 14)*

## Sources

### Primary (HIGH confidence)
- `tools/rmapi/rmapi/commands/foods.py` — Phase 14 command pattern (client source)
- `tools/rmapi/rmapi/commands/units.py` — Phase 14 command pattern (client source)
- `tools/rmapi/rmapi/http.py` — HTTP wrapper with params support (project source)
- `tools/rmapi/rmapi/utils.py` — `apply_fields` implementation (project source)
- `apps/api/src/recipes/recipes.controller.ts` — GET /api/recipes and GET /api/recipes/:id endpoints (project source)
- `apps/api/src/recipes/recipes.service.ts` — `findAll` return shape, `findOne` return shape (project source)
- `apps/api/src/recipes/dto/recipe-query.dto.ts` — Confirmed query param names: `search`, `foodId`, `sort`, `order`, `page`, `pageSize` (project source)
- `packages/shared/src/api/recipes.ts` — `RecipeListItem`, `RecipeDetailResponse` type definitions (project source)
- `packages/shared/src/common.ts` — `PaginatedResponse<T>` shape: `{items, total, page, perPage}` (project source)

### Secondary (MEDIUM confidence)
- `tools/rmapi/tests/test_foods.py` — Established mock/assert patterns (project source)
- `.planning/REQUIREMENTS.md` — RCP-01, RCP-02 requirement text and flag names

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new libraries; all dependencies already installed and in use
- Architecture: HIGH — API response shapes confirmed from backend source; CLI patterns confirmed from Phase 14
- Pitfalls: HIGH — naming mismatches (pageSize vs per_page, foodId vs food_id) are deterministic code-level facts; field projection behavior confirmed from `apply_fields` source

**Research date:** 2026-03-20
**Valid until:** 2026-06-20 (stable — CLI and API are both in this repo; no external dependencies)
