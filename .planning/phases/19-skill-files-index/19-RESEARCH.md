# Phase 19: Skill Files + Index — Research

**Researched:** 2026-03-20
**Domain:** Documentation authoring for AI agent skill files
**Confidence:** HIGH

## Summary

Phase 19 produces four Markdown files that teach an AI agent how to use the `rmapi` CLI. Unlike all previous phases, this phase generates no code — it generates documentation. The output is a `skills/` directory at the repo root containing three task-oriented skill files and one lightweight index. Every command signature in the skill files must match the installed `rmapi` binary exactly, and each file must carry a `last-verified` frontmatter date.

The entire CLI implementation already exists across phases 13–18. The research task here is therefore to audit every command signature, identify the correct invocation patterns, document ID-threading chains, and understand what format the planner should use when instructing the agent to write these files.

The key design decision from STATE.md is already locked: "Skill files live in `skills/` at repo root so API changes and skill file updates travel in the same PR" and "skills/index.md written last after all skill file names are finalized — prevents stale catalogue."

**Primary recommendation:** Write the four skill files by reading the source of truth (the actual command modules), then commit them to `skills/` at the repo root. No tests are written for this phase — the content IS the deliverable.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SKL-01 | `skills/index.md` lists all available skills with one-line descriptions, loads in under 500 tokens | Index file is ~10 lines; trivially under 500 tokens; written last after all skill filenames finalized (per STATE.md decision) |
| SKL-02 | `skills/recipe-discovery.md` documents search, filter, sort, field projection, get-detail with working `rmapi` examples | All signatures verified from `recipes.py`: `recipes list` (6 flags) + `recipes get` with `--fields` |
| SKL-03 | `skills/meal-plan.md` documents read-then-mutate pattern with correct date format and meal type values | Verified from `meal_plan.py`: ISO 8601 dates, meal types = breakfast/lunch/dinner/snack/dessert; `list` outputs `data["entries"]` directly as array |
| SKL-04 | `skills/recipe-management.md` documents full ID-threading creation chain with error recovery | Full chain verified from foods.py, recipes.py, sections.py, ingredients.py, steps.py — each command returns `id` in JSON output |
| SKL-05 | Every skill file has `last-verified` frontmatter field; all command signatures match installed `rmapi` binary | Frontmatter standard: YAML block at top of each Markdown file with `last-verified: YYYY-MM-DD` |
</phase_requirements>

## Standard Stack

### Core

| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| Markdown | — | Skill file format | Plain text, LLM-readable, no toolchain required |
| YAML frontmatter | — | `last-verified` field | Parseable by CI and humans; standard for documentation files |

### No Dependencies

This phase has no package dependencies. No `pip install`, no `npm install`. The deliverable is pure Markdown documentation.

## Architecture Patterns

### Recommended Project Structure

```
skills/
├── index.md             # Lightweight catalogue (~200 tokens)
├── recipe-discovery.md  # Search, filter, get-detail
├── recipe-management.md # Create, edit, full ID-threading chain
└── meal-plan.md         # Read-then-mutate meal plan pattern
```

### Pattern 1: Frontmatter Block

Every skill file opens with a YAML frontmatter block:

```markdown
---
last-verified: 2026-03-20
---
```

This makes the verification date machine-readable for any future CI check (SKLT-01 in future requirements).

### Pattern 2: Skill Index Structure

`skills/index.md` is a catalogue-only file. It must load in under 500 tokens (~400 words), so it contains no command examples — only one-line descriptions with file references.

```markdown
---
last-verified: 2026-03-20
---

# rmapi Skill Index

Load this file at session start to discover available skills.
Load the relevant skill file only when you need to perform that task.

| Skill File | What it covers |
|------------|---------------|
| recipe-discovery.md | Search and retrieve recipes |
| recipe-management.md | Create and edit recipes (full ID-threading chain) |
| meal-plan.md | Read and modify the weekly meal plan |
```

### Pattern 3: Task-Oriented Skill File Structure

