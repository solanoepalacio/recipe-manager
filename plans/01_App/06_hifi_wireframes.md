# Step 6 — High-Fidelity Wireframes

## Overview

High-fidelity wireframes for all 12 views of the Robotina Cooks recipe manager. Each wireframe is a static HTML file in `plans/01_App/hifi/`, rendered as phone frames (375×812px) on a dark canvas. Files are numbered to match their low-fi counterparts in `plans/01_App/wireframes/`.

---

## Tooling

- **Format:** Static HTML files, previewed in a browser
- **Font:** Outfit (Google Fonts) — weights 300–700
- **Icons:** Lucide Icons via unpkg CDN
- **No frameworks or build tools** — pure HTML + CSS

---

## Design System

Established during Round 1 iteration on the app shell and recipe detail views.

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| Background | `#FAFAF7` | App background, cards |
| Text | `#2C2C2A` | Primary text, filled buttons |
| Secondary | `#8A8680` | Labels, secondary text, icons |
| Placeholder | `#C8C4BD` | Input placeholders, disabled states |
| Border | `#E0DCD5` | Input borders, dividers, outlines |
| Subtle BG | `#F4F2ED` | Section headers, search bar, stat boxes |
| Sand | `#E8E1D5` | Top bar (detail/shared), drawer header |
| Green | `#5EBD6A` | Accent — FAB, active states, links, green underline |
| Red | `#D94F4F` | Destructive — logout, delete actions |
| Canvas | `#22201C` | HTML body background (dark, for framing) |

### Typography

| Role | Size | Weight |
|------|------|--------|
| Page title (top bar) | 18px | 600 |
| Large heading | 22px | 600 |
| Recipe/section title | 20px | 600 |
| Body text | 15px | 400 |
| Buttons | 14–15px | 500 |
| Labels (uppercase) | 12px | 500 |
| Secondary/meta | 13px | 400 |
| Annotation | 11px | 400 |

### Component Patterns

**Top bar** — Two variants:
- Standard: `#FAFAF7` bg, hamburger left, title centered
- Detail/sand: `#E8E1D5` bg, back arrow left, title centered, overflow menu right

**Buttons:**
- Filled: `#2C2C2A` bg, `#FAFAF7` text, `border-radius: 20px` (actions) or `12px` (forms)
- Outline: transparent bg, `1.5px solid #E0DCD5`, `#2C2C2A` text
- Destructive: outline with `#D94F4F` text

**FAB:** `#5EBD6A` bg, `border-radius: 16px`, white `+`, bottom-right absolute

**Accordion:** Chevron-right (collapsed) / chevron-down (expanded), expanded row gets `#F4F2ED` background and bold title. Used in: meal planner days, admin household list, recipe detail sections.

**Bottom sheet:** Scrim overlay (`rgba(44,44,42,0.35)`), sheet with drag handle (36×4px, `#E0DCD5`), `border-radius: 20px 20px 20px 20px`. Used in: recipe name prompt, meal planner recipe picker.

**Full-screen modal:** White background, top bar with close/back action left and title centered. Used in: ingredient picker, crear alimento, admin modals.

**List items:** `padding: 12px 20px`, `border-bottom: 1px solid #F4F2ED`. Edit mode adds grip-vertical handle left + × delete right.

**Form inputs:** Underline style (`border-bottom: 1.5px solid #E0DCD5`) for single fields, bordered style (`border: 1.5px solid #E0DCD5`, `border-radius: 8–12px`) for textareas and selects. Labels are 12px uppercase `#8A8680`.

**Tab bar:** Equal-width tabs, active tab has `#2C2C2A` text + green underline (2px `#5EBD6A`), inactive in `#C8C4BD`.

**Active/selected state:** Green underline (`text-decoration` with `#5EBD6A`), not background highlight. Used in: drawer nav, tab bar, food picker selection.

---

## File Inventory

| File | Screens | Key Patterns |
|------|---------|-------------|
| `01_auth.html` | 1 — User login | Centered form, filled button |
| `02_app_shell.html` | 2 — Recipe list, drawer open | Top bar, search, recipe cards, FAB, drawer |
| `03_recipe_detail.html` | 3 — Initial, scrolled, edit mode | Collapsing hero, sticky header, accordion sections, edit toggles |
| `04_recipe_creation.html` | 8 — Bottom sheet, 4 tabs, ingredient picker, fotos ×2, crear alimento | Tab bar, bottom sheet, full-screen modal, form inputs, step blocks |
| `05_cook_mode.html` | 2 — All steps, mid-cook | Step list, checked/collapsed steps, "you are here" hint |
| `06_shared_recipe.html` | 2 — Initial (hero+banner), scrolled | Branding banner/footer, public header (no edit) |
| `07_meal_planner.html` | 3 — All collapsed, two expanded, recipe picker | Week nav, day accordion, bottom sheet picker |
| `08_hoy.html` | 2 — With meals, empty state | Greeting, recipe links, stat boxes, "Proximamente" |
| `09_household.html` | 1 — Member list | Read-only list, admin badge chip |
| `10_profile.html` | 1 — Minimal profile | Name + email, logout button only |
| `11_admin_login.html` | 2 — Admin login, setup wizard | Standalone forms, no navigation |
| `12_admin_crud.html` | 5 — Households, expanded, user edit, tokens, password reset | Admin accordion, full-screen modals, token display, destructive actions |

**Total: 12 files, 32 screens**

---

## Design Decisions

### Round 1 (iterated)

These views were built with careful iteration to establish the design system:

1. **App shell** — Defined visual identity. Hamburger (CSS lines, not icon), recipe cards (image + name + time), green FAB, sand drawer header with green underline for active nav item.

2. **Recipe detail** — Most complex view. Collapsing hero image, sticky recipe header that locks below top bar on scroll. Three states (initial, scrolled, edit) share the same layout — edit mode reveals drag handles and delete buttons in reserved space without layout shift. Sections use collapsible accordion with `#F4F2ED` headers.

3. **Recipe creation** — Defined all form patterns. Tab bar for section navigation, bottom sheet for initial name prompt, full-screen modal for ingredient picker with search + category grouping + inline food creation. Step editing uses numbered circles + optional title + textarea blocks.

4. **Meal planner** — Defined accordion for data lists. Week navigation with prev/next chevrons, 7 collapsible day rows with summary text, expanded state shows recipe entries with delete + add actions. Bottom sheet recipe picker with search and time display.

### Round 2 (batch)

Remaining views applied Round 1 patterns directly:

- **Auth / Admin login** — Centered standalone forms, no app chrome
- **Cook mode** — Step list with check-off pattern, collapsed done steps serve as progress indicator
- **Shared recipe** — Public variant of recipe detail (no edit, branding banner/footer)
- **Hoy** — Landing screen with greeting, recipe links, placeholder stats
- **Household / Profile** — Ultra-minimal read-only pages
- **Admin CRUD** — Reuses accordion (from planner) and full-screen modal (from creation) patterns

### Key Principles

- **Structure follows lo-fi wireframes exactly** — hi-fi adds visual treatment, not new layouts
- **Green is accent only** — FAB, active states, links. Never dominant.
- **Sand adds warmth** — Top bars, drawer header. Keeps the app feeling organic.
- **Minimal chrome** — No heavy shadows, no gradients, no busy borders. Content-first.
- **Consistent interaction patterns** — Bottom sheet for quick prompts, full-screen modal for complex flows, accordion for expandable lists.
