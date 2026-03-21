# Phase 19: Skill Bundle Updates - Context

**Gathered:** 2026-03-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Update four agent skill files (`recipes_create.md`, `shared.md`, `recipes_get.md`, `recipes_edit.md`) to reflect the four v1.2 API ergonomics changes shipped in phases 15–18. No code changes — documentation only.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — documentation-only phase. Skill file updates should accurately reflect v1.2 API changes: compound create path, ?name= filters, slug lookup, and batch ingredient add.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `skills/recipe-manager/recipes_create.md` — existing create skill (needs compound create + ?name= filter updates)
- `skills/recipe-manager/shared.md` — shared conventions (needs ?name= filter section for foods/units)
- `skills/recipe-manager/recipes_get.md` — get detail skill (needs slug lookup documentation)
- `skills/recipe-manager/recipes_edit.md` — edit skill (needs batch ingredient add endpoint)

### Established Patterns
- Skill files use Markdown with endpoint tables, request/response examples, and cross-references
- Each skill file ends with a `## Cross-references` section

### v1.2 Changes to Document
1. **Phase 15 — Name Filters**: `GET /api/foods?name=` and `GET /api/units?name=` support optional case-insensitive substring filter — returns full list when omitted
2. **Phase 16 — Slug Lookup**: `GET /api/recipes/:id` accepts both UUID and human-readable slug — cross-household access returns 404 for both
3. **Phase 17 — Batch Ingredient Add**: `POST /api/recipes/:id/sections/:sectionId/ingredients/batch` accepts `{ ingredients: [{ foodId, unitId?, quantity?, note? }] }` — returns full SectionResponse
4. **Phase 18 — Compound Recipe Create**: `POST /api/recipes` now accepts optional `ingredients[]` and `steps[]` arrays — creates recipe + all sub-resources atomically in a single call

### Integration Points
- Plan 19-01: recipes_create.md (compound create + recommended sequence update) + shared.md (?name= filter)
- Plan 19-02: recipes_get.md (slug lookup) + recipes_edit.md (batch ingredient add)

</code_context>

<specifics>
## Specific Ideas

- recipes_create.md "Recommended sequence" should show 3-call path (compound) as the new default vs old 11+ call path
- shared.md ?name= filter section should explain the targeted ID resolution pattern
- recipes_get.md should add slug navigation as an alternative to UUID lookup, with example
- recipes_edit.md batch endpoint should be documented under "Add ingredients to a section" with full request/response shape

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
