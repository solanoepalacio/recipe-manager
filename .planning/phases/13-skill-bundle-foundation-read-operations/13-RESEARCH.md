# Phase 13: Skill Bundle — Foundation + Read Operations - Research

**Researched:** 2026-03-20
**Domain:** Technical documentation for AI agent consumption (Markdown skill bundle)
**Confidence:** HIGH

## Summary

Phase 13 is pure documentation work — no code changes to the application. The deliverable is four Markdown files placed at `skills/recipe-manager/` that teach an AI agent how to authenticate and perform read operations on the recipe-manager REST API with no prior knowledge.

The key distinction from normal developer documentation is audience: these files are read by a machine at runtime, one file at a time, on demand. Every design choice must optimize for machine parsability and completeness-per-file, not developer ergonomics. The `plans/02_Skill/skill-bundle-spec.md` file is the canonical requirements source and defines the exact content contract for each file.

The four files for this phase are: `index.md` (startup index), `shared.md` (auth + errors + pagination), `recipes_search.md` (GET /api/recipes with query params), and `recipes_get.md` (GET /api/recipes/:id full detail shape). All data needed to write these files exists in the live codebase — no external research required.

**Primary recommendation:** Write the four skill files as lean, machine-readable Markdown tables and JSON blocks. Follow `skill-bundle-spec.md` requirements exactly. No prose padding.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SKILL-01 | Agent can find which skill file to read for any operation (`index.md` — startup index with one-line descriptions and read guidance) | `index.md` must list all 8 bundle files with one-line descriptions; format and completeness requirements defined in `skill-bundle-spec.md` §index.md |
| SKILL-02 | Agent can authenticate and understand error codes and pagination (`shared.md` — Bearer auth, base URL, 400/401/403/404/500 meanings, pagination envelope) | Auth mechanism confirmed in `api-key.guard.ts` (Bearer header, SHA-256 hash lookup); error shapes from `packages/shared/src/common.ts` ErrorResponse; pagination envelope from PaginatedResponse; base URL `/api` from `main.ts` global prefix |
| SKILL-03 | Agent can search and list recipes by name, food, sort, and pagination (`recipes_search.md` — GET /api/recipes with all query params, example request/response) | All query params confirmed in `recipe-query.dto.ts` and `recipes.controller.ts`; RecipeListItem shape from `packages/shared/src/api/recipes.ts`; default values: sort=createdAt, order=desc, page=1, pageSize=20 |
| SKILL-04 | Agent can fetch full recipe detail including sections, ingredients, steps, and images (`recipes_get.md` — GET /api/recipes/:id full response shape) | RecipeDetailResponse with all nested types confirmed in `packages/shared/src/api/recipes.ts`; 403 on wrong household, 404 on missing confirmed in `recipes.controller.ts` |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Markdown | N/A | Skill file format | Agent-agnostic; no tooling dependencies; human-readable for maintenance |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| JSON blocks in Markdown | N/A | Request/response examples | Machine-parsable, unambiguous shape representation |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Markdown files | OpenAPI YAML | OpenAPI is verbose and requires tooling; Markdown is direct and readable by LLMs without parsing |
| Markdown files | In-code comments | Not loadable as standalone skill files; doesn't support progressive disclosure pattern |

## Architecture Patterns

### Recommended Project Structure
```
skills/
└── recipe-manager/
    ├── index.md          # Startup index — agent entry point
    ├── shared.md         # Auth, base URL, errors, pagination
    ├── recipes_search.md # GET /api/recipes
    ├── recipes_get.md    # GET /api/recipes/:id
    ├── recipes_create.md # Phase 14
    ├── recipes_edit.md   # Phase 14
    ├── recipes_image.md  # Phase 14
    └── meal_plan.md      # Phase 14
```

The `skills/` directory is placed at project root (alongside `apps/`, `packages/`).

### Pattern 1: Progressive Disclosure Index
**What:** `index.md` is the only file an agent receives at startup. It contains no endpoint docs — only pointers to the right file for each operation class.
**When to use:** Every skill bundle starts with an index. The agent fetches the specific skill file before each class of operation.
**Requirements from spec:**
- One-line description per file
- Explicit statement: read the relevant file before each operation
- Call out `shared.md` as the prerequisite for auth setup
- No endpoint documentation in index itself