Each skill file follows a consistent structure:
1. Frontmatter (`last-verified`)
2. One-paragraph orientation ("When to load this file")
3. Prerequisites (env vars, how to get IDs)
4. Command sequences with exact shell examples
5. Error recovery notes

### Pattern 4: ID-Threading Documentation

ID-threading is the core value of recipe-management.md. The pattern is: each command returns JSON to stdout, and the agent extracts the `id` field using a JSON processor (e.g., `jq`) to pass into the next command.

```bash
# Step 1: resolve food IDs
TOMATO_ID=$(rmapi foods lookup --names "tomato" | jq -r '.[0].id')

# Step 2: create recipe
RECIPE_ID=$(rmapi recipes create --name "Pasta Pomodoro" | jq -r '.id')

# Step 3: add a section (auto-created on recipe creation, but can add more)
SECTION_ID=$(rmapi sections add "$RECIPE_ID" --title "Sauce" | jq -r '.id')

# Step 4: add ingredient
rmapi ingredients add "$RECIPE_ID" "$SECTION_ID" \
  --food-id "$TOMATO_ID" \
  --quantity 3 \
  --note "chopped"

# Step 5: add step
rmapi steps add "$RECIPE_ID" --body "Simmer tomatoes for 20 minutes"
```

**Important note:** Per phase 09 decision, a default ingredient section is auto-created when a recipe is created (`260320-h10` quick task). The agent can use the section `id` returned in the `sections` array from `rmapi recipes get <id>` instead of calling `rmapi sections add`.

### Anti-Patterns to Avoid

- **Documenting commands that don't exist:** Only document commands present in the installed binary. Do not reference `rmapi recipes search` (it's a flag on `rmapi recipes list`).
- **Using wrong meal type values:** Only `breakfast`, `lunch`, `dinner`, `snack`, `dessert` are valid (enforced by Click `choice` type in `meal_plan.py`).
- **Wrong date format:** All dates must be `YYYY-MM-DD` (ISO 8601). The API uses string dates throughout.
- **Omitting `--yes` on destructive commands:** `delete` and `remove` commands fail with exit code 4 without `--yes` in non-TTY context (agent context is always non-TTY).
- **Confusing `meal-plan list` output:** `rmapi meal-plan list` outputs `data["entries"]` directly as a JSON array — not a wrapper object.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Command signature documentation | Manual narrative descriptions | Copy exact signatures directly from source | Source is ground truth; narrated descriptions drift |
| ID extraction examples | Hard-coded IDs in examples | `jq -r '.id'` pattern | Shows agent the actual workflow |

## Complete Command Signature Reference

Extracted directly from source code (HIGH confidence):

### foods

```bash
rmapi foods lookup --names "name1,name2"          # resolve names to [{name, id}]
rmapi foods lookup --names "name1" --fields id    # project to id only
```

### units

```bash
rmapi units list                                   # [{id, name, abbreviation}]
rmapi units list --fields id,name                 # projected
```

### recipes

```bash
rmapi recipes list                                 # {items: [...], pagination}
rmapi recipes list --search "pasta"               # name substring filter
rmapi recipes list --food-id <id>                 # filter by food
rmapi recipes list --sort name|createdAt|updatedAt|random
rmapi recipes list --order asc|desc
rmapi recipes list --page 1 --per-page 20
rmapi recipes list --fields id,name               # project items only
rmapi recipes get <id>                             # full detail
rmapi recipes get <id> --fields id,name,sections  # projected top-level fields
rmapi recipes create --name "Name"                 # required
rmapi recipes create --name "..." --description "..." --servings-qty 4 \
  --servings-unit "portions" --prep-time 10 --cook-time 30 \
  --total-time 40 --perform-time 20 --source-url "https://..."
rmapi recipes update <id> [any subset of create flags except --name is optional]
rmapi recipes delete <id> --yes
rmapi recipes duplicate <id>
rmapi recipes add-image <id> --url "https://..."
```

### sections

