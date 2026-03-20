# Requirements: Recipe Manager — v1.1 Agent Integration

**Defined:** 2026-03-20
**Core Value:** An AI agent can manage household recipes and meal plans through the REST API using a thin CLI wrapper and task-oriented skill files — with no API-specific code in the agent itself.

## v1.1 Requirements

### CLI Scaffold

- [x] **CLI-01**: `rmapi` reads `RMAPI_BASE_URL` and `RMAPI_TOKEN` from environment variables; never accepts secrets via flags
- [x] **CLI-02**: All successful output goes to stdout as JSON; all errors go to stderr as `{"code": "...", "message": "...", "status": N}`
- [x] **CLI-03**: Exit codes are distinct per error class: 0 success, 1 API error, 2 auth failure, 3 not found, 4 validation error
- [x] **CLI-04**: All list and detail commands accept `--fields id,name,...` to strip response to named top-level fields only
- [x] **CLI-05**: All destructive commands (delete, remove) accept `--yes` to skip confirmation; without `--yes` on a non-TTY, the command fails fast with exit code 4

### Lookup Prerequisites

- [x] **LOOK-01**: Agent can resolve multiple food names to IDs in one call — `rmapi foods lookup --names "tomato,chicken"` returns `[{name, id}]` (one HTTP request, client-side filter)
- [x] **LOOK-02**: Agent can list all units — `rmapi units list` returns `[{id, name, abbreviation}]`

### Recipe Operations

- [x] **RCP-01**: Agent can search and list recipes — `rmapi recipes list` with `--search`, `--food-id`, `--sort`, `--order`, `--page`, `--per-page`
- [x] **RCP-02**: Agent can get full recipe detail — `rmapi recipes get <id>` with `--fields` projection to strip images/timestamps
- [x] **RCP-03**: Agent can create a recipe — `rmapi recipes create` with name and optional metadata (description, servings, times, source URL)
- [x] **RCP-04**: Agent can update recipe metadata — `rmapi recipes update <id>` with any subset of metadata fields
- [x] **RCP-05**: Agent can delete a recipe — `rmapi recipes delete <id> --yes`
- [x] **RCP-06**: Agent can duplicate a recipe — `rmapi recipes duplicate <id>`
- [x] **RCP-07**: Agent can upload an image to a recipe from a URL — `rmapi recipes add-image <id> --url <url>` (CLI downloads and uploads as multipart)

### Sections

- [x] **SEC-01**: Agent can add an ingredient section — `rmapi sections add <recipe-id> --title "..."`
- [x] **SEC-02**: Agent can edit a section title — `rmapi sections update <recipe-id> <section-id> --title "..."`
- [x] **SEC-03**: Agent can delete a section — `rmapi sections delete <recipe-id> <section-id> --yes`
- [x] **SEC-04**: Agent can reorder sections — `rmapi sections reorder <recipe-id> --ids "id1,id2,id3"`

### Ingredients

- [x] **ING-01**: Agent can add an ingredient to a section — `rmapi ingredients add <recipe-id> <section-id> --food-id --quantity --unit-id --note`
- [x] **ING-02**: Agent can edit an ingredient — `rmapi ingredients update <recipe-id> <section-id> <ingredient-id>` with any subset of fields
- [x] **ING-03**: Agent can remove an ingredient — `rmapi ingredients delete <recipe-id> <section-id> <ingredient-id> --yes`
- [x] **ING-04**: Agent can reorder ingredients within a section — `rmapi ingredients reorder <recipe-id> <section-id> --ids "id1,id2,id3"`

### Steps

- [x] **STP-01**: Agent can add a step — `rmapi steps add <recipe-id> --body "..." --title "..."`
- [x] **STP-02**: Agent can edit a step — `rmapi steps update <recipe-id> <step-id> --body "..." --title "..."`
- [x] **STP-03**: Agent can delete a step — `rmapi steps delete <recipe-id> <step-id> --yes`
- [x] **STP-04**: Agent can reorder steps — `rmapi steps reorder <recipe-id> --ids "id1,id2,id3"`

### Meal Plan

