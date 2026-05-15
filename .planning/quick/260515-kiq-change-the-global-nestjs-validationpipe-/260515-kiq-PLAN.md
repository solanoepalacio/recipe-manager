---
phase: 260515-kiq
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - apps/api/src/main.ts
  - apps/api/tests/validation-pipe.e2e-spec.ts
autonomous: true
requirements:
  - VALIDATION-ALL-ERRORS
must_haves:
  truths:
    - "POST /api/* requests with multiple invalid top-level fields return ALL field errors in one 400 response, not just the first."
    - "POST /api/* requests with multiple invalid fields inside a @ValidateNested array (e.g. CreateRecipeDto.ingredients[i]) return ALL nested errors in one 400 response."
    - "Validation error response body still has the standard Nest shape ({ statusCode: 400, message: string[], error: 'Bad Request' }) so existing UI/agent clients keep working."
  artifacts:
    - path: "apps/api/src/main.ts"
      provides: "Global ValidationPipe configured with stopAtFirstError: false"
      contains: "stopAtFirstError: false"
    - path: "apps/api/tests/validation-pipe.e2e-spec.ts"
      provides: "E2E spec proving multi-error behavior at top level AND nested arrays"
      contains: "stopAtFirstError"
  key_links:
    - from: "apps/api/src/main.ts"
      to: "ValidationPipe"
      via: "useGlobalPipes options object"
      pattern: "stopAtFirstError:\\s*false"
    - from: "apps/api/tests/validation-pipe.e2e-spec.ts"
      to: "apps/api/src/main.ts"
      via: "Mirrors production ValidationPipe options when bootstrapping the Nest test app"
      pattern: "stopAtFirstError:\\s*false"
---

<objective>
Make the NestJS API return ALL validation errors from a single request instead of stopping at the first, including errors inside `@ValidateNested({ each: true })` arrays.

Purpose: Today the global `ValidationPipe` in `apps/api/src/main.ts` uses class-validator defaults, which surface only the first failing constraint per property and (depending on options) can short-circuit nested validation. Both UI and agent clients need to see every invalid field at once so users can fix forms in a single round-trip and the agent can self-correct payloads without N retries.

Output:
- One-line config change in `apps/api/src/main.ts` (`stopAtFirstError: false`).
- New e2e spec `apps/api/tests/validation-pipe.e2e-spec.ts` that proves the behavior for both a top-level multi-error case AND a nested-array multi-error case.
</objective>

<execution_context>
@.claude/get-shit-done/workflows/execute-plan.md
@.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@CLAUDE.md
@apps/api/src/main.ts
@apps/api/src/recipes/dto/create-recipe.dto.ts
@apps/api/src/recipes/ingredients/dto/batch-create-ingredient.dto.ts
@apps/api/test/jest-e2e.json
@apps/api/tests/auth.e2e-spec.ts
@apps/api/package.json

<interfaces>
<!-- Key contracts the executor needs. Do NOT re-explore the codebase. -->

apps/api/src/main.ts — current global pipe (lines 29–35):
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

apps/api/src/recipes/dto/create-recipe.dto.ts — `CreateRecipeDto` top-level constraints relevant to multi-error tests:
  - name: @IsString()  (required)
  - description?: @IsString()
  - servingsQty?: @IsInt() @Min(0)
  - prepTime?: @IsInt() @Min(0)
  - sourceUrl?: @IsUrl()
  - ingredients?: @IsArray() @ValidateNested({ each: true }) @Type(() => BatchIngredientItemDto)

apps/api/src/recipes/ingredients/dto/batch-create-ingredient.dto.ts — `BatchIngredientItemDto` per-item constraints:
  - foodId: @IsString()  (required)
  - unitId?: @IsString()
  - quantity?: @IsNumber() @Min(0)
  - note?: @IsString()

apps/api/test/jest-e2e.json — e2e runner config (rootDir `..`, testRegex `tests/.+\.e2e-spec\.ts$`). Run via `yarn workspace @recipe-manager/api test:e2e`.

