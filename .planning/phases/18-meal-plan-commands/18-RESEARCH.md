# Phase 18: Meal Plan Commands - Research

**Researched:** 2026-03-20
**Domain:** Python Click CLI — meal plan subcommand group wrapping REST API
**Confidence:** HIGH

## Summary

Phase 18 adds a `meal-plan` Click command group to the existing `rmapi` CLI tool. The backend API is already fully implemented (Phase 5) and the CLI scaffold patterns are solidly established across Phases 13–17. No novel technical problems exist in this phase — it is the fourth application of the same Click subcommand pattern to a new API surface.

The meal plan API differs from recipe sub-resources in one important way: the list endpoint returns a `{ entries: [...] }` wrapper (not a paginated `{ items, total, page, perPage }` wrapper), the create endpoint lives at `POST /api/meal-plan/entries` (not `POST /api/meal-plan`), and the update/delete endpoints use `PATCH/DELETE /api/meal-plan/entries/:id`. The CLI must expose `--from` and `--to` date filter flags on `list`, map `--type` to the API's `mealType` field, and apply `require_yes` on `remove`.

**Primary recommendation:** Follow the `sections.py`/`steps.py` pattern precisely. One new file `tools/rmapi/rmapi/commands/meal_plan.py`, one new test file `tools/rmapi/tests/test_meal_plan.py`, and one line in `cli.py` to register the group.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| MPL-01 | `rmapi meal-plan list --from YYYY-MM-DD --to YYYY-MM-DD` returns entries array | Backend: `GET /api/meal-plan?from=&to=` returns `{ entries: MealPlanEntryResponse[] }` |
| MPL-02 | `rmapi meal-plan add --recipe-id <id> --date YYYY-MM-DD --type <mealType>` creates entry and returns its `id` | Backend: `POST /api/meal-plan/entries` body: `{ recipeId, date, mealType }` returns `MealPlanEntryResponse` |
| MPL-03 | `rmapi meal-plan move <entry-id> --date YYYY-MM-DD --type <mealType>` updates date and meal type | Backend: `PATCH /api/meal-plan/entries/:id` body: sparse `{ date?, mealType? }` returns `MealPlanEntryResponse` |
| MPL-04 | `rmapi meal-plan remove <entry-id> --yes` deletes the entry | Backend: `DELETE /api/meal-plan/entries/:id` returns `{ id: string }` |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| click | 8.3.x | CLI framework | Already in use across all rmapi commands |
| requests | 2.x | HTTP client | Already in use; `http.py` wrapper handles auth + error mapping |
| pytest | 7.x | Test runner | Already in use; `conftest.py` provides `runner` fixture |

No new dependencies required. This phase adds no packages.

**Installation:** None — all dependencies are already installed in the repo venv.

## Architecture Patterns

### Recommended Project Structure
```
tools/rmapi/rmapi/commands/
├── meal_plan.py       # NEW — 4 subcommands: list, add, move, remove
├── sections.py        # reference pattern
├── steps.py           # reference pattern
└── ...

tools/rmapi/tests/
├── test_meal_plan.py  # NEW — covers MPL-01 through MPL-04
├── test_sections.py   # reference pattern
└── ...
```

### Pattern 1: Click Command Group Module
**What:** Each API resource is a `@click.group()` function in its own file under `commands/`. Subcommands are decorated with `@group.command("name")`.
**When to use:** Always — this is the universal pattern for all rmapi modules.
**Example (from sections.py):**
```python
@click.group()
def sections() -> None:
    """Ingredient section commands."""
    pass

@sections.command("add")
@click.argument("recipe_id")
@click.option("--title", default=None)
def sections_add(recipe_id, title):
    body = {k: v for k, v in {"title": title}.items() if v is not None}
    data = http.post(f"/api/recipes/{recipe_id}/sections", body)
    click.echo(json.dumps(data))
```

### Pattern 2: Sparse Body Dict Comprehension
**What:** Build request body by filtering `None` values — only supplied flags go to the API.
**When to use:** All create and update commands. Critical for PATCH semantics on `move`.
```python
body = {k: v for k, v in {"date": date, "mealType": meal_type}.items() if v is not None}
```

### Pattern 3: Destructive Command Guard
**What:** `require_yes(yes)` from `utils.py` enforces `--yes` flag or interactive TTY.
**When to use:** `remove` command only. `add` and `move` are not destructive.
```python
from ..utils import require_yes
require_yes(yes)
result = http.delete(f"/api/meal-plan/entries/{entry_id}")
click.echo(json.dumps(result))
```

