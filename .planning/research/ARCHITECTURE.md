# Architecture Research

**Domain:** Agent CLI integration into an existing NestJS monorepo
**Researched:** 2026-03-20
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                        mili (Pydantic AI agent)                  │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │   shell_exec tool  ←→  skills/ context loaded at start   │    │
│  └──────────────────────────┬─────────────────────────────┘     │
└───────────────────────────── │ ──────────────────────────────────┘
                               │ invokes
┌───────────────────────────── │ ──────────────────────────────────┐
│         recipe-manager repo  │                                   │
│                              ▼                                   │
│  ┌────────────────────────────────────────────────┐              │
│  │         tools/rmapi/rmapi.py  (single file)    │              │
│  │                                                │              │
│  │  rmapi recipes list --fields id,name           │              │
│  │  rmapi recipes get <id>                        │              │
│  │  rmapi meal-plan list --from 2026-03-20        │              │
│  │  rmapi [resource] [action] [args...]           │              │
│  └──────────────────────┬─────────────────────────┘              │
│                         │ HTTP  Authorization: Bearer $RMAPI_TOKEN│
│                         ▼                                         │
│  ┌────────────────────────────────────────────────┐              │
│  │      apps/api  (NestJS, existing)              │              │
│  │      AnyAuthGuard → API key → householdId      │              │
│  └────────────────────────────────────────────────┘              │
│                                                                   │
│  ┌────────────────────────────────────────────────┐              │
│  │      skills/  (markdown skill files)           │              │
│  │      skills/index.md                           │              │
│  │      skills/recipe-discovery.md               │              │
│  │      skills/recipe-management.md              │              │
│  │      skills/meal-plan-management.md            │              │
│  └────────────────────────────────────────────────┘              │
└──────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Implementation |
|-----------|----------------|----------------|
| `tools/rmapi/rmapi.py` | Thin CLI wrapper over the REST API; handles auth, base URL, field projection, error normalization, JSON output | Single Python script, argparse subcommands, httpx |
| `skills/index.md` | One-paragraph-per-skill catalogue; agent loads this first to decide which skill to read | Static markdown, manually maintained |
| `skills/<task>.md` | Step-by-step task patterns with exact `rmapi` invocations; loaded by agent on demand | Markdown with YAML frontmatter (name, description) |
| `apps/api` | Unchanged NestJS backend; API key auth already implemented via `AnyAuthGuard` | Existing |
| `packages/shared` | Type contracts; `rmapi` output shapes match these types | Existing |

---

## Recommended Project Structure

```
recipe-manager/
├── tools/
│   └── rmapi/
│       ├── rmapi.py          # single executable script (the CLI)
│       ├── requirements.txt  # httpx, only dep
│       └── README.md         # one-page usage doc for humans
│
├── skills/
│   ├── index.md              # skills catalogue (name + one-line description each)
│   ├── recipe-discovery.md   # search, filter, paginate recipes
│   ├── recipe-management.md  # create, edit, duplicate, delete, images
│   └── meal-plan-management.md # view, add, move, remove meal plan entries
│
├── apps/
│   ├── api/                  # NestJS backend (unchanged)
│   └── web/                  # Next.js frontend (unchanged)
└── packages/
    └── shared/               # API boundary types (unchanged)
```

### Structure Rationale

- **`tools/rmapi/`:** Co-located with the repo so it stays in sync with API changes. Not a workspace package (no `package.json`) — it is a standalone Python script. The `tools/` prefix groups future CLI utilities without polluting root.
- **`skills/`:** Flat directory, not nested. Each file is a single task. Flat means the agent can enumerate them with one `ls`-equivalent call and load only what it needs. Nesting adds navigation overhead with no benefit at this scale (3–10 skill files).
- **`skills/index.md`:** The agent reads this first. It is a catalogue: one row per skill with name and a one-line description. It never describes *how* — that's in the individual skill files. Keeps the index small (< 500 tokens).

---

## Architectural Patterns

### Pattern 1: Sub-command CLI with resource/action naming

