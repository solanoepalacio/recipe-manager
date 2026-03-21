# Phase 2: Database Schema + Prisma - Research

**Researched:** 2026-03-16
**Domain:** Prisma ORM schema authoring, PostgreSQL migrations, database seeding
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| HH-01 | Users belong to a household; all recipes and meal plans are household-scoped and private to members | Non-nullable `householdId` FK on `Recipe`, `MealPlan`, and `MealPlanEntry` enforced at DB level via Prisma schema; service-layer filtering covered in Phase 4+ |
</phase_requirements>

---

## Summary

Phase 2 turns the stub `schema.prisma` (generator + datasource only, committed in Phase 1) into the complete production schema covering all 13 entities from the data model. It also produces the initial migration and seeds the `Food` and `Unit` lookup tables.

The complete entity set is: `Household`, `User`, `Admin`, `ApiToken`, `Food`, `Unit`, `Recipe`, `IngredientSection`, `RecipeIngredient`, `InstructionStep`, `RecipeImage`, `MealPlan`, `MealPlanEntry`. All household-scoped tables (`Recipe`, `MealPlan`, `MealPlanEntry`) must carry a non-nullable `householdId` FK so the database itself enforces HH-01 structurally. Service-layer filtering (the runtime enforcement) happens in later phases.

**Primary recommendation:** Write the full Prisma schema in one plan, run `prisma migrate dev` to create a named initial migration, and write a `seed.ts` that populates `Food` and `Unit` from curated lists. Integration-test with a live PostgreSQL instance (docker-compose already provides one).

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| prisma | 6.19.2 (installed) | CLI: schema lint, migrate, generate, seed | Installed in devDependencies of apps/api |
| @prisma/client | 6.19.2 (installed) | Generated query client used at runtime | Already imported in PrismaService |
| PostgreSQL | 16-alpine (docker-compose) | Relational database | Project decision; docker-compose already configured |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| ts-node | (transitive, available via nest-cli) | Execute `seed.ts` directly | Prisma seed script is TypeScript; needs ts-node or tsx to run |
| tsx | latest | Faster TS execution for seed | Alternative to ts-node; recommended for Prisma 6 seeds |

**Note on seed runner:** Prisma 6 docs recommend `ts-node` or `tsx` to run TypeScript seed files. Check whether `ts-node` is already resolvable in the workspace before adding `tsx`. The `prisma.seed` key in `package.json` (apps/api) controls how `prisma db seed` invokes the file.

**Installation (if tsx not present):**
```bash
yarn workspace @recipe-manager/api add -D tsx
```

---

## Architecture Patterns

### Prisma File Location (project-decided)
```
apps/api/
├── prisma/
│   ├── schema.prisma       # Full schema — this phase writes it
│   ├── migrations/         # Created by prisma migrate dev
│   └── seed.ts             # Seed script — this phase writes it
```

This matches `plans/01_App/07_project_structure.md` exactly.

### Pattern 1: UUID primary keys with `@default(cuid())` vs `@default(uuid())`

**What:** Prisma supports `@default(uuid())` (UUIDv4) and `@default(cuid())`. The data model specifies UUIDs.

**When to use:** Use `@default(uuid())` for all `id` fields — consistent with the data model spec and makes IDs predictable format for API consumers.

```prisma
// Source: Prisma official docs — https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference
model Household {
  id        String   @id @default(uuid())
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Pattern 2: Enum definition in Prisma schema

**What:** Prisma `enum` blocks map to PostgreSQL `ENUM` types. The project already defines `Gender` and `MealType` as TypeScript enums in `packages/shared/src/enums.ts`. The Prisma enums must match the same values exactly.

```prisma
// Source: Prisma official docs
enum Gender {
  male
  female
  other
}

enum MealType {
  breakfast
  lunch
  dinner
  snack
  dessert
}
```

**Critical:** Prisma enum values are case-sensitive and map directly to database values. The shared TypeScript enums use lowercase values (`Gender.Male = 'male'`), so Prisma enum members must also be lowercase to match.

### Pattern 3: Household-scoped FK enforcement (HH-01)

**What:** Non-nullable FK on every household-scoped table enforces the constraint at the database level. Prisma makes a field non-nullable by default (no `?`).

```prisma
model Recipe {
  id          String    @id @default(uuid())
  householdId String                          // NON-NULLABLE — enforces HH-01
  household   Household @relation(fields: [householdId], references: [id])
  // ... rest of fields
}

