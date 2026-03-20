# Step 5 --- UI Views & Wireframes (Low-Fi)

All wireframes are draw.io XML files stored in `plans/01_App/wireframes/`. Each file contains one or more mobile-first phone frames (390x780px). The primary design target is mobile; tablet and desktop adaptations are noted where significant.

**Language:** Spanish throughout all UI text.
**Style:** Grey wireframe (no color), direct Unicode characters.

---

## View Inventory

### Auth & Setup

| # | View | Wireframe File | Screens |
|---|------|----------------|---------|
| 1 | User Login | `01_auth.drawio` | 1 |

### Main App

| # | View | Wireframe File | Screens |
|---|------|----------------|---------|
| 2 | App Shell (nav drawer) | `02_app_shell.drawio` | 2 |
| 3 | Recipe Detail | `03_recipe_detail.drawio` | 3 |
| 4 | Recipe Creation | `04_recipe_creation.drawio` | 7 |
| 5 | Cook Mode | `05_cook_mode.drawio` | 2 |
| 6 | Shared Recipe (public) | `06_shared_recipe.drawio` | 2 |
| 7 | Meal Planner | `07_meal_planner.drawio` | 3 |
| 8 | Hoy (Today) | `08_hoy.drawio` | 2 |
| 9 | Household | `09_household.drawio` | 1 |
| 10 | Profile | `10_profile.drawio` | 1 |

### Admin

| # | View | Wireframe File | Screens |
|---|------|----------------|---------|
| 11 | Admin Login + Setup Wizard | `11_admin_login.drawio` | 2 |
| 12 | Admin CRUD | `12_admin_crud.drawio` | 5 |

**Total: 12 wireframe files, 31 screens.**

---

## View Details

### 1. User Login (`01_auth.drawio`)

**Login screen**
- Centered form: email/username + password fields, "Iniciar sesion" button.
- On auth failure: inline error message below the form.
- Redirect target after login: `/hoy`.
- This is the regular user login only. The setup wizard belongs to the admin flow (see view 11).

---

### 2. App Shell (`02_app_shell.drawio`)

**Screen 1 --- Recipe list (accessed via Recetas in drawer)**
- Top bar: hamburger (left), "Recetas" (center).
- Search bar below top bar.
- Sort/filter chips row.
- Recipe cards: image thumbnail (left) + title + total time. Vertically stacked list.
- FAB (bottom-right): opens name prompt bottom sheet (see Recipe Creation).

**Screen 2 --- Nav drawer open**
- Slides from left over content.
- Drawer header: "Hola, [Nombre]" (tappable, navigates to Profile) + "Familia [Apellido] -->" (tappable, navigates to Household). No avatar.
- Nav items (top to bottom): **Hoy** (active/highlighted by default) -- **Recetas** -- **Planificador** -- (separator) -- **Salir**.
- "Hoy" is the app landing screen.

**Tablet/desktop adaptation:** Drawer can be permanently visible as a sidebar on wide screens. Recipe list becomes a multi-column grid.

---

### 3. Recipe Detail (`03_recipe_detail.drawio`)

Three states on one canvas:

**State A --- Initial (hero visible)**
- Top bar: back arrow (left), faint title (center), overflow menu (right).
- Hero image fills width below top bar.
- Sticky recipe header below image:
  - Row 1: recipe name (large, bold) + "Compartir" text link (right).
  - Row 2: prep, cooking, total times (small, grey).
  - Row 3: "Editar" outline button + "Cocinar" filled button (rightmost).
- Content below: ingredients list (grouped by section), instruction steps.

**State B --- Scrolled (image collapsed)**
- Hero image scrolls away. Sticky header locks directly below top bar.
- Otherwise identical to State A.

**State C --- Edit mode**
- Triggered by tapping "Editar". Button changes to "Listo" (checkmark).
- Drag handles appear left of each ingredient/step row. Delete buttons appear right.
- "+" add buttons (always present but subtle in view mode) become more prominent.
- Recipe name gains an underline (editable in place).
- No layout shift --- affordances appear in reserved space.

**Tablet/desktop adaptation:** Two-column layout: image + metadata left, ingredients + steps right.

---

### 4. Recipe Creation (`04_recipe_creation.drawio`)