**What:** `rmapi <resource> <action> [options]` mirrors REST semantics so the agent can reason from API docs without extra translation. `rmapi recipes list`, `rmapi recipes get <id>`, `rmapi meal-plan add`.

**When to use:** Always — the API is resource-oriented, so the CLI should be too.

**Trade-offs:** Slightly more to type, but agents never type manually; they construct strings. The predictable shape reduces hallucination.

**Example:**
```
rmapi recipes list --q pasta --fields id,name,totalTime
rmapi recipes get abc-123
rmapi recipes create --name "Carbonara" --description "Classic Roman pasta"
rmapi meal-plan list --from 2026-03-20 --to 2026-03-27
rmapi meal-plan add --recipe-id abc-123 --date 2026-03-21 --meal-type dinner
```

### Pattern 2: Environment variable configuration, no config file

**What:** All runtime configuration comes from two env vars: `RMAPI_BASE_URL` (e.g. `http://localhost:3000`) and `RMAPI_TOKEN` (the Bearer token). No config file, no `~/.rmapi.toml`.

**When to use:** Always. The agent runs `rmapi` as a subprocess — it controls the environment. Config files require path management and add a setup step that can fail silently.

**Trade-offs:** The caller must export the vars. This is the same pattern used by `DOCKER_HOST`, `KUBECONFIG`, `DATABASE_URL` — well-understood by developers and agents alike. Flags (`--base-url`, `--token`) override env vars as escape hatches.

**Example:**
```bash
export RMAPI_BASE_URL=http://localhost:3000
export RMAPI_TOKEN=rma_abc123...
rmapi recipes list
```

### Pattern 3: JSON stdout, errors to stderr, typed exit codes

**What:** Every successful command writes a single JSON object (or JSON array) to stdout. Errors write `{"error": "<code>", "message": "<text>", "hint": "<optional fix>"}` to stderr and exit non-zero.

**When to use:** Always for agent-consumed CLIs. The agent has no interactive terminal and parses stdout directly.

**Exit code contract:**
```
0  — success
1  — general / unexpected error
2  — usage error (bad args)
3  — resource not found (404)
4  — permission denied (401/403)
5  — conflict (409)
```

**Trade-offs:** Requires agents to check both stdout and stderr. Standard approach — all research sources agree this is the correct split. Human users can redirect stderr to /dev/null if desired.

**Example output (success):**
```json
{"id": "abc-123", "name": "Carbonara", "slug": "carbonara"}
```

**Example error (stderr):**
```json
{"error": "not_found", "message": "Recipe abc-123 not found", "hint": "Use `rmapi recipes list` to find valid IDs"}
```

### Pattern 4: --fields projection to limit token usage

**What:** Every list and get command supports `--fields id,name,slug` which strips the response to only the requested keys (shallow, top-level). Without `--fields`, the full API response is returned.

**When to use:** The agent uses `--fields` for discovery/selection tasks (listing to find an ID). It omits `--fields` when it needs full detail (loading a recipe to read instructions).

**Trade-offs:** Implemented in the CLI script, not the API — projection is a post-processing step on the JSON response. Simple to implement, high token savings on list calls. Not a replacement for server-side pagination (`perPage` is a query param).

**Example:**
```
rmapi recipes list --fields id,name  # → [{"id":"...","name":"..."}, ...]
rmapi recipes get abc-123            # → full recipe object with sections, steps, images
```

### Pattern 5: Progressive skill loading via index

**What:** The agent's system prompt instructs it to read `skills/index.md` at session start. The index lists all skills with a one-line description. The agent reads a specific skill file only when it needs to perform that task type.

**When to use:** Always. Loading all skill files up front wastes context. The index costs ~200 tokens; each full skill file costs ~800–1500 tokens.

**Trade-offs:** Requires the agent to make a second read call to get full skill instructions. The latency is negligible; the token savings are significant for long sessions.

**Skill file format (follows Agent Skills open standard):**
```markdown
---
name: recipe-management
description: Create, update, duplicate, and delete recipes including sections, ingredients, steps, and images.
---

# Recipe Management

## When to use this skill
...

## Patterns
...

## Example invocations
rmapi recipes create --name "..." --description "..."
```

