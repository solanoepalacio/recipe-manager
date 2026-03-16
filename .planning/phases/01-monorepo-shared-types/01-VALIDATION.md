---
phase: 1
slug: monorepo-shared-types
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-16
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest (via NestJS default) + ts-jest for `apps/api`; Jest + React Testing Library for `apps/web` |
| **Config file** | `apps/api/package.json` (jest config section) — none yet, Wave 0 creates it |
| **Quick run command** | `yarn workspace @recipe-manager/api test` |
| **Full suite command** | `yarn workspaces foreach run test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `yarn workspace @recipe-manager/api test`
- **After every plan wave:** Run `yarn workspaces foreach run build`
- **Before `/gsd:verify-work`:** Full build green + Swagger UI manually verified at `/api/docs`
- **Max feedback latency:** 60 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 1 | API-03 | build | `yarn workspaces foreach run build` | ❌ W0 | ⬜ pending |
| 1-02-01 | 02 | 1 | API-03 | type-check | `yarn workspace @recipe-manager/shared tsc --noEmit` | ❌ W0 | ⬜ pending |
| 1-03-01 | 03 | 2 | API-03 | smoke/e2e | `yarn workspace @recipe-manager/api test:e2e` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/api/test/app.e2e-spec.ts` — smoke test for API-03: GET `/api/docs` returns 200
- [ ] `apps/api/jest.config.ts` — unit test config with ts-jest
- [ ] `apps/api/test/jest-e2e.json` — e2e test config (NestJS CLI default path)
- [ ] Jest + testing deps installed: `yarn workspace @recipe-manager/api add -D jest @nestjs/testing ts-jest supertest @types/supertest`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Swagger UI renders at `/api/docs` | API-03 | Runtime browser check | Start server (`yarn workspace @recipe-manager/api start`), navigate to `http://localhost:3001/api/docs`, verify UI loads |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 60s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