model MealPlan {
  id          String    @id @default(uuid())
  householdId String    @unique              // One meal plan per household
  household   Household @relation(fields: [householdId], references: [id])
}

model MealPlanEntry {
  id         String   @id @default(uuid())
  mealPlanId String
  mealPlan   MealPlan @relation(fields: [mealPlanId], references: [id])
  // householdId is transitively scoped via mealPlan → household
}
```

**Note on MealPlanEntry:** HH-01's success criterion says "household-scoped tables have a non-nullable householdId FK." `MealPlanEntry` reaches the household transitively through `MealPlan`. The success criterion lists `Recipe`, `MealPlan`, and `MealPlanEntry`. For MealPlanEntry, `mealPlanId` is already non-nullable, giving transitivity. No direct `householdId` on `MealPlanEntry` is needed per the data model design.

### Pattern 4: Decimal fields for quantities

**What:** `servingsQty` and `RecipeIngredient.quantity` use `Decimal?` in the data model. In Prisma, this maps to `Decimal?` which uses the PostgreSQL `DECIMAL` type. In TypeScript, Prisma returns `Prisma.Decimal` objects.

```prisma
model Recipe {
  servingsQty Decimal?
}

model RecipeIngredient {
  quantity  Decimal?
}
```

**Pitfall:** `Prisma.Decimal` is NOT the same as JavaScript `number`. When mapping to shared types, the service layer must call `.toNumber()` or `.toString()`. The shared type `RecipeIngredient` interface should use `number | null` or `string | null`.

### Pattern 5: Seed file structure

```typescript
// apps/api/prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Upsert pattern — idempotent, safe to re-run
  const units = [
    { name: 'cup', abbreviation: 'cup' },
    { name: 'tablespoon', abbreviation: 'tbsp' },
    // ...
  ];

  for (const unit of units) {
    await prisma.unit.upsert({
      where: { name: unit.name },
      update: {},
      create: unit,
    });
  }
  // Same pattern for foods
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

**Key:** Use `upsert` not `createMany`. Upsert is idempotent — `prisma db seed` can be re-run safely. `createMany` fails on re-run if the records already exist.

### Pattern 6: package.json seed configuration

```json
// apps/api/package.json — add to top-level
"prisma": {
  "seed": "tsx prisma/seed.ts",
  "schema": "prisma/schema.prisma"
}
```

This is required for `prisma db seed` to know how to run the seed file.

### Anti-Patterns to Avoid

- **Using `@map` aliases unnecessarily:** Only use `@map` when bridging a naming mismatch. All field names in this project align with the data model directly.
- **Putting `seed.ts` inside `src/`:** Prisma convention and the project structure place it in `prisma/seed.ts`. Putting it in `src/` breaks the CLI invocation path.
- **Using `createMany` in seeds:** Not idempotent. `prisma db seed` re-runs fail with unique constraint violations.
- **Nullable FK for householdId:** The householdId on Recipe/MealPlan MUST be `String` (non-nullable), not `String?`. A nullable FK would allow orphaned recipes not scoped to any household, violating HH-01.
- **Mismatched enum casing:** If Prisma enum values don't match TypeScript enum values exactly, the ORM will not auto-map them. Use lowercase in both places.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Schema migrations | Custom SQL migration files | `prisma migrate dev` | Handles versioning, naming, rollback tracking, schema drift detection |
| FK cascade behavior | Manual ON DELETE triggers | Prisma `onDelete` relation actions | Type-safe, schema-documented, covers all cascade rules |
| Unique constraint for slug per household | App-level duplicate check | `@@unique([householdId, slug])` in Prisma | Enforced at DB level; race-condition safe |
| Idempotent seed | Truncate + insert | `upsert` with `where: { name }` | Safe re-runs; no data loss in dev |
| Enum synchronization | Mapping TypeScript enums manually | Prisma generates enum-typed fields | Auto-generated types enforce correctness at compile time |

---

## Common Pitfalls

### Pitfall 1: Prisma client not regenerated after schema change

**What goes wrong:** After editing `schema.prisma`, the generated client in `node_modules/@prisma/client` is stale. TypeScript types for new models don't exist yet, causing compilation errors.
**Why it happens:** The client is generated, not dynamic. Any schema edit requires regeneration.
**How to avoid:** Always run `prisma generate` after schema edits (or use `prisma migrate dev` which runs generate automatically).
**Warning signs:** `Property 'recipe' does not exist on type 'PrismaClient'` TypeScript errors.

