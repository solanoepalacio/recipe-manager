# Feature Research

**Domain:** AI agent skill system over a recipe manager REST API
**Researched:** 2026-03-20
**Confidence:** HIGH — based on direct inspection of existing API contract (`packages/shared` types) and milestone context, not speculation

---

## Context: What "Agent" Means Here

The agent is an AI (LLM) that manages household recipes and meal plans by calling the existing REST API through a thin CLI wrapper (`rmapi`). The agent's interface is text (skill `.md` files). Its constraints differ fundamentally from a human UI:

- **Context window is finite.** Every unnecessary field burns tokens. A 50-field recipe detail response used in a list-then-act workflow is a context tax, not a feature.
- **The agent has no visual layer.** `thumbnailUrl`, `landscapeView`, `images` carry zero semantic value for a text agent.
- **The agent works in multi-step patterns.** A human clicks; the agent reads a skill file, executes a sequence of CLI calls, and reasons about the results. Skill granularity must match the agent's cognitive unit, not the API's HTTP unit.
- **Error messages are part of the interface.** Normalized errors from `rmapi` (not raw NestJS 400 JSON) are what the agent reads to decide next steps.

---

## Feature Landscape

### Table Stakes (Agent Can't Function Without These)

Features the agent requires to complete its core mission. Absent any one of these, the agent is blocked.

| Feature | Why Required | Complexity | Notes |
|---------|--------------|------------|-------|
| **`rmapi` CLI with auth** | Agent needs a single command surface with Bearer token configured once; raw curl with auth headers on every call is impractical | LOW | Config stored in env or `~/.rmapi.json`; `rmapi auth status` to verify |
| **Recipe search skill** | All agent workflows start with finding a recipe by name or ingredient; without this, every other skill is blocked | LOW | Wraps `GET /api/recipes?q=...`; returns `id`, `name`, `slug` only — no full detail |
| **Recipe detail (projected)** | Agent needs ingredient list and steps to reason about a recipe; full response is 300-500 tokens of noise | LOW | Projection strips `images`, `thumbnailUrl`, `landscapeView`, `shareToken`, `createdAt`, `updatedAt` — keeps `id`, `name`, `description`, `servingsQty`, `servingsUnit`, `prepTime`, `cookTime`, `totalTime`, `isLocked`, `sections` (ingredients), `steps` |
| **Add recipe to meal plan skill** | Core agent workflow: user asks "put pasta on Tuesday dinner" → agent searches, gets ID, posts entry | LOW | Multi-step: search → detail → POST `/api/meal-plan/entries`; skill must document the full sequence |
| **View meal plan skill** | Agent must be able to read the current week's plan before proposing changes | LOW | Wraps `GET /api/meal-plan?from=&to=`; returns entry list with `recipeId`, `recipeName`, `date`, `mealType` |
| **Remove meal plan entry skill** | Agent needs to clear slots before reassigning | LOW | Wraps `DELETE /api/meal-plan/entries/:id`; entry ID comes from view-meal-plan output |
| **Move meal plan entry skill** | Moving an entry is more efficient than delete + re-add; agents make planning errors | LOW | Wraps `PATCH /api/meal-plan/entries/:id` with `{ date, mealType }` |
| **Normalized error output** | Agent reads `rmapi` stderr to recover from errors; NestJS 400 message arrays and 404 bodies are inconsistent | MEDIUM | `rmapi` must normalize to `{ error: string, code: string }` — agent skill files document expected error codes |

### Differentiators (High Agent Value, Not Obvious)

