---
phase: 19
slug: skill-files-index
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-20
---

# Phase 19 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | none — documentation phase only |
| **Config file** | none |
| **Quick run command** | `grep -r "last-verified" skills/` |
| **Full suite command** | `grep -r "last-verified" skills/ && wc -w skills/index.md` |
| **Estimated runtime** | ~1 second |

---

## Sampling Rate

- **After every task commit:** Run `grep "last-verified" skills/<file>.md`
- **After every plan wave:** Run `grep -r "last-verified" skills/` — all 4 files must match
- **Before `/gsd:verify-work`:** Human spot-checks 3 commands per skill file against `rmapi --help`
- **Max feedback latency:** ~5 seconds (file existence checks only)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 19-01-01 | 01 | 1 | SKL-02 | manual | `grep "last-verified" skills/recipe-discovery.md` | ❌ W0 | ⬜ pending |
| 19-01-02 | 01 | 1 | SKL-04 | manual | `grep "last-verified" skills/recipe-management.md` | ❌ W0 | ⬜ pending |
| 19-01-03 | 01 | 1 | SKL-03 | manual | `grep "last-verified" skills/meal-plan.md` | ❌ W0 | ⬜ pending |
| 19-01-04 | 01 | 1 | SKL-01, SKL-05 | manual | `grep "last-verified" skills/index.md && wc -w skills/index.md` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `skills/` directory at repo root — created in first task

*Existing pytest infrastructure in `tools/rmapi/tests/` does not apply — no code deliverables in this phase.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `skills/index.md` under 500 tokens | SKL-01 | Token count is model-dependent; word count is a proxy | Run `wc -w skills/index.md` — must be under ~400 words |
| `recipe-discovery.md` command signatures match installed binary | SKL-02 | Requires human to run `rmapi --help` and compare | Run `rmapi recipes list --help` and verify flags in skill file match |
| `meal-plan.md` date format and meal types are correct | SKL-03 | Semantic correctness; cannot be grep-verified | Verify `YYYY-MM-DD` format and `breakfast\|lunch\|dinner\|snack\|dessert` values appear in file |
| `recipe-management.md` ID-threading chain is correct | SKL-04 | End-to-end correctness requires human trace-through | Read the creation chain in the file; verify each step extracts `.id` from prior output |
| All `rmapi` command signatures in skill files match installed binary | SKL-05 | Requires running `rmapi <cmd> --help` for each command | Spot-check 3 random commands per file against `rmapi --help` |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