### Pitfall 2: Migration applied to wrong database

**What goes wrong:** `prisma migrate dev` or `prisma migrate deploy` runs against the production database because `DATABASE_URL` points to the wrong instance.
**Why it happens:** `.env` file not set up correctly; env var inherited from shell.
**How to avoid:** Always verify `DATABASE_URL` before running migrations. For this project, use the docker-compose database for development (`localhost:5432`).
**Warning signs:** Migration succeeds but no records change in the expected database.

### Pitfall 3: Compound unique constraint missing on Recipe slug

**What goes wrong:** `slug` is unique per household (two households can have a recipe called "pasta"). If only a simple `@unique` is placed on `slug`, the second household can't create a recipe with the same slug.
**Why it happens:** Data model note says "unique per household" which requires a compound index.
**How to avoid:** Use `@@unique([householdId, slug])` at the model level, not `@unique` on the field.

### Pitfall 4: `Decimal` type handling in TypeScript

**What goes wrong:** Prisma returns `Prisma.Decimal` for `Decimal` fields, not JavaScript `number`. Passing these directly to JSON responses returns `{"d":["12"],...}` instead of `12`.
**Why it happens:** `Prisma.Decimal` is a BigDecimal-style object.
**How to avoid:** Service layer must call `.toNumber()` when mapping Prisma results to shared response types. Document this in the service layer conventions.
**Warning signs:** API response contains `{"d":["..."]}` nested objects instead of numbers.

### Pitfall 5: `prisma migrate dev` vs `prisma migrate deploy`

**What goes wrong:** `migrate deploy` is used in development thinking it's equivalent; it doesn't detect drift and won't create new migrations.
**Why it happens:** Confusing the two commands.
**How to avoid:** Use `migrate dev` during development (detects drift, creates migrations, runs seeds). Use `migrate deploy` in production/CI (applies pending migrations only).

### Pitfall 6: Seed script TypeScript path resolution

**What goes wrong:** `prisma db seed` runs `tsx prisma/seed.ts` but the seed imports from `@prisma/client`, which resolves through the workspace's node_modules. If run from the wrong directory, module resolution fails.
**Why it happens:** Yarn workspaces hoisting edge cases.
**How to avoid:** Run all prisma commands with `yarn workspace @recipe-manager/api prisma ...` or from inside `apps/api/`. The `prisma.seed` script path in `package.json` is relative to the `package.json` location.

---

## Code Examples

Verified patterns from Prisma 6 official documentation:

### Complete schema structure (reference)