Seven screens:

**Screen 0 --- Name prompt (bottom sheet)**
- Triggered by FAB on recipe list.
- Bottom sheet slides up over dimmed recipe list.
- Drag handle, title: "Como se llama la receta?"
- Single text input (auto-focused).
- "Cancelar" (left) + "Crear" (right). "Crear" disabled until text is entered.
- On confirm: `POST /api/recipes` with name only, then redirect to creation view.

**Screen 1 --- Ingredientes tab (default landing)**
- Tab bar: **Ingredientes** (active) -- Instrucciones -- Basico -- Fotos.
- Top bar: back arrow + "Nueva receta".
- Existing ingredient rows: drag handle (left), food name + quantity/unit, delete button (right).
- "+ Anadir ingrediente" button opens full-screen ingredient picker (Screen 2).
- "Guardar" pill button fixed at bottom-right (visible on all tabs).

**Screen 2 --- Ingredient picker (full-screen modal)**
- Modal top bar: "Cancelar" (left), "Seleccionar alimento" (center).
- Search bar at top.
- **"+ Crear [search term]" row** (dashed border): appears when the search text does not exactly match an existing food. Tapping creates the food inline and selects it immediately.
- Food results list: each row shows food name (bold) + category subtitle. Selected food is highlighted with a checkmark.
- After food is selected: quantity input + unit dropdown + optional note field appear below the list.
- "Anadir ingrediente" confirm button at bottom.

**Screen 3 --- Instrucciones tab**
- Numbered steps: filled circle with number + optional title field + textarea.
- Drag handle (left), delete button (top-right).
- "+ Anadir paso" button at bottom.

**Screen 4 --- Basico tab**
- Nombre field: pre-filled with the name entered in Screen 0 (dark text, editable).
- Descripcion: textarea.
- Porciones: number input + text unit.
- Prep and Coccion: time inputs.

**Screen 5 --- Fotos tab**
- Two states shown: empty (dashed upload zone) and with image (preview + "Eliminar foto" link).

**Screen 6 --- Create food modal (full-screen)**
- Triggered by tapping "+ Crear [search term]" in the ingredient picker (Screen 2).
- Modal top bar: "Cancelar" (left), "Crear alimento" (center).
- Single field: "Nombre del alimento", pre-filled with the search term. Editable.
- "Crear" button.
- After creation: `POST /api/foods`, returns to ingredient picker with the new food auto-selected.
- "Cancelar" returns to the picker without creating anything.

**Implementation note:** After initial creation, further editing uses the recipe detail view in edit mode (State C). No separate "edit recipe" flow exists.

---

### 5. Cook Mode (`05_cook_mode.drawio`)

Full-screen view optimized for kitchen use. Light background. Client-side only (no API calls).

**State A --- All steps expanded (entry state)**
- Top bar: "x Salir" (left), recipe name (center).
- Each step: filled dark circle with number + large instruction text (16px+).
- Full scrollable list. Steps fade at bottom to suggest scrollability.
- No ingredients, no prev/next navigation, no progress indicator.

**State B --- Mid-cook (steps 1-3 checked, 4-6 pending)**
- Checked steps: grey circle with white checkmark, instruction text truncated and greyed out, row collapsed to ~52px.
- Pending steps: same expanded style as State A.
- First pending step has slightly thicker border ("you are here" hint).
- Thin divider separates done from pending sections.
- Tapping a done step re-expands it (toggle behavior).

**Tablet/desktop adaptation:** Content centered with a max-width constraint. Font size can increase further on larger screens.

---

### 6. Shared Recipe --- Public (`06_shared_recipe.drawio`)

No login required. Accessible via share token URL.

**State A --- Initial (hero + branding visible)**
- Branding banner at top (scrolls away): "Robotina Cooks" (left), "Iniciar sesion" (right).
- Hero image below banner.
- Recipe name (large, bold).
- Description row below name.
- Times row: prep, cooking, total.
- "Cocinar" filled button (no "Editar").
- Ingredients + steps in read-only layout.

