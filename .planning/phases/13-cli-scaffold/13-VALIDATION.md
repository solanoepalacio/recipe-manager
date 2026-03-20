---
phase: 13
slug: cli-scaffold
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-20
---

# Phase 13 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | pytest 8.x (install via `pip install -e "tools/rmapi/[dev]"`) |
| **Config file** | `tools/rmapi/pyproject.toml` (pytest section) — Wave 0 creates |
| **Quick run command** | `cd tools/rmapi && python -m pytest tests/ -x -q` |
| **Full suite command** | `cd tools/rmapi && python -m pytest tests/ -v` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd tools/rmapi && python -m pytest tests/ -x -q`
- **After every plan wave:** Run `cd tools/rmapi && python -m pytest tests/ -v`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 13-01-01 | 01 | 0 | CLI-01,CLI-02,CLI-03,CLI-04,CLI-05 | unit | `cd tools/rmapi && python -m pytest tests/ -x -q` | ❌ W0 | ⬜ pending |
| 13-02-01 | 01 | 1 | CLI-01 | unit | `cd tools/rmapi && python -m pytest tests/test_config.py -x` | ❌ W0 | ⬜ pending |
| 13-02-02 | 01 | 1 | CLI-02,CLI-03 | unit | `cd tools/rmapi && python -m pytest tests/test_errors.py -x` | ❌ W0 | ⬜ pending |
| 13-02-03 | 01 | 1 | CLI-04 | unit | `cd tools/rmapi && python -m pytest tests/test_fields.py -x` | ❌ W0 | ⬜ pending |
| 13-02-04 | 01 | 1 | CLI-05 | unit | `cd tools/rmapi && python -m pytest tests/test_yes_guard.py -x` | ❌ W0 | ⬜ pending |
| 13-02-05 | 01 | 1 | CLI-01 | integration | `cd tools/rmapi && pip install -e . && rmapi --help` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tools/rmapi/pyproject.toml` — package declaration with entry point and deps
- [ ] `tools/rmapi/rmapi/__init__.py` — empty init
- [ ] `tools/rmapi/rmapi/cli.py` — root Click group skeleton
- [ ] `tools/rmapi/rmapi/config.py` — Config.from_env()
- [ ] `tools/rmapi/rmapi/errors.py` — RmapiError hierarchy + raise_for_status()
- [ ] `tools/rmapi/rmapi/utils.py` — apply_fields() + require_yes()
- [ ] `tools/rmapi/rmapi/commands/__init__.py` — empty init
- [ ] `tools/rmapi/rmapi/commands/recipes.py` — placeholder recipes group
- [ ] `tools/rmapi/tests/conftest.py` — shared `runner` fixture with `mix_stderr=False`
- [ ] `tools/rmapi/tests/test_config.py` — CLI-01 test stubs (env var read + missing var)
- [ ] `tools/rmapi/tests/test_errors.py` — CLI-02, CLI-03 test stubs (stdout/stderr routing + exit codes)
- [ ] `tools/rmapi/tests/test_fields.py` — CLI-04 test stubs (apply_fields projection)
- [ ] `tools/rmapi/tests/test_yes_guard.py` — CLI-05 test stubs (non-TTY guard + --yes bypass)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `rmapi --help` renders all subcommand groups in terminal | CLI-01 | TTY rendering; CliRunner captures output but --help display is terminal-specific | Run `pip install -e tools/rmapi/ && rmapi --help` in a real shell; verify recipes group listed |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
