---
phase: 11
slug: frontend-profile-household-shared-recipe
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-18
---

# Phase 11 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest + React Testing Library |
| **Config file** | `apps/web/vitest.config.ts` |
| **Quick run command** | `yarn workspace @recipe-manager/web test --run` |
| **Full suite command** | `yarn workspace @recipe-manager/web test --run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `yarn workspace @recipe-manager/web test --run`
- **After every plan wave:** Run `yarn workspace @recipe-manager/web test --run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 20 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 11-01-01 | 01 | 1 | PROF-01 | unit | `yarn workspace @recipe-manager/web test --run profile` | ❌ W0 | ⬜ pending |
| 11-01-02 | 01 | 1 | PROF-01 | unit | `yarn workspace @recipe-manager/web test --run profile` | ❌ W0 | ⬜ pending |
| 11-02-01 | 02 | 1 | SHR-01 | unit | `yarn workspace @recipe-manager/web test --run share` | ❌ W0 | ⬜ pending |
| 11-02-02 | 02 | 1 | SHR-01 | unit | `yarn workspace @recipe-manager/web test --run share` | ❌ W0 | ⬜ pending |
| 11-03-01 | 03 | 1 | SHR-02 | unit | `yarn workspace @recipe-manager/web test --run shared` | ❌ W0 | ⬜ pending |
| 11-03-02 | 03 | 1 | SHR-02 | unit | `yarn workspace @recipe-manager/web test --run shared` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/web/src/components/__tests__/ProfilePage.test.tsx` — stubs for PROF-01
- [ ] `apps/web/src/components/__tests__/ShareLinkFlow.test.tsx` — stubs for SHR-01
- [ ] `apps/web/src/components/__tests__/SharedRecipePage.test.tsx` — stubs for SHR-02

*Existing Vitest + RTL infrastructure covers all phase requirements — no new framework installs needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Copy-to-clipboard writes correct URL to clipboard | SHR-01 | Clipboard API not reliably testable in jsdom | 1. Open recipe detail. 2. Click Compartir. 3. Click Copiar enlace. 4. Paste into address bar — verify URL matches `/shared/<token>` format |
| Unauthenticated `/shared/:token` tab shows no login redirect | SHR-02 | Auth redirect behavior requires real browser session | 1. Open incognito tab. 2. Visit `/shared/<valid-token>`. 3. Verify recipe loads with no redirect to `/login` |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 20s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
