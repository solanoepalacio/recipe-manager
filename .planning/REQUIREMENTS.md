# Requirements: Recipe Manager

**Defined:** 2026-03-16
**Core Value:** Households can organize, discover, and cook their recipes together — from a searchable library to a weekly meal plan to an in-kitchen cook mode.

## v1 Requirements

### Authentication

- [x] **AUTH-01**: User can sign in with email or username + password
- [x] **AUTH-02**: User session persists across browser refresh (persistent by default)
- [ ] **AUTH-03**: User can sign out
- [ ] **AUTH-04**: Admin can complete first-time setup wizard (creates single Admin record; wizard inaccessible after)
- [ ] **AUTH-05**: Admin can generate a one-time password reset URL for any user (no email — shared out-of-band)

### Recipes

- [ ] **RCP-01**: User can create a new recipe from scratch
- [ ] **RCP-02**: User can duplicate an existing recipe (creates independent copy)
- [ ] **RCP-03**: User can set recipe name with auto-generated URL slug
- [ ] **RCP-04**: User can set recipe description, servings (qty + unit), prep/cook/total/perform times, and source URL
- [ ] **RCP-05**: User can lock a recipe to prevent editing
- [ ] **RCP-06**: User can toggle landscape view for a recipe
- [ ] **RCP-07**: User can view full recipe detail (ingredients, instructions, images)
- [ ] **RCP-08**: User can enter cook mode (full-screen, large text, step-by-step navigation)

### Ingredients

- [ ] **ING-01**: User can add ingredients to a recipe with quantity, unit, food name, and optional note
- [ ] **ING-02**: User can organize ingredients into titled sections
- [ ] **ING-03**: User can reorder ingredients within a section

### Instructions

- [ ] **INS-01**: User can add step-by-step instructions with optional step title
- [ ] **INS-02**: User can reorder instruction steps via drag-and-drop

### Images

- [ ] **IMG-01**: User can upload an image for a recipe
- [ ] **IMG-02**: User can delete a recipe image

### Search & Discovery

- [ ] **SRCH-01**: User can search recipes by name with fuzzy matching
- [ ] **SRCH-02**: User can filter recipes by food/ingredient
- [ ] **SRCH-03**: User can sort recipes by name, date created, date updated, or random (asc/desc)
- [ ] **SRCH-04**: User can paginate recipe list with configurable page size

### Sharing

- [ ] **SHR-01**: User can generate a shareable public link for a recipe
- [ ] **SHR-02**: Anyone with the share link can view a recipe without logging in

### Meal Planning

- [ ] **PLAN-01**: User can view a weekly meal planner (1 or 4 weeks)
- [ ] **PLAN-02**: User can assign a recipe to a date and meal type (breakfast, lunch, dinner, snack, dessert)
- [ ] **PLAN-03**: User can drag-and-drop meal plan entries to reorganize
- [ ] **PLAN-04**: User can edit or delete individual meal plan entries

### Profile

- [ ] **PROF-01**: User can view and edit their profile (name, email, username)

### Households

- [x] **HH-01**: Users belong to a household; all recipes and meal plans are household-scoped and private to members
- [ ] **HH-02**: All household members share the same meal plan

### Administration

- [ ] **ADM-01**: Admin can view, create, edit, and delete user accounts
- [ ] **ADM-02**: Admin can view, create, edit, and delete households
- [ ] **ADM-03**: Admin can manage the foods database (view, create, edit, delete)
- [ ] **ADM-04**: Admin can manage the units database (view, create, edit, delete)
- [ ] **ADM-05**: Admin can create long-lived API tokens tied to a user account
- [ ] **ADM-06**: Admin can view and delete existing API tokens

### API & Developer Access

- [ ] **API-01**: Full non-admin functionality is accessible via REST API (same endpoints as UI)
- [x] **API-02**: Agent authenticates via Bearer token (API key tied to a user account)
- [x] **API-03**: Interactive API documentation is available at `/api/docs` (Swagger UI)

### Mobile & UX

- [ ] **UX-01**: Application has a responsive layout (phone, tablet, desktop)
- [ ] **UX-02**: Loading indicators are shown while data is being fetched
- [ ] **UX-03**: Toast/notification system for success, error, and info states

## v2 Requirements

### Notifications

- **NOTF-01**: User receives in-app notifications for household activity
- **NOTF-02**: Email notifications (requires email infrastructure)

### Social / Collaboration

- **SOCL-01**: Users can leave comments or notes on recipes
- **SOCL-02**: Recipe rating system

### Import / Export

- **IMP-01**: Import recipe from URL (scraping)
- **IMP-02**: Export recipes to PDF

## Out of Scope

