# Project Research Summary

**Project:** Recipe Manager — v1.1 Agent Integration (rmapi CLI + Skill Files)
**Domain:** Agent-facing CLI wrapper over an existing REST API + LLM skill file system
**Researched:** 2026-03-20
**Confidence:** HIGH

## Executive Summary

This milestone adds AI agent access to an existing, fully-designed REST API. The pattern is well-established: a thin Python CLI (`rmapi`) authenticates via Bearer token, wraps every relevant endpoint with a `noun verb` subcommand grammar, and outputs strict JSON to stdout. The agent never calls the API directly — it reads skill files (SKILL.md format) to discover task patterns and invokes `rmapi` as a subprocess. Nothing in the existing NestJS backend, frontend, or shared types needs to change; all new work is net-new files in `tools/rmapi/` and `skills/`.

The recommended implementation is Python + httpx + argparse (zero npm, zero shared-type coupling, fully self-contained) with skill files written to the SKILL.md open standard already supported natively by Claude Code. The most critical design constraints are all in the CLI scaffold phase: field projection must be built in from the start to avoid context window bloat, error output must be machine-parseable JSON with a closed set of `code` values, credentials must come from environment variables only (never CLI flags), and all destructive commands must accept `--yes` to prevent agent deadlocks. These are not retrofittable — getting them wrong in Phase 1 forces a rewrite of skill files and agent workflows later.

The primary ongoing risk after launch is skill file rot: the skill files have no compile-time link to the API contract, so every sprint that changes an API surface must include a skill file review as part of its definition of done. Adding a CI check that validates skill file command signatures against `rmapi --help` output is the only scalable mitigation.

---

## Key Findings

### Recommended Stack

The CLI is a single Python script (`tools/rmapi/rmapi.py`) using only stdlib (`argparse`, `json`, `os`) plus `httpx` for HTTP and `python-dotenv` for local dev config. No Node/npm, no code generation, no shared types — the CLI is a standalone tool for the agent, not a frontend consumer. Python 3.9+ is present on any modern system; the editable install (`pip install -e tools/rmapi/`) makes `rmapi` available as a shell command. Skill files use the SKILL.md open standard (agentskills.io, December 2025), which is natively supported by Claude Code and the runtime this agent will use.

**Core technologies:**
- Python 3.13 (system): CLI implementation — zero-dependency install, readable in error traces, first-class httpx support
- httpx 0.28.x: HTTP client — sync API, strict timeouts, typed, modern replacement for requests
- argparse (stdlib): Subcommand routing — zero-dependency, exit code semantics built in, maps cleanly to REST resource groups
- python-dotenv 1.x: Config loading — reads `RMAPI_TOKEN` / `RMAPI_BASE_URL` from `.env` for local dev ergonomics
- SKILL.md format: Agent skill files — open standard, natively supported by Claude Code, progressive disclosure (index loads at startup, individual files load on demand)

**What NOT to use:** requests (no types, no enforcement), Click/Typer (overkill), colored output (corrupts JSON), `--token` flag (shell history exposure), swagger codegen (fat, unauditable), interactive prompts (deadlocks agents).

### Expected Features

The agent's "user" is an LLM, not a human. Every feature decision flows from that constraint: context window is finite, there is no visual layer, and error messages are part of the decision interface.

**Must have (table stakes — agent blocked without these):**
- `rmapi` CLI with Bearer token auth and normalized JSON error output — foundation for all skills
- `search-recipes` skill — all agent workflows start with name-to-ID resolution
- `get-recipe-detail` skill (projected fields only) — ingredients and steps for reasoning
- `view-meal-plan` skill — read current week before proposing changes
- `add-to-meal-plan` skill — core multi-step workflow: search → resolve ID → POST entry
- `remove-from-meal-plan` and `move-meal-plan-entry` skills — plan manipulation requires entry `id` from GET, not recipe `id`
- `lookup-foods` and `lookup-units` prerequisite skills — API requires `foodId`/`unitId` (controlled vocabulary); agent cannot guess these
- `create-recipe` skill — highest-complexity sequence: recipe → section → ingredients (×N) → steps (×N); ID threading must be explicit
- `skills/INDEX.md` — discovery catalogue; prevents agent from hallucinating endpoints

**Should have (v1.x after core loop validated):**
- `edit-recipe`, `add-ingredient`, `edit-ingredient`, `add-step` skills
- `duplicate-recipe` skill
- `shopping-list` skill (client-side aggregation over meal plan + recipe detail)
- `--fields` projection flag on all list/get commands