### Pattern 2: Complete-per-File Skill Docs
**What:** Each skill file is fully self-contained for its operation. An agent reading only that file can construct a correct HTTP request.
**When to use:** All files except `index.md`.
**Requirements from spec:**
- Exact endpoint path and method
- All query/body parameters with types, required/optional markers, and defaults
- Full response shape (nested objects shown in full)
- At least one example request and response in JSON
- Cross-references when IDs from other endpoints are needed

### Pattern 3: Machine-Readable Format Conventions
**What:** Tables for parameter lists; JSON blocks for request/response examples; minimal prose.
**When to use:** Throughout all skill files.
**Example:**
```markdown
## Query Parameters

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| search | string | No | — | Case-insensitive substring match on recipe name |
| foodId | string | No | — | Filter to recipes containing an ingredient with this food ID |
| sort | enum | No | createdAt | One of: name, createdAt, updatedAt, random |
| order | enum | No | desc | One of: asc, desc |
| page | integer | No | 1 | 1-based page number |
| pageSize | integer | No | 20 | Items per page |
```

### Anti-Patterns to Avoid
- **Prose-heavy explanations:** Each sentence is context tokens the agent must process. Prefer tables and code blocks.
- **Incomplete response shapes:** If a field is nullable (e.g., `description: string | null`), show that. Agents infer from examples.
- **Missing defaults:** Document defaults explicitly — agents cannot guess that `pageSize` defaults to 20.
- **Cross-file dependencies without cross-references:** If `recipes_get.md` is needed to obtain IDs for edit operations, say so. Phase 13 files are read-only but `recipes_get.md` must note its `:id` param is used by all sub-resource endpoints in Phase 14 files.
- **Version drift:** Skill files describe the live API. If the API changes, the files must change. The compiler does not enforce skill file accuracy — tests do.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| API contract documentation | Custom doc generator | Read from source: controllers, DTOs, shared types | Source is authoritative; generators add a sync problem |
| Example request validation | Test suite | Manual inspection of DTO decorators | Skill files are prose, not code — over-engineering |
| Skill format standard | Invent a schema | Follow `skill-bundle-spec.md` exactly | Spec is already written and requirements are locked |

**Key insight:** This phase is a writing task, not an engineering task. The API is already built. The deliverable is accurate prose and examples derived from reading the live codebase.

## Common Pitfalls

### Pitfall 1: Inaccurate Pagination Field Names
**What goes wrong:** Writing `pageSize` in the response envelope when the actual API returns `perPage`.
**Why it happens:** The query parameter is named `pageSize` (RecipeQueryDto) but the PaginatedResponse interface uses `perPage`. These are different names.
**How to avoid:** The request uses `pageSize`; the response envelope uses `perPage`. Document both explicitly.
**Warning signs:** Any time a query param name matches a response field name exactly — verify they are indeed the same.

Source evidence (HIGH confidence):
- `packages/shared/src/common.ts` line 7: `perPage: number` (response field)
- `apps/api/src/recipes/dto/recipe-query.dto.ts` line 50: `pageSize?: number = 20` (query param)

### Pitfall 2: Missing Nullable Fields
**What goes wrong:** Documenting `description` as `string` when it is `string | null`.
**Why it happens:** Agents reading the example response infer the type from the example. If the example shows a non-null value, the agent assumes non-nullable.
**How to avoid:** Show a mix of null and non-null values in examples, or annotate type explicitly in the response shape table.
**Warning signs:** Any RecipeDetailResponse or RecipeListItem field that is `| null` in the shared type.

### Pitfall 3: Wrong HTTP Status for Validation Errors
**What goes wrong:** Documenting `422` as the validation error code when NestJS returns `400`.
**Why it happens:** REST convention suggests 422 for semantic validation; NestJS ValidationPipe returns 400 by default.
**How to avoid:** The spec says document both 400 and 422. NestJS default is 400. Document 400 as the primary; mention 422 as also possible per spec guidance.
**Warning signs:** Check `skill-bundle-spec.md` §shared.md — it explicitly lists both 400/422.

### Pitfall 4: Index File Contains Endpoint Documentation
**What goes wrong:** Adding endpoint details (paths, params) to `index.md` for convenience.
**Why it happens:** It seems helpful. But the spec prohibits it.
**How to avoid:** `index.md` contains only file names, one-line descriptions, and the read-this-first instruction.
**Warning signs:** If any HTTP method, path, or parameter appears in `index.md`, it violates the spec.

