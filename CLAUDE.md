# CLAUDE.md — Recipe Manager

The **pre-implementation design phase is complete**. All design artifacts are finalized in `mvp_plans/`. The project is now in the **implementation phase**.

---

## What We're Building

A full-stack recipe manager application. The feature scope is defined in `mvp_plans/user_stories.md`.

Key constraints:
- The backend API has two clients: the **UI** (human users, session auth) and an **agent** (API key auth). Both use the same endpoints for all non-admin functionality.
- **Admin users are human-only** — the agent has no admin access.
- **Deployment, infrastructure, and CI are out of scope.**
- **Agent design and implementation are out of scope** — assume it will consume the same REST API as the UI.

---


### Key Rules

- **STRICT: All file operations (read, write, edit, create, delete) MUST stay within `/home/solanoe/code/recipe-manager`. Never access, reference, or modify any file outside this directory. This applies to the orchestrator and all spawned agents.**
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
| `01_tech_stack_and_data_model.md` | Stack decisions and ERD |
| `02_auth_design.md` | Auth & authorization design |
| `03_api_design.md` | REST contract |
| `04_user_flows.md` | Key user flows |
| `05_ui_views.md` | UI views and low-fi wireframes (draw.io) |
| `06_hifi_wireframes.md` | High-fidelity wireframes |
| `07_project_structure.md` | Folder structure and conventions |
