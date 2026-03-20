# Phase 16: Recipe Write Commands - Research

**Researched:** 2026-03-20
**Domain:** Python CLI (Click) + REST API write operations (POST, PATCH, DELETE, multipart image upload)
**Confidence:** HIGH

## Summary

Phase 16 adds five `rmapi recipes` subcommands: `create`, `update`, `delete`, `duplicate`, and `add-image`. All five extend the `recipes` Click group already defined in `tools/rmapi/rmapi/commands/recipes.py`. The first four commands follow the established pattern from Phases 13–15 (Call `http.post()`, `http.patch()`, `http.delete()`, or `http.post()` with JSON body; print JSON to stdout; errors handled automatically by `raise_for_status`). The `add-image` command is the only novel case: it must download an image from a URL using `requests.get`, then upload it as `multipart/form-data` to `POST /api/recipes/:id/images` — the only endpoint in this project that expects multipart, not JSON.

The HTTP client in `http.py` already has `post`, `patch`, and `delete` functions. It does NOT have a multipart upload helper, so `add-image` must use `requests.post` directly (the same approach the frontend uses — raw fetch without Content-Type header so the browser/requests can set the boundary automatically). The `require_yes` guard from `utils.py` handles the `--yes` pattern for `delete` (CLI-05). All other infrastructure (errors, config, test fixtures, the `runner` pytest fixture) is already in place.

The full API contract is confirmed from the backend source: `POST /api/recipes` → `RecipeDetailResponse`; `PATCH /api/recipes/:id` → `RecipeDetailResponse` (only supplied fields patched); `DELETE /api/recipes/:id` → `{"id": string}` (HTTP 200, not 204); `POST /api/recipes/:id/duplicate` → `RecipeDetailResponse`; `POST /api/recipes/:id/images` → `ImageResponse` (`{id, url, order, createdAt}`).

**Primary recommendation:** Add all five subcommands to `recipes.py` in a single plan using TDD; write a `_mock_post`, `_mock_patch`, `_mock_delete` helper pattern in the test file; handle multipart upload by calling `requests.post` directly with `files={"file": (filename, bytes, content_type)}` and the Authorization header from `Config.from_env()`.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| RCP-03 | Agent can create a recipe — `rmapi recipes create` with name and optional metadata (description, servings, times, source URL) | `POST /api/recipes` confirmed; `CreateRecipeDto` fields confirmed; `http.post()` already in `http.py` |
| RCP-04 | Agent can update recipe metadata — `rmapi recipes update <id>` with any subset of metadata fields | `PATCH /api/recipes/:id` confirmed; `UpdateRecipeDto` is all-optional; `http.patch()` already in `http.py`; sparse body (only supplied flags) is the correct pattern |
| RCP-05 | Agent can delete a recipe — `rmapi recipes delete <id> --yes` | `DELETE /api/recipes/:id` → `{"id": string}` confirmed; `http.delete()` already in `http.py`; `require_yes()` already in `utils.py` |
| RCP-06 | Agent can duplicate a recipe — `rmapi recipes duplicate <id>` | `POST /api/recipes/:id/duplicate` → `RecipeDetailResponse` confirmed; no body required |
| RCP-07 | Agent can upload an image to a recipe from a URL — `rmapi recipes add-image <id> --url <url>` (CLI downloads and uploads as multipart) | `POST /api/recipes/:id/images` accepts `multipart/form-data` with field `file`; `ImageResponse` shape confirmed; must use `requests.post` directly with `files=` kwarg, not `http.post()` |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| click | 8.3.x (already installed) | CLI framework | All rmapi commands use Click |
| requests | (already installed) | HTTP client + image download | Already wrapped in `http.py`; also used directly for multipart upload |
| pytest | (already installed) | Test runner | Already used across all phases |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| unittest.mock | stdlib | Mock `requests.get/post/patch/delete` in tests | All CLI tests mock HTTP at the requests level |
| io.BytesIO | stdlib | Wrap downloaded image bytes for `files=` upload | Used in `add-image` to pass image content to requests multipart upload |

