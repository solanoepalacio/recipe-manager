---
phase: 2
slug: database-schema-prisma
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-16
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29 + ts-jest |
| **Config file** | `apps/api/jest.config.ts` (unit) / `apps/api/jest-integration.config.ts` (Wave 0 — must be created) |
| **Quick run command** | `npx prisma validate` (schema lint, no DB, < 2s) |
| **Full suite command** | `yarn workspace @recipe-manager/api jest --config jest-integration.config.ts` |
| **Estimated runtime** | ~2 seconds (quick) / ~15 seconds (full integration) |

---

## Sampling Rate

- **After every task commit:** Run `npx prisma validate`
- **After every plan wave:** Run `yarn workspace @recipe-manager/api jest --config jest-integration.config.ts`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 2-01-01 | 01 | 1 | HH-01 | schema lint | `npx prisma validate` | ✅ (CLI) | ⬜ pending |
| 2-01-02 | 01 | 1 | HH-01 | integration | `yarn workspace @recipe-manager/api jest --config jest-integration.config.ts --testPathPattern schema` | ❌ W0 | ⬜ pending |
| 2-02-01 | 02 | 2 | HH-01 | integration | `yarn workspace @recipe-manager/api jest --config jest-integration.config.ts --testPathPattern seed` | ❌ W0 | ⬜ pending |
| 2-02-02 | 02 | 2 | HH-01 | manual/smoke | `npx prisma migrate deploy` exits 0 | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `apps/api/integration_tests/schema.integration-spec.ts` — stubs for HH-01 DB-level enforcement (Recipe.householdId, MealPlan.householdId non-nullable)
- [ ] `apps/api/integration_tests/seed.integration-spec.ts` — verifies Food and Unit tables are non-empty after seed
- [ ] `apps/api/jest-integration.config.ts` — separate Jest config for integration tests (rootDir: `integration_tests/`, testEnvironment: `node`)
- [ ] `tsx` devDependency in `apps/api/package.json` — required for `prisma db seed` to run `seed.ts`

*Wave 0 must be complete before plan wave 1 execution.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `prisma migrate deploy` applies with no errors against fresh PostgreSQL | HH-01 (success criterion 1) | Migration CLI output requires human inspection; no jest wrapper for bare migrate deploy | Run `npx prisma migrate deploy` from `apps/api/`; verify exit code 0 and no error output |
| `SELECT COUNT(*) FROM "Food"` returns non-zero | HH-01 (success criterion 2) | Seed data count is a data assertion, not code behavior | After seed: `npx prisma studio` or `psql -c 'SELECT COUNT(*) FROM "Food"'` |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
