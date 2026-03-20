---
phase: 14
slug: lookup-commands
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-20
---

# Phase 14 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest 8.x |
| **Config file** | `tools/rmapi/pyproject.toml` — `[tool.pytest.ini_options] testpaths = ["tests"]` |
| **Quick run command** | `cd /home/solanoe/code/recipe-manager && .venv/bin/pytest tools/rmapi/tests/ -x -q` |
| **Full suite command** | `cd /home/solanoe/code/recipe-manager && .venv/bin/pytest tools/rmapi/tests/ -v` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd /home/solanoe/code/recipe-manager && .venv/bin/pytest tools/rmapi/tests/ -x -q`
- **After every plan wave:** Run `cd /home/solanoe/code/recipe-manager && .venv/bin/pytest tools/rmapi/tests/ -v`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 14-01-01 | 01 | 0 | LOOK-01 | unit | `.venv/bin/pytest tools/rmapi/tests/test_foods.py -x -q` | ❌ W0 | ⬜ pending |
| 14-01-02 | 01 | 0 | LOOK-02 | unit | `.venv/bin/pytest tools/rmapi/tests/test_units.py -x -q` | ❌ W0 | ⬜ pending |
| 14-01-03 | 01 | 1 | LOOK-01 | unit | `.venv/bin/pytest tools/rmapi/tests/test_foods.py -x -q` | ✅ W0 | ⬜ pending |
| 14-01-04 | 01 | 1 | LOOK-02 | unit | `.venv/bin/pytest tools/rmapi/tests/test_units.py -x -q` | ✅ W0 | ⬜ pending |
| 14-01-05 | 01 | 1 | LOOK-01, LOOK-02 | unit | `.venv/bin/pytest tools/rmapi/tests/ -x -q` | ✅ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tools/rmapi/tests/test_foods.py` — failing stubs for LOOK-01 (lookup + no-match omit + fields projection + auth error propagation)
- [ ] `tools/rmapi/tests/test_units.py` — failing stubs for LOOK-02 (list + fields projection + auth error propagation)

*Existing `conftest.py` with `CliRunner` fixture covers all phase tests — no new fixtures needed.*

---

## Manual-Only Verifications

*All phase behaviors have automated verification.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
