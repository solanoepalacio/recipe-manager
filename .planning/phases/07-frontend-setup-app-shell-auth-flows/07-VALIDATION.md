---
phase: 7
slug: frontend-setup-app-shell-auth-flows
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-18
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest + @testing-library/react |
| **Config file** | `apps/web/vitest.config.ts` (Wave 0 creates) |
| **Quick run command** | `yarn workspace @recipe-manager/web test --run` |
| **Full suite command** | `yarn workspace @recipe-manager/web test --run --coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `yarn workspace @recipe-manager/web test --run`
- **After every plan wave:** Run `yarn workspace @recipe-manager/web test --run --coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 20 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 1 | UX-01 | build | `yarn workspace @recipe-manager/web build` | ❌ W0 | ⬜ pending |
| 07-01-02 | 01 | 1 | UX-01 | unit | `yarn workspace @recipe-manager/web test --run` | ❌ W0 | ⬜ pending |
| 07-02-01 | 02 | 2 | UX-01 | unit | `yarn workspace @recipe-manager/web test --run` | ❌ W0 | ⬜ pending |
| 07-02-02 | 02 | 2 | UX-01 | manual | Resize browser at 375/768/1280px — no horizontal scroll | ❌ W0 | ⬜ pending |
| 07-03-01 | 03 | 2 | UX-02 | unit | `yarn workspace @recipe-manager/web test --run` | ❌ W0 | ⬜ pending |
| 07-03-02 | 03 | 2 | UX-02 | e2e-manual | Visit /recipes unauthenticated → redirect to /login | ❌ W0 | ⬜ pending |
| 07-04-01 | 04 | 3 | UX-02 | unit | `yarn workspace @recipe-manager/web test --run` | ❌ W0 | ⬜ pending |
| 07-04-02 | 04 | 3 | UX-03 | unit | `yarn workspace @recipe-manager/web test --run` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/web/vitest.config.ts` — vitest config with jsdom environment
- [ ] `apps/web/src/test/setup.ts` — @testing-library/jest-dom matchers
- [ ] `apps/web/src/components/__tests__/AppShell.test.tsx` — stub for UX-01
- [ ] `apps/web/src/components/__tests__/AuthProvider.test.tsx` — stub for UX-02
- [ ] `apps/web/src/components/__tests__/Toast.test.tsx` — stub for UX-03
- [ ] Install vitest, @testing-library/react, @testing-library/jest-dom, jsdom as devDependencies

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| App shell renders without horizontal scroll on mobile | UX-01 | Requires real browser resize; CSS layout not testable via jsdom | Open at localhost:3001, resize to 375px — verify no horizontal scrollbar |
| Drawer opens/closes on hamburger tap | UX-01 | Touch interaction; requires browser | Tap hamburger on mobile viewport — drawer slides in from left |
| Unauthenticated redirect to /login | UX-02 | Requires real router navigation | Visit /recipes directly in browser without session — should land on /login |
| Login redirects to /recipes | UX-02 | Requires real session cookie | Submit valid credentials — should redirect to /recipes |
| Toast auto-dismisses after 4s | UX-03 | Timer-based; requires real browser | Trigger a toast manually — verify it disappears ~4 seconds later |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 20s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
