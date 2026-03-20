---
phase: 15
slug: recipe-read-commands
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-20
---

# Phase 15 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest (already installed in `.venv`) |
| **Config file** | `tools/rmapi/pyproject.toml` |
| **Quick run command** | `cd /home/solanoe/code/recipe-manager && .venv/bin/pytest tools/rmapi/tests/test_recipes.py -x -q` |
| **Full suite command** | `cd /home/solanoe/code/recipe-manager && .venv/bin/pytest tools/rmapi/tests/ -v` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd /home/solanoe/code/recipe-manager && .venv/bin/pytest tools/rmapi/tests/test_recipes.py -x -q`
- **After every plan wave:** Run `cd /home/solanoe/code/recipe-manager && .venv/bin/pytest tools/rmapi/tests/ -v`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 15-01-01 | 01 | 0 | RCP-01, RCP-02 | unit | `pytest tools/rmapi/tests/test_recipes.py -x -q` | ❌ W0 | ⬜ pending |
| 15-01-02 | 01 | 1 | RCP-01 | unit | `pytest tools/rmapi/tests/test_recipes.py::test_recipes_list_returns_paginated_response -x` | ❌ W0 | ⬜ pending |
| 15-01-03 | 01 | 1 | RCP-01 | unit | `pytest tools/rmapi/tests/test_recipes.py::test_recipes_list_search_flag -x` | ❌ W0 | ⬜ pending |
| 15-01-04 | 01 | 1 | RCP-01 | unit | `pytest tools/rmapi/tests/test_recipes.py::test_recipes_list_food_id_flag -x` | ❌ W0 | ⬜ pending |
| 15-01-05 | 01 | 1 | RCP-01 | unit | `pytest tools/rmapi/tests/test_recipes.py::test_recipes_list_sort_order_flags -x` | ❌ W0 | ⬜ pending |
| 15-01-06 | 01 | 1 | RCP-01 | unit | `pytest tools/rmapi/tests/test_recipes.py::test_recipes_list_pagination_flags -x` | ❌ W0 | ⬜ pending |
| 15-01-07 | 01 | 1 | RCP-01 | unit | `pytest tools/rmapi/tests/test_recipes.py::test_recipes_list_fields_projection -x` | ❌ W0 | ⬜ pending |
| 15-01-08 | 01 | 1 | RCP-02 | unit | `pytest tools/rmapi/tests/test_recipes.py::test_recipes_get_returns_detail -x` | ❌ W0 | ⬜ pending |
| 15-01-09 | 01 | 1 | RCP-02 | unit | `pytest tools/rmapi/tests/test_recipes.py::test_recipes_get_fields_projection -x` | ❌ W0 | ⬜ pending |
| 15-01-10 | 01 | 1 | RCP-02 | unit | `pytest tools/rmapi/tests/test_recipes.py::test_recipes_get_not_found -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tools/rmapi/tests/test_recipes.py` — 9 test stubs covering RCP-01 and RCP-02

*All other infrastructure (conftest.py, pytest config, http.py, errors.py, utils.py) already exists from Phases 13 and 14.*

---

## Manual-Only Verifications

*All phase behaviors have automated verification.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