- [x] **MPL-01**: Agent can read meal plan entries by date range — `rmapi meal-plan list --from 2026-03-20 --to 2026-03-27`
- [x] **MPL-02**: Agent can add a recipe to the meal plan — `rmapi meal-plan add --recipe-id <id> --date 2026-03-21 --type dinner`
- [x] **MPL-03**: Agent can move a meal plan entry — `rmapi meal-plan move <entry-id> --date 2026-03-22 --type lunch`
- [x] **MPL-04**: Agent can remove a meal plan entry — `rmapi meal-plan remove <entry-id> --yes`

### Skill Files

- [ ] **SKL-01**: `skills/index.md` lists all available skills with one-line descriptions — agent loads this at session start to discover capabilities (~200 tokens)
- [ ] **SKL-02**: `skills/recipe-discovery.md` documents how to search, filter, and get recipe detail using `rmapi` — includes field projection guidance and ID-threading patterns
- [ ] **SKL-03**: `skills/meal-plan.md` documents how to read and modify the meal plan — includes the search-then-add pattern and date format conventions
- [ ] **SKL-04**: `skills/recipe-management.md` documents how to create and edit recipes — explicit ID-threading chain (lookup foods → create recipe → add section → add ingredients → add steps), error recovery guidance
- [ ] **SKL-05**: All skill files include `last-verified` frontmatter field and reference the `rmapi` command signatures they depend on

## Future Requirements

### Skill Freshness

- **SKLT-01**: CI check validates skill file `rmapi` command signatures against `rmapi --help` output — fails if a command or flag referenced in a skill no longer exists

### Extended Image Support

- **IMG-01**: `rmapi recipes add-image <id> --file -` accepts image bytes from stdin — enables mili to pipe Telegram photo bytes without writing temp files

## Out of Scope

| Feature | Reason |
|---------|--------|
| Share token management | Human-intentional action; not appropriate for agent automation |
| Recipe lock/unlock | Irreversible human-intentional action; agent locking a recipe prevents all further edits and requires human UI intervention |
| Image delete via rmapi | Agent adds images during creation; deletion is a human curation task |
| Admin endpoints | Admin is human-only by design (no agent admin access) |
| `--file` flag for image upload | Telegram photo piping deferred to future; `--url` covers the research pipeline use case |
| Recipe sharing/public view | Out of agent scope |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CLI-01 | Phase 13 | Complete |
| CLI-02 | Phase 13 | Complete |
| CLI-03 | Phase 13 | Complete |
| CLI-04 | Phase 13 | Complete |
| CLI-05 | Phase 13 | Complete |
| LOOK-01 | Phase 14 | Complete |
| LOOK-02 | Phase 14 | Complete |
| RCP-01 | Phase 15 | Complete |
| RCP-02 | Phase 15 | Complete |
| RCP-03 | Phase 16 | Complete |
| RCP-04 | Phase 16 | Complete |
| RCP-05 | Phase 16 | Complete |
| RCP-06 | Phase 16 | Complete |
| RCP-07 | Phase 16 | Complete |
| SEC-01 | Phase 17 | Complete |
| SEC-02 | Phase 17 | Complete |
| SEC-03 | Phase 17 | Complete |
| SEC-04 | Phase 17 | Complete |
| ING-01 | Phase 17 | Complete |
| ING-02 | Phase 17 | Complete |
| ING-03 | Phase 17 | Complete |
| ING-04 | Phase 17 | Complete |
| STP-01 | Phase 17 | Complete |
| STP-02 | Phase 17 | Complete |
| STP-03 | Phase 17 | Complete |
| STP-04 | Phase 17 | Complete |
| MPL-01 | Phase 18 | Complete |
| MPL-02 | Phase 18 | Complete |
| MPL-03 | Phase 18 | Complete |
| MPL-04 | Phase 18 | Complete |
| SKL-01 | Phase 19 | Pending |
| SKL-02 | Phase 19 | Pending |
| SKL-03 | Phase 19 | Pending |
| SKL-04 | Phase 19 | Pending |
| SKL-05 | Phase 19 | Pending |

**Coverage:**
- v1.1 requirements: 35 total
- Mapped to phases: 35 (phases 13–19)
- Unmapped: 0

---
*Requirements defined: 2026-03-20*
*Last updated: 2026-03-20 — traceability updated after roadmap creation*
