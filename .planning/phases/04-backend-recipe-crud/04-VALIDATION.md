---
phase: 4
slug: backend-recipe-crud
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-16
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29 + ts-jest |
| **Config file** | `apps/api/jest.config.ts` |
| **Quick run command** | `yarn workspace @recipe-manager/api test --testPathPattern=recipes` |
| **Full suite command** | `yarn workspace @recipe-manager/api test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `yarn workspace @recipe-manager/api test --testPathPattern=<module>`
- **After every plan wave:** Run `yarn workspace @recipe-manager/api test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 4-01-01 | 01 | 1 | API-01 | unit | `yarn workspace @recipe-manager/api test --testPathPattern=recipes.service` | ❌ W0 | ⬜ pending |
| 4-01-02 | 01 | 1 | API-01 | unit | `yarn workspace @recipe-manager/api test --testPathPattern=recipes.service` | ❌ W0 | ⬜ pending |
| 4-01-03 | 01 | 1 | API-01 | unit | `yarn workspace @recipe-manager/api test --testPathPattern=recipes.service` | ❌ W0 | ⬜ pending |
| 4-02-01 | 02 | 2 | API-01 | unit | `yarn workspace @recipe-manager/api test --testPathPattern=sections.service` | ❌ W0 | ⬜ pending |
| 4-02-02 | 02 | 2 | API-01 | unit | `yarn workspace @recipe-manager/api test --testPathPattern=ingredients.service` | ❌ W0 | ⬜ pending |
| 4-03-01 | 03 | 2 | API-01 | unit | `yarn workspace @recipe-manager/api test --testPathPattern=steps.service` | ❌ W0 | ⬜ pending |
| 4-04-01 | 04 | 3 | API-01 | unit | `yarn workspace @recipe-manager/api test --testPathPattern=images.service` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/recipes/recipes.service.spec.ts` — covers recipe CRUD, slug generation, household scoping, isLocked guard
- [ ] `src/recipes/sections/sections.service.spec.ts` — covers section CRUD and reorder
- [ ] `src/recipes/ingredients/ingredients.service.spec.ts` — covers ingredient CRUD and reorder
- [ ] `src/recipes/steps/steps.service.spec.ts` — covers step CRUD and reorder
- [ ] `src/recipes/images/images.service.spec.ts` — covers image create/delete (mock `fs.promises.unlink`)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Swagger shows all recipe endpoints with correct schemas | API-01 | UI verification | Navigate to `GET /api/docs`, confirm all recipe endpoints visible with request/response schemas derived from shared types |
| Image file physically stored on disk | API-01 | File system side effect | After `POST /recipes/:id/images`, verify file exists at configured upload path |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