**State B --- Scrolled (top bar locked)**
- Top bar: recipe name centered only. No back arrow, no hamburger, no overflow.
- Sticky header: description + times + "Cocinar" only. Name not repeated (top bar shows it).
- Branding footer at end of content (not sticky): "Robotina Cooks" (left), "Mas" (right).
- Annotated: logged-in variant adds "Guardar en mis recetas" alongside "Mas".

---

### 7. Meal Planner (`07_meal_planner.drawio`)

**Screen 1 --- All days collapsed (default)**
- Top bar: hamburger (left), "Planificador" (center).
- Week navigation row: `< Semana del 10 - 16 mar >` with prev/next chevrons.
- 7 day rows (vertical accordion): collapse arrow + day name + date + summary (recipe names comma-separated, or "Sin recetas planificadas" in italic grey).
- Multiple days can be open simultaneously.

**Screen 2 --- Lunes and Miercoles expanded**
- Expanded day: darker background header, down arrow, recipe entries as text rows (name left, delete right), "+ Anadir receta" at bottom.
- Empty expanded day (Miercoles): "Sin recetas planificadas" italic + "+" add button.
- Delete removes recipe from day without confirmation.

**Screen 3 --- Recipe picker (bottom sheet)**
- Scrim over planner, bottom sheet slides up.
- Drag handle, title: "Anadir receta a [day name + date]".
- Search bar.
- Recipe list: name + total time per row.
- Tapping a recipe assigns it and closes the sheet.

**Tablet/desktop adaptation:** Could switch to a 7-column grid (one column per day) instead of the accordion pattern.

---

### 8. Hoy --- Today (`08_hoy.drawio`)

Landing screen of the app.

**State A --- With meals planned**
- Top bar: hamburger (left), "Hoy" (center).
- Greeting: "Hola, Maria" (large, bold).
- "Recetas de hoy" section: simple text list of recipe names, each tappable (navigates to recipe detail) with a subtle right chevron. No cards, no images, no times.
- "Tu actividad" section: two stat boxes side by side (e.g., "12 recetas cocinadas este mes", "47 recetas guardadas") + full-width streak box. Annotated "Proximamente" --- placeholder for future gamification.
- No add button, no FAB.

**State B --- No meals planned (empty state)**
- Same greeting and top bar.
- "Recetas de hoy" section: "No hay recetas para hoy" in light grey italic. No CTA --- user navigates to Planificador via drawer.
- Stats section still visible with zero/low values.

---

### 9. Household (`09_household.drawio`)

Single screen, read-only.

- Top bar: back arrow (left), "Hogar" (center).
- Large heading: household name (e.g., "Familia Garcia").
- "Miembros" section header + divider.
- Member list: first names only (household name provides last name context).
  - Current user: "(tu)" inline right of name + "Admin" badge (grey chip, far right).
  - Other members: first name only.
- No invite, remove, leave, or edit actions for MVP.
- Accessed via "Familia [Apellido] -->" in the nav drawer header.

---

### 10. Profile (`10_profile.drawio`)

Single screen, minimal placeholder.

- Top bar: back arrow (left), "Perfil" (center).
- User's first name as large heading.
- Email below in grey.
- "Cerrar sesion" button: full-width, outline style, red text. Only action on the page.
- No profile editing, no password change for MVP.
- Accessed via tapping "Hola, [Nombre]" in the nav drawer header.

---

### 11. Admin Login + Setup Wizard (`11_admin_login.drawio`)

Two screens. Separate from the user login (different entity, different endpoint).

**Screen 1 --- Admin login**
- "Panel de administracion" heading (large, bold).
- "Robotina Cooks" subtitle in grey.
- Email field + password field.
- "Iniciar sesion" full-width dark button.
- Appears when an Admin account already exists.

**Screen 2 --- Setup wizard (first-time only)**
- "Configuracion inicial" heading, "Crea la cuenta de administrador" subtitle.
- Fields: email, password, confirm password.
- "Crear cuenta" button.
- Appears only on fresh install (`GET /api/setup` returns `required: true`).
- After creation: redirects to admin login.
- Only accessible once --- when no Admin record exists (enforced by `SetupGuard`).

---

### 12. Admin CRUD (`12_admin_crud.drawio`)

Five screens covering all admin management actions. The admin panel has its own layout (no nav drawer, no bottom nav).

