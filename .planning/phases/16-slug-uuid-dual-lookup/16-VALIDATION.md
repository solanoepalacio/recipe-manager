---
phase: 16
slug: slug-uuid-dual-lookup
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-21
---

# Phase 16 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest + ts-jest |
| **Config file** | `apps/api/jest-integration.config.ts` (integration) / `apps/api/jest.config.*` (unit) |
| **Quick run command** | `yarn workspace @recipe-manager/api test --testPathPattern=recipes.service` |
| **Full suite command** | `yarn workspace @recipe-manager/api test:integration` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `yarn workspace @recipe-manager/api test --testPathPattern=recipes.service`
- **After every plan wave:** Run `yarn workspace @recipe-manager/api test:integration`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 16-01-01 | 01 | 1 | ERGO-04 | unit | `yarn workspace @recipe-manager/api test --testPathPattern=recipes.service` | ✅ | ⬜ pending |
| 16-01-02 | 01 | 1 | ERGO-04 | integration | `yarn workspace @recipe-manager/api test:integration` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/api/integration_tests/recipes-slug.integration-spec.ts` — integration tests for ERGO-04 slug/UUID dual lookup with household scoping via Prisma direct

*Existing unit test infrastructure (recipes.service.spec.ts) covers unit cases — only integration file is new.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Swagger UI `:id` param shows both UUID and slug description | ERGO-04 | Visual check in browser | Navigate to `/api/docs`, find GET /recipes/:id, verify param description mentions both UUID and slug |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
