---
phase: 5
slug: backend-search-sharing-meal-plan
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-16
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29 + ts-jest |
| **Config file** | `apps/api/jest.config.ts` |
| **Quick run command** | `yarn workspace @recipe-manager/api test --testPathPattern=recipes.service\|sharing\|meal-plan` |
| **Full suite command** | `yarn workspace @recipe-manager/api test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `yarn workspace @recipe-manager/api test --testPathPattern=<module>`
- **After every plan wave:** Run `yarn workspace @recipe-manager/api test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 5-01-01 | 01 | 1 | SC-1 | unit | `yarn workspace @recipe-manager/api test --testPathPattern=recipes.service` | ✅ extend | ⬜ pending |
| 5-01-02 | 01 | 1 | SC-2 | unit | `yarn workspace @recipe-manager/api test --testPathPattern=recipes.service` | ✅ extend | ⬜ pending |
| 5-01-03 | 01 | 1 | SC-2 | unit | `yarn workspace @recipe-manager/api test --testPathPattern=recipes.service` | ✅ extend | ⬜ pending |
| 5-01-04 | 01 | 1 | SC-2 | unit | `yarn workspace @recipe-manager/api test --testPathPattern=recipes.service` | ✅ extend | ⬜ pending |
| 5-02-01 | 02 | 2 | SC-3 | unit | `yarn workspace @recipe-manager/api test --testPathPattern=sharing.service` | ❌ W0 | ⬜ pending |
| 5-02-02 | 02 | 2 | SC-3 | unit | `yarn workspace @recipe-manager/api test --testPathPattern=sharing.service` | ❌ W0 | ⬜ pending |
| 5-02-03 | 02 | 2 | SC-3 | unit | `yarn workspace @recipe-manager/api test --testPathPattern=sharing.service` | ❌ W0 | ⬜ pending |
| 5-02-04 | 02 | 2 | SC-3 | unit | `yarn workspace @recipe-manager/api test --testPathPattern=sharing.service` | ❌ W0 | ⬜ pending |
| 5-03-01 | 03 | 2 | SC-4 | unit | `yarn workspace @recipe-manager/api test --testPathPattern=meal-plan.service` | ❌ W0 | ⬜ pending |
| 5-03-02 | 03 | 2 | SC-4 | unit | `yarn workspace @recipe-manager/api test --testPathPattern=meal-plan.service` | ❌ W0 | ⬜ pending |
| 5-03-03 | 03 | 2 | SC-4 | unit | `yarn workspace @recipe-manager/api test --testPathPattern=meal-plan.service` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/api/src/recipes/sharing/sharing.service.spec.ts` — stubs for token generation, revocation, public lookup (SC-3)
- [ ] `apps/api/src/meal-plan/meal-plan.service.spec.ts` — stubs for entry CRUD, lazy MealPlan creation, household scoping (SC-4)

*Existing `apps/api/src/recipes/recipes.service.spec.ts` needs new test cases — file already exists, extend it.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `GET /api/shared/:token` returns recipe with no auth header | SC-3 | Integration-level guard bypass verification | `curl -s http://localhost:3001/api/shared/<token>` → 200 with recipe JSON |
| Swagger UI shows all new endpoints at `/api/docs` | SC-1,2,3,4 | UI rendering check | Open `/api/docs` → confirm `GET /recipes`, `POST /recipes/:id/share`, `GET /shared/:token`, `POST /meal-plan/entries` all present |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
