# CLAUDE.md — Recipe Manager

The **pre-implementation design phase is complete**. All design artifacts are finalized in `mvp_plans/`. The project is now in the **implementation phase**.

---

## Session Start Protocol

At the start of every session:
1. Read `mvp_plans/implementation_progress.md` to identify the current milestone and task.
2. Read `mvp_plans/implementation_workflow.md` for the orchestration process.
3. Read relevant design artifacts for the current task.
4. Resume from where the previous session left off — do not re-summarize completed work.

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

The implementation follows the orchestration workflow in `mvp_plans/implementation_workflow.md`. The short version:

1. **Pick** the next task from `implementation_progress.md`
2. **Spawn a task agent** in an isolated worktree to implement it (TDD: tests first, then implementation)
3. **Spawn an architect agent** to review the branch
4. **Merge** to `main` only when tests pass and review is approved
5. **Update** `implementation_progress.md`

### Key Rules

- All code, files, directories, and URLs are in **English**. Only UI-facing strings are in Spanish.
- `packages/shared` is the **source of truth** for the API boundary. Backend services return shared types. Frontend consumes shared types. The compiler enforces this.
- Every DTO has `class-validator` decorators AND `@ApiProperty()` for OpenAPI docs.
- Household-scoped data is filtered by `householdId` at the **service layer**.
- No branch is merged without passing tests.

---

## Agents

Agent definitions live in `.claude/agents/`.

### Design phase (complete)
- `architecture-specialist.md` — used for steps 1–3
- `ui-specialist.md` — used for steps 5–6

### Implementation phase
- See `implementation_workflow.md` for task agent and architect agent prompt templates

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
| `implementation_progress.md` | Implementation milestones, tasks, and status |
| `implementation_workflow.md` | Orchestration process for each task (TDD + review) |