```bash
rmapi sections add <recipe-id>                     # no title = untitled section
rmapi sections add <recipe-id> --title "Sauce"
rmapi sections update <recipe-id> <section-id> --title "New Title"
rmapi sections delete <recipe-id> <section-id> --yes
rmapi sections reorder <recipe-id> --ids "id1,id2,id3"
```

### ingredients

```bash
rmapi ingredients add <recipe-id> <section-id> --food-id <id>   # required
rmapi ingredients add <recipe-id> <section-id> --food-id <id> \
  --quantity 2.5 --unit-id <id> --note "chopped"
rmapi ingredients update <recipe-id> <section-id> <ingredient-id> \
  [--food-id] [--quantity] [--unit-id] [--note]
rmapi ingredients delete <recipe-id> <section-id> <ingredient-id> --yes
rmapi ingredients reorder <recipe-id> <section-id> --ids "id1,id2,id3"
```

### steps

```bash
rmapi steps add <recipe-id> --body "Instruction text"   # required
rmapi steps add <recipe-id> --body "..." --title "Optional title"
rmapi steps update <recipe-id> <step-id> [--body "..."] [--title "..."]
rmapi steps delete <recipe-id> <step-id> --yes
rmapi steps reorder <recipe-id> --ids "id1,id2,id3"
```

### meal-plan

```bash
rmapi meal-plan list                                # all entries
rmapi meal-plan list --from 2026-03-20 --to 2026-03-27   # date-filtered
rmapi meal-plan add --recipe-id <id> --date 2026-03-21 --type dinner
# --type choices: breakfast | lunch | dinner | snack | dessert
rmapi meal-plan move <entry-id> --date 2026-03-22
rmapi meal-plan move <entry-id> --type lunch
rmapi meal-plan move <entry-id> --date 2026-03-22 --type lunch
rmapi meal-plan remove <entry-id> --yes
```

## Common Pitfalls

### Pitfall 1: Default Section Already Exists

**What goes wrong:** Agent calls `rmapi sections add <recipe-id>` after `rmapi recipes create`, creating a second section when one already exists.
**Why it happens:** Recipe creation auto-creates a default section (phase 09 quick task `260320-h10`). Documentation must tell the agent to check for existing sections first.
**How to avoid:** In recipe-management.md, document that `rmapi recipes get <id> --fields sections` retrieves the auto-created section ID. Only call `sections add` when a second named section is genuinely needed.

### Pitfall 2: `--yes` Is Mandatory for Agent Context

**What goes wrong:** `rmapi recipes delete <id>` without `--yes` fails with exit code 4 and a JSON error in any non-TTY environment (all agent contexts).
**Why it happens:** `require_yes()` checks `sys.stdin.isatty()` and fails fast when false and `--yes` not provided.
**How to avoid:** All skill file examples involving delete/remove MUST include `--yes`.

### Pitfall 3: meal-plan list Output Is an Array, Not an Object

**What goes wrong:** Agent tries to access `.entries` on the output of `rmapi meal-plan list`, gets null.
**Why it happens:** The CLI command explicitly returns `data["entries"]` — the wrapper is stripped before output.
**How to avoid:** Document in meal-plan.md that `rmapi meal-plan list` outputs a JSON array directly. Use `jq '.[]'` not `jq '.entries[]'`.

### Pitfall 4: foods lookup Returns Empty Array for No Matches

**What goes wrong:** Agent assumes missing food name means error.
**Why it happens:** Per LOOK-01, non-matching names are silently omitted with exit code 0.
**How to avoid:** In recipe-management.md, document that the agent must verify each input name appears in the output array before proceeding. If a name is missing, the food does not exist in the database.

### Pitfall 5: quantity Is a Float, Not a String

**What goes wrong:** Agent passes `--quantity "2"` (string) vs `--quantity 2` (numeric) — Click handles this transparently, but documentation should be explicit.
**Why it happens:** Click's `type=float` accepts both, but it's clarifying for the agent to know decimal quantities work (e.g., `--quantity 0.5`).

### Pitfall 6: skills/index.md Written Before Filenames Are Final