Features that make the agent significantly more capable or reliable, but aren't strictly blocking.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Skills index file** | Agent can discover available capabilities without hallucinating endpoints; reduces "I don't know how to do X" failures | LOW | A single `skills/INDEX.md` listing all skill files with one-line descriptions and when to use each |
| **Create full recipe skill (atomic)** | Agent can scaffold a complete recipe (metadata + sections + ingredients + steps) in one guided operation rather than 6+ raw API calls | MEDIUM | The real complexity is ID threading: create recipe → get `id` → create section → get `sectionId` → create ingredients. The skill must document this chain explicitly. |
| **Ingredient lookup skill** | Ingredients require `foodId` (not free text); agent must look up food IDs before creating/editing ingredients — this is non-obvious | LOW | Wraps `GET /api/foods?search=...`; skill documents the required food-ID-before-ingredient pattern |
| **Unit lookup skill** | Same problem as food IDs; units require `unitId` | LOW | Wraps `GET /api/units`; can be cached within a session since units change rarely |
| **Field projection via `--fields` flag** | Different skills need different subsets; projection at the CLI layer prevents bloating unrelated skill outputs | MEDIUM | `rmapi recipes get <id> --fields id,name,sections.ingredients` — saves ~200 tokens per recipe detail call |
| **Shopping list derivation skill** | Agent can aggregate ingredients across multiple meal plan entries (deduplicate by foodId, sum quantities) — useful for "what do I need to buy this week?" | MEDIUM | Pure client-side aggregation over existing API data; no new endpoint needed |
| **Duplicate and modify recipe skill** | Agent can create a variation of an existing recipe cheaply; useful for "make a smaller version of X" | LOW | Wraps `POST /api/recipes/:id/duplicate` then `PATCH` for edits; skill documents the `name` suffix convention |

### Anti-Features (Commonly Considered, Actually Harmful)

| Feature | Why Requested | Why Problematic | Better Approach |
|---------|---------------|-----------------|-----------------|
| **One skill file per endpoint** | Seems organized; mirrors API docs | Agent doesn't think in HTTP verbs. A skill for `POST /api/meal-plan/entries` is useless; the agent needs to know the full task sequence including the search step before it. Skills at endpoint granularity require the agent to compose them correctly — which it will fail at. | One skill per user-facing task (e.g., `add-to-meal-plan.md` covers search + post) |
| **Full recipe detail in every skill** | Seems informative | `RecipeDetailResponse` with sections/ingredients/steps is ~300-500 tokens. Using it for meal plan operations (where you only need `id` and `name`) wastes context on every call. In a 10-recipe planning session this compounds to thousands of wasted tokens. | Use list response (id + name + slug) for lookup; only fetch detail when ingredients/steps are needed |
| **Real-time plan sync / polling** | Agent might want "live" state | No websockets in scope; polling is wasteful and the API is stateful enough — a fresh `GET /api/meal-plan` is fast | Fetch-when-needed pattern; skills document when to refresh |
| **Agent writes to `shareToken` or `isLocked`** | Possible via PATCH | Locking a recipe prevents all further edits — if agent locks a recipe by accident, recovery requires the UI. Sharing produces public URLs. These are human-intentional actions with irreversible UX consequences. | Exclude `isLocked` and share operations from all agent skill files; agent is read-write on content, read-only on recipe settings |
| **Image upload skills** | Completeness | Images are binary; agent cannot source recipe images meaningfully. Multipart upload from CLI is complex for zero agent value. | Explicitly out of scope for agent skills; documented in skills INDEX.md as "human-only" |
| **Admin endpoint skills** | "Agent should be able to manage everything" | Admin endpoints (`/api/admin/...`) require a completely separate auth guard (`AdminAuthGuard`) and a different credential. The agent authenticates as a User via API key, not as Admin. Cross-contaminating the two auth domains creates security confusion. | Admin skills would require a separate `rmapi admin` sub-command with different credentials — out of scope for v1.1 |
| **Free-text food names on ingredient create** | Seems simpler than food ID lookup | The API requires `foodId` (controlled vocabulary, admin-managed). If the agent invents food names it will always get 400s. The skill must teach ID lookup first. | Make `ingredient-lookup.md` a prerequisite documented in `create-recipe.md` |

---

## Field Projection: What Each Operation Actually Needs

The key insight: **the agent's context window is the limiting resource**, not API bandwidth. Over-fetching fields in frequently-called operations compounds across a planning session.

### Recipe List (search/browse)

**Agent needs:** `id`, `name`, `slug`
**Agent does NOT need:** `description`, `prepTime`, `cookTime`, `totalTime`, `servingsQty`, `servingsUnit`, `thumbnailUrl`, `createdAt`, `updatedAt`