### Pattern 4: CLI Registration
**What:** Import and register group in `cli.py` with `cli.add_command(meal_plan)`.
**When to use:** After creating the module.

### API Endpoint Mapping

| CLI Command | HTTP Method | Endpoint | Notes |
|-------------|------------|----------|-------|
| `meal-plan list` | GET | `/api/meal-plan` | Query params: `from`, `to` (both optional) |
| `meal-plan add` | POST | `/api/meal-plan/entries` | Body: `recipeId`, `date`, `mealType` (all required) |
| `meal-plan move <id>` | PATCH | `/api/meal-plan/entries/:id` | Body: sparse `date`, `mealType` |
| `meal-plan remove <id>` | DELETE | `/api/meal-plan/entries/:id` | Returns `{ id }` |

### Response Shape Contract

**list** — GET `/api/meal-plan` returns `MealPlanResponse`:
```json
{
  "entries": [
    {
      "id": "...",
      "date": "2026-03-21",
      "mealType": "dinner",
      "recipeId": "...",
      "recipeName": "...",
      "recipeSlug": "...",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```
The list command should output `data["entries"]` as a JSON array (not the wrapper), matching the success criterion "returns all meal plan entries in the date range as a JSON array."

**add/move** — return a single `MealPlanEntryResponse` object (not wrapped).

**remove** — returns `{ "id": "..." }`.

### MealType Enum Values
Valid values from `packages/shared/src/enums.ts`:
- `breakfast`
- `lunch`
- `dinner`
- `snack`
- `dessert`

The `--type` CLI flag maps to the `mealType` body field. Use `click.Choice(["breakfast", "lunch", "dinner", "snack", "dessert"])` to validate at the CLI layer.

### Anti-Patterns to Avoid
- **Wrapping list output in `{ entries: [...] }`:** The success criterion says "returns a JSON array" — emit `data["entries"]` directly, not the full wrapper object.
- **Making `--date` and `--type` optional on `add`:** These are required fields per the API DTO (`@IsString()` without `@IsOptional()`). Mark them `required=True` in Click.
- **Using `http.put` for `move`:** The backend uses PATCH, not PUT. Use `http.patch`.
- **Naming the Python variable `type`:** `type` is a Python builtin. Use `meal_type` as the Python parameter name (Click `--type` option maps to `meal_type` kwarg automatically via hyphen-to-underscore normalization).
- **Naming the module `meal-plan.py`:** Python module names cannot contain hyphens. Use `meal_plan.py`; register with `cli.add_command(meal_plan, name="meal-plan")` if needed, or just name the group function `meal_plan` and let Click use the underscore name (which CLI normalizes to `meal-plan` automatically).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Auth header injection | Custom per-command auth logic | `http.get/post/patch/delete` wrappers | Already handles `Config.from_env()` + Bearer token |
| Error-to-exit-code mapping | Custom error handling | `raise_for_status` in `errors.py` | Covers 401→exit 2, 404→exit 3, 400→exit 4, other→exit 1 |
| Destructive guard | Custom confirmation logic | `require_yes(yes)` from `utils.py` | Handles TTY detection + non-TTY fast fail |
| CLI runner for tests | Custom test harness | `CliRunner` from `click.testing` via `runner` fixture | Already in `conftest.py` |

## Common Pitfalls

### Pitfall 1: Module naming with hyphens
**What goes wrong:** `meal-plan.py` is not a valid Python filename for import.
**Why it happens:** The CLI subcommand is `meal-plan` but Python modules use snake_case.
**How to avoid:** Name the file `meal_plan.py`. Click normalizes underscores to hyphens in command names, so `@click.group()` named `meal_plan` will be invokable as `rmapi meal-plan ...` automatically.
**Warning signs:** `ModuleNotFoundError` or `ImportError` when importing from `cli.py`.

### Pitfall 2: Outputting the list wrapper instead of the entries array
**What goes wrong:** `click.echo(json.dumps(data))` where data is `{ "entries": [...] }` — outputs the object, not the array.
**Why it happens:** Other list commands (recipes) return the full paginated wrapper, so it's natural to follow the same pattern.
**How to avoid:** The success criterion explicitly says "returns all meal plan entries... as a JSON array." Emit `data["entries"]` directly.
**Warning signs:** Test asserting `isinstance(result, list)` fails; instead gets a dict.

### Pitfall 3: Using `type` as a Python variable name
**What goes wrong:** Shadowing the Python builtin `type` function inside the command handler.
**Why it happens:** The CLI flag is `--type` which Click maps to a `type` kwarg.
**How to avoid:** Use `"meal_type"` as the parameter name: `@click.option("--type", "meal_type", ...)`. Consistent with how Phase 17 used `"step_body"` to avoid shadowing `body`.
**Warning signs:** Unexpected behavior or linting errors in the function body.