**No new packages required.** All dependencies are already present in the venv.

**Installation:** None needed.

## Architecture Patterns

### Project Structure
No new files needed — all five subcommands are added to the existing module:

```
tools/rmapi/rmapi/commands/
└── recipes.py        # Phase 16: add create, update, delete, duplicate, add-image

tools/rmapi/tests/
└── test_recipes.py   # Phase 16: extend with write command tests (14+ new test functions)
```

### Pattern 1: POST with JSON body (create, duplicate)

`http.post()` accepts an optional `json_body` dict and returns the parsed response. For `create`, build a body dict containing only the flags the user supplied (filter out None values). For `duplicate`, the endpoint takes no body.

```python
# Source: tools/rmapi/rmapi/http.py
def post(path: str, json_body: dict | None = None) -> dict | list:
    config = Config.from_env()
    response = requests.post(url, headers=_headers(config), json=json_body)
    raise_for_status(response)
    return response.json()
```

Build sparse body for `create`:
```python
body = {k: v for k, v in {
    "name": name,
    "description": description,
    "servingsQty": servings_qty,
    "servingsUnit": servings_unit,
    "prepTime": prep_time,
    "cookTime": cook_time,
    "totalTime": total_time,
    "performTime": perform_time,
    "sourceUrl": source_url,
}.items() if v is not None}
data = http.post("/api/recipes", body)
```

### Pattern 2: PATCH with sparse JSON body (update)

`http.patch()` exists in `http.py`. The key constraint: only send the fields the user actually supplied — omit everything they didn't pass. This is different from `create` because integer fields (servings, times) default to `None` when not supplied by the user; `None` should not be sent (that would null the field). Only send keys where the flag was explicitly provided.

```python
# Source: tools/rmapi/rmapi/http.py
def patch(path: str, json_body: dict | None = None) -> dict | list: ...
```

```python
body = {k: v for k, v in {
    "description": description,
    "servingsQty": servings_qty,
    "servingsUnit": servings_unit,
    "prepTime": prep_time,
    "cookTime": cook_time,
    "totalTime": total_time,
    "performTime": perform_time,
    "sourceUrl": source_url,
}.items() if v is not None}
data = http.patch(f"/api/recipes/{id}", body)
```

Note: `name` is included in `UpdateRecipeDto` so it could be added as an optional `--name` flag on `update` for completeness, but the requirement says "any subset of metadata fields" — minimum viable is all the optional fields minus `isLocked` (which is a human-intentional action per the Out of Scope section).

### Pattern 3: DELETE with --yes guard

`http.delete()` exists in `http.py`. It returns `None` on 204 or the parsed JSON on 200. The `/api/recipes/:id` DELETE returns HTTP 200 with `{"id": string}`, so `http.delete()` will return a dict. The `require_yes()` guard from `utils.py` must be called before the HTTP request.

```python
# Source: tools/rmapi/rmapi/utils.py
def require_yes(yes: bool) -> None:
    """Guard destructive commands: --yes flag OR interactive TTY required."""
```

```python
@recipes.command("delete")
@click.argument("id")
@click.option("--yes", is_flag=True, default=False, help="Skip confirmation prompt")
def recipes_delete(id: str, yes: bool) -> None:
    """Delete a recipe by ID."""
    require_yes(yes)
    result = http.delete(f"/api/recipes/{id}")
    click.echo(json.dumps(result))
```

### Pattern 4: Multipart image upload (add-image)

This is the only command that cannot use `http.post()` because the endpoint requires `multipart/form-data`, not JSON. The implementation must:
1. Download the image from the `--url` using `requests.get` (plain GET, no auth)
2. Post the image bytes to `POST /api/recipes/:id/images` using `requests.post` with `files={"file": (filename, bytes, content_type)}` and the Authorization header

**Critical:** Do NOT set `Content-Type: application/json` or use the `json=` kwarg — requests automatically sets the correct `multipart/form-data; boundary=...` header when `files=` is used.