**What goes wrong:** Index references a skill file with the wrong name.
**Why it happens:** Writing index.md first when filenames might still change.
**How to avoid:** STATE.md records the decision: "skills/index.md written last after all skill file names are finalized." In the plan, the task that writes index.md must come after tasks that write the three skill files.

## Architecture Patterns — File Writing Task Order

The plan should follow this task sequence:

1. Write `skills/recipe-discovery.md` (no dependencies)
2. Write `skills/recipe-management.md` (no dependencies)
3. Write `skills/meal-plan.md` (no dependencies)
4. Write `skills/index.md` (depends on all three filenames above being finalized)

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | pytest (existing at `tools/rmapi/tests/`) |
| Config file | `tools/rmapi/pyproject.toml` |
| Quick run command | `cd /home/solanoe/code/recipe-manager && python -m pytest tools/rmapi/tests/ -x -q` |
| Full suite command | `cd /home/solanoe/code/recipe-manager && python -m pytest tools/rmapi/tests/ -q` |

### Phase Requirements to Test Map

Phase 19 requirements (SKL-01 through SKL-05) are documentation deliverables, not code deliverables. No automated tests can verify that a Markdown file "correctly documents" an ID-threading pattern — that is a human review task. However, the following structural checks ARE automatable:

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SKL-01 | `skills/index.md` exists and is under 500 tokens (~400 words) | manual | wc -w skills/index.md (human check) | ❌ Wave 0 |
| SKL-02 | `skills/recipe-discovery.md` exists with frontmatter | manual | grep "last-verified" skills/recipe-discovery.md | ❌ Wave 0 |
| SKL-03 | `skills/meal-plan.md` exists with frontmatter | manual | grep "last-verified" skills/meal-plan.md | ❌ Wave 0 |
| SKL-04 | `skills/recipe-management.md` exists with frontmatter | manual | grep "last-verified" skills/recipe-management.md | ❌ Wave 0 |
| SKL-05 | All skill files have `last-verified` frontmatter | manual | grep -l "last-verified" skills/*.md | ❌ Wave 0 |

**Note:** All SKL requirements are manual-only. There is no code to unit-test. The verification step for this phase is human review of file contents against `rmapi --help` output and the success criteria in the ROADMAP.

### Sampling Rate

- **Per task commit:** None — no automated test suite for documentation
- **Per wave merge:** Manual check: `grep -r "last-verified" skills/` returns all 4 files
- **Phase gate:** Human verifier reads each skill file and spot-checks 3 commands against `rmapi --help`

### Wave 0 Gaps

- [ ] `skills/` directory at repo root — create in first task
- [ ] No new test files required — documentation phase only

## Code Examples

### Verified: Full Recipe Creation Chain

```bash
# Source: tools/rmapi/rmapi/commands/ (all modules)

# 1. Resolve ingredient food IDs (one HTTP call)
FOODS=$(rmapi foods lookup --names "tomato,garlic,pasta")
TOMATO_ID=$(echo "$FOODS" | jq -r '.[] | select(.name=="tomato") | .id')
GARLIC_ID=$(echo "$FOODS" | jq -r '.[] | select(.name=="garlic") | .id')

# 2. Get unit ID for grams
GRAM_ID=$(rmapi units list | jq -r '.[] | select(.abbreviation=="g") | .id')

# 3. Create the recipe
RECIPE_ID=$(rmapi recipes create --name "Pasta al Pomodoro" --servings-qty 4 | jq -r '.id')

# 4. Get the auto-created default section ID
SECTION_ID=$(rmapi recipes get "$RECIPE_ID" --fields sections | jq -r '.sections[0].id')

# 5. Add ingredients to the existing section
rmapi ingredients add "$RECIPE_ID" "$SECTION_ID" --food-id "$TOMATO_ID" --quantity 400 --unit-id "$GRAM_ID"
rmapi ingredients add "$RECIPE_ID" "$SECTION_ID" --food-id "$GARLIC_ID" --quantity 3 --note "minced"

# 6. Add steps
rmapi steps add "$RECIPE_ID" --body "Crush and sauté the garlic in olive oil"
rmapi steps add "$RECIPE_ID" --body "Add crushed tomatoes and simmer 20 minutes"
rmapi steps add "$RECIPE_ID" --body "Cook pasta and toss with sauce"
```

### Verified: Meal Plan Read-Then-Mutate Pattern

```bash
# Source: tools/rmapi/rmapi/commands/meal_plan.py

# 1. Read current week entries
ENTRIES=$(rmapi meal-plan list --from 2026-03-20 --to 2026-03-27)

# 2. Extract entry ID to move
ENTRY_ID=$(echo "$ENTRIES" | jq -r '.[] | select(.date=="2026-03-21" and .type=="dinner") | .id')

# 3. Move to different day
rmapi meal-plan move "$ENTRY_ID" --date 2026-03-22 --type lunch

# 4. Remove an entry
rmapi meal-plan remove "$ENTRY_ID" --yes
```

### Verified: Recipe Discovery with Field Projection

```bash
# Source: tools/rmapi/rmapi/commands/recipes.py

# Lightweight list for agent decision-making (minimal tokens)
rmapi recipes list --fields id,name --per-page 50

# Search with filter
rmapi recipes list --search "pasta" --food-id "$TOMATO_ID" --sort name

# Get detail with reduced fields (skip images/timestamps)
rmapi recipes get "$RECIPE_ID" --fields id,name,description,sections,steps
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Agent hardcodes API calls | Agent uses rmapi CLI | Phase 13 | No API-specific code in agent |
| Monolithic agent knowledge | Task-specific skill files loaded on demand | Phase 19 | Reduced per-task token consumption |

## Open Questions

1. **jq availability**
   - What we know: All skill file examples use `jq` for JSON extraction from shell
   - What's unclear: Whether the deployment environment (wherever the agent runs) has `jq` installed
   - Recommendation: Document `jq` as a prerequisite in each skill file's "Prerequisites" section; include a Python one-liner alternative (`python3 -c "import sys,json; print(json.load(sys.stdin)['id'])"`) as fallback

2. **Section auto-creation edge case**
   - What we know: A default section is auto-created on recipe creation (quick task `260320-h10`)
   - What's unclear: Whether the section has a default title or is empty/null
   - Recommendation: Plan task should instruct agent to verify via `rmapi recipes get <id> --fields sections` and document whatever the actual default title is

## Sources

### Primary (HIGH confidence)

- `tools/rmapi/rmapi/commands/recipes.py` — all recipe command signatures
- `tools/rmapi/rmapi/commands/foods.py` — foods lookup signature
- `tools/rmapi/rmapi/commands/units.py` — units list signature
- `tools/rmapi/rmapi/commands/sections.py` — sections command signatures
- `tools/rmapi/rmapi/commands/ingredients.py` — ingredients command signatures
- `tools/rmapi/rmapi/commands/steps.py` — steps command signatures
- `tools/rmapi/rmapi/commands/meal_plan.py` — meal-plan command signatures
- `tools/rmapi/rmapi/utils.py` — `require_yes` behavior (non-TTY enforcement)
- `tools/rmapi/rmapi/errors.py` — exit code taxonomy
- `.planning/STATE.md` — locked decisions: skills/ location, index.md written last
- `.planning/REQUIREMENTS.md` — SKL-01 through SKL-05 requirements text

### Secondary (MEDIUM confidence)

- `.planning/ROADMAP.md` — Phase 19 success criteria (used to structure research)

## Metadata

**Confidence breakdown:**
- Command signatures: HIGH — read directly from source Python files
- Architecture/file structure: HIGH — locked decisions in STATE.md, requirements in REQUIREMENTS.md
- Token count estimates: MEDIUM — "under 500 tokens" is rough; actual tokenization depends on model
- jq availability in agent environment: LOW — not specified anywhere in project docs

**Research date:** 2026-03-20
**Valid until:** Until any rmapi command module is modified (command signatures are the source of truth)