**Defer (v2+):**
- Nutritional rollup (requires nutrition data, out of scope entirely)
- Multi-household agent access
- Batch operations (requires API changes)
- Admin skills (separate auth domain, different credentials)

**Anti-features (actively harmful — do not build):**
- One skill file per endpoint (agent thinks in tasks, not HTTP verbs)
- Full recipe detail in every skill (context window tax compounds over a session)
- `isLocked` or share operations in agent skills (irreversible human-intentional actions)
- Image upload skills (agent has no image source; binary multipart complexity for zero value)

### Architecture Approach

The architecture is strictly additive: two new directories (`tools/rmapi/` and `skills/`) in the existing monorepo. Nothing in `apps/api`, `apps/web`, or `packages/shared` is modified. The CLI is not a Yarn workspace — it is a standalone Python package with its own `pyproject.toml`. Skills live in the recipe-manager repo (not the agent's repo) so API changes and skill file updates travel in the same PR.

The agent flow is: read `skills/index.md` at session start → load individual skill file on demand → construct `rmapi` command → shell_exec → parse JSON stdout → continue. The CLI flow is: parse args → inject `Authorization: Bearer` header → call `apps/api` → normalize response/error → print JSON to stdout → exit with typed code.

**Major components:**
1. `tools/rmapi/rmapi.py` — single executable Python script; argparse subcommands (`rmapi recipes list`, `rmapi meal-plan add`); all auth, projection, error normalization in one file; no side effects on existing workspaces
2. `skills/index.md` — agent-readable catalogue; one-line description per skill; loaded at session start; under 500 tokens
3. `skills/<task>.md` — SKILL.md format; one file per user-facing task; exact `rmapi` invocations with expected output shapes; `last-verified` date in frontmatter
4. `apps/api` (unchanged) — `AnyAuthGuard` already handles Bearer token auth; no new endpoints needed
5. `packages/shared` (unchanged) — `rmapi` output shapes already match existing types

**Build order (dependency-driven):** CLI first (skill files need accurate command syntax to document) → `recipe-discovery` skill (simpler read patterns, validates skill format) → `recipe-management` skill (write operations, ID threading) → `meal-plan-management` skill (depends on recipe IDs) → `skills/index.md` last (catalogues finalized skill names).

### Critical Pitfalls

1. **Response verbosity creep** — Full API payloads returned by default flood the agent's context window; "getting dumber" mid-task is the symptom. Build `--fields` projection and minimal default list shapes into the CLI scaffold before wiring any endpoint. Never retrofit this.

2. **Shell injection via agent-constructed arguments** — Agent builds command strings containing user-supplied recipe names or descriptions; special characters or semicolons execute unintended shell commands (CVE-2025-54795). Use argument vectors (`shell=False`) everywhere. Validate inputs for shell metacharacters. Never pass user data to a shell string.

3. **API key exposure in shell history** — `--token sk-abc123` appears in `~/.bash_history`, `ps aux`, and process dumps (MITRE T1552.003). Credentials exclusively from `RMAPI_TOKEN` env var or `~/.rmapi/config.json` (0600). Never add a `--token` flag.

4. **Error messages designed for humans** — Plain-text errors or single exit code 1 for all failures prevent the agent from distinguishing retriable from fatal errors, causing blind retries or premature give-up. Every error must be a JSON object with `code`, `http_status`, `retriable`, and `fields` keys. Use distinct exit codes per error class.

5. **Skill file rot** — Skill files diverge silently from the API as the codebase evolves; agent follows stale patterns and gets repeated 400s. Add `last-verified` date to every skill file's frontmatter. Add a CI check that validates skill file command signatures against `rmapi --help`. Every API-changing PR must include a skill file review in its definition of done.

---

## Implications for Roadmap

### Phase 1: CLI Scaffold

**Rationale:** The `rmapi` CLI is a prerequisite for every skill file. Skill files cannot be written accurately until the command grammar, error format, exit codes, and `--fields` projection are stable and verified against the live API. All critical pitfalls (verbosity, injection, key exposure, error taxonomy, interactive deadlocks, pagination) must be addressed in this phase — they cannot be retrofitted without rewriting skill files.

**Delivers:** A working `rmapi` binary with auth, field projection, normalized JSON errors, typed exit codes, `--yes` flags on destructive commands, and a test suite that asserts on parsed JSON output and exit codes.

**Addresses:** `rmapi` CLI table-stakes feature; normalized error output; `--fields` projection flag

**Avoids:** Response verbosity creep, shell injection, API key exposure, error messages for humans, interactive prompt deadlocks, inconsistent pagination, human-oriented test suite

**Research flag:** No deeper research needed — patterns are well-documented. Follow the architecture spec in ARCHITECTURE.md directly.

---

### Phase 2: Read-Only Skills (Recipe Discovery + Meal Plan View)

**Rationale:** Read-only skills are lower risk (no write path, no ID threading) and validate the SKILL.md format and progressive-loading pattern before tackling complex write workflows. `search-recipes` and `view-meal-plan` are also prerequisite skills referenced by every write skill — their command grammar and output shapes must be stable first.

**Delivers:** `skills/recipe-discovery.md` (search, filter, field projection), `skills/meal-plan-management.md` (view, date range), `lookup-foods.md`, `lookup-units.md`

**Addresses:** search-recipes, view-meal-plan, lookup-foods/units table-stakes features

**Avoids:** Skill file rot (add `last-verified` dates and CI check in this phase)

**Research flag:** SKILL.md frontmatter format is documented at agentskills.io — no additional research needed.

---

### Phase 3: Meal Plan Write Skills

**Rationale:** The add/remove/move meal plan entry skills are low-complexity write operations (single POST/DELETE/PATCH each) but introduce the key pattern the agent will use most: search → resolve ID → mutate. Validating this pattern with simple mutations before tackling the multi-step recipe creation chain reduces risk.

**Delivers:** `add-to-meal-plan.md`, `remove-from-meal-plan.md`, `move-meal-plan-entry.md`

**Addresses:** add-to-meal-plan, remove-from-meal-plan, move-meal-plan-entry table-stakes features

**Avoids:** Entry ID confusion (document that entry `id` comes from GET, not from recipe `id`)

**Research flag:** Standard patterns — no additional research needed.

---

### Phase 4: Recipe Write Skills (Create + Edit)

**Rationale:** Recipe creation is the highest-complexity skill due to ID threading across 4 sequential API calls (recipe → section → ingredients × N → steps × N). Deferring it until Phase 4 means the CLI is stable, read patterns are validated, and meal plan write patterns have exercised the search → ID → mutate sequence. The `create-recipe` skill must document the full ID threading chain explicitly; this is where most agent failures occur.

**Delivers:** `create-recipe.md`, `get-recipe-detail.md`, `edit-recipe.md`; optionally `add-ingredient.md`, `edit-ingredient.md`, `add-step.md`, `duplicate-recipe.md`

**Addresses:** create-recipe (P1), edit-recipe, add/edit-ingredient, add-step, duplicate-recipe (P2)

**Avoids:** ID threading failures (section required even for single-section recipes; food lookup before every ingredient; steps appended after ingredients)

**Research flag:** ID threading sequence should be verified against the live API during implementation — the shared type declarations are the authoritative source but a live integration test is needed to confirm the exact required field set for each step.

---

### Phase 5: Skills Index + Shopping List

**Rationale:** `skills/index.md` is written last — after all skill files exist and their names and descriptions are finalized. The shopping list skill requires the full meal plan + recipe detail chain to be stable (it aggregates across both). Both are low-effort once the preceding phases are done.

**Delivers:** `skills/index.md` (agent discovery catalogue), `shopping-list.md` (client-side aggregation)

**Addresses:** Skills INDEX must-have feature; shopping-list should-have feature

**Avoids:** Stale index (written last so it reflects actual files)

**Research flag:** No additional research needed.

---

### Phase Ordering Rationale

- Phase 1 must come first because every skill file references `rmapi` command syntax. Building skills before the CLI grammar is locked guarantees the skill files need rewriting.
- Read skills (Phase 2) before write skills (Phases 3–4) because write skill sequences start with a search or view step; the output shapes of those commands must be stable before the write skill documents them.
- Meal plan writes (Phase 3) before recipe writes (Phase 4) because meal plan writes are simpler (no ID threading) and validate the search → resolve → mutate pattern at low risk before the complex recipe creation chain is tackled.
- Skills index (Phase 5) written last so it accurately reflects finalized skill file names and descriptions without requiring a second pass.

### Research Flags

Needs attention during implementation:
- **Phase 4 (create-recipe):** Verify the exact required field set and ordering for the recipe creation chain (recipe → section → ingredients → steps) against the live API. The shared types define the contract but an integration test is the only way to confirm no required fields are missing from the skill file examples.

Phases with standard patterns (no additional research needed):
- **Phase 1:** CLI scaffold patterns are fully documented in ARCHITECTURE.md and PITFALLS.md
- **Phase 2:** SKILL.md format is specified at agentskills.io; `rmapi` read commands map directly to existing endpoints
- **Phase 3:** Meal plan write operations are single-step; patterns established in Phase 2
- **Phase 5:** Index is a static catalogue; shopping list is client-side aggregation

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Python + httpx + argparse + SKILL.md are all officially documented. SKILL.md is an adopted open standard with Anthropic's canonical spec repo. Version compatibility matrix verified on PyPI. |
| Features | HIGH | Based on direct inspection of `packages/shared` type declarations (source of truth) and `mvp_plans/03_api_design.md`. Token cost estimates are MEDIUM — validate with actual `rmapi` output during Phase 1. |
| Architecture | HIGH | All components are additive (no existing file changes). Component boundaries and build order are clear and dependency-driven. Sources include multiple authoritative agent-native CLI design references. |
| Pitfalls | HIGH | Multiple corroborating authoritative sources (OWASP, Trail of Bits, MITRE ATT&CK, NVIDIA). Critical pitfalls are unanimous across all sources. Recovery costs are documented and realistic. |

**Overall confidence:** HIGH

### Gaps to Address

- **Token cost of actual `rmapi` output:** The feature research estimates ~120–500 tokens per response. This should be measured with real `rmapi` output during Phase 1 to calibrate `--fields` projection defaults and validate that minimal list shapes stay under the stated budget.
- **Pagination contract for existing API:** PITFALLS.md flags inconsistent pagination as a critical risk. Before implementing list commands, verify that the existing API endpoints use a consistent pagination shape (check `packages/shared` list response types). If inconsistent, the `rmapi` abstraction layer must normalize it.
- **`--all` flag feasibility:** PITFALLS.md recommends a `--all` flag that fetches and flattens all pages. This requires the API to support cursor or offset pagination with a stable `hasMore` indicator. Confirm during Phase 1 CLI scaffold.

---

## Sources

### Primary (HIGH confidence)
- `packages/shared/src/api/recipes.d.ts` — RecipeDetailResponse, RecipeListItemResponse field inventory
- `packages/shared/src/api/meal-plan.d.ts` — MealPlanEntryResponse field inventory
- `packages/shared/src/enums.d.ts` — MealType enum values
- `mvp_plans/03_api_design.md` — Full endpoint reference and auth guard summary
- `.planning/PROJECT.md` — Milestone scope and existing feature inventory
- [agentskills.io/specification](https://agentskills.io/specification) — SKILL.md format spec (official standard)
- [github.com/anthropics/skills spec](https://github.com/anthropics/skills/blob/main/spec/agent-skills-spec.md) — Anthropic canonical spec
- [python-httpx.org](https://www.python-httpx.org/) — httpx official docs
- [OWASP AI Agent Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/AI_Agent_Security_Cheat_Sheet.html)
- [MITRE ATT&CK T1552.003](https://attack.mitre.org/techniques/T1552/003/) — Unsecured Credentials in Shell History
- [NVIDIA: Sandboxing Agentic Workflows](https://developer.nvidia.com/blog/practical-security-guidance-for-sandboxing-agentic-workflows-and-managing-execution-risk/)
- [Writing CLI Tools That AI Agents Actually Want to Use](https://dev.to/uenyioha/writing-cli-tools-that-ai-agents-actually-want-to-use-39no)

### Secondary (MEDIUM confidence)
- [SKILL.md Pattern article (Bibek Poudel, Feb 2026)](https://bibek-poudel.medium.com/the-skill-md-pattern-how-to-write-ai-agent-skills-that-actually-work-72a3169dd7ee) — SKILL.md body conventions
- [pydantic-ai-skills documentation](https://dougtrajano.github.io/pydantic-ai-skills/) — Frontmatter format, progressive disclosure
- [TOON vs JSON (jduncan.io)](https://jduncan.io/blog/2025-11-11-toon-vs-json-agent-optimized-data/) — Token cost analysis
- [Securing CLI Based AI Agent (Medium, 2026)](https://medium.com/@visrow/securing-cli-based-ai-agent-c36429e88783) — Security patterns
- [Building a 24/7 Claude Code Wrapper (DEV)](https://dev.to/jungjaehoon/why-claude-code-subagents-waste-50k-tokens-per-turn-and-how-to-fix-it-41ma) — Token waste in subprocesses
- Agent context-window cost estimates — based on average token density of JSON responses from similar REST APIs (validate with actual rmapi output during Phase 1)

### Tertiary (LOW confidence)
- None — all significant findings have HIGH or MEDIUM corroboration.

---
*Research completed: 2026-03-20*
*Ready for roadmap: yes*
