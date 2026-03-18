---
phase: 9
slug: frontend-recipe-creation-editing
status: draft
nyquist_compliant: false
wave_0_complete: false
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

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 9-01-01 | 01 | 1 | RCP-01 | unit | `yarn workspace @recipe-manager/web test --run -- RecipeFormShell` | ❌ W0 | ⬜ pending |
| 9-01-02 | 01 | 1 | RCP-01 | unit | `yarn workspace @recipe-manager/web test --run -- SlugPreview` | ❌ W0 | ⬜ pending |
| 9-02-01 | 02 | 2 | ING-01 | unit | `yarn workspace @recipe-manager/web test --run -- IngredientSection` | ❌ W0 | ⬜ pending |
| 9-02-02 | 02 | 2 | ING-02 | unit | `yarn workspace @recipe-manager/web test --run -- FoodUnitPicker` | ❌ W0 | ⬜ pending |
| 9-02-03 | 02 | 2 | ING-03 | unit | `yarn workspace @recipe-manager/web test --run -- IngredientReorder` | ❌ W0 | ⬜ pending |
| 9-03-01 | 03 | 2 | INS-01 | unit | `yarn workspace @recipe-manager/web test --run -- InstructionStep` | ❌ W0 | ⬜ pending |
| 9-03-02 | 03 | 2 | INS-02 | unit | `yarn workspace @recipe-manager/web test --run -- StepReorder` | ❌ W0 | ⬜ pending |
| 9-04-01 | 04 | 3 | IMG-01 | unit | `yarn workspace @recipe-manager/web test --run -- ImageUpload` | ❌ W0 | ⬜ pending |
| 9-04-02 | 04 | 3 | IMG-02 | unit | `yarn workspace @recipe-manager/web test --run -- ImageDelete` | ❌ W0 | ⬜ pending |
| 9-05-01 | 05 | 3 | RCP-05 | unit | `yarn workspace @recipe-manager/web test --run -- LockToggle` | ❌ W0 | ⬜ pending |
| 9-05-02 | 05 | 3 | RCP-02 | unit | `yarn workspace @recipe-manager/web test --run -- DuplicateRecipe` | ❌ W0 | ⬜ pending |
| 9-05-03 | 05 | 3 | RCP-05 | integration | `yarn workspace @recipe-manager/api test --run -- recipe-lock` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/web/tests/components/RecipeFormShell.test.tsx` — stubs for RCP-01 (create/edit form shell)
- [ ] `apps/web/tests/components/SlugPreview.test.tsx` — stubs for RCP-01 (slug preview)
- [ ] `apps/web/tests/components/IngredientSection.test.tsx` — stubs for ING-01 (ingredient section)
- [ ] `apps/web/tests/components/FoodUnitPicker.test.tsx` — stubs for ING-01, ING-02 (pickers)
- [ ] `apps/web/tests/components/IngredientReorder.test.tsx` — stubs for ING-03 (drag-and-drop reorder)
- [ ] `apps/web/tests/components/InstructionStep.test.tsx` — stubs for INS-01, INS-02 (step editor + reorder)
- [ ] `apps/web/tests/components/ImageUpload.test.tsx` — stubs for IMG-01, IMG-02 (image management)
- [ ] `apps/web/tests/components/LockToggle.test.tsx` — stubs for RCP-05 (lock toggle)
- [ ] `apps/web/tests/components/DuplicateRecipe.test.tsx` — stubs for RCP-02 (duplicate action)
- [ ] `apps/api/integration_tests/recipe-lock.test.ts` — stubs for RCP-05 backend (isLocked field)
- [ ] Install `@dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities` — required for ING-03, INS-02

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

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
