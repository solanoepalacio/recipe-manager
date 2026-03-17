---
phase: 6
slug: backend-admin-endpoints
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-17
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x |
| **Config file** | `apps/api/jest.config.js` |
| **Quick run command** | `cd apps/api && yarn test --testPathPattern=admin` |
| **Full suite command** | `cd apps/api && yarn test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd apps/api && yarn test --testPathPattern=admin`
- **After every plan wave:** Run `cd apps/api && yarn test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 6-01-01 | 06-01 | 1 | Admin auth guard | unit | `cd apps/api && yarn test --testPathPattern=admin-auth` | ❌ W0 | ⬜ pending |
| 6-01-02 | 06-01 | 1 | AdminAuthModule wiring | unit | `cd apps/api && yarn test --testPathPattern=admin-auth` | ❌ W0 | ⬜ pending |
| 6-02-01 | 06-02 | 2 | Admin users CRUD | unit | `cd apps/api && yarn test --testPathPattern=admin-users` | ❌ W0 | ⬜ pending |
| 6-03-01 | 06-03 | 2 | Admin households CRUD | unit | `cd apps/api && yarn test --testPathPattern=admin-households` | ❌ W0 | ⬜ pending |
| 6-04-01 | 06-04 | 2 | Admin foods CRUD | unit | `cd apps/api && yarn test --testPathPattern=admin-foods` | ❌ W0 | ⬜ pending |
| 6-04-02 | 06-04 | 2 | Admin units CRUD | unit | `cd apps/api && yarn test --testPathPattern=admin-units` | ❌ W0 | ⬜ pending |
| 6-05-01 | 06-05 | 2 | Admin tokens create/list/delete | unit | `cd apps/api && yarn test --testPathPattern=admin-tokens` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/api/src/admin/admin-auth/admin-auth.controller.spec.ts` — stubs for admin auth guard
- [ ] `apps/api/src/admin/users/admin-users.service.spec.ts` — stubs for admin users CRUD
- [ ] `apps/api/src/admin/households/admin-households.service.spec.ts` — stubs for households CRUD
- [ ] `apps/api/src/admin/foods/admin-foods.service.spec.ts` — stubs for foods CRUD
- [ ] `apps/api/src/admin/units/admin-units.service.spec.ts` — stubs for units CRUD
- [ ] `apps/api/src/admin/tokens/admin-tokens.service.spec.ts` — stubs for tokens create/list/delete

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Token shown once | Admin tokens | Raw token only returned at creation; no re-retrieval | Create token via POST /admin/tokens, verify raw value in response; GET /admin/tokens only returns masked id+metadata |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
