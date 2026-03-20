# Pre-Implementation Workflow

This document defines the process we follow to move from user stories to a ready-to-implement codebase. It is the source of truth for how sessions are structured and how artifacts are managed.

---

## How Each Step Works

Every pre-implementation step follows the same loop:

0. **Specialist agent (if needed)** — Before discussion begins, decide whether the step warrants a specialist sub-agent (e.g., an architecture specialist, a UI specialist). If so, create the agent definition in `.claude/agents/` first, then use it to drive the rest of the step. Not every step needs one — use judgement.
1. **Discuss** — We have a conversation about the topic. Claude asks clarifying questions, surfaces trade-offs, and flags decisions that need to be made. The user provides context, preferences, and final calls.
2. **Decide** — Decisions are made explicitly. Where relevant, the *why* is captured alongside the *what*.
3. **Document** — Claude writes or updates the artifact for that step. The document is saved in `plans/01_App/` and linked from `plans/01_App/progress.md`.

No step is considered complete until its artifact is written and `progress.md` is updated.

---

## Session Continuity

At the start of a new session, Claude should:
1. Read `progress.md` to understand current status and which step is active.
2. Read the artifact(s) for the current and immediately preceding step(s) for context.
3. Resume from where the previous session left off — no re-summarizing of completed steps.

At the end of a session (or when switching steps), Claude should ensure:
- The current artifact reflects all decisions made in that session.
- `progress.md` status is up to date.

---

## Artifact Conventions

- One markdown file per step, stored in `plans/01_App/`.
- Filename follows the pattern: `{step-number}_{short_name}.md` (e.g., `01_tech_stack.md`).
- Each artifact includes a **Decisions** section that lists key choices and the reasoning behind them.
- Artifacts are living documents — they can and should be updated when a later step reveals a gap or conflict.

## Specialist Agents

When a step warrants a specialist, its agent definition is created in `.claude/agents/` before the discussion begins. Agent files:
- Are named descriptively (e.g., `architecture-specialist.md`, `ui-specialist.md`).
- Contain a focused system prompt scoped to that domain.
- Are scoped to this project (`.claude/agents/`, not `~/.claude/agents/`).
- Are noted in the `Agent` column of `progress.md`.

Not every step needs a specialist. Apply when the domain is narrow enough that a focused system prompt meaningfully improves the output.

---

## Updating `progress.md`

`progress.md` is the single source of truth for where we are. It must be updated:
- When a step moves from `Not Started` → `In Progress`
- When a step moves from `In Progress` → `Complete`
- When a new step is added or an existing step is split/merged
- When a completed step is reopened due to a revision

The status field for each step uses one of: `Not Started`, `In Progress`, `Complete`, `Revisiting`.

---

## General Principles

- **Don't over-design.** Each artifact should be good enough to build from, not perfect.
- **Decisions log matters.** Capture *why*, not just *what*.
- **Later steps can reopen earlier ones.** That's expected — flag it, update the artifact, note the change in `progress.md`.
- **Deployment, infrastructure, and CI are out of scope** for this pre-implementation phase.
- **Agent client is out of scope** for design — assume it will use the same REST endpoints as the UI via API key auth.
