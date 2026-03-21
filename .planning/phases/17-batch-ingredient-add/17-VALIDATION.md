---
phase: 17
slug: batch-ingredient-add
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-21
---

# Phase 17 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest (unit) + Jest with Prisma-direct (integration) |
| **Config file** | `apps/api/jest.config.ts` (unit) / `apps/api/jest-integration.config.ts` (integration) |
| **Quick run command** | `cd apps/api && yarn test --testPathPattern=ingredients.service.spec` |
| **Full suite command** | `cd apps/api && yarn test && yarn test:integration` |
| **Estimated runtime** | ~20 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd apps/api && yarn test --testPathPattern=ingredients.service.spec`
- **After every plan wave:** Run `cd apps/api && yarn test && yarn test:integration`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~20 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 17-01-01 | 01 | 1 | ERGO-05 | unit | `cd apps/api && yarn test --testPathPattern=ingredients.service.spec` | ❌ W0 | ⬜ pending |
| 17-01-02 | 01 | 1 | ERGO-05 | integration | `cd apps/api && yarn test:integration --testPathPattern=recipes-batch-ingredient` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/api/integration_tests/recipes-batch-ingredient.integration-spec.ts` — covers ERGO-05 integration scenarios (atomicity, ordering, hydration, FK rollback)
- [ ] `describe('batchCreate')` block in `apps/api/src/recipes/ingredients/ingredients.service.spec.ts` — covers ERGO-05 unit scenarios (empty array, ordering, mock structure)
- [ ] Extend `mockPrisma` in `ingredients.service.spec.ts` with `createMany: jest.fn()` on `recipeIngredient` and `$transaction` mock

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Swagger UI documents `/batch` route with correct request/response schema | ERGO-05 | Visual check in browser | Navigate to `/api/docs`, find POST /recipes/:id/sections/:sectionId/ingredients/batch, verify array body schema and SectionResponse documented |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
