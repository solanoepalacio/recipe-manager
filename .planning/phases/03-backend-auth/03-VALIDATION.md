---
phase: 3
slug: backend-auth
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-16
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x (NestJS default) |
| **Config file** | `apps/api/jest.config.ts` |
| **Quick run command** | `yarn workspace apps/api test --testPathPattern=auth` |
| **Full suite command** | `yarn workspace apps/api test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `yarn workspace apps/api test --testPathPattern=auth`
- **After every plan wave:** Run `yarn workspace apps/api test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | AUTH-01 | unit | `yarn workspace apps/api test --testPathPattern=session-auth` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | API-02 | unit | `yarn workspace apps/api test --testPathPattern=api-key-auth` | ❌ W0 | ⬜ pending |
| 03-01-03 | 01 | 1 | AUTH-01 | unit | `yarn workspace apps/api test --testPathPattern=any-auth` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 2 | AUTH-01 | e2e | `yarn workspace apps/api test:e2e --testPathPattern=auth` | ❌ W0 | ⬜ pending |
| 03-02-02 | 02 | 2 | AUTH-02 | e2e | `yarn workspace apps/api test:e2e --testPathPattern=auth` | ❌ W0 | ⬜ pending |
| 03-02-03 | 02 | 2 | AUTH-02 | e2e | `yarn workspace apps/api test:e2e --testPathPattern=admin-auth` | ❌ W0 | ⬜ pending |
| 03-03-01 | 03 | 3 | AUTH-04 | e2e | `yarn workspace apps/api test:e2e --testPathPattern=setup` | ❌ W0 | ⬜ pending |
| 03-04-01 | 04 | 4 | AUTH-03, AUTH-05 | e2e | `yarn workspace apps/api test:e2e --testPathPattern=password-reset` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/api/src/auth/tests/session-auth.guard.spec.ts` — stubs for AUTH-01
- [ ] `apps/api/src/auth/tests/api-key-auth.guard.spec.ts` — stubs for API-02
- [ ] `apps/api/src/auth/tests/any-auth.guard.spec.ts` — stubs for AUTH-01
- [ ] `apps/api/tests/auth.e2e-spec.ts` — e2e stubs for AUTH-01, AUTH-02
- [ ] `apps/api/tests/admin-auth.e2e-spec.ts` — e2e stubs for AUTH-02
- [ ] `apps/api/tests/setup.e2e-spec.ts` — e2e stubs for AUTH-04
- [ ] `apps/api/tests/password-reset.e2e-spec.ts` — e2e stubs for AUTH-03, AUTH-05

*Existing jest infrastructure covers all phase requirements — no new framework install needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Session cookie appears in browser DevTools | AUTH-01 | Browser cookie inspection | Login via POST /auth/login, open Network tab, verify Set-Cookie header with connect.sid |
| Admin session uses separate cookie name | AUTH-02 | Browser cookie inspection | Login via POST /admin/auth/login, verify Set-Cookie header with admin.sid |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
