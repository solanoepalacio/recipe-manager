---
phase: 16
slug: recipe-write-commands
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-20
---

# Phase 16 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest 7.x |
| **Config file** | `tools/rmapi/pytest.ini` or `tools/rmapi/pyproject.toml` |
| **Quick run command** | `cd tools/rmapi && python -m pytest tests/test_recipes.py -x -q` |
| **Full suite command** | `cd tools/rmapi && python -m pytest tests/ -x -q` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd tools/rmapi && python -m pytest tests/test_recipes.py -x -q`
- **After every plan wave:** Run `cd tools/rmapi && python -m pytest tests/ -x -q`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 16-01-01 | 01 | 1 | RCP-03 | unit | `cd tools/rmapi && python -m pytest tests/test_recipes.py::test_recipes_create -x -q` | ✅ | ⬜ pending |
| 16-01-02 | 01 | 1 | RCP-04 | unit | `cd tools/rmapi && python -m pytest tests/test_recipes.py::test_recipes_update -x -q` | ✅ | ⬜ pending |
| 16-01-03 | 01 | 1 | RCP-05 | unit | `cd tools/rmapi && python -m pytest tests/test_recipes.py::test_recipes_delete -x -q` | ✅ | ⬜ pending |
| 16-01-04 | 01 | 1 | RCP-06 | unit | `cd tools/rmapi && python -m pytest tests/test_recipes.py::test_recipes_duplicate -x -q` | ✅ | ⬜ pending |
| 16-01-05 | 01 | 1 | RCP-07 | unit | `cd tools/rmapi && python -m pytest tests/test_recipes.py::test_recipes_add_image -x -q` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tools/rmapi/tests/test_recipes.py` — add stubs for RCP-03 through RCP-07 (create, update, delete, duplicate, add-image)

*All new tests go in the existing `test_recipes.py` — no new test files needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `add-image` downloads from real URL and uploads multipart | RCP-07 | Requires live network and real image URL | Run `rmapi recipes add-image <id> --url https://example.com/image.jpg` and verify JSON response |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
