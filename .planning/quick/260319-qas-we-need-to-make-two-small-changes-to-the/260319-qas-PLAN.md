---
phase: quick-260319-qas
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - apps/api/prisma/schema.prisma
  - packages/shared/src/api/auth.ts
  - packages/shared/src/api/admin.ts
  - packages/shared/src/api/profile.ts
  - packages/shared/src/api/household.ts
  - apps/api/src/admin/users/dto/create-user.dto.ts
  - apps/api/src/admin/users/admin-users.service.ts
  - apps/api/src/admin/users/admin-users.service.spec.ts
  - apps/api/src/admin/households/admin-households.service.ts
  - apps/api/src/profile/profile.service.ts
  - apps/web/src/components/__tests__/ProfilePage.test.tsx
autonomous: true
requirements: []
must_haves:
  truths:
    - "gender and dateOfBirth are required (non-nullable) on the User model"
    - "email remains optional (nullable) on the User model"
    - "Existing users with NULL gender/dateOfBirth get sensible defaults via migration"
    - "All shared types, DTOs, services, and tests reflect the new nullability"
  artifacts:
    - path: "apps/api/prisma/schema.prisma"
      provides: "User model with required gender and dateOfBirth"
      contains: "gender           Gender"
    - path: "packages/shared/src/api/profile.ts"
      provides: "ProfileResponse with non-null gender and dateOfBirth"
  key_links:
    - from: "apps/api/prisma/schema.prisma"
      to: "packages/shared/src/api/profile.ts"
      via: "shared type nullability must match Prisma nullability"
      pattern: "gender: Gender;"
---

<objective>
Make gender and dateOfBirth required (non-nullable) on the User model, and ensure email remains optional. Kids won't have emails and won't be able to login, but every user must have gender and date of birth.

Purpose: Data integrity — every user must have gender and date of birth for household member profiles.
Output: Updated Prisma schema, migration, shared types, backend DTOs/services, and tests.
</objective>

<execution_context>
@/home/solanoe/code/recipe-manager/.claude/get-shit-done/workflows/execute-plan.md
@/home/solanoe/code/recipe-manager/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@apps/api/prisma/schema.prisma
@packages/shared/src/api/auth.ts
@packages/shared/src/api/admin.ts
@packages/shared/src/api/profile.ts
@packages/shared/src/api/household.ts
@packages/shared/src/enums.ts
@apps/api/src/admin/users/dto/create-user.dto.ts
@apps/api/src/admin/users/dto/update-user.dto.ts
@apps/api/src/admin/users/admin-users.service.ts
@apps/api/src/admin/users/admin-users.service.spec.ts
@apps/api/src/admin/households/admin-households.service.ts
@apps/api/src/profile/profile.service.ts
@apps/api/src/profile/dto/update-profile.dto.ts
@apps/web/src/components/__tests__/ProfilePage.test.tsx

<interfaces>
<!-- Key types the executor needs -->

From packages/shared/src/enums.ts:
```typescript
export enum Gender {
  Male = 'male',
  Female = 'female',
  Other = 'other',
}
```

