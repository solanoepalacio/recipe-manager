# Pre-Implementation Progress

Tracks the status of each pre-implementation step. See `workflow.md` for how to manage this document and how sessions are structured.

---

## Steps

| # | Step | Artifact | Agent | Status |
|---|------|----------|-------|--------|
| 1 | Tech Stack & Data Model | `01_tech_stack_and_data_model.md` | `architecture-specialist` | Complete |
| 2 | Authentication & Authorization Design | `02_auth_design.md` | `architecture-specialist` | Complete |
| 3 | API Design (REST Contract) | `03_api_design.md` | `architecture-specialist` | Complete |
| 4 | User Flows | `04_user_flows.md` | — | Complete |
| 5 | UI Views & Wireframes (low-fi) | `05_ui_views.md` | `ui-specialist` | Complete |
| 6 | High-Fidelity Wireframes | `06_hifi_wireframes.md` | `ui-specialist` | Not Started |
| 7 | Project Structure & Conventions | `07_project_structure.md` | — | Not Started |

---

## Notes & Revisions

### 2026-03-11 — New "Hoy" landing view + regression

**Context:** During meal planner wireframing, we decided the app needs a "Hoy" (Today) landing view — the screen users see when they open the app. This requires a new wireframe plus updates to existing ones.

**Plan (in order):**
1. ~~Finish **meal planner** wireframe (accordion pattern — 7 collapsible days)~~ — Done
2. ~~Wireframe the **"Hoy"** view~~ — Done
3. ~~**Regression pass** on `02_app_shell.drawio`:~~ — Done
   - Added "Hoy" as first nav drawer item
   - App now lands on "Hoy" instead of "Recetas"
4. No other wireframes needed knock-on changes

**Resolved decisions:**
- Meal planner: all days collapsed by default, multiple can be open at once
- Hoy: simple text list of today's recipes, gamification stats placeholder

### 2026-03-11 — Foods: add-on-the-fly + admin scope changes

**Context:** Users need to create new foods inline while adding/editing recipe ingredients. Also, admin CRUD scope was refined.

**Plan:**
1. ~~Wireframe **admin views**~~ --- Done (11_admin_login.drawio + 12_admin_crud.drawio)
2. ~~**Regression on `04_recipe_creation.drawio`**~~ --- Done (added "+ Crear [search term]" row to ingredient picker)
3. No units CRUD --- managed in code

---

## References

- User stories: `mvp_plans/user_stories.md`
- Workflow: `mvp_plans/workflow.md`
