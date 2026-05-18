---
title: Fix agent empty-body validation loop on recipe/meal-plan creation
date: 2026-05-15
priority: high
---

# Fix agent empty-body validation loop

## Problem

When an AI agent mistakenly POSTs an empty body to `POST /api/recipes` (and
likely `POST /api/meal-plan` entry creation), NestJS's default `ValidationPipe`
returns a 400 with a flat message like `["name must be a string"]`.

The agent doesn't recognize this as "you sent zero fields" — it reads it as
"the value I sent wasn't a string" — and retries with the same empty body,
looping indefinitely.

## Narrow fix (this todo)

Enrich the 400 response on the recipe and meal-plan creation endpoints so the
loop breaks immediately, even before the broader `/api/ai/*` mirror pattern
exists.

The response should additionally include:

- `received_keys`: the list of top-level keys actually present in the request body
- `expected_required`: the list of required top-level fields for this endpoint

These fields are *additive* — the existing `message: string[]` shape stays so
the web client is unaffected.

## Out of scope (tracked separately in backlog)

- Full `/api/ai/*` mirror endpoints with snake_case I/O
- `dry-run` variant of create
- Auto-resolve `food_name` / `unit_name` instead of requiring IDs
- Global change to error response shape

## Related context

Came out of `/gsd:explore` session 2026-05-15 on API ergonomics for AI agents.
The broader mirror pattern and the food/unit ID resolution question are in the
project backlog.