Standard Nest validation error response shape (what tests assert against):
  {
    statusCode: 400,
    message: string[],   // class-validator messages, one entry per failing constraint
    error: 'Bad Request'
  }
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Flip ValidationPipe to return all errors + add e2e spec proving it</name>
  <files>apps/api/src/main.ts, apps/api/tests/validation-pipe.e2e-spec.ts</files>
  <behavior>
    The new e2e spec MUST contain at least these two passing cases (in addition to any setup boilerplate):

    1. "top-level: returns all errors for multiple invalid top-level fields"
       - POST /api/recipes with body: { name: 123, servingsQty: -5, prepTime: 'fast', sourceUrl: 'not-a-url' }
         (auth not required to reach validation; if the route is guarded and returns 401 before validation runs,
          use any POST route under /api that accepts CreateRecipeDto-like input and reaches the pipe — see
          "If validation is gated behind auth" note below.)
       - Expect HTTP 400.
       - Expect `body.message` to be an array (string[]).
       - Assert it contains AT LEAST 4 distinct messages, one mentioning each of:
         `name`, `servingsQty`, `prepTime`, `sourceUrl`.
       - Assert `body.statusCode === 400` and `body.error === 'Bad Request'`.

    2. "nested array: returns all errors across multiple invalid ingredients[]"
       - POST /api/recipes with body:
         { name: 'Valid Name', ingredients: [
             { foodId: 42, quantity: -1 },          // foodId not a string, quantity < 0
             { foodId: 'ok', quantity: 'lots' }     // quantity not a number
         ] }
       - Expect HTTP 400.
       - Assert `body.message` is an array with AT LEAST 3 entries.
       - Assert at least one message references `ingredients.0.foodId` (or `ingredients[0].foodId`),
         one references `ingredients.0.quantity`, and one references `ingredients.1.quantity`.
         Use a tolerant matcher: `body.message.some((m: string) => /ingredients\W*0\W*foodId/.test(m))` etc.,
         because class-validator path formatting can be either `ingredients.0.foodId` or `ingredients[0].foodId`.

    Guardrails on the test setup:
    - The spec MUST bootstrap a `TestingModule` from `AppModule` (mirror `apps/api/tests/auth.e2e-spec.ts`).
    - The spec MUST configure `ValidationPipe` with the EXACT same options as production
      (`whitelist: true, forbidNonWhitelisted: true, transform: true, stopAtFirstError: false`).
      If the options diverge from `main.ts`, the test does not actually prove the production behavior.
    - Skip both cases when `DATABASE_URL` is unset (follow the `DB_AVAILABLE` pattern in `auth.e2e-spec.ts`)
      so the spec does not block dev machines without a DB. Validation runs before DB access, but
      `AppModule` bootstrap may require the DB connection to initialize.
    - If validation is gated behind auth (POST /api/recipes likely requires a session): the spec MUST
      still verify validation behavior. Two acceptable approaches — pick whichever requires LESS new code:
        (a) Authenticate via the existing signup/login flow used in other e2e specs and send the invalid
            payloads with the session cookie; OR
        (b) Find an unauthenticated POST route in the codebase that uses a DTO with both top-level
            constraints AND a `@ValidateNested({ each: true })` array, and use it instead. Document the
            choice in a one-line comment at the top of the spec.
      Do NOT bypass the global pipe by hand-constructing a controller — that would not test the global config.
  </behavior>
  <action>
    Implement two changes in this order:

    1. Edit `apps/api/src/main.ts`: add `stopAtFirstError: false` to the existing `ValidationPipe` options
       object passed to `app.useGlobalPipes(...)`. Keep `whitelist: true`, `forbidNonWhitelisted: true`,
       `transform: true` unchanged. Add a brief inline comment explaining why
       (e.g. `// Return ALL validation errors per request (incl. nested arrays) so UI + agent clients can fix multiple fields in one round-trip.`).
       Do NOT introduce any other config flag, exception factory, or pipe wrapper — the goal is a single
       deterministic flag change that propagates to nested DTOs by default.

    2. Create `apps/api/tests/validation-pipe.e2e-spec.ts` implementing the behavior block above.
       Follow the conventions of `apps/api/tests/auth.e2e-spec.ts`:
         - `import 'reflect-metadata'` is already pulled in transitively, but be defensive if needed.
         - Use `supertest` (already a devDependency).
         - `beforeAll` builds the testing module from `AppModule`, creates the Nest app, calls
           `app.setGlobalPrefix('api')`, and registers the same `ValidationPipe` as production
           (whitelist, forbidNonWhitelisted, transform, stopAtFirstError: false).
         - `afterAll` closes the app.
         - Guard every test with `if (!DB_AVAILABLE) return;` matching the existing pattern.
       Do NOT use heredoc-style copying of `auth.e2e-spec.ts` wholesale — only the bootstrap pattern.
       Do NOT add `@ApiProperty` / DTO changes; this plan does not modify DTOs.
       Do NOT touch `apps/api/integration_tests/` — those are Prisma-service-level tests that bypass
       the HTTP pipe and cannot prove this behavior.
  </action>
  <verify>
    <automated>cd apps/api && yarn test:e2e --testPathPattern validation-pipe.e2e-spec.ts</automated>
    Additionally, confirm `stopAtFirstError: false` is the ONLY substantive diff in `main.ts`:
      grep -n 'stopAtFirstError' apps/api/src/main.ts   # must return exactly 1 line with `false`
      grep -n 'stopAtFirstError' apps/api/tests/validation-pipe.e2e-spec.ts   # must return at least 1 line
  </verify>
  <done>
    - `apps/api/src/main.ts` contains `stopAtFirstError: false` inside the global `ValidationPipe` options;
      no other behavior changed (existing routes still work, existing e2e/integration suites still pass).
    - `apps/api/tests/validation-pipe.e2e-spec.ts` exists with the two cases above and passes when
      `DATABASE_URL` is set; auto-skips otherwise.
    - The top-level case returns `>= 4` messages naming `name`, `servingsQty`, `prepTime`, `sourceUrl`.
    - The nested case returns `>= 3` messages covering `ingredients.0.foodId`, `ingredients.0.quantity`,
      and `ingredients.1.quantity`.
    - Running the full e2e suite (`yarn workspace @recipe-manager/api test:e2e`) is green; no other spec regressed.
  </done>
</task>

</tasks>

<verification>
- Manual sanity check (optional, while dev server is up):
    curl -sS -X POST http://localhost:3001/api/recipes \
      -H 'Content-Type: application/json' \
      -b 'connect.sid=<valid-session>' \
      -d '{"name":123,"servingsQty":-5,"prepTime":"fast","sourceUrl":"nope"}' | jq '.message | length'
  Should print a number `>= 4`.
- `yarn workspace @recipe-manager/api test:e2e` is green.
- `grep -c 'stopAtFirstError' apps/api/src/main.ts` (excluding comment-only lines) returns 1.
</verification>

<success_criteria>
- Single config flag (`stopAtFirstError: false`) added to the global `ValidationPipe`; no other behavior change.
- New e2e spec proves all errors are returned for BOTH a top-level multi-field case AND a nested-array multi-field case.
- Existing e2e and integration suites still pass.
- Validation error response shape (`{ statusCode, message: string[], error }`) is unchanged so existing clients keep working.
</success_criteria>

<output>
Create `.planning/quick/260515-kiq-change-the-global-nestjs-validationpipe-/260515-kiq-01-SUMMARY.md` when done.
</output>