```prisma
// Source: https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Gender {
  male
  female
  other
}

enum MealType {
  breakfast
  lunch
  dinner
  snack
  dessert
}

model Household {
  id         String    @id @default(uuid())
  name       String
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt
  users      User[]
  recipes    Recipe[]
  mealPlan   MealPlan?
}

model User {
  id           String     @id @default(uuid())
  householdId  String
  household    Household  @relation(fields: [householdId], references: [id])
  name         String
  email        String?    @unique
  username     String?    @unique
  passwordHash String?
  gender       Gender?
  dateOfBirth  DateTime?
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
  recipes      Recipe[]
  apiTokens    ApiToken[]
}

model Admin {
  id           String     @id @default(uuid())
  name         String
  email        String     @unique
  passwordHash String
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
  apiTokens    ApiToken[]
}

model ApiToken {
  id          String    @id @default(uuid())
  name        String
  tokenHash   String
  userId      String
  user        User      @relation(fields: [userId], references: [id])
  createdById String
  createdBy   Admin     @relation(fields: [createdById], references: [id])
  createdAt   DateTime  @default(now())
  lastUsedAt  DateTime?
}

model Food {
  id          String              @id @default(uuid())
  name        String              @unique
  createdAt   DateTime            @default(now())
  updatedAt   DateTime            @updatedAt
  ingredients RecipeIngredient[]
}

model Unit {
  id           String             @id @default(uuid())
  name         String             @unique
  abbreviation String?
  createdAt    DateTime           @default(now())
  updatedAt    DateTime           @updatedAt
  ingredients  RecipeIngredient[]
}

model Recipe {
  id               String              @id @default(uuid())
  householdId      String
  household        Household           @relation(fields: [householdId], references: [id])
  createdById      String
  createdBy        User                @relation(fields: [createdById], references: [id])
  name             String
  slug             String
  description      String?
  servingsQty      Decimal?
  servingsUnit     String?
  prepTime         Int?
  cookTime         Int?
  totalTime        Int?
  performTime      Int?
  sourceUrl        String?
  isLocked         Boolean             @default(false)
  landscapeView    Boolean             @default(false)
  shareToken       String?             @unique
  createdAt        DateTime            @default(now())
  updatedAt        DateTime            @updatedAt
  sections         IngredientSection[]
  steps            InstructionStep[]
  images           RecipeImage[]
  mealPlanEntries  MealPlanEntry[]

  @@unique([householdId, slug])
}

model IngredientSection {
  id          String             @id @default(uuid())
  recipeId    String
  recipe      Recipe             @relation(fields: [recipeId], references: [id])
  title       String?
  order       Int
  ingredients RecipeIngredient[]
}

model RecipeIngredient {
  id        String            @id @default(uuid())
  sectionId String
  section   IngredientSection @relation(fields: [sectionId], references: [id])
  foodId    String
  food      Food              @relation(fields: [foodId], references: [id])
  unitId    String?
  unit      Unit?             @relation(fields: [unitId], references: [id])
  quantity  Decimal?
  note      String?
  order     Int
}

model InstructionStep {
  id       String  @id @default(uuid())
  recipeId String
  recipe   Recipe  @relation(fields: [recipeId], references: [id])
  title    String?
  body     String
  order    Int
}

model RecipeImage {
  id        String   @id @default(uuid())
  recipeId  String
  recipe    Recipe   @relation(fields: [recipeId], references: [id])
  url       String
  order     Int
  createdAt DateTime @default(now())
}

model MealPlan {
  id          String          @id @default(uuid())
  householdId String          @unique
  household   Household       @relation(fields: [householdId], references: [id])
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt
  entries     MealPlanEntry[]
}

model MealPlanEntry {
  id         String   @id @default(uuid())
  mealPlanId String
  mealPlan   MealPlan @relation(fields: [mealPlanId], references: [id])
  recipeId   String
  recipe     Recipe   @relation(fields: [recipeId], references: [id])
  date       DateTime @db.Date
  mealType   MealType
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

### Idempotent seed upsert

```typescript
// Source: https://www.prisma.io/docs/guides/database/seed-database
const commonUnits = [
  { name: 'cup', abbreviation: 'cup' },
  { name: 'tablespoon', abbreviation: 'tbsp' },
  { name: 'teaspoon', abbreviation: 'tsp' },
  { name: 'gram', abbreviation: 'g' },
  { name: 'kilogram', abbreviation: 'kg' },
  { name: 'milliliter', abbreviation: 'ml' },
  { name: 'liter', abbreviation: 'l' },
  { name: 'ounce', abbreviation: 'oz' },
  { name: 'pound', abbreviation: 'lb' },
  { name: 'piece', abbreviation: null },
  { name: 'slice', abbreviation: null },
  { name: 'clove', abbreviation: null },
  { name: 'pinch', abbreviation: null },
];

for (const unit of commonUnits) {
  await prisma.unit.upsert({
    where: { name: unit.name },
    update: {},
    create: unit,
  });
}
```

### package.json prisma seed config

```json
// apps/api/package.json (add at top level, alongside "name", "scripts", etc.)
"prisma": {
  "seed": "tsx prisma/seed.ts",
  "schema": "prisma/schema.prisma"
}
```

### Running migrations (from apps/api/)

```bash
# Development: create migration + apply + regenerate client
npx prisma migrate dev --name init

# Verify schema with dry-run
npx prisma migrate dev --create-only --name init

# Apply seed
npx prisma db seed