### Pitfall 5: Incorrect Image URL Base Path
**What goes wrong:** Documenting image URLs without the `/uploads/` prefix.
**Why it happens:** The stored URL in the database is a relative path. The agent needs to know how it's served.
**How to avoid:** `main.ts` configures `useStaticAssets(uploadsDir, { prefix: '/uploads' })`. Images are served at `<baseUrl>/uploads/<filename>`. The `url` field in ImageResponse already contains the full relative path (e.g., `/uploads/uuid.jpg`) — no assembly needed.
**Warning signs:** This applies to Phase 14 (`recipes_image.md`) but worth noting now since `recipes_get.md` surfaces the `images[]` array with `url` fields.

## Code Examples

Verified patterns from live codebase:

### Authentication (API Key)
```
// Source: apps/api/src/auth/guards/api-key.guard.ts
Authorization: Bearer <raw-api-token>
```
The guard reads `Authorization` header, slices off `Bearer `, hashes with SHA-256, looks up in `ApiToken` table. The agent sends the raw token — hashing is server-side.

### PaginatedResponse envelope
```json
// Source: packages/shared/src/common.ts
{
  "items": [...],
  "total": 100,
  "page": 1,
  "perPage": 20
}
```

### RecipeListItem shape (GET /api/recipes response items)
```json
// Source: packages/shared/src/api/recipes.ts RecipeListItem
{
  "id": "uuid",
  "name": "Tortilla española",
  "slug": "tortilla-espanola",
  "description": "Receta tradicional",
  "servingsQty": 4,
  "servingsUnit": "porciones",
  "shareToken": null,
  "createdAt": "2026-03-01T10:00:00.000Z",
  "updatedAt": "2026-03-15T14:30:00.000Z",
  "imageCount": 2,
  "coverImageUrl": "/uploads/abc123.jpg"
}
```

### RecipeDetailResponse full shape (GET /api/recipes/:id)
```json
// Source: packages/shared/src/api/recipes.ts RecipeDetailResponse + nested types
{
  "id": "uuid",
  "householdId": "uuid",
  "createdById": "uuid",
  "name": "Tortilla española",
  "slug": "tortilla-espanola",
  "description": "Receta tradicional",
  "servingsQty": 4,
  "servingsUnit": "porciones",
  "prepTime": 15,
  "cookTime": 20,
  "totalTime": 35,
  "performTime": null,
  "sourceUrl": null,
  "isLocked": false,
  "shareToken": null,
  "createdAt": "2026-03-01T10:00:00.000Z",
  "updatedAt": "2026-03-15T14:30:00.000Z",
  "sections": [
    {
      "id": "uuid",
      "title": null,
      "order": 0,
      "ingredients": [
        {
          "id": "uuid",
          "foodId": "uuid",
          "foodName": "Huevo",
          "unitId": "uuid",
          "unitName": "unidad",
          "quantity": 6,
          "note": null,
          "order": 0
        }
      ]
    }
  ],
  "steps": [
    {
      "id": "uuid",
      "title": null,
      "body": "Batir los huevos con sal.",
      "order": 0
    }
  ],
  "images": [
    {
      "id": "uuid",
      "url": "/uploads/abc123.jpg",
      "order": 0,
      "createdAt": "2026-03-01T10:05:00.000Z"
    }
  ]
}
```

### ErrorResponse shape
```json
// Source: packages/shared/src/common.ts ErrorResponse
{
  "statusCode": 404,
  "message": "Recipe uuid not found",
  "error": "Not Found"
}
```
For validation errors (400), `message` is an array of strings.

