---
phase: 8
slug: frontend-recipe-list-detail-cook-mode
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-18
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest ^4.1.0 |
| **Config file** | `apps/web/vitest.config.ts` |
| **Quick run command** | `yarn workspace @recipe-manager/web test` |
| **Full suite command** | `yarn workspace @recipe-manager/web test --coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `yarn workspace @recipe-manager/web test`
- **After every plan wave:** Run `yarn workspace @recipe-manager/web test --coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 08-01-00 | 01 | 0 | SRCH-01, SRCH-02, SRCH-03, SRCH-04 | unit | `yarn workspace @recipe-manager/web test -- --testNamePattern="RecipeListPage"` | ❌ W0 | ⬜ pending |
| 08-01-00b | 01 | 0 | fix | unit | `yarn workspace @recipe-manager/web test -- --testNamePattern="AppShell"` | ✅ | ⬜ pending |
| 08-01-01 | 01 | 1 | SRCH-01 | unit | `yarn workspace @recipe-manager/web test -- --testNamePattern="RecipeListPage"` | ❌ W0 | ⬜ pending |
| 08-01-02 | 01 | 1 | SRCH-02 | unit | `yarn workspace @recipe-manager/web test -- --testNamePattern="RecipeListPage"` | ❌ W0 | ⬜ pending |
| 08-01-03 | 01 | 1 | SRCH-03 | unit | `yarn workspace @recipe-manager/web test -- --testNamePattern="RecipeListPage"` | ❌ W0 | ⬜ pending |
| 08-01-04 | 01 | 1 | SRCH-04 | unit | `yarn workspace @recipe-manager/web test -- --testNamePattern="RecipeListPage"` | ❌ W0 | ⬜ pending |
| 08-02-00 | 02 | 0 | RCP-07 | unit | `yarn workspace @recipe-manager/web test -- --testNamePattern="RecipeDetailPage"` | ❌ W0 | ⬜ pending |
| 08-02-01 | 02 | 1 | RCP-07 | unit | `yarn workspace @recipe-manager/web test -- --testNamePattern="RecipeDetailPage"` | ❌ W0 | ⬜ pending |
| 08-03-00 | 03 | 0 | RCP-08 | unit | `yarn workspace @recipe-manager/web test -- --testNamePattern="CookModePage"` | ❌ W0 | ⬜ pending |
| 08-03-01 | 03 | 1 | RCP-08 | unit | `yarn workspace @recipe-manager/web test -- --testNamePattern="CookModePage"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/web/src/components/__tests__/RecipeListPage.test.tsx` — stubs for SRCH-01, SRCH-02, SRCH-03, SRCH-04
- [ ] `apps/web/src/components/__tests__/RecipeDetailPage.test.tsx` — stubs for RCP-07
- [ ] `apps/web/src/components/__tests__/CookModePage.test.tsx` — stubs for RCP-08
- [ ] Fix `apps/web/src/components/__tests__/AppShell.test.tsx:26` — remove stale `Buscar recetas...` assertion (search moved out of AppShell in Phase 7)

*Existing infrastructure (Vitest + Testing Library + jsdom) covers all phase requirements — no new framework install needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Cook mode full-screen visual covers AppShell chrome | RCP-08 | CSS overlay correctness cannot be verified in jsdom (no layout engine) | Navigate to `/recipes/:slug/cook` in browser; confirm TopBar and Drawer are not visible; confirm cook mode top bar shows recipe title and exit button |
| Recipe list sort=random re-shuffles on each click | SRCH-03 | Randomness test is non-deterministic | Click "Random" sort; note card order; click again; confirm order changed |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
