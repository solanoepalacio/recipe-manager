---
phase: 9
slug: frontend-recipe-creation-editing
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-18
---

# Phase 9 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest + React Testing Library |
| **Config file** | `apps/web/vitest.config.ts` |
| **Quick run command** | `yarn workspace @recipe-manager/web test --run` |
| **Full suite command** | `yarn workspace @recipe-manager/web test --run && yarn workspace @recipe-manager/api test --run` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `yarn workspace @recipe-manager/web test --run`
- **After every plan wave:** Run `yarn workspace @recipe-manager/web test --run && yarn workspace @recipe-manager/api test --run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------|-------------------|--------|
| 9-01-01 | 01 | 1 | RCP-01, RCP-03, RCP-04 | unit | `yarn workspace @recipe-manager/web test --run -- RecipeEditor` | ⬜ pending |
| 9-01-02 | 01 | 1 | RCP-01 | unit | `yarn workspace @recipe-manager/web test --run -- RecipeEditor` | ⬜ pending |
| 9-02-01 | 02 | 2 | ING-01, ING-02, ING-03 | unit | `yarn workspace @recipe-manager/web test --run -- IngredientEditor` | ⬜ pending |
| 9-02-02 | 02 | 2 | ING-01 | unit | `yarn workspace @recipe-manager/web test --run -- IngredientEditor` | ⬜ pending |
| 9-03-01 | 03 | 2 | INS-01, INS-02 | unit | `yarn workspace @recipe-manager/web test --run -- StepEditor` | ⬜ pending |
| 9-04-01 | 04 | 2 | IMG-01, IMG-02 | unit | `yarn workspace @recipe-manager/web test --run -- ImageManagement` | ⬜ pending |
| 9-05-01 | 05 | 2 | RCP-05, RCP-02 | unit | `yarn workspace @recipe-manager/web test --run -- RecipeSettings` | ⬜ pending |
| 9-05-02 | 05 | 2 | RCP-05 | integration | `yarn workspace @recipe-manager/api test --run -- recipe-lock` | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

All test files are created as part of their respective plan tasks (not as separate Wave 0 stubs). Each plan's task includes test creation inline with the component code.

- [x] `apps/web/src/components/__tests__/RecipeEditor.test.tsx` — created in Plan 09-01, Task 1 (RCP-01, RCP-03, RCP-04)
- [x] `apps/web/src/components/__tests__/IngredientEditor.test.tsx` — created in Plan 09-02, Task 1 (ING-01, ING-02, ING-03)
- [x] `apps/web/src/components/__tests__/StepEditor.test.tsx` — created in Plan 09-03, Task 1 (INS-01, INS-02)
- [x] `apps/web/src/components/__tests__/ImageManagement.test.tsx` — created in Plan 09-04, Task 1 (IMG-01, IMG-02)
- [x] `apps/web/src/components/__tests__/RecipeSettings.test.tsx` — created in Plan 09-05, Task 2 (RCP-02, RCP-05)
- [x] Install `@dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities` — installed in Plan 09-01, Task 1

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Drag-and-drop ingredient reorder feels smooth | ING-03 | Touch/pointer interaction cannot be reliably tested in jsdom | Open recipe editor, drag ingredient to new position, verify order persists after save |
| Drag-and-drop step reorder feels smooth | INS-02 | Touch/pointer interaction cannot be reliably tested in jsdom | Open recipe editor, drag step to new position, verify order persists after save |
| Image upload shows progress/spinner | IMG-01 | File upload UI state requires real browser | Upload a large image, verify loading indicator appears |
| Lock toggle removes all edit controls | RCP-05 | Visual regression better verified manually | Lock a recipe, reload page, verify no edit buttons/inputs visible |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