Current Prisma User model (lines 38-53 of schema.prisma):
```prisma
model User {
  id               String     @id @default(uuid())
  householdId      String
  household        Household  @relation(fields: [householdId], references: [id])
  name             String
  email            String?    @unique
  passwordHash     String?
  resetToken       String?
  resetTokenExpiry DateTime?
  gender           Gender?
  dateOfBirth      DateTime?
  createdAt        DateTime   @default(now())
  updatedAt        DateTime   @updatedAt
  recipes          Recipe[]
  apiTokens        ApiToken[]
}
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Update Prisma schema and create migration</name>
  <files>apps/api/prisma/schema.prisma</files>
  <action>
1. In `apps/api/prisma/schema.prisma`, change the User model:
   - `gender Gender?` -> `gender Gender` (remove the `?`)
   - `dateOfBirth DateTime?` -> `dateOfBirth DateTime` (remove the `?`)
   - `email` stays as `String?` (already optional, no change needed)

2. Create a Prisma migration with a two-step approach for existing data:
   - Run: `cd apps/api && npx prisma migrate dev --name make_gender_dob_required --create-only`
   - Edit the generated SQL migration file to add DEFAULT values BEFORE the ALTER COLUMN NOT NULL:
     ```sql
     -- Backfill existing NULL values with defaults
     UPDATE "User" SET "gender" = 'other' WHERE "gender" IS NULL;
     UPDATE "User" SET "dateOfBirth" = '2000-01-01' WHERE "dateOfBirth" IS NULL;

     -- Then the ALTER COLUMN statements (Prisma generates these)
     ALTER TABLE "User" ALTER COLUMN "gender" SET NOT NULL;
     ALTER TABLE "User" ALTER COLUMN "dateOfBirth" SET NOT NULL;
     ```
   - Run: `cd apps/api && npx prisma migrate dev` to apply
   - Run: `cd apps/api && npx prisma generate` to regenerate client

Note: The default values ('other' for gender, '2000-01-01' for dateOfBirth) are just backfill defaults for any existing rows with NULL. New users will always have real values.
  </action>
  <verify>
    <automated>cd /home/solanoe/code/recipe-manager/apps/api && npx prisma validate</automated>
  </verify>
  <done>Prisma schema has gender and dateOfBirth as required fields; migration applied successfully; Prisma client regenerated.</done>
</task>

<task type="auto">
  <name>Task 2: Update shared types, backend DTOs, services, and tests</name>
  <files>
    packages/shared/src/api/profile.ts
    packages/shared/src/api/admin.ts
    packages/shared/src/api/household.ts
    apps/api/src/admin/users/dto/create-user.dto.ts
    apps/api/src/admin/users/admin-users.service.ts
    apps/api/src/admin/users/admin-users.service.spec.ts
    apps/api/src/admin/households/admin-households.service.ts
    apps/api/src/profile/profile.service.ts
    apps/api/src/profile/dto/update-profile.dto.ts
    apps/web/src/components/__tests__/ProfilePage.test.tsx
  </files>
  <action>
**Shared types (packages/shared/src/api/):**

1. `profile.ts` — ProfileResponse:
   - `gender: Gender | null` -> `gender: Gender` (remove `| null`)
   - `dateOfBirth: string | null` -> `dateOfBirth: string` (remove `| null`)
   - UpdateProfileRequest: keep gender/dateOfBirth as optional (partial update), but remove `| null` from their types: `gender?: Gender` and `dateOfBirth?: string`

2. `admin.ts` — AdminUserResponse:
   - `gender: string | null` -> `gender: string` (remove `| null`)
   - `dateOfBirth: string | null` -> `dateOfBirth: string` (remove `| null`)

3. `household.ts` — HouseholdMemberResponse:
   - `gender: Gender | null` -> `gender: Gender` (remove `| null`)
   - `dateOfBirth: string | null` -> `dateOfBirth: string` (remove `| null`)
   - CreateMemberRequest: make gender and dateOfBirth required (remove `?`): `gender: Gender` and `dateOfBirth: string`
   - UpdateMemberRequest: keep gender/dateOfBirth as optional (partial update), but remove `| null`: `gender?: Gender` and `dateOfBirth?: string`

**Backend DTOs (apps/api/src/):**

4. `admin/users/dto/create-user.dto.ts` — CreateAdminUserDto:
   - Remove `@IsOptional()` from gender field; change `gender?: string` to `gender!: string`; change `@ApiPropertyOptional` to `@ApiProperty`
   - Remove `@IsOptional()` from dateOfBirth field; change `dateOfBirth?: string` to `dateOfBirth!: string`; change `@ApiPropertyOptional` to `@ApiProperty`; add `@IsDateString()` validator (import from class-validator)

5. `admin/users/dto/update-user.dto.ts` — UpdateAdminUserDto:
   - Keep gender and dateOfBirth as `@IsOptional()` (partial update DTO), but remove the possibility of setting to null. No changes needed here since `gender?: string` and `dateOfBirth?: string` already don't allow null.

6. `profile/dto/update-profile.dto.ts` — UpdateProfileDto:
   - Change `gender?: Gender | null` to `gender?: Gender` (remove `| null`)
   - Change `dateOfBirth?: string | null` to `dateOfBirth?: string` (remove `| null`)
   - Remove `nullable: true` from both `@ApiPropertyOptional` decorators

**Backend services (apps/api/src/):**

7. `admin/users/admin-users.service.ts`:
   - In `toAdminUserResponse` type signature: change `gender: string | null` to `gender: string` and `dateOfBirth: Date | null` to `dateOfBirth: Date`
   - In the return object: change `dateOfBirth: user.dateOfBirth ? user.dateOfBirth.toISOString() : null` to `dateOfBirth: user.dateOfBirth.toISOString()`
   - In `create` method: change `gender: (dto.gender as $Enums.Gender | undefined) ?? null` to `gender: dto.gender as $Enums.Gender` (required, no null fallback)
   - In `create` method: change `dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null` to `dateOfBirth: new Date(dto.dateOfBirth)`

8. `admin/households/admin-households.service.ts`:
   - In `toAdminUserResponse` type signature: change `gender: string | null` to `gender: string` and `dateOfBirth: Date | null` to `dateOfBirth: Date`
   - In the return: change `dateOfBirth: user.dateOfBirth ? user.dateOfBirth.toISOString() : null` to `dateOfBirth: user.dateOfBirth.toISOString()`

9. `profile/profile.service.ts`:
   - In `toProfileResponse` type signature: change `gender: string | null` to `gender: string` and `dateOfBirth: Date | null` to `dateOfBirth: Date`
   - In the return: change `dateOfBirth: user.dateOfBirth?.toISOString() ?? null` to `dateOfBirth: user.dateOfBirth.toISOString()`

**Tests:**

10. `admin/users/admin-users.service.spec.ts`:
    - In ALL mock user objects, change `gender: null` to `gender: 'other'` and `dateOfBirth: null` to `dateOfBirth: new Date('2000-01-01')` (there are ~7 occurrences on lines 104, 120, 129, 136, 145)

11. `apps/web/src/components/__tests__/ProfilePage.test.tsx`:
    - Change mock profile `gender: null` to `gender: 'female'` (or any valid Gender value)
    - Change mock profile `dateOfBirth: null` to `dateOfBirth: '1990-05-15'` (any valid ISO date string)
  </action>
  <verify>
    <automated>cd /home/solanoe/code/recipe-manager && npx tsc --noEmit -p apps/api/tsconfig.json && npx tsc --noEmit -p apps/web/tsconfig.json && cd apps/api && npx jest --passWithNoTests 2>&1 | tail -20</automated>
  </verify>
  <done>All shared types use non-nullable gender and dateOfBirth in responses. Create DTOs require both fields. Update DTOs keep them optional but non-nullable. All service mappers remove null-handling for these fields. All tests pass with non-null mock values. TypeScript compiles cleanly in both apps.</done>
</task>

</tasks>

<verification>
- `npx prisma validate` passes (schema is valid)
- `npx tsc --noEmit` passes in both apps/api and apps/web (no type errors)
- `cd apps/api && npx jest` passes (all backend tests green)
- Prisma schema shows `gender Gender` and `dateOfBirth DateTime` (no `?`)
- Prisma schema shows `email String?` (still optional)
</verification>

<success_criteria>
- gender and dateOfBirth are required (NOT NULL) in the database
- email remains optional (nullable) in the database
- All shared types, DTOs, services reflect the new nullability constraints
- All existing tests pass
- TypeScript compiles cleanly across the monorepo
</success_criteria>

<output>
After completion, create `.planning/quick/260319-qas-we-need-to-make-two-small-changes-to-the/260319-qas-SUMMARY.md`
</output>
