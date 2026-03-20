---
phase: 14
slug: skill-bundle-write-operations-meal-plan
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
| **Framework** | Manual review — Phase 14 produces only Markdown skill files |
| **Config file** | none |
| **Quick run command** | `ls .claude/skills/` |
| **Full suite command** | `ls .claude/skills/ && grep -l "## Endpoints" .claude/skills/*.md` |
| **Estimated runtime** | ~2 seconds |

---

## Sampling Rate

- **After every task commit:** Run `ls .claude/skills/`
- **After every plan wave:** Run full suite command
- **Before `/gsd:verify-work`:** All skill files present and contain required sections
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 14-01-01 | 01 | 1 | SKILL-05 | file-check | `test -f .claude/skills/recipes_create.md && echo OK` | ❌ W0 | ⬜ pending |
| 14-02-01 | 02 | 1 | SKILL-06 | file-check | `test -f .claude/skills/recipes_edit.md && echo OK` | ❌ W0 | ⬜ pending |
| 14-03-01 | 03 | 1 | SKILL-07 | file-check | `test -f .claude/skills/recipes_image.md && echo OK` | ❌ W0 | ⬜ pending |
| 14-04-01 | 04 | 1 | SKILL-08 | file-check | `test -f .claude/skills/meal_plan.md && echo OK` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `.claude/skills/` directory exists
- [ ] `recipes_create.md` — created in Wave 1 (SKILL-05)
- [ ] `recipes_edit.md` — created in Wave 1 (SKILL-06)
- [ ] `recipes_image.md` — created in Wave 1 (SKILL-07)
- [ ] `meal_plan.md` — created in Wave 1 (SKILL-08)

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| recipes_create.md sequence correctness | SKILL-05 | Content quality — must be read by human/agent to verify completeness | Read file; confirm: lists required pre-steps (get food IDs, unit IDs), POST /api/recipes body, POST /api/recipes/:id/sections/:id/ingredients body, POST /api/recipes/:id/sections/:id/steps body |
| recipes_edit.md completeness | SKILL-06 | Content quality | Read file; confirm: covers PATCH/DELETE for recipe metadata, section, ingredient, step; references recipes_get.md for ID sourcing |
| recipes_image.md multipart docs | SKILL-07 | Content quality | Read file; confirm: documents multipart/form-data Content-Type, POST /api/recipes/:id/image body, DELETE /api/recipes/:id/image |
| meal_plan.md response shape | SKILL-08 | Content quality | Read file; confirm: documents flat `{ entries: [...] }` shape (not paginated), mealType enum values, date range params |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
