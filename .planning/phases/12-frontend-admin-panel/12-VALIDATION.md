---
phase: 12
slug: frontend-admin-panel
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-19
---

# Phase 12 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.0 + @testing-library/react 16.3.2 |
| **Config file** | `apps/web/vitest.config.ts` |
| **Quick run command** | `cd apps/web && yarn test` |
| **Full suite command** | `cd apps/web && yarn test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd apps/web && yarn test`
- **After every plan wave:** Run `cd apps/web && yarn test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 12-01-W0 | 01 | 0 | ADM-01..06 | unit | `cd apps/web && yarn test` | ❌ W0 | ⬜ pending |
| 12-01-01 | 01 | 1 | (auth) | unit | `cd apps/web && yarn test` | ❌ W0 | ⬜ pending |
| 12-01-02 | 01 | 1 | (setup) | unit | `cd apps/web && yarn test` | ❌ W0 | ⬜ pending |
| 12-02-01 | 02 | 1 | (login) | unit | `cd apps/web && yarn test` | ❌ W0 | ⬜ pending |
| 12-03-01 | 03 | 2 | ADM-01 | unit | `cd apps/web && yarn test` | ❌ W0 | ⬜ pending |
| 12-04-01 | 04 | 2 | ADM-02 | unit | `cd apps/web && yarn test` | ❌ W0 | ⬜ pending |
| 12-05-01 | 05 | 2 | ADM-03+04 | unit | `cd apps/web && yarn test` | ❌ W0 | ⬜ pending |
| 12-06-01 | 06 | 2 | ADM-05+06 | unit | `cd apps/web && yarn test` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/web/tests/admin/AdminAuthProvider.test.tsx` — stubs for admin session check + redirect
- [ ] `apps/web/tests/admin/setup-page.test.tsx` — stubs for setup guard redirect logic
- [ ] `apps/web/tests/admin/admin-login-page.test.tsx` — stubs for login form + error display
- [ ] `apps/web/tests/admin/users-section.test.tsx` — stubs for ADM-01 list/create/edit/delete
- [ ] `apps/web/tests/admin/households-section.test.tsx` — stubs for ADM-02
- [ ] `apps/web/tests/admin/foods-section.test.tsx` — stubs for ADM-03
- [ ] `apps/web/tests/admin/units-section.test.tsx` — stubs for ADM-04
- [ ] `apps/web/tests/admin/tokens-section.test.tsx` — stubs for ADM-05 + ADM-06
- [ ] `apps/web/tests/admin/OneTimeDisplay.test.tsx` — stubs for copy + dismiss behavior

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Raw token never shown after dismiss | ADM-05 | Requires live session state | Create token, copy value, dismiss OneTimeDisplay, confirm token is no longer in DOM |
| Setup wizard unavailable after admin exists | ADM-01 | Requires backend state (admin row exists) | Complete setup once, navigate to /setup, confirm redirect to /admin/login |
| Password reset URL is displayed once | ADM-01 | Live API response + copy UX | Generate URL for a user, confirm URL appears in OneTimeDisplay |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
