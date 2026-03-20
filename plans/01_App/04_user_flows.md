# Step 4 — User Flows

Key multi-step and branching flows. Straightforward CRUD (edit profile, delete recipe, etc.) is omitted — those are single-screen interactions fully covered by the API contract.

---

## 1. First-Time Setup

Runs once on fresh install. The UI checks `/api/setup` on boot and redirects accordingly.

```mermaid
flowchart TD
    A[App loads] --> B{GET /api/setup\nrequired?}
    B -- true --> C[Redirect to /setup wizard]
    B -- false --> D[Redirect to /login]

    C --> E[Admin fills name, email, password]
    E --> F[POST /api/setup]
    F --> G{Success?}
    G -- yes --> H[Redirect to /login]
    G -- no --> E
```

---

## 2. User Login

```mermaid
flowchart TD
    A[User visits app] --> B{Has session\ncookie?}
    B -- yes --> C[Load app normally]
    B -- no --> D[Redirect to /login]

    D --> E[Enter email/username + password]
    E --> F[POST /api/auth/login]
    F --> G{Success?}
    G -- no --> H[Show error] --> E
    G -- yes --> I[Session cookie set]
    I --> C
```

---

## 3. Creating a Recipe

Recipe creation is incremental — the record is created first, then content is added in subsequent steps.

```mermaid
flowchart TD
    A[User clicks New Recipe] --> B[POST /api/recipes\nname only required]
    B --> C[Redirect to recipe editor]

    C --> D[Edit basic info\nname, description, times, servings, source URL]
    D --> E[PATCH /api/recipes/:id]

    C --> F[Add ingredient section\nPOST /api/recipes/:id/sections]
    F --> G[Add ingredients to section\nPOST .../ingredients]
    G --> H{More sections?}
    H -- yes --> F
    H -- no --> I[Done with ingredients]

    C --> J[Add instruction steps\nPOST /api/recipes/:id/steps]
    J --> K[Reorder steps via drag-and-drop\nPUT /api/recipes/:id/steps/reorder]

    C --> L[Upload image\nPOST /api/recipes/:id/images]

    D & I & K & L --> M[Recipe complete]
```

---

## 4. Cook Mode

Entered from the recipe detail page. Client-side only — no API calls during cook mode.

```mermaid
flowchart TD
    A[User on recipe detail page] --> B[Click Enter Cook Mode]
    B --> C[Full-screen view opens\nLarge text, step 1 of N]

    C --> D{Navigate}
    D -- Next --> E[Show next step]
    D -- Prev --> F[Show previous step]
    E & F --> D

    D -- Exit --> G[Return to recipe detail page]
```

---

## 5. Recipe Sharing

```mermaid
flowchart TD
    A[User on recipe detail page] --> B{Share token\nexists?}

    B -- no --> C[Click Share]
    C --> D[POST /api/recipes/:id/share]
    D --> E[Display shareable URL]

    B -- yes --> E

    E --> F{User action}
    F -- Copy link --> G[Link copied to clipboard]
    F -- Revoke --> H[DELETE /api/recipes/:id/share]
    H --> I[Share token cleared\nLink no longer works]

    Z[Anyone with link] --> AA[GET /api/recipes/shared/:token]
    AA --> BB{Token valid?}
    BB -- yes --> CC[View recipe — read only, no auth required]
    BB -- no --> DD[404 page]
```

---

## 6. Meal Planning

```mermaid
flowchart TD
    A[User opens Meal Planner] --> B[GET /api/meal-plan?from=...&to=...\nLoad entries for visible date range]
    B --> C[Calendar view rendered\nEntries grouped by date + mealType]

    C --> D{User action}

    D -- Add recipe to slot --> E[Pick date + mealType + recipe]
    E --> F[POST /api/meal-plan/entries]
    F --> C

    D -- Move entry drag-and-drop --> G[Drop on new date/mealType]
    G --> H[PATCH /api/meal-plan/entries/:id\nbody: date and/or mealType]
    H --> C

    D -- Remove entry --> I[DELETE /api/meal-plan/entries/:id]
    I --> C

    D -- Change date range --> J[GET /api/meal-plan?from=...&to=...]
    J --> C
```

---

## 7. Password Reset

Admin-initiated. No email infrastructure — the URL is shared out-of-band.

```mermaid
flowchart TD
    A[Admin opens user detail] --> B[Click Generate Reset URL]
    B --> C[POST /api/admin/users/:id/password-reset-url]
    C --> D[One-time URL returned\nShown to admin once]
    D --> E[Admin shares URL with user\ne.g. via message]

    E --> F[User opens URL in browser]
    F --> G{Token valid\nand not expired?}
    G -- no --> H[Show error: link expired or invalid]
    G -- yes --> I[Show reset password form]
    I --> J[User submits new password]
    J --> K[Password updated\nReset token cleared]
    K --> L[Redirect to /login]
```

---

## 8. Adding a User to a Household (with login)

Admin-initiated. The admin creates the account and shares credentials out-of-band.

```mermaid
flowchart TD
    A[Admin opens Users panel] --> B[Click Create User]
    B --> C[Fill name, email, username, password\nSelect target household]
    C --> D[POST /api/admin/users]
    D --> E{Success?}
    E -- no --> F[Show validation error] --> C
    E -- yes --> G[User account created]
    G --> H[Admin shares credentials with user\ne.g. via message]
    H --> I[User logs in via /login\nPOST /api/auth/login]
    I --> J[Session established\nUser lands on app]
```

---

## 9. Creating an API Key for an Agent User

Two-stage admin flow: first create the agent as a household member (no-login user), then issue a token tied to that user.

```mermaid
flowchart TD
    A[Admin opens Users panel] --> B[Create agent user\nPOST /api/admin/users\nname only, no password]
    B --> C[Agent User record exists in target household\npasswordHash = null]

    C --> D[Admin opens API Tokens panel]
    D --> E[Click Create Token\nFill name, select agent user]
    E --> F[POST /api/admin/tokens\nbody: name, userId]
    F --> G[Raw token returned — shown once]
    G --> H[Admin copies token and shares with agent developer]
    H --> I[Agent authenticates via\nAuthorization: Bearer token\nAll actions attributed to agent User]
```

---

## 11. Adding a Household Member (no-login)

```mermaid
flowchart TD
    A[User opens Household page] --> B[Click Add Member]
    B --> C[Fill name, optionally: date of birth, gender]
    C --> D[POST /api/household/members]
    D --> E{Success?}
    E -- no --> F[Show validation error] --> C
    E -- yes --> G[Member appears in household list\nVisible to agent, cannot log in]
```
