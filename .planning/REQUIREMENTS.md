# Requirements: Recipe Manager

**Defined:** 2026-03-16
**Core Value:** Households can organize, discover, and cook their recipes together — from a searchable library to a weekly meal plan to an in-kitchen cook mode.

## v1 Requirements

### Authentication

- [ ] **AUTH-01**: User can sign in with email or username + password
- [ ] **AUTH-02**: User session persists across browser refresh (persistent by default)
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

- [ ] **HH-01**: Users belong to a household; all recipes and meal plans are household-scoped and private to members
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
- [ ] **API-02**: Agent authenticates via Bearer token (API key tied to a user account)
- [ ] **API-03**: Interactive API documentation is available at `/api/docs` (Swagger UI)

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

*Populated during roadmap creation.*

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | — | Pending |
| AUTH-02 | — | Pending |
| AUTH-03 | — | Pending |
| AUTH-04 | — | Pending |
| AUTH-05 | — | Pending |
| RCP-01 | — | Pending |
| RCP-02 | — | Pending |
| RCP-03 | — | Pending |
| RCP-04 | — | Pending |
| RCP-05 | — | Pending |
| RCP-06 | — | Pending |
| RCP-07 | — | Pending |
| RCP-08 | — | Pending |
| ING-01 | — | Pending |
| ING-02 | — | Pending |
| ING-03 | — | Pending |
| INS-01 | — | Pending |
| INS-02 | — | Pending |
| IMG-01 | — | Pending |
| IMG-02 | — | Pending |
| SRCH-01 | — | Pending |
| SRCH-02 | — | Pending |
| SRCH-03 | — | Pending |
| SRCH-04 | — | Pending |
| SHR-01 | — | Pending |
| SHR-02 | — | Pending |
| PLAN-01 | — | Pending |
| PLAN-02 | — | Pending |
| PLAN-03 | — | Pending |
| PLAN-04 | — | Pending |
| PROF-01 | — | Pending |
| HH-01 | — | Pending |
| HH-02 | — | Pending |
| ADM-01 | — | Pending |
| ADM-02 | — | Pending |
| ADM-03 | — | Pending |
| ADM-04 | — | Pending |
| ADM-05 | — | Pending |
| ADM-06 | — | Pending |
| API-01 | — | Pending |
| API-02 | — | Pending |
| API-03 | — | Pending |
| UX-01 | — | Pending |
| UX-02 | — | Pending |
| UX-03 | — | Pending |

**Coverage:**
- v1 requirements: 46 total
- Mapped to phases: 0 (pending roadmap)
- Unmapped: 46 ⚠️

---
*Requirements defined: 2026-03-16*
*Last updated: 2026-03-16 after initial definition*
