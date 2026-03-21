---
phase: 18
slug: compound-recipe-create
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-21
---

# Phase 18 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x (integration tests via supertest) |
| **Config file** | `apps/api/jest.config.ts` |
| **Quick run command** | `cd apps/api && yarn test --testPathPattern=recipes` |
| **Full suite command** | `cd apps/api && yarn test:integration` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd apps/api && yarn test --testPathPattern=recipes`
- **After every plan wave:** Run `cd apps/api && yarn test:integration`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 18-01-01 | 01 | 1 | ERGO-03 | integration | `cd apps/api && yarn test:integration --testPathPattern=recipes` | ❌ W0 | ⬜ pending |
| 18-01-02 | 01 | 1 | ERGO-03 | integration | `cd apps/api && yarn test:integration --testPathPattern=recipes` | ❌ W0 | ⬜ pending |
| 18-01-03 | 01 | 1 | ERGO-03 | integration | `cd apps/api && yarn test:integration --testPathPattern=recipes` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/api/integration_tests/recipes/compound-create.integration-spec.ts` — integration test stubs for ERGO-03 (success path, FK rollback, backward compat)

*Existing infrastructure covers the test framework — only new test file stubs needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Swagger UI shows optional `ingredients[]` and `steps[]` on POST /api/recipes | ERGO-03 | UI inspection required | Open `/api/docs`, locate `POST /api/recipes`, verify new optional array fields are documented |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
