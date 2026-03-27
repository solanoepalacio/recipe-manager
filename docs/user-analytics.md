# User Analytics — Event Reference

The Recipe Manager uses [Umami](https://umami.is/) for usage analytics. Umami is self-hosted, cookieless, and privacy-friendly — no consent banner is required.

Page views and time-on-page are tracked automatically by the Umami script embedded in the frontend. Key user interactions are tracked as custom events, documented below.

---

## Tracked Events

| Event Name | Source | Trigger | Payload Fields |
|---|---|---|---|
| `cook-mode-start` | frontend | User opens cook mode for a recipe | `recipeId: string`, `recipeName: string` |
| `recipe-search` | frontend | Search input debounces to a non-empty value | `query: string` |
| `recipe-filter` | frontend | Filter chip applied *(planned — not yet implemented)* | `filterType: string`, `filterValue: string` |
| `recipe-create` | frontend | After successful recipe creation | `recipeId: string`, `recipeName: string` |
| `recipe-edit` | frontend | After successful recipe save | `recipeId: string`, `recipeName: string` |
| `share-link-generate` | frontend | After share link is generated for a recipe | `recipeId: string`, `recipeName: string` |
| `meal-plan-add` | frontend | After a recipe is added to the meal planner | `recipeId: string`, `recipeName: string` |
| `meal-plan-remove` | frontend | After a meal plan entry is deleted | `recipeId: string`, `recipeName: string` |
| `share-link-view` | backend | Share token validated — shared recipe accessed | `recipeId: string`, `recipeName: string` |

---

## Notes

- All frontend events use `window.umami?.track()` with optional chaining — they are silent no-ops when the Umami script is not loaded or is blocked.
- The backend `share-link-view` event is fire-and-forget: a Umami outage never blocks recipe access.
- `recipe-search` captures raw user-typed search text. This is acceptable: Umami is self-hosted, access is restricted to the application manager, and this is a single-operator household system.
- When a shared recipe is viewed, two data points are recorded: an automatic page view (from the script) and the `share-link-view` backend event. This is intentional — the page view provides session/traffic context; the backend event provides recipe-level data.
- `recipe-filter` is listed as planned. It will be implemented when filter chip UI is added to the recipe list.