---

## Data Flow

### Agent Request Flow

```
agent decides to manage recipes
    ↓
reads skills/index.md (if not already in context)
    ↓
reads skills/recipe-management.md
    ↓
constructs: rmapi recipes create --name "Carbonara"
    ↓
shell_exec tool runs rmapi with RMAPI_BASE_URL + RMAPI_TOKEN from env
    ↓
rmapi.py: parses args → builds HTTP request → calls apps/api
    ↓
apps/api: AnyAuthGuard validates Bearer token → routes to RecipesService
    ↓
RecipesService: creates recipe scoped to householdId from token
    ↓
response: {"id": "...", "name": "Carbonara", "slug": "carbonara"}
    ↓
rmapi.py: prints JSON to stdout, exits 0
    ↓
agent receives structured output, continues
```

### Skill Discovery Flow

```
session start
    ↓
agent system prompt: "read skills/index.md to know what you can do"
    ↓
agent reads skills/index.md → gets list of skill names + one-line descriptions
    ↓
agent holds index in context for the session
    ↓
when task requires a skill: agent reads the specific skill/*.md file
    ↓
agent now has exact rmapi invocation patterns for the task
```

---

## Integration Points

### New Components (net new, nothing modified)

| Component | Location | Notes |
|-----------|----------|-------|
| `rmapi.py` | `tools/rmapi/rmapi.py` | New Python script, no impact on existing workspaces |
| `requirements.txt` | `tools/rmapi/requirements.txt` | `httpx>=0.27` only dep; not a Yarn workspace |
| `skills/index.md` | `skills/index.md` | Static markdown |
| `skills/recipe-discovery.md` | `skills/` | New markdown |
| `skills/recipe-management.md` | `skills/` | New markdown |
| `skills/meal-plan-management.md` | `skills/` | New markdown |

### Existing Components (no modifications required)

| Component | Why untouched |
|-----------|--------------|
| `apps/api` | API key auth (`AnyAuthGuard`) is already implemented. No new endpoints needed. |
| `packages/shared` | Types are already correct. `rmapi` output shapes match them by construction. |
| `apps/web` | Completely unaffected. |
| `package.json` (root) | `tools/rmapi/` is not a Yarn workspace. No entry needed. |

### External Dependencies

| Service | Integration | Notes |
|---------|-------------|-------|
| `apps/api` REST | HTTP via httpx, Bearer token | Base URL from `RMAPI_BASE_URL`. Token from `RMAPI_TOKEN`. |
| mili agent | reads skill files, invokes rmapi subprocess | Agent is external; only contract is file locations and rmapi interface |

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 3–10 skill files | Flat `skills/` directory is sufficient. Index is a single markdown file. |
| 10–30 skill files | Add a `category` field to skill frontmatter. Index auto-generates from frontmatter. Flat directory still works. |
| 30+ skill files | Group into subdirectories by domain (`skills/recipes/`, `skills/meal-plan/`). Update index generation script. |

This milestone has 3 skills. The flat structure is correct now and can grow without rearchitecting.

---

## Anti-Patterns

### Anti-Pattern 1: Config file instead of env vars

**What people do:** Write a `~/.rmapi.json` or `tools/rmapi/.env` that stores base URL and token.

**Why it's wrong:** The agent runs in a controlled environment where env vars are already the standard secret injection mechanism. A config file adds a setup step, introduces a path that differs between machines, and can silently use stale values. Every CI/CD and container pattern uses env vars — agents should too.

**Do this instead:** `RMAPI_BASE_URL` and `RMAPI_TOKEN` env vars. Document them in `tools/rmapi/README.md`.

### Anti-Pattern 2: Separate scripts per endpoint

**What people do:** `rmapi-list-recipes.py`, `rmapi-create-recipe.py`, `rmapi-get-recipe.py` etc.

**Why it's wrong:** The agent must track many tool names, and each script duplicates auth/config logic. Error handling diverges over time. Discovery requires enumerating files rather than `rmapi --help`.