Rationale: The agent uses the list step purely to resolve a name to an ID. Description and times are only consulted when the user asks "which recipe takes less than 30 minutes?" — and even then, `prepTime` + `cookTime` suffices; `totalTime` is redundant (it's a calculated sum).

### Recipe Detail (when cooking, editing, or reporting ingredients)

**Agent needs:** `id`, `name`, `description`, `servingsQty`, `servingsUnit`, `prepTime`, `cookTime`, `totalTime`, `isLocked` (to avoid attempting edits), `sections[].title`, `sections[].ingredients[].foodName`, `sections[].ingredients[].quantity`, `sections[].ingredients[].unitName`, `sections[].ingredients[].note`, `steps[].title`, `steps[].body`

**Agent does NOT need:** `slug` (has `id`), `performTime` (performer-facing timing, irrelevant to agent), `landscapeView` (display setting), `shareToken` (security-sensitive, no agent action needed), `images[].url` (binary, no semantic value), `createdAt`, `updatedAt`

Saving: stripping 6 fields + entire `images` array saves ~120-200 tokens per detail fetch.

### Meal Plan View

**Agent needs:** `entries[].id`, `entries[].recipeId`, `entries[].recipeName`, `entries[].date`, `entries[].mealType`

**Agent does NOT need:** `entries[].recipeThumbnailUrl` (visual, no agent value)

### Ingredient/Food Lookup

**Agent needs:** `id`, `name` (to display for confirmation)
**Agent does NOT need:** any other food metadata

---

## Task Patterns and Skill File Mapping

**Principle:** One skill file per user-facing task. A task is what a user says in plain language. The skill encodes the full multi-step API sequence needed to fulfill that task.

**Correct granularity test:** Can the agent complete the user request by following exactly one skill file? If yes, the granularity is right. If the agent must compose two skill files, merge them into one. If one skill file handles 10 different goals, split it.

### Canonical Skill Files

| Skill File | User Intent It Serves | API Sequence | Key Pitfalls Documented |
|------------|----------------------|--------------|------------------------|
| `search-recipes.md` | "Find a recipe", "What recipes do we have?", "Do we have a pasta recipe?" | `GET /api/recipes?q=...` → return id+name list | Fuzzy match means partial names work; always confirm with user before acting on ambiguous results |
| `get-recipe-detail.md` | "What are the ingredients for X?", "Show me the steps for Y" | `GET /api/recipes/:id` with field projection | Use search first to get ID; document projected fields |
| `add-to-meal-plan.md` | "Put X on Tuesday for dinner", "Schedule Y this week" | search → `GET /api/recipes/:id` (id only) → `POST /api/meal-plan/entries` | Must resolve recipe name to ID first; date format is ISO 8601 (`YYYY-MM-DD`); mealType enum values |
| `view-meal-plan.md` | "What's planned this week?", "What are we having on Thursday?" | `GET /api/meal-plan?from=YYYY-MM-DD&to=YYYY-MM-DD` | Date range calculation; entries are flat list, not grouped — skill shows how to group by date for display |
| `remove-from-meal-plan.md` | "Remove X from the meal plan", "Clear Thursday dinner" | view-meal-plan → find entry.id → `DELETE /api/meal-plan/entries/:id` | Entry ID comes from GET, not from recipe ID — document this clearly |
| `move-meal-plan-entry.md` | "Move Tuesday's dinner to Wednesday", "Change breakfast to lunch" | view-meal-plan → find entry.id → `PATCH /api/meal-plan/entries/:id` | Cheaper than delete + re-add; `date` and `mealType` are both optional in PATCH |
| `create-recipe.md` | "Create a new recipe for X", "Add a recipe called Y with these ingredients" | `POST /api/recipes` → `POST /api/recipes/:id/sections` → `POST .../ingredients` (×N) → `POST /api/recipes/:id/steps` (×N) | ID threading chain must be explicit; food lookup required before each ingredient; section required even for single-section recipes |
| `lookup-foods.md` | (prerequisite, not user-facing) | `GET /api/foods?search=...` | Referenced by create-recipe and edit-ingredients skills as a required prior step |
| `lookup-units.md` | (prerequisite, not user-facing) | `GET /api/units` | Units rarely change; can suggest caching within a session |
| `edit-recipe.md` | "Update the cook time for X", "Change the description of Y" | search → `PATCH /api/recipes/:id` | Only top-level recipe fields; does not cover ingredient or step edits |
| `add-ingredient.md` | "Add garlic to the X recipe" | food lookup → `POST /api/recipes/:id/sections/:sectionId/ingredients` | Must have section ID (from recipe detail); must look up foodId first |
| `edit-ingredient.md` | "Change the olive oil to 3 tablespoons" | recipe detail → find ingredient.id → food/unit lookup → `PATCH .../ingredients/:ingredientId` | Ingredient ID must come from recipe detail, not guessed |
| `add-step.md` | "Add a step to X", "Append instructions to Y" | `POST /api/recipes/:id/steps` | Steps are appended in order; no reorder needed for append |
| `duplicate-recipe.md` | "Make a copy of X", "Create a variation of Y" | search → `POST /api/recipes/:id/duplicate` → optionally `PATCH` new recipe | DuplicateRecipeResponse returns `id`, `slug`, `name` — use returned ID for follow-up edits |
| `shopping-list.md` | "What do I need to buy for this week's meals?" | view-meal-plan → `GET /api/recipes/:id` for each unique recipeId → aggregate ingredients by foodName | Client-side aggregation; document deduplication logic; quantities in different units cannot be summed — note this limitation |

### Skills NOT to Create (Anti-Skill List)

| Potential Skill | Why Not |
|-----------------|---------|
| `lock-recipe.md` | Irreversible human-intentional action; agent should never lock |
| `share-recipe.md` | Produces public URLs; human-only action with external consequences |
| `upload-image.md` | Binary; agent has no image source |
| `reorder-sections.md` | No user-facing scenario where an agent needs to reorder without a full recipe rebuild |
| `reorder-steps.md` | Same rationale |
| `admin-*.md` | Separate auth domain, out of scope for v1.1 |

---

## Feature Dependencies

```
lookup-foods.md
    └──required-by──> add-ingredient.md
    └──required-by──> create-recipe.md (ingredient step)

lookup-units.md
    └──required-by──> add-ingredient.md
    └──required-by──> create-recipe.md (ingredient step)

search-recipes.md
    └──required-by──> get-recipe-detail.md
    └──required-by──> add-to-meal-plan.md
    └──required-by──> edit-recipe.md
    └──required-by──> add-ingredient.md
    └──required-by──> edit-ingredient.md
    └──required-by──> duplicate-recipe.md
    └──required-by──> shopping-list.md

view-meal-plan.md
    └──required-by──> remove-from-meal-plan.md (need entry.id)
    └──required-by──> move-meal-plan-entry.md (need entry.id)
    └──required-by──> shopping-list.md (need recipeIds)

get-recipe-detail.md
    └──required-by──> add-ingredient.md (need sectionId)
    └──required-by──> edit-ingredient.md (need ingredient.id)
    └──required-by──> shopping-list.md (need sections.ingredients)

rmapi CLI (auth configured)
    └──required-by──> ALL skills
```

### Dependency Notes

- **lookup-foods required by create-recipe:** The API enforces controlled food vocabulary. A skill that attempts to create an ingredient without first resolving `foodId` will always fail with a 400.
- **view-meal-plan required by remove and move:** The entry `id` is only available from the GET response, not from the recipe ID. This is the single most common agent mistake to document.
- **get-recipe-detail required by add-ingredient:** The section ID (`sectionId`) is only available from recipe detail. Even a simple "add garlic" requires fetching detail first.

---

## MVP Definition

### Launch With (v1.1)

The minimum set that enables the agent to manage recipes and meal plans end-to-end.

- [ ] `rmapi` CLI with auth, field projection, normalized errors
- [ ] `skills/INDEX.md` — discovery file
- [ ] `search-recipes.md`
- [ ] `get-recipe-detail.md`
- [ ] `view-meal-plan.md`
- [ ] `add-to-meal-plan.md`
- [ ] `remove-from-meal-plan.md`
- [ ] `move-meal-plan-entry.md`
- [ ] `lookup-foods.md`
- [ ] `lookup-units.md`
- [ ] `create-recipe.md` — highest-complexity skill, essential for "add a recipe" use case

### Add After Validation (v1.x)

- [ ] `edit-recipe.md` — add when agents start making edit requests
- [ ] `add-ingredient.md` / `edit-ingredient.md` — fine-grained editing; defer until create-recipe is validated
- [ ] `add-step.md` — same rationale
- [ ] `duplicate-recipe.md` — add when "make a variation" pattern emerges
- [ ] `shopping-list.md` — valuable but requires reliable meal plan + recipe detail chain first

### Future Consideration (v2+)

- [ ] Agent-facing nutritional rollup (requires nutrition data, out of scope entirely)
- [ ] Multi-household agent access (agent scoped to one household in v1)
- [ ] Batch operations (add 7 entries to meal plan in one call) — requires API changes

---

## Feature Prioritization Matrix

| Feature | Agent Value | Implementation Cost | Priority |
|---------|-------------|---------------------|----------|
| `rmapi` CLI (auth + errors) | HIGH | LOW | P1 |
| Skills INDEX | HIGH | LOW | P1 |
| search-recipes skill | HIGH | LOW | P1 |
| view-meal-plan skill | HIGH | LOW | P1 |
| add-to-meal-plan skill | HIGH | LOW | P1 |
| remove/move meal plan skills | HIGH | LOW | P1 |
| get-recipe-detail (projected) | HIGH | LOW | P1 |
| lookup-foods / lookup-units skills | HIGH | LOW | P1 |
| create-recipe skill | HIGH | MEDIUM | P1 |
| Field projection `--fields` flag | MEDIUM | MEDIUM | P2 |
| edit-recipe skill | MEDIUM | LOW | P2 |
| add/edit-ingredient skills | MEDIUM | LOW | P2 |
| add-step skill | MEDIUM | LOW | P2 |
| duplicate-recipe skill | MEDIUM | LOW | P2 |
| shopping-list skill | MEDIUM | MEDIUM | P2 |
| Admin skills | LOW | HIGH | P3 |
| Image upload skill | NONE | HIGH | exclude |

**Priority key:**
- P1: Must have for launch — agent non-functional without these
- P2: Should have — expands agent capability after core loop validated
- P3: Nice to have — future consideration

---

## Skill File Granularity Recommendation

**Use one skill file per user-facing task, not one per endpoint.**

Justification:

1. The agent's reasoning unit is a user request ("schedule pasta for dinner tonight"), not an HTTP method. Skill files at endpoint granularity shift composition responsibility to the agent's runtime reasoning — which is unreliable and prone to hallucinating intermediate steps.

2. Multi-step sequences (search → resolve ID → post entry) must be encoded as explicit, ordered steps in a single skill file. If the sequence lives across two files, the agent must decide the order at runtime. It will sometimes get it wrong (e.g., trying to POST an entry with a recipe name instead of an ID).

3. "Prerequisite" skills (lookup-foods, lookup-units) are an exception: they are reusable sub-procedures referenced by multiple skills. They remain separate only because they are called identically from multiple parent skills, not because they map to user requests.

4. The upper bound on skill file size is the context a single task requires — typically 1-3 API calls, documented in ~30-60 lines of markdown. Larger than this signals the skill should be split into two distinct user intents.

---

## Sources

- `packages/shared/src/api/recipes.d.ts` — `RecipeDetailResponse`, `RecipeListItemResponse` field inventory (HIGH confidence, source of truth)
- `packages/shared/src/api/meal-plan.d.ts` — `MealPlanEntryResponse` field inventory (HIGH confidence)
- `packages/shared/src/api/ingredients.d.ts` — `IngredientSectionResponse`, `RecipeIngredientResponse` (HIGH confidence)
- `packages/shared/src/enums.d.ts` — `MealType` enum values (HIGH confidence)
- `mvp_plans/03_api_design.md` — full endpoint reference and guard summary (HIGH confidence)
- `.planning/PROJECT.md` — milestone scope and existing feature inventory (HIGH confidence)
- Agent context-window cost estimates: based on average token density of JSON responses from similar REST APIs (MEDIUM confidence — validate with actual `rmapi` output during implementation)

---

*Feature research for: AI agent skill system over recipe manager REST API*
*Researched: 2026-03-20*