```python
import io
import requests as req_lib
from ..config import Config

@recipes.command("add-image")
@click.argument("id")
@click.option("--url", "image_url", required=True, help="URL of the image to download and upload")
def recipes_add_image(id: str, image_url: str) -> None:
    """Download image from URL and upload as multipart to the recipe."""
    config = Config.from_env()
    # Step 1: download
    dl = req_lib.get(image_url, timeout=30)
    dl.raise_for_status()
    content_type = dl.headers.get("Content-Type", "image/jpeg")
    filename = image_url.split("/")[-1].split("?")[0] or "image.jpg"
    # Step 2: upload multipart
    response = req_lib.post(
        f"{config.base_url}/api/recipes/{id}/images",
        headers={"Authorization": f"Bearer {config.token}"},
        files={"file": (filename, io.BytesIO(dl.content), content_type)},
    )
    from ..errors import raise_for_status
    raise_for_status(response)
    click.echo(json.dumps(response.json()))
```

### Pattern 5: --url option name collision avoidance

Click reserves `url` as a common parameter name. To avoid shadowing Python built-ins or Click internals, name the Python parameter `image_url` using the `"image_url"` positional argument to `@click.option`:

```python
@click.option("--url", "image_url", required=True, ...)
def recipes_add_image(id: str, image_url: str) -> None: ...
```

### Pattern 6: Testing POST/PATCH/DELETE commands

The test file already has `_mock_get(payload)` and `_mock_get_404()`. Add analogous helpers for write operations:

```python
def _mock_post(payload, status=201):
    mock_resp = MagicMock()
    mock_resp.status_code = status
    mock_resp.json.return_value = payload
    return mock_resp

def _mock_patch(payload, status=200):
    mock_resp = MagicMock()
    mock_resp.status_code = status
    mock_resp.json.return_value = payload
    return mock_resp

def _mock_delete(payload=None, status=200):
    mock_resp = MagicMock()
    mock_resp.status_code = status
    mock_resp.json.return_value = payload if payload is not None else {"id": "r1"}
    return mock_resp
```

For `add-image`, two `requests` calls must be mocked: the image download (`requests.get`) and the upload (`requests.post`). Use `patch` with `side_effect` or two separate `patch` calls:

```python
def test_recipes_add_image_success(runner):
    dl_resp = MagicMock()
    dl_resp.status_code = 200
    dl_resp.content = b"fake-image-bytes"
    dl_resp.headers = {"Content-Type": "image/jpeg"}
    dl_resp.raise_for_status = lambda: None

    upload_resp = MagicMock()
    upload_resp.status_code = 201
    upload_resp.json.return_value = FAKE_IMAGE_RESPONSE

    with patch("requests.get", return_value=dl_resp), \
         patch("requests.post", return_value=upload_resp):
        result = runner.invoke(cli, ["recipes", "add-image", "r1", "--url", "http://example.com/img.jpg"], env=ENV)
    assert result.exit_code == 0
    data = json.loads(result.stdout)
    assert "id" in data and "url" in data
```

### Anti-Patterns to Avoid