**Do this instead:** Single `rmapi.py` with `argparse` subcommands. `rmapi recipes list`, `rmapi recipes get`, `rmapi recipes create` — one entry point, shared auth, shared error normalization.

### Anti-Pattern 3: Prose output instead of JSON

**What people do:** Print `"Recipe created: Carbonara (id: abc-123)"` to stdout.

**Why it's wrong:** The agent must parse natural language to extract the ID. Parsing is fragile — change the message wording and the agent breaks. Exit code alone is insufficient.

**Do this instead:** `{"id": "abc-123", "name": "Carbonara"}` to stdout always. Prose goes to stderr as an informational message only (or is omitted entirely).

### Anti-Pattern 4: Loading all skill files into agent context at startup

**What people do:** System prompt includes the full content of all skill files.

**Why it's wrong:** Each skill file is 800–1500 tokens. Three skills = ~4500 tokens of fixed overhead per session, before any work begins. Context fills faster; costs are higher.

**Do this instead:** System prompt includes only `skills/index.md` (~200 tokens). Agent reads individual skill files on demand when a relevant task arises.

### Anti-Pattern 5: Skills live outside the recipe-manager repo

**What people do:** Put skill files in the mili agent's repo or in a separate documentation repository.

**Why it's wrong:** When the API changes (endpoint added, field renamed), the skill files must be updated in sync. Skills living in the same repo as the API means a single PR updates both. Cross-repo drift is guaranteed to cause stale skill instructions.

**Do this instead:** `skills/` directory at the root of `recipe-manager`. Version-locked with the API they describe.

---

## Suggested Build Order

Based on component dependencies, build in this sequence:

1. **`tools/rmapi/rmapi.py`** — The CLI must exist before skill files can reference it with accurate command syntax. Build all supported subcommands (recipes CRUD, meal-plan CRUD, foods list, units list). Verify against live API.

2. **`skills/recipe-discovery.md`** — Covers `rmapi recipes list` with filtering and `--fields` projection. Simpler patterns, good for validating skill file format before tackling write operations.

3. **`skills/recipe-management.md`** — Covers create/edit/duplicate/delete and sub-resources (sections, ingredients, steps, images). More complex, depends on discovery patterns being stable.

4. **`skills/meal-plan-management.md`** — Covers `rmapi meal-plan` commands. Depends on recipe IDs being retrievable (recipe-discovery skill).

5. **`skills/index.md`** — Written last, after all skill files exist and their names/descriptions are finalized. Catalogues all three skills.

---

## Sources

- [CLI-Anything: One Command Makes Any Software Agent-Native](https://menonlab-blog-production.up.railway.app/blog/cli-anything-agent-native-software/) — JSON output patterns for agent-native CLIs
- [Writing CLI Tools That AI Agents Actually Want to Use](https://dev.to/uenyioha/writing-cli-tools-that-ai-agents-actually-want-to-use-39no) — Exit codes, error format, `--fields` pattern
- [You Need to Rewrite Your CLI for AI Agents](https://justin.poehnelt.com/posts/rewrite-your-cli-for-ai-agents/) — Field masks, NDJSON, input hardening
- [pydantic-ai-skills documentation](https://dougtrajano.github.io/pydantic-ai-skills/) — SKILL.md frontmatter format, progressive disclosure pattern
- [pydantic-ai-skills AGENTS.md](https://github.com/DougTrajano/pydantic-ai-skills/blob/main/AGENTS.md) — Skill naming conventions, discovery indexing
- [TOON vs JSON: Why AI Agents Need Token-Optimized Data Formats](https://jduncan.io/blog/2025-11-11-toon-vs-json-agent-optimized-data/) — Token cost analysis for output formats
- [Anthropic Agent Skills open standard](https://agentskills.io) — Vendor-neutral skill file specification (December 2025)
- `mvp_plans/03_api_design.md` — Authoritative endpoint reference for `rmapi` command design
- `mvp_plans/07_project_structure.md` — Existing monorepo conventions

---
*Architecture research for: agent CLI integration (rmapi + skills) in recipe-manager monorepo*
*Researched: 2026-03-20*