| Feature | Reason |
|---------|--------|
| Email sending | No email infrastructure in MVP; password reset URLs shared out-of-band by admin |
| Agent implementation | Agent consumes the same REST API as UI — its design/impl is out of scope |
| Deployment / CI/CD | Infrastructure is out of scope for this project |
| OAuth / social login | Email + password sufficient for v1 |
| Mobile native app | Web-only (responsive) |
| Nutritional information | Not part of core household recipe management value |
| Real-time updates | No websockets; page refresh / TanStack Query refetch covers use cases |
| Rich text descriptions | Plain text for MVP (simplifies data model) |

## Traceability

*Updated: 2026-03-16 — roadmap created (12 phases)*

| Requirement | Phase | Status |
|-------------|-------|--------|
| API-03 | Phase 1: Monorepo + Shared Types | Complete |
| HH-01 | Phase 2: Database Schema + Prisma | Complete |
| AUTH-01 | Phase 3: Backend Auth | Complete |
| AUTH-02 | Phase 3: Backend Auth | Complete |
| AUTH-03 | Phase 3: Backend Auth | Pending |
| AUTH-04 | Phase 3: Backend Auth | Pending |
| AUTH-05 | Phase 3: Backend Auth | Pending |
| API-02 | Phase 3: Backend Auth | Complete |
| API-01 | Phase 4: Backend Recipe CRUD | Pending |
| UX-01 | Phase 7: Frontend Setup + App Shell + Auth Flows | Pending |
| UX-02 | Phase 7: Frontend Setup + App Shell + Auth Flows | Pending |
| UX-03 | Phase 7: Frontend Setup + App Shell + Auth Flows | Pending |
| RCP-07 | Phase 8: Frontend Recipe List + Detail + Cook Mode | Pending |
| RCP-08 | Phase 8: Frontend Recipe List + Detail + Cook Mode | Pending |
| SRCH-01 | Phase 8: Frontend Recipe List + Detail + Cook Mode | Pending |
| SRCH-02 | Phase 8: Frontend Recipe List + Detail + Cook Mode | Pending |
| SRCH-03 | Phase 8: Frontend Recipe List + Detail + Cook Mode | Pending |
| SRCH-04 | Phase 8: Frontend Recipe List + Detail + Cook Mode | Pending |
| RCP-01 | Phase 9: Frontend Recipe Creation + Editing | Pending |
| RCP-02 | Phase 9: Frontend Recipe Creation + Editing | Pending |
| RCP-03 | Phase 9: Frontend Recipe Creation + Editing | Pending |
| RCP-04 | Phase 9: Frontend Recipe Creation + Editing | Pending |
| RCP-05 | Phase 9: Frontend Recipe Creation + Editing | Pending |
| RCP-06 | Phase 9: Frontend Recipe Creation + Editing | Pending |
| ING-01 | Phase 9: Frontend Recipe Creation + Editing | Pending |
| ING-02 | Phase 9: Frontend Recipe Creation + Editing | Pending |
| ING-03 | Phase 9: Frontend Recipe Creation + Editing | Pending |
| INS-01 | Phase 9: Frontend Recipe Creation + Editing | Pending |
| INS-02 | Phase 9: Frontend Recipe Creation + Editing | Pending |
| IMG-01 | Phase 9: Frontend Recipe Creation + Editing | Pending |
| IMG-02 | Phase 9: Frontend Recipe Creation + Editing | Pending |
| PLAN-01 | Phase 10: Frontend Meal Planner | Pending |
| PLAN-02 | Phase 10: Frontend Meal Planner | Pending |
| PLAN-03 | Phase 10: Frontend Meal Planner | Pending |
| PLAN-04 | Phase 10: Frontend Meal Planner | Pending |
| HH-02 | Phase 10: Frontend Meal Planner | Pending |
| PROF-01 | Phase 11: Frontend Profile + Household + Shared Recipe | Pending |
| SHR-01 | Phase 11: Frontend Profile + Household + Shared Recipe | Pending |
| SHR-02 | Phase 11: Frontend Profile + Household + Shared Recipe | Pending |
| ADM-01 | Phase 12: Frontend Admin Panel | Pending |
| ADM-02 | Phase 12: Frontend Admin Panel | Pending |
| ADM-03 | Phase 12: Frontend Admin Panel | Pending |
| ADM-04 | Phase 12: Frontend Admin Panel | Pending |
| ADM-05 | Phase 12: Frontend Admin Panel | Pending |
| ADM-06 | Phase 12: Frontend Admin Panel | Pending |

**Coverage:**
- v1 requirements: 46 total
- Mapped to phases: 46 ✓
- Unmapped: 0 ✓

**Notes on phase assignments:**
- Requirements are assigned to the phase where they first become fully verifiable by a user or developer. Backend phases (1-6) verify against the live API/Swagger. Frontend phases (7-12) verify through the browser.
- Phases 5 and 6 are backend infrastructure phases with no direct requirement assignments; they deliver the API capabilities consumed by frontend phases 8, 10, 11, and 12.

---
*Requirements defined: 2026-03-16*
*Last updated: 2026-03-16 after roadmap creation*
