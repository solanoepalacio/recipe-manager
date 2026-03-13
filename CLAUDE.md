# CLAUDE.md — Recipe Manager

This project is in the **pre-implementation design phase**. No code has been written yet. The goal is to produce a set of design artifacts that fully specify the application before any implementation begins.

---

## Session Start Protocol

At the start of every session:
1. Read `mvp_plans/progress.md` to identify the current step and its status.
2. Read the artifact for the current step (if one exists) and the immediately preceding step.
3. Resume from where the previous session left off — do not re-summarize completed steps.

---

## What We're Building

A full-stack recipe manager application. The feature scope is defined in `mvp_plans/user_stories.md`.

Key constraints:
- The backend API has two clients: the **UI** (human users, session auth) and an **agent** (API key auth). Both use the same endpoints for all non-admin functionality.
- **Admin users are human-only** — the agent has no admin access.
- **Deployment, infrastructure, and CI are out of scope.**
- **Agent design and implementation are out of scope** — assume it will consume the same REST API as the UI.

---

## How We Work

The full workflow is documented in `mvp_plans/workflow.md`. The short version:

1. **Discuss** the topic for the current step.
2. **Decide** — the user makes final calls; capture the *why* alongside the *what*.
3. **Document** — write or update the artifact in `mvp_plans/`, then update `mvp_plans/progress.md`.

No step is complete until its artifact is written and `progress.md` is updated.

---

## Specialist Agents

Some steps use a specialist sub-agent to drive the discussion. Agent definitions live in `.claude/agents/`. The agent to use for each step (if any) is noted in the `Agent` column of `progress.md`. See `mvp_plans/workflow.md` for the full convention.

## Design Artifacts

All planning documents live in `mvp_plans/`. Filenames follow the pattern `{step-number}_{short_name}.md`.

| File | Purpose |
|------|---------|
| `user_stories.md` | Source of truth for MVP features |
| `workflow.md` | How sessions are structured and artifacts are managed |
| `progress.md` | Current status of every step — always keep this up to date |
| `01_tech_stack_and_data_model.md` | Stack decisions and ERD |
| `02_auth_design.md` | Auth & authorization design |
| `03_api_design.md` | REST contract |
| `04_user_flows.md` | Key user flows |
| `05_ui_views.md` | UI views and low-fi wireframes (draw.io) |
| `06_hifi_wireframes.md` | High-fidelity wireframes |
| `07_project_structure.md` | Folder structure and conventions |
