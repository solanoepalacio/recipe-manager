---
phase: 18
slug: meal-plan-commands
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-20
---

# Phase 18 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest 7.x |
| **Config file** | `tools/rmapi/pyproject.toml` (existing) |
| **Quick run command** | `cd /home/solanoe/code/recipe-manager && .venv/bin/pytest tools/rmapi/tests/test_meal_plan.py -x` |
| **Full suite command** | `cd /home/solanoe/code/recipe-manager && .venv/bin/pytest tools/rmapi/tests/ -x` |
| **Estimated runtime** | ~1 second |

---

## Sampling Rate

- **After every task commit:** Run `.venv/bin/pytest tools/rmapi/tests/test_meal_plan.py -x`
- **After every plan wave:** Run `.venv/bin/pytest tools/rmapi/tests/ -x`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~1 second

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 18-01-01 | 01 | 1 | MPL-01 | unit | `.venv/bin/pytest tools/rmapi/tests/test_meal_plan.py::test_meal_plan_list -x` | ❌ W0 | ⬜ pending |
| 18-01-01 | 01 | 1 | MPL-01 | unit | `.venv/bin/pytest tools/rmapi/tests/test_meal_plan.py::test_meal_plan_list_date_filters -x` | ❌ W0 | ⬜ pending |
| 18-01-02 | 01 | 1 | MPL-02 | unit | `.venv/bin/pytest tools/rmapi/tests/test_meal_plan.py::test_meal_plan_add -x` | ❌ W0 | ⬜ pending |
| 18-01-02 | 01 | 1 | MPL-02 | unit | `.venv/bin/pytest tools/rmapi/tests/test_meal_plan.py::test_meal_plan_add_body -x` | ❌ W0 | ⬜ pending |
| 18-01-03 | 01 | 1 | MPL-03 | unit | `.venv/bin/pytest tools/rmapi/tests/test_meal_plan.py::test_meal_plan_move -x` | ❌ W0 | ⬜ pending |
| 18-01-03 | 01 | 1 | MPL-03 | unit | `.venv/bin/pytest tools/rmapi/tests/test_meal_plan.py::test_meal_plan_move_sparse_body -x` | ❌ W0 | ⬜ pending |
| 18-01-04 | 01 | 1 | MPL-04 | unit | `.venv/bin/pytest tools/rmapi/tests/test_meal_plan.py::test_meal_plan_remove_with_yes -x` | ❌ W0 | ⬜ pending |
| 18-01-04 | 01 | 1 | MPL-04 | unit | `.venv/bin/pytest tools/rmapi/tests/test_meal_plan.py::test_meal_plan_remove_requires_yes -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tools/rmapi/tests/test_meal_plan.py` — stubs for MPL-01 through MPL-04

*All test stubs must be created before implementation begins.*

---

## Manual-Only Verifications

*All phase behaviors have automated verification.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 2s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