### Pitfall 4: PUT vs PATCH for move
**What goes wrong:** Calling `http.put` for the move command.
**Why it happens:** "move" sounds like a full replacement.
**How to avoid:** The backend controller uses `@Patch('entries/:id')`. Use `http.patch`.
**Warning signs:** 405 Method Not Allowed from the API.

### Pitfall 5: Required fields on `add` marked optional
**What goes wrong:** `--recipe-id`, `--date`, `--type` left as optional (`default=None`) on `add` — agent call missing a required field gets a 400 from the API instead of a helpful CLI error.
**Why it happens:** Following the sparse-body pattern blindly from `update` commands.
**How to avoid:** On `add`, mark all three `required=True` in Click options.
**Warning signs:** `exit_code == 1` instead of `0` on minimal invocation.

## Code Examples

### meal_plan.py structure
```python
# Source: derived from tools/rmapi/rmapi/commands/sections.py pattern
"""Meal plan commands."""

import json
import click
from .. import http
from ..utils import require_yes


@click.group()
def meal_plan() -> None:
    """Meal plan commands."""
    pass


@meal_plan.command("list")
@click.option("--from", "from_date", default=None, help="Start date YYYY-MM-DD")
@click.option("--to", "to_date", default=None, help="End date YYYY-MM-DD")
def meal_plan_list(from_date, to_date):
    """List meal plan entries by date range."""
    params = {k: v for k, v in {"from": from_date, "to": to_date}.items() if v is not None}
    data = http.get("/api/meal-plan", params=params)
    click.echo(json.dumps(data["entries"]))


@meal_plan.command("add")
@click.option("--recipe-id", required=True, help="Recipe ID to assign")
@click.option("--date", "entry_date", required=True, help="Date YYYY-MM-DD")
@click.option("--type", "meal_type", required=True,
              type=click.Choice(["breakfast", "lunch", "dinner", "snack", "dessert"]),
              help="Meal type")
def meal_plan_add(recipe_id, entry_date, meal_type):
    """Add a recipe to the meal plan."""
    body = {"recipeId": recipe_id, "date": entry_date, "mealType": meal_type}
    data = http.post("/api/meal-plan/entries", body)
    click.echo(json.dumps(data))


@meal_plan.command("move")
@click.argument("entry_id")
@click.option("--date", "entry_date", default=None, help="New date YYYY-MM-DD")
@click.option("--type", "meal_type", default=None,
              type=click.Choice(["breakfast", "lunch", "dinner", "snack", "dessert"]),
              help="New meal type")
def meal_plan_move(entry_id, entry_date, meal_type):
    """Move a meal plan entry to a new date or meal type."""
    body = {k: v for k, v in {"date": entry_date, "mealType": meal_type}.items() if v is not None}
    data = http.patch(f"/api/meal-plan/entries/{entry_id}", body)
    click.echo(json.dumps(data))


@meal_plan.command("remove")
@click.argument("entry_id")
@click.option("--yes", is_flag=True, default=False, help="Skip confirmation prompt")
def meal_plan_remove(entry_id, yes):
    """Remove a meal plan entry."""
    require_yes(yes)
    result = http.delete(f"/api/meal-plan/entries/{entry_id}")
    click.echo(json.dumps(result))
```

Note: `--from` is a Python keyword conflict. Use `"from_date"` as the parameter name: `@click.option("--from", "from_date", ...)`.

### cli.py registration
```python
# Source: tools/rmapi/rmapi/cli.py existing pattern
from .commands.meal_plan import meal_plan
cli.add_command(meal_plan)
```