# Reset dev DB (drop + recreate + seed)
npx prisma migrate reset
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@default(cuid())` for IDs | `@default(uuid())` or `@default(cuid())` both supported | Prisma 5+ | UUIDs preferred here per data model spec; both work fine |
| Separate `prisma/` at project root | `prisma/` inside each app | Multi-app monorepos | Correct for this project — prisma dir is inside `apps/api/` |
| `ts-node` for seed execution | `tsx` recommended for Prisma 6 | Prisma 6 | Faster, no tsconfig path issues |

**Deprecated/outdated:**
- `prisma introspect`: Replaced by `prisma db pull`. Not needed here (we're building schema-first).
- `@default(autoincrement())` for IDs: Data model specifies UUIDs — do not use auto-increment.

---

## Open Questions

1. **Seed data volume for Food**
   - What we know: The data model says "pre-populated via seed/migrations" and Admin manages foods going forward
   - What's unclear: How many food entries to seed — a minimal starter set (20-50 common foods) or a comprehensive list (hundreds)?
   - Recommendation: Seed ~50 common pantry staples (eggs, milk, flour, chicken, beef, tomato, onion, garlic, etc.) to make the app functional out of the box. Admin can add more. This is a planning/content decision, not a technical one.

2. **`@db.Date` vs `DateTime` for MealPlanEntry.date**
   - What we know: The data model specifies `Date` (not DateTime) for `MealPlanEntry.date`. Prisma maps `DateTime` to PostgreSQL `TIMESTAMP`, but `@db.Date` annotation maps to `DATE` (no time component).
   - What's unclear: Whether downstream code (Phase 10 meal planner) cares about time precision.
   - Recommendation: Use `DateTime @db.Date` — stores only the date, returns midnight UTC from Prisma, keeps the schema true to intent.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest 29 + ts-jest |
| Config file | `apps/api/jest.config.ts` |
| Unit test run command | `yarn workspace @recipe-manager/api test` |
| E2e/integration command | `yarn workspace @recipe-manager/api test:e2e` |

**Note:** Integration tests (real DB) belong in `apps/api/integration_tests/` per project convention. A separate jest config is needed for integration tests (not yet created). Unit tests live in `apps/api/tests/` and already run with the existing config.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| HH-01 | Recipe.householdId is non-nullable at DB level | integration | `yarn workspace @recipe-manager/api jest --testPathPattern integration_tests/schema` | Wave 0 |
| HH-01 | MealPlan.householdId is non-nullable at DB level | integration | `yarn workspace @recipe-manager/api jest --testPathPattern integration_tests/schema` | Wave 0 |
| HH-01 | prisma migrate deploy applies with no errors | manual/smoke | `npx prisma migrate deploy` (exit 0) | Wave 0 |
| HH-01 | prisma db seed populates foods and units tables | integration | `yarn workspace @recipe-manager/api jest --testPathPattern integration_tests/seed` | Wave 0 |

**Manual verification commands (acceptable for this phase):**
- `prisma migrate deploy` against fresh PostgreSQL — exit 0 = pass
- `SELECT COUNT(*) FROM "Food"` and `SELECT COUNT(*) FROM "Unit"` return non-zero counts post-seed

### Sampling Rate

- **Per task commit:** Schema linting (`npx prisma validate`) — runs in < 2 seconds, no DB required
- **Per wave merge:** Full integration suite against test DB
- **Phase gate:** All success criteria met before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `apps/api/integration_tests/schema.integration-spec.ts` — covers HH-01 DB-level enforcement
- [ ] `apps/api/integration_tests/seed.integration-spec.ts` — verifies Food/Unit seed counts
- [ ] `apps/api/jest-integration.config.ts` — separate jest config for integration tests (rootDir: `integration_tests/`, testEnvironment: `node`)
- [ ] `tsx` devDependency in `apps/api/package.json` — needed for `prisma db seed` to run `seed.ts`

---

## Sources

### Primary (HIGH confidence)
- Prisma 6.19.2 installed at `apps/api/node_modules/@prisma/client` — confirmed via `node -e` version check
- `plans/01_App/01_tech_stack_and_data_model.md` — authoritative entity definitions, field types, relations
- `plans/01_App/07_project_structure.md` — canonical file locations
- `.planning/REQUIREMENTS.md` — HH-01 requirement text
- `apps/api/prisma/schema.prisma` — current stub (generator + datasource only)
- `packages/shared/src/enums.ts` — Gender and MealType enum values (lowercase)
- `docker-compose.yml` — PostgreSQL 16 setup confirmed
- `.env.example` — DATABASE_URL format

### Secondary (MEDIUM confidence)
- Prisma docs pattern for seed upsert — consistent with Prisma 6 official guidance
- `@@unique([householdId, slug])` compound constraint — standard Prisma compound unique syntax

### Tertiary (LOW confidence)
- Food seed data content (50 common pantry items) — judgment call, not sourced from official docs

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Prisma version confirmed from installed package
- Architecture: HIGH — directly derived from finalized design artifacts
- Pitfalls: HIGH — Decimal/enum/compound-unique pitfalls are well-documented Prisma behaviors
- Seed data scope: LOW — content decisions not technically sourced

**Research date:** 2026-03-16
**Valid until:** 2026-09-16 (Prisma schema API is stable; seed content is project-specific)