- **Sending None values in PATCH body:** If the user doesn't supply `--description`, the flag value is `None`. Sending `{"description": null}` would null out the field in the database. Always filter None values from the body.
- **Using http.post() for multipart upload:** `http.post()` sets `Content-Type: application/json`. Passing `files=` to it would be overridden. Use `requests.post` directly with `files=` and manually set only the Authorization header.
- **Setting Content-Type manually for multipart:** Let `requests` set `Content-Type: multipart/form-data; boundary=...` automatically — setting it manually breaks the boundary.
- **Importing requests as `requests` inside recipes.py where it conflicts:** The existing `recipes.py` does not import `requests` directly. For `add-image`, import it as `import requests as req_lib` or use a distinct name to avoid confusion.
- **Not calling require_yes before HTTP request:** The guard must run before any network call. If `sys.stdin.isatty()` is False and `--yes` is not set, it exits with code 4 before touching the network.
- **Using http.delete() return value assumptions:** The API returns HTTP 200 + `{"id": string}` for recipe delete (not 204). `http.delete()` handles this correctly — it returns `None` only for 204, otherwise returns parsed JSON.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Field projection | Custom dict filtering | `apply_fields()` in `rmapi/utils.py` | Already handles list and dict; tested |
| HTTP error mapping | Status code conditionals | `raise_for_status()` in `rmapi/errors.py` | Maps 401→AuthError, 404→NotFoundError, 400/422→ValidationError |
| Destructive command guard | Custom `--yes` logic | `require_yes()` in `rmapi/utils.py` | Handles both TTY detection and non-TTY fast-fail; tested in Phase 13 |
| Auth header construction | Manual `Authorization: Bearer` string | `Config.from_env()` + `_headers()` pattern | Reuse `config.token` directly for multipart upload |
| JSON body for POST/PATCH | Manual `json.dumps` + headers | `http.post(path, body)` / `http.patch(path, body)` | Wrapper handles headers, URL construction, error raising |

**Key insight:** Only `add-image` requires stepping outside the `http.*` wrappers — every other write command uses the existing abstractions unchanged.

## Common Pitfalls

### Pitfall 1: PATCH sends None values, nulling out fields
**What goes wrong:** A user runs `rmapi recipes update r1 --description "New"` without touching `--servings-qty`. Click sets `servings_qty=None`. If the body includes `{"servingsQty": null}`, the API service picks it up as an explicit null and saves it, wiping the existing value.
**Why it happens:** Click option defaults are `None` when not provided. The PATCH body dict comprehension must filter them out.
**How to avoid:** `{k: v for k, v in {...}.items() if v is not None}` — same pattern used in `recipes_list` for query params.
**Warning signs:** Fields get nulled out after an update that didn't mention them.

### Pitfall 2: add-image uses http.post() which sets application/json
**What goes wrong:** `http.post()` passes `json=json_body` to `requests.post()`. If you try to also pass `files=`, `requests` will raise a `ValueError: not supported` or silently ignore one of them.
**Why it happens:** `requests` cannot simultaneously send `json=` (JSON body) and `files=` (multipart body).
**How to avoid:** For `add-image`, call `requests.post` directly with only `files=` and `headers=` (Authorization only, no Content-Type).
**Warning signs:** Server returns 400 "unexpected content type" or a Python ValueError at runtime.