### test_meal_plan.py structure
```python
# Source: tools/rmapi/tests/test_sections.py pattern
ENV = {"RMAPI_BASE_URL": "http://localhost:3001", "RMAPI_TOKEN": "test-token"}

FAKE_ENTRY = {
    "id": "mp1",
    "date": "2026-03-21",
    "mealType": "dinner",
    "recipeId": "r1",
    "recipeName": "Pasta",
    "recipeSlug": "pasta",
    "createdAt": "2026-03-20T00:00:00.000Z",
    "updatedAt": "2026-03-20T00:00:00.000Z",
}

FAKE_LIST_RESPONSE = {"entries": [FAKE_ENTRY]}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| mix_stderr=True in CliRunner | CliRunner() with no args | click 8.2+ | Use `result.stdout` not `result.output` for JSON assertions |

**Deprecated/outdated:**
- `CliRunner(mix_stderr=False)`: parameter removed in click 8.2+; `CliRunner()` is the correct form (Phase 13-01 decision).

## Open Questions

1. **`--from` as a Python keyword**
   - What we know: `from` is a reserved keyword in Python; cannot be used as a function parameter name.
   - What's unclear: Nothing — Click's `@click.option("--from", "from_date", ...)` syntax resolves this cleanly.
   - Recommendation: Always use `"from_date"` as the Python parameter name, `--from` as the CLI flag name.

2. **`--type` as a Python builtin shadow**
   - What we know: `type` is a Python builtin, not a keyword — shadowing it is legal but poor practice.
   - What's unclear: Nothing.
   - Recommendation: Use `"meal_type"` as the Python parameter name, `--type` as the CLI flag name.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | pytest 7.x |
| Config file | `tools/rmapi/pytest.ini` or `pyproject.toml` (existing) |
| Quick run command | `cd /home/solanoe/code/recipe-manager && .venv/bin/pytest tools/rmapi/tests/test_meal_plan.py -x` |
| Full suite command | `cd /home/solanoe/code/recipe-manager && .venv/bin/pytest tools/rmapi/tests/ -x` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MPL-01 | `meal-plan list` returns entries array from `GET /api/meal-plan` | unit | `.venv/bin/pytest tools/rmapi/tests/test_meal_plan.py::test_meal_plan_list -x` | Wave 0 |
| MPL-01 | `--from` and `--to` flags pass as query params | unit | `.venv/bin/pytest tools/rmapi/tests/test_meal_plan.py::test_meal_plan_list_date_filters -x` | Wave 0 |
| MPL-02 | `meal-plan add` posts to entries endpoint and returns id | unit | `.venv/bin/pytest tools/rmapi/tests/test_meal_plan.py::test_meal_plan_add -x` | Wave 0 |
| MPL-02 | `meal-plan add` body contains recipeId, date, mealType | unit | `.venv/bin/pytest tools/rmapi/tests/test_meal_plan.py::test_meal_plan_add_body -x` | Wave 0 |
| MPL-03 | `meal-plan move <id>` patches date and type | unit | `.venv/bin/pytest tools/rmapi/tests/test_meal_plan.py::test_meal_plan_move -x` | Wave 0 |
| MPL-03 | `meal-plan move` body is sparse (omits None fields) | unit | `.venv/bin/pytest tools/rmapi/tests/test_meal_plan.py::test_meal_plan_move_sparse_body -x` | Wave 0 |
| MPL-04 | `meal-plan remove <id> --yes` deletes and exits 0 | unit | `.venv/bin/pytest tools/rmapi/tests/test_meal_plan.py::test_meal_plan_remove_with_yes -x` | Wave 0 |
| MPL-04 | `meal-plan remove <id>` without --yes exits 4 in non-TTY | unit | `.venv/bin/pytest tools/rmapi/tests/test_meal_plan.py::test_meal_plan_remove_requires_yes -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `.venv/bin/pytest tools/rmapi/tests/test_meal_plan.py -x`
- **Per wave merge:** `.venv/bin/pytest tools/rmapi/tests/ -x`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tools/rmapi/tests/test_meal_plan.py` — covers MPL-01 through MPL-04

## Sources

### Primary (HIGH confidence)
- `apps/api/src/meal-plan/meal-plan.controller.ts` — exact HTTP verbs, routes, and parameter names
- `apps/api/src/meal-plan/meal-plan.service.ts` — confirmed response shapes and field names
- `packages/shared/src/api/meal-plan.ts` — `MealPlanEntryResponse`, `MealPlanResponse`, `CreateMealPlanEntryRequest`, `UpdateMealPlanEntryRequest` interfaces
- `packages/shared/src/enums.ts` — `MealType` enum values: breakfast, lunch, dinner, snack, dessert
- `tools/rmapi/rmapi/commands/sections.py` — reference implementation for command group pattern
- `tools/rmapi/rmapi/commands/steps.py` — reference implementation
- `tools/rmapi/tests/test_sections.py` — reference test pattern

### Secondary (MEDIUM confidence)
- `.planning/STATE.md` decisions block — confirmed Click 8.2+ CliRunner pattern, sparse body pattern, `require_yes` guard pattern

### Tertiary (LOW confidence)
None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies; verified existing tool versions from installed package
- Architecture: HIGH — all patterns directly observed in existing Phase 17 code
- Pitfalls: HIGH — `--from` keyword conflict and `--type` builtin shadow are deterministic Python language facts; other pitfalls observed from existing phase decisions

**Research date:** 2026-03-20
**Valid until:** 2026-06-20 (stable — Python, Click, and the backend API are not changing)
