# Phase 16: Slug/UUID Dual Lookup - Context

**Gathered:** 2026-03-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 16 makes `GET /api/recipes/:id` accept both a UUID and a human-readable slug, returning identical `RecipeDetailResponse` for both. Write operations (PATCH, DELETE, duplicate) remain UUID-only. A slug from a different household returns 404 (not 403) to prevent slug-existence leaks.

</domain>

<decisions>
## Implementation Decisions

### UUID Detection & Helper Placement
- Detect UUID using a UUID v4 regex (`/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i`) — no new dependency needed
- `isUuid` helper is inline in `recipes.service.ts` — single-use, no reason to share
- Ambiguous input (looks like neither UUID nor slug, e.g. "abc123") is treated as a slug — attempt slug lookup, return 404 on miss

### Service Integration & Scope
- New `findByIdOrSlug(idOrSlug: string, householdId: string)` method called only by `findOne` — `findAndVerifyOwnership` unchanged for write operations
- Slug lookup scope: `GET /recipes/:id` only — write ops (update, delete, duplicate) stay UUID-only and continue calling `findAndVerifyOwnership`
- 404 message: same format as current (`Recipe ${id} not found`) — consistent error messages

### Test Strategy
- Integration tests in `apps/api/integration_tests/` — consistent with other API phases
- Test data: seed a recipe with a known name and use its auto-generated slug in assertions
- Include cross-household 404 test: slug of household B returns 404 when authenticated as household A user

### Claude's Discretion
- Swagger `@ApiParam` description wording for `:id` field

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `findAndVerifyOwnership(recipeId, householdId)` — existing method using `findUnique({ where: { id } })`, unchanged for write ops
- `RECIPE_INCLUDE` constant — Prisma include object for full recipe hydration, reuse in slug branch
- `toRecipeDetailResponse()` — response mapper, reuse unchanged

### Established Patterns
- All recipe endpoints use `@CurrentUser()` decorator to extract `householdId` from session
- 404 via `NotFoundException`, 403 via `ForbiddenException` — slug branch must only throw `NotFoundException`
- Integration tests use a seeded household/user/recipe fixture pattern

### Integration Points
- `apps/api/src/recipes/recipes.service.ts` — add `isUuid` helper + `findByIdOrSlug` method; update `findOne` to call it
- `apps/api/src/recipes/recipes.controller.ts` — add `@ApiParam` description to `GET :id` endpoint
- `apps/api/integration_tests/` — new test file for slug/UUID dual lookup scenarios

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches for implementation and Swagger annotation.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