### Pitfall 3: Image download error not surfaced cleanly
**What goes wrong:** The image URL is invalid or the remote server returns 4xx/5xx. If `dl.raise_for_status()` is a bare stdlib call (not `raise_for_status` from `errors.py`), the exception is an untyped `requests.HTTPError` — Click will catch it and exit 1 with an ugly traceback rather than a JSON error.
**Why it happens:** The download step is outside the `raise_for_status` wrapper that maps codes to typed errors.
**How to avoid:** Wrap the download in a try/except and raise `ApiError` on failure, or accept that the download error will propagate as exit code 1 (acceptable since it's not an API-layer error). Document this behavior clearly in tests.
**Warning signs:** Test for download failure exits with unclean output if not handled.

### Pitfall 4: Test mocking two requests calls in add-image
**What goes wrong:** `add-image` calls `requests.get` (download) then `requests.post` (upload). If you only mock one, the other hits a real network.
**Why it happens:** The two calls happen in the same command function, both using the `requests` module.
**How to avoid:** Use two `patch` context managers simultaneously: `with patch("requests.get", ...), patch("requests.post", ...):`.
**Warning signs:** Test hangs or fails with `ConnectionError`.

### Pitfall 5: click.option --url conflicts with Python built-in
**What goes wrong:** If the Click option parameter name is `url`, it shadows nothing critical in Python, but it does conflict with the local `image_url` variable naming needed when `requests` also has `url` in scope.
**How to avoid:** Always use `@click.option("--url", "image_url", ...)` to give Click option a distinct Python parameter name.

### Pitfall 6: Delete test must pass --yes or mock sys.stdin.isatty
**What goes wrong:** In tests, `sys.stdin.isatty()` returns False (no real TTY in CliRunner). Without `--yes`, `require_yes` exits with code 4. Tests that don't pass `--yes` will fail with exit code 4 instead of 0.
**How to avoid:** All `delete` tests that test the happy path must include `"--yes"` in the invocation args.
**Warning signs:** Delete test exits 4 with `"confirmation_required"` in stderr instead of testing the actual delete.

## Code Examples

Verified patterns from project source:

### API Endpoint Reference (confirmed from backend source)

| Endpoint | Method | Body | Response | HTTP Status |
|----------|--------|------|----------|-------------|
| `/api/recipes` | POST | `CreateRecipeDto` (JSON) | `RecipeDetailResponse` | 201 |
| `/api/recipes/:id` | PATCH | `UpdateRecipeDto` (JSON, all fields optional) | `RecipeDetailResponse` | 200 |
| `/api/recipes/:id` | DELETE | none | `{"id": string}` | 200 |
| `/api/recipes/:id/duplicate` | POST | none | `RecipeDetailResponse` | 201 |
| `/api/recipes/:id/images` | POST | multipart `file` field | `ImageResponse` | 201 |

`ImageResponse` fields (confirmed from `images.service.ts` and shared types): `id`, `url`, `order`, `createdAt`.

### CreateRecipeDto fields (confirmed from `create-recipe.dto.ts`)
Required: `name` (string)
Optional: `description` (string), `servingsQty` (int ≥ 0), `servingsUnit` (string), `prepTime` (int ≥ 0), `cookTime` (int ≥ 0), `totalTime` (int ≥ 0), `performTime` (int ≥ 0), `sourceUrl` (URL string)

### UpdateRecipeDto fields (confirmed from `update-recipe.dto.ts`)
All optional: `name`, `description`, `servingsQty`, `servingsUnit`, `prepTime`, `cookTime`, `totalTime`, `performTime`, `sourceUrl`, `isLocked`. Note: `isLocked` is out of scope for the agent per REQUIREMENTS.md.

### recipes create — implementation pattern
```python
@recipes.command("create")
@click.option("--name", required=True, help="Recipe name")
@click.option("--description", default=None, help="Plain text description")
@click.option("--servings-qty", default=None, type=int, help="Serving quantity")
@click.option("--servings-unit", default=None, help='Serving unit label (e.g. "portions")')
@click.option("--prep-time", default=None, type=int, help="Prep time in minutes")
@click.option("--cook-time", default=None, type=int, help="Cook time in minutes")
@click.option("--total-time", default=None, type=int, help="Total time in minutes")
@click.option("--perform-time", default=None, type=int, help="Active perform time in minutes")
@click.option("--source-url", default=None, help="Source URL for the original recipe")
def recipes_create(name, description, servings_qty, servings_unit,
                   prep_time, cook_time, total_time, perform_time, source_url):
    """Create a new recipe."""
    body = {k: v for k, v in {
        "name": name,
        "description": description,
        "servingsQty": servings_qty,
        "servingsUnit": servings_unit,
        "prepTime": prep_time,
        "cookTime": cook_time,
        "totalTime": total_time,
        "performTime": perform_time,
        "sourceUrl": source_url,
    }.items() if v is not None}
    data = http.post("/api/recipes", body)
    click.echo(json.dumps(data))
```

### recipes delete — implementation pattern
```python
from ..utils import apply_fields, require_yes

@recipes.command("delete")
@click.argument("id")
@click.option("--yes", is_flag=True, default=False, help="Skip confirmation prompt")
def recipes_delete(id: str, yes: bool) -> None:
    """Delete a recipe by ID."""
    require_yes(yes)
    result = http.delete(f"/api/recipes/{id}")
    click.echo(json.dumps(result))
```

### add-image — implementation pattern
```python
import io
import requests as req_lib
from ..config import Config
from ..errors import raise_for_status

@recipes.command("add-image")
@click.argument("id")
@click.option("--url", "image_url", required=True, help="URL of the image to download and upload")
def recipes_add_image(id: str, image_url: str) -> None:
    """Download image from URL and upload as multipart to the recipe."""
    config = Config.from_env()
    dl = req_lib.get(image_url, timeout=30)
    dl.raise_for_status()
    content_type = dl.headers.get("Content-Type", "image/jpeg")
    filename = image_url.split("/")[-1].split("?")[0] or "image.jpg"
    response = req_lib.post(
        f"{config.base_url}/api/recipes/{id}/images",
        headers={"Authorization": f"Bearer {config.token}"},
        files={"file": (filename, io.BytesIO(dl.content), content_type)},
    )
    raise_for_status(response)
    click.echo(json.dumps(response.json()))
```

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Manual `sys.exit(N)` for error codes | `RmapiError` subclasses extend `click.ClickException` — Click sets `exit_code` automatically | No manual exit code management needed |
| Hand-rolled multipart upload logic | `requests` `files=` kwarg handles boundary automatically | One-liner upload after download |
| Confirmation prompts via input() | `require_yes(yes)` with TTY detection | Non-TTY fast-fail at exit 4, already tested |

## Open Questions

1. **Should `recipes update` include a `--name` flag?**
   - What we know: `UpdateRecipeDto` includes `name` as optional; the requirement says "any subset of metadata fields"; name is metadata.
   - What's unclear: Whether the requirement intends name changes (the agent might want to rename a recipe).
   - Recommendation: Include `--name` as optional in `recipes update` — it costs nothing and is more complete. The planner can drop it if too many flags is a concern.

2. **How should download failures in `add-image` surface?**
   - What we know: `dl.raise_for_status()` raises `requests.HTTPError` (not a typed `RmapiError`). Click will catch it and show a traceback-style error, exiting with code 1.
   - What's unclear: Whether the requirement expects a clean JSON error for download failures vs. API failures.
   - Recommendation: Accept exit code 1 with a less-clean error for download failures. Document in tests. The `raise_for_status` from `errors.py` covers the upload step cleanly.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | pytest (already installed in `.venv`) |
| Config file | `tools/rmapi/pyproject.toml` (testpaths configured) |
| Quick run command | `cd /home/solanoe/code/recipe-manager && .venv/bin/pytest tools/rmapi/tests/test_recipes.py -x -q` |
| Full suite command | `cd /home/solanoe/code/recipe-manager && .venv/bin/pytest tools/rmapi/tests/ -v` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| RCP-03 | `rmapi recipes create --name "X"` POSTs to /api/recipes and returns RecipeDetailResponse | unit | `pytest tools/rmapi/tests/test_recipes.py::test_recipes_create_minimal -x` | ❌ Wave 0 |
| RCP-03 | Optional metadata flags are included in POST body when supplied | unit | `pytest tools/rmapi/tests/test_recipes.py::test_recipes_create_with_metadata -x` | ❌ Wave 0 |
| RCP-03 | Unsupplied optional flags are NOT included in POST body | unit | `pytest tools/rmapi/tests/test_recipes.py::test_recipes_create_omits_none_fields -x` | ❌ Wave 0 |
| RCP-04 | `rmapi recipes update <id> --description "X"` PATCHes /api/recipes/:id | unit | `pytest tools/rmapi/tests/test_recipes.py::test_recipes_update_description -x` | ❌ Wave 0 |
| RCP-04 | Only supplied flags appear in PATCH body | unit | `pytest tools/rmapi/tests/test_recipes.py::test_recipes_update_sparse_body -x` | ❌ Wave 0 |
| RCP-05 | `rmapi recipes delete <id> --yes` DELETEs and exits 0 with {"id": ...} | unit | `pytest tools/rmapi/tests/test_recipes.py::test_recipes_delete_with_yes -x` | ❌ Wave 0 |
| RCP-05 | `rmapi recipes delete <id>` without --yes on non-TTY exits 4 | unit | `pytest tools/rmapi/tests/test_recipes.py::test_recipes_delete_requires_yes -x` | ❌ Wave 0 |
| RCP-06 | `rmapi recipes duplicate <id>` POSTs to /api/recipes/:id/duplicate and returns detail | unit | `pytest tools/rmapi/tests/test_recipes.py::test_recipes_duplicate -x` | ❌ Wave 0 |
| RCP-07 | `rmapi recipes add-image <id> --url <url>` downloads then uploads multipart | unit | `pytest tools/rmapi/tests/test_recipes.py::test_recipes_add_image_success -x` | ❌ Wave 0 |
| RCP-07 | add-image passes Authorization header (not Content-Type) to upload | unit | `pytest tools/rmapi/tests/test_recipes.py::test_recipes_add_image_auth_header -x` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `cd /home/solanoe/code/recipe-manager && .venv/bin/pytest tools/rmapi/tests/test_recipes.py -x -q`
- **Per wave merge:** `cd /home/solanoe/code/recipe-manager && .venv/bin/pytest tools/rmapi/tests/ -v`
- **Phase gate:** Full suite green (currently 43 tests passing) before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tools/rmapi/tests/test_recipes.py` — add ~10 new test functions for RCP-03 through RCP-07 (file exists; append to it)
- [ ] Add `FAKE_IMAGE_RESPONSE` and `_mock_post`, `_mock_patch`, `_mock_delete` helpers to `test_recipes.py`

*(All infrastructure — conftest.py, pytest config, http.py, errors.py, utils.py, Config — already exists from Phases 13–15)*

## Sources

### Primary (HIGH confidence)
- `tools/rmapi/rmapi/commands/recipes.py` — existing Phase 15 pattern for group and subcommand structure (project source)
- `tools/rmapi/rmapi/http.py` — `post()`, `patch()`, `delete()` function signatures confirmed (project source)
- `tools/rmapi/rmapi/utils.py` — `require_yes()` implementation confirmed (project source)
- `tools/rmapi/rmapi/errors.py` — `raise_for_status()` confirmed (project source)
- `apps/api/src/recipes/recipes.controller.ts` — POST, PATCH, DELETE, duplicate endpoint routes confirmed (project source)
- `apps/api/src/recipes/images/images.controller.ts` — multipart POST endpoint, `FileInterceptor('file', ...)`, 10MB limit confirmed (project source)
- `apps/api/src/recipes/recipes.service.ts` — `remove()` returns `{"id": string}` at HTTP 200 confirmed (project source)
- `apps/api/src/recipes/images/images.service.ts` — `ImageResponse` shape `{id, url, order, createdAt}` confirmed (project source)
- `apps/api/src/recipes/dto/create-recipe.dto.ts` — all `CreateRecipeDto` fields confirmed (project source)
- `apps/api/src/recipes/dto/update-recipe.dto.ts` — all `UpdateRecipeDto` optional fields confirmed (project source)
- `tools/rmapi/tests/test_recipes.py` — Phase 15 test pattern (mock helpers, ENV, assertions) confirmed (project source)
- `.planning/REQUIREMENTS.md` — RCP-03 through RCP-07 requirement text and flag names (project source)

### Secondary (MEDIUM confidence)
- `tools/rmapi/tests/test_yes_guard.py` — `require_yes` test patterns for delete guard behavior (project source)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new libraries; all dependencies already installed and in use
- Architecture: HIGH — API endpoint shapes confirmed from backend source; CLI patterns established in Phases 13–15; multipart pattern derived from `images.controller.ts` (FileInterceptor field name `file` confirmed)
- Pitfalls: HIGH — PATCH sparse body and multipart Content-Type are deterministic code-level facts; TTY guard behavior tested and confirmed from Phase 13

**Research date:** 2026-03-20
**Valid until:** 2026-06-20 (stable — CLI and API are both in this repo; no external dependencies)