**Screen 1 --- Households collapsed (default)**
- Top bar: "Administracion" (left, bold), "Cerrar sesion" (right, red).
- Collapsible accordion of households: collapse arrow + household name + member count.

**Screen 2 --- Household expanded (Familia Garcia)**
- Expanded household shows member list.
- Each member row: name (left), three icon buttons (right): info, API tokens, reset password.
- Collapsed households remain visible below.

**Screen 3 --- Edit user modal (full-page)**
- Top bar: "Cerrar" (left), "Editar usuario" (center).
- Editable fields: Nombre, Correo electronico, Fecha de nacimiento (date input, nullable), Genero (dropdown: Masculino / Femenino / Otro, nullable), Hogar (dropdown).
- "Guardar" button.
- "Eliminar usuario" destructive link at bottom.

**Screen 4 --- API tokens modal (full-page)**
- Top bar: "Volver" (left), "Tokens API" (center).
- Token list: token name + created date, delete button per row.
- "Crear token" button.
- One-time token display: monospace token string + "Copiar" button.
- Token is shown only once after creation.

**Screen 5 --- Password reset modal (full-page)**
- Top bar: "Volver" (left), "Restablecer contrasena" (center).
- User name displayed for context.
- "Generar enlace" button.
- URL display: monospace reset link + "Copiar" button.
- Link is one-time use and expires.

**Admin design note:** Foods and Units admin views are not wireframed separately. They follow the same accordion + modal CRUD pattern demonstrated in the household/user screens.

---

## Navigation Structure

```
App boot (user)
  |
  +-- No session? --> User Login
  |
  +-- Has session --> Hoy (landing)

Admin boot
  |
  +-- GET /api/setup required? --> Setup Wizard --> Admin Login
  |
  +-- No admin session? --> Admin Login
  |
  +-- Has admin session --> Admin CRUD
       |
       +-- Nav drawer:
       |     Hoy (landing)
       |     Recetas --> Recipe List --> Recipe Detail --> Cook Mode
       |     Planificador --> Meal Planner
       |     ---
       |     Salir
       |
       +-- Drawer header:
             "Hola, [Name]" --> Profile
             "Familia [X] -->" --> Household

Admin panel (separate section):
  Admin Login --> Admin CRUD (households, users, tokens, passwords)

Public (no auth):
  /shared/:token --> Shared Recipe View
```

---

## Key Interaction Patterns

| Pattern | Used In | Notes |
|---------|---------|-------|
| Bottom sheet | Recipe name prompt, recipe picker (meal planner) | Slides up from bottom, scrim behind, drag handle |
| Full-screen modal | Ingredient picker, admin modals (info, tokens, reset) | Overlays entire screen, "Volver"/"Cancelar" to dismiss |
| Collapsible accordion | Meal planner (days), admin CRUD (households) | Multiple items can be open simultaneously |
| Collapsing header | Recipe detail, shared recipe | Hero image scrolls away, sticky header locks below top bar |
| Inline edit toggle | Recipe detail edit mode | "Editar" / "Listo" toggle, drag handles + delete buttons appear in reserved space |
| Checklist with collapse | Cook mode | Tapping a step checks it and collapses the row |

---

## Empty States

| View | Empty State |
|------|-------------|
| Hoy | "No hay recetas para hoy" (grey italic). Stats section with zero values. |
| Recipe list | Not wireframed --- standard "No hay recetas" message + FAB remains visible. |
| Meal planner (day) | "Sin recetas planificadas" (grey italic) + "+" add button. |
| Fotos tab | Dashed upload zone placeholder. |
| Admin tokens list | Empty list + "Crear token" button. |

---

## Responsive Breakpoints (Implementation Guidance)

| Breakpoint | Layout Changes |
|------------|----------------|
| Mobile (< 768px) | Primary design target. All wireframes reflect this layout. |
| Tablet (768px -- 1024px) | Nav drawer can be semi-persistent. Recipe list becomes 2-column grid. Recipe detail may show two-column layout (image+meta left, content right). |
| Desktop (> 1024px) | Nav drawer permanently visible as sidebar. Recipe list becomes 3-column grid. Meal planner could switch from accordion to 7-column grid. Content areas gain max-width constraints. |