### GET /api/recipes query parameters
```
// Source: apps/api/src/recipes/dto/recipe-query.dto.ts
GET /api/recipes?search=tortilla&sort=name&order=asc&page=1&pageSize=10
GET /api/recipes?foodId=<uuid>&sort=createdAt&order=desc
GET /api/recipes?sort=random
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| OpenAPI YAML for agent consumption | Markdown skill files | v1.1 milestone | Agent-readable, no tooling, progressive disclosure |
| Single comprehensive API doc | Per-operation skill files | v1.1 milestone | Agent loads only what it needs per operation |

## Open Questions

1. **Where does `skills/` live in the monorepo?**
   - What we know: `skill-bundle-spec.md` says `skills/recipe-manager/` without specifying relative to what
   - What's unclear: Project root vs. a specific workspace
   - Recommendation: Place at monorepo root (`/skills/recipe-manager/`) alongside `apps/` and `packages/`. This is a distribution artifact, not app or package code.

2. **Should skill files document `totalTime` derivation behavior?**
   - What we know: `recipes.service.ts` line 127 computes `totalTime` as `prepTime + cookTime` if not explicitly set and both are non-null; stored `totalTime` takes precedence
   - What's unclear: Whether an agent needs this detail for read operations
   - Recommendation: Document in `recipes_get.md` that `totalTime` may be null even when `prepTime` and `cookTime` are set (if `totalTime` was never explicitly stored). The derived computation is server-side and transparent to API consumers.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest (ts-jest) — apps/api unit tests |
| Config file | `apps/api/jest.config.ts` |
| Quick run command | `yarn workspace recipe-manager-api test` |
| Full suite command | `yarn workspace recipe-manager-api test --coverage` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SKILL-01 | `index.md` lists all 8 bundle files with descriptions; no endpoint docs present | manual-only | N/A — file content review | ❌ Wave 0 |
| SKILL-02 | `shared.md` covers Bearer auth, error codes, pagination envelope | manual-only | N/A — documentation accuracy review | ❌ Wave 0 |
| SKILL-03 | `recipes_search.md` covers all query params with correct names/defaults | manual-only | N/A — documentation accuracy review | ❌ Wave 0 |
| SKILL-04 | `recipes_get.md` covers full RecipeDetailResponse shape including nested types | manual-only | N/A — documentation accuracy review | ❌ Wave 0 |

**Manual-only justification:** These requirements are documentation correctness requirements. Verification is by reading the produced Markdown files and confirming accuracy against the live source code. There is no executable test surface — the skill files contain no runnable code.

**Alternative verification approach:** The success criteria can be validated by a human (or the verifier agent) role-playing as the agent: read only `index.md`, follow the pointer to `shared.md`, attempt to construct an authenticated GET /api/recipes request from `recipes_search.md` alone, attempt to parse a GET /api/recipes/:id response from `recipes_get.md` alone. If all four success criteria are satisfiable, requirements are met.

### Sampling Rate
- **Per task commit:** N/A — documentation tasks; review file content on write
- **Per wave merge:** Manual cross-check against source types
- **Phase gate:** All four files present at `skills/recipe-manager/` with content satisfying spec requirements before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `skills/recipe-manager/` directory — does not exist yet; Wave 0 task creates it
- [ ] No test infrastructure gaps — documentation phase requires no test scaffolding

## Sources

### Primary (HIGH confidence)
- `plans/02_Skill/skill-bundle-spec.md` — canonical requirements for all 8 skill files; defines content contract exactly
- `packages/shared/src/api/recipes.ts` — authoritative RecipeDetailResponse, RecipeListItem, RecipeQueryParams types
- `packages/shared/src/common.ts` — PaginatedResponse and ErrorResponse shapes
- `apps/api/src/recipes/dto/recipe-query.dto.ts` — confirmed query param names, types, and defaults
- `apps/api/src/recipes/recipes.controller.ts` — confirmed endpoint paths and HTTP methods
- `apps/api/src/recipes/recipes.service.ts` — confirmed response mapping, totalTime derivation behavior
- `apps/api/src/auth/guards/api-key.guard.ts` — confirmed Bearer auth mechanism
- `apps/api/src/main.ts` — confirmed global prefix `/api`, static asset path `/uploads`

### Secondary (MEDIUM confidence)
- `plans/01_App/03_api_design.md` — design document for API conventions (base path, error shape, sub-resource nesting patterns)

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack (Markdown + JSON): HIGH — spec is prescriptive, no alternatives
- Architecture (file structure and content pattern): HIGH — spec defines exact file names and content requirements
- Pitfalls (nullable fields, pagination naming): HIGH — verified directly against TypeScript types in shared package

**Research date:** 2026-03-20
**Valid until:** Until API changes; specifically: RecipeDetailResponse shape, RecipeListItem shape, PaginatedResponse envelope, or query param names/defaults change
