---
phase: 17
slug: sub-resource-commands
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-20
---

# Phase 17 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest 7.x |
| **Config file** | `tools/rmapi/pytest.ini` or `tools/rmapi/pyproject.toml` |
| **Quick run command** | `cd tools/rmapi && python -m pytest tests/ -x -q` |
| **Full suite command** | `cd tools/rmapi && python -m pytest tests/ -v` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd tools/rmapi && python -m pytest tests/ -x -q`
- **After every plan wave:** Run `cd tools/rmapi && python -m pytest tests/ -v`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 17-01-01 | 01 | 1 | SEC-01..04 | unit | `cd tools/rmapi && python -m pytest tests/test_sections.py -x -q` | ❌ W0 | ⬜ pending |
| 17-01-02 | 01 | 1 | ING-01..04 | unit | `cd tools/rmapi && python -m pytest tests/test_ingredients.py -x -q` | ❌ W0 | ⬜ pending |
| 17-01-03 | 01 | 1 | STP-01..04 | unit | `cd tools/rmapi && python -m pytest tests/test_steps.py -x -q` | ❌ W0 | ⬜ pending |
| 17-01-04 | 01 | 1 | SEC-01..04, ING-01..04, STP-01..04 | unit | `cd tools/rmapi && python -m pytest tests/ -x -q` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tools/rmapi/tests/test_sections.py` — new test file with stubs for SEC-01 through SEC-04
- [ ] `tools/rmapi/tests/test_ingredients.py` — new test file with stubs for ING-01 through ING-04
- [ ] `tools/rmapi/tests/test_steps.py` — new test file with stubs for STP-01 through STP-04

*Three new test files needed — one per command group, mirroring test_recipes.py structure.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Full creation chain (sections → ingredients → steps) | SEC-01, ING-01, STP-01 | Requires live API with threaded IDs | Run sections add, capture id; run ingredients add with recipe-id + section-id, capture id; run steps add; verify all JSON outputs |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
