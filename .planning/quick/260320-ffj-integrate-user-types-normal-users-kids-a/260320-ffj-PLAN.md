---
phase: quick
plan: 260320-ffj
type: execute
wave: 1
depends_on: []
files_modified:
  - packages/shared/src/enums.ts
  - packages/shared/src/api/household.ts
  - packages/shared/src/api/admin.ts
  - packages/shared/src/api/auth.ts
  - apps/api/prisma/schema.prisma
  - apps/api/src/household/household.service.ts
  - apps/api/src/admin/users/dto/create-user.dto.ts
  - apps/api/src/admin/users/dto/update-user.dto.ts
  - apps/api/src/admin/users/admin-users.service.ts
  - apps/api/src/admin/tokens/admin-tokens.service.ts
  - apps/api/src/admin/tokens/dto/create-token.dto.ts
  - apps/api/src/admin/tokens/admin-tokens.controller.ts
  - apps/api/src/auth/auth.service.ts
  - apps/api/src/auth/guards/any-auth.guard.ts
  - apps/api/prisma/seed-dev.ts
  - apps/web/src/app/(app)/household/page.tsx
  - apps/web/src/app/(admin)/admin/panel/households/page.tsx
  - apps/web/src/app/(admin)/admin/panel/tokens/page.tsx
autonomous: true
requirements: []
must_haves:
  truths:
    - "Each user has a userType field: normal, kid, or agent"
    - "Kids do not require email, password, or gender — only name and dateOfBirth"
    - "Agents do not require email, password, gender, or dateOfBirth — only name"
    - "Normal users require name, email, password, gender, and dateOfBirth"
    - "When creating a household member, I choose a member type and only see relevant fields"
    - "Agent users get an API token automatically created when they are created"
    - "On the admin tokens page, the user dropdown only shows agent-type users"
    - "Token dropdown shows household name next to agent name for easy identification"
    - "Only normal users (with email+password) can log in via session auth"
    - "Existing users default to userType=normal"
  artifacts:
    - path: "packages/shared/src/enums.ts"
      provides: "UserType enum"
      contains: "UserType"
    - path: "apps/api/prisma/schema.prisma"
      provides: "UserType Prisma enum + User.userType field"
      contains: "enum UserType"
  key_links:
    - from: "apps/api/src/admin/users/admin-users.service.ts"
      to: "apps/api/src/admin/tokens/admin-tokens.service.ts"
      via: "auto-create token for agent user on creation"
      pattern: "apiToken.create"
    - from: "apps/web/src/app/(admin)/admin/panel/tokens/page.tsx"
      to: "/admin/users?userType=agent"
      via: "filtered query for agent users only"
      pattern: "userType.*agent"
---

<objective>
Integrate user types (normal, kid, agent) across the full stack: schema, shared types, backend services/DTOs, and frontend forms.

Purpose: Enable family-oriented member management where kids are tracked without login credentials and agents represent API-consuming bots with auto-assigned tokens.
Output: Updated Prisma schema with UserType enum, type-aware backend validation, type-conditional frontend forms, agent-only token assignment.
</objective>

<execution_context>
@/home/solanoe/code/recipe-manager/.claude/get-shit-done/workflows/execute-plan.md
@/home/solanoe/code/recipe-manager/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@packages/shared/src/enums.ts
@packages/shared/src/api/household.ts
@packages/shared/src/api/admin.ts
@packages/shared/src/api/auth.ts
@apps/api/prisma/schema.prisma
@apps/api/src/household/household.service.ts
@apps/api/src/admin/users/admin-users.service.ts
@apps/api/src/admin/users/dto/create-user.dto.ts
@apps/api/src/admin/tokens/admin-tokens.service.ts
@apps/api/src/admin/tokens/dto/create-token.dto.ts
@apps/api/src/admin/tokens/admin-tokens.controller.ts
@apps/api/src/auth/auth.service.ts
@apps/api/prisma/seed-dev.ts
@apps/web/src/app/(app)/household/page.tsx
@apps/web/src/app/(admin)/admin/panel/households/page.tsx
@apps/web/src/app/(admin)/admin/panel/tokens/page.tsx

<interfaces>
From packages/shared/src/enums.ts:
```typescript
export enum Gender {
  Male = 'male',
  Female = 'female',
  Other = 'other',
}
```

From packages/shared/src/api/household.ts:
```typescript
export interface HouseholdMemberResponse {
  id: string; name: string; email: string | null; username: string | null;
  gender: Gender; dateOfBirth: string; createdAt: string; updatedAt: string;
}
export interface CreateMemberRequest {
  name: string; email?: string; username?: string; password?: string;
  gender: Gender; dateOfBirth: string;
}
```

From packages/shared/src/api/admin.ts:
```typescript
export interface AdminUserResponse {
  id: string; householdId: string; name: string; email: string | null;
  username: string | null; gender: string; dateOfBirth: string;
  createdAt: string; updatedAt: string;
}
export interface AdminTokenResponse {
  id: string; name: string; userId: string; createdById: string;
  createdAt: string; lastUsedAt: string | null;
}
export interface AdminTokenCreatedResponse extends AdminTokenResponse {
  token: string;
}
```

Prisma User model fields:
- id, householdId, name, email?, passwordHash?, resetToken?, resetTokenExpiry?, gender, dateOfBirth, createdAt, updatedAt
- email is already optional (String?), passwordHash is already optional (String?)
- gender is required (Gender enum), dateOfBirth is required (DateTime)
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add UserType enum and update schema, shared types, and backend</name>
  <files>
    packages/shared/src/enums.ts
    packages/shared/src/api/household.ts
    packages/shared/src/api/admin.ts
    packages/shared/src/api/auth.ts
    apps/api/prisma/schema.prisma
    apps/api/src/household/household.service.ts
    apps/api/src/admin/users/dto/create-user.dto.ts
    apps/api/src/admin/users/dto/update-user.dto.ts
    apps/api/src/admin/users/admin-users.service.ts
    apps/api/src/admin/tokens/admin-tokens.service.ts
    apps/api/src/admin/tokens/dto/create-token.dto.ts
    apps/api/src/admin/tokens/admin-tokens.controller.ts
    apps/api/src/auth/auth.service.ts
    apps/api/prisma/seed-dev.ts
  </files>
  <action>
    **1. Shared types — enums.ts:**
    Add `UserType` enum with values: `Normal = 'normal'`, `Kid = 'kid'`, `Agent = 'agent'`.

    **2. Prisma schema:**
    - Add `enum UserType { normal kid agent }` (matching TypeScript enum values).
    - Add `userType UserType @default(normal)` field to the `User` model.
    - Make `gender` optional: change `Gender` to `Gender?` (kids inherit null, agents have null).
    - Make `dateOfBirth` optional: change `DateTime` to `DateTime?` (agents have no DOB).
    - Run `npx prisma migrate dev --name add_user_type` from `apps/api/`.
    - Run `npx prisma generate`.

    **3. Shared types — household.ts:**
    - Add `userType: UserType` (import from enums) to `HouseholdMemberResponse`.
    - Update `CreateMemberRequest`: add `userType: UserType`, make `gender` optional (`gender?: Gender`), make `dateOfBirth` optional (`dateOfBirth?: string`).
    - Update `UpdateMemberRequest`: add optional `userType?: UserType`.

    **4. Shared types — admin.ts:**
    - Add `userType: string` to `AdminUserResponse`.
    - Add `userName?: string` and `householdName?: string` to `AdminTokenResponse` (so the tokens page can show who owns the token and their household).

    **5. Backend — admin-users DTOs:**
    - `create-user.dto.ts`: Add `@IsOptional() @IsString() userType?: string` field (defaults to 'normal' in service). Make `gender` `@IsOptional()`. Make `dateOfBirth` `@IsOptional()`. Make `email` `@IsOptional()`. Make `password` `@IsOptional()`. All with `@ApiPropertyOptional()`.
    - `update-user.dto.ts`: Add `@IsOptional() @IsString() userType?: string`.

    **6. Backend — admin-users.service.ts:**
    - Update `USER_SELECT` to include `userType: true`.
    - Update `toAdminUserResponse` to include `userType: user.userType`.
    - In `create()`: validate type-specific required fields:
      - If `userType === 'normal'`: require email, password, gender, dateOfBirth (throw BadRequestException if missing).
      - If `userType === 'kid'`: require name and dateOfBirth. gender is optional. email/password NOT required.
      - If `userType === 'agent'`: require only name. No email, password, gender, dateOfBirth needed.
    - In `create()`: when `userType === 'agent'`, after creating the user, auto-create an ApiToken:
      - Generate `rawToken = randomBytes(32).toString('hex')`, `tokenHash = createHash('sha256')...`.
      - Find the first admin (or use a system-level approach): `const admin = await this.prisma.admin.findFirst()`.
      - Create `apiToken` with `name: "Auto: {user.name}"`, `userId: newUser.id`, `createdById: admin.id`, `tokenHash`.
      - Log a message but do NOT return the raw token from create-user endpoint. The token can be viewed/recreated from the tokens admin page.

      Actually, BETTER approach: return the raw token in the response so the admin can see it once. Add an optional `autoToken?: string` field to `AdminUserResponse` in shared types. Only populated on creation of agent users.

      Wait — cleaner: After creating agent user, also auto-create a token. Return a NEW response type `AdminUserCreatedResponse extends AdminUserResponse { autoToken?: string }` in shared types. The admin-users controller POST endpoint returns this type. The token is shown once.

    - In `create()`: set `userType` from DTO (default 'normal'), cast to Prisma enum. Set `gender` to null for agents. Set `dateOfBirth` to null for agents.

    **7. Backend — admin-tokens.service.ts:**
    - Update `findAll()`: join user and user's household in the query to return `userName` and `householdName` in the response. Update `TOKEN_SELECT` to include `user: { select: { name: true, household: { select: { name: true } } } }`. Update `toAdminTokenResponse` to map these.
    - Add a new method `findAllAgentUsers()` that returns users where `userType === 'agent'`. This is used by the frontend token creation form. OR: add a `?userType=agent` filter to the existing admin-users findAll endpoint.

    Better: Add `userType` query param filter to `AdminUsersService.findAll()` and `AdminUsersController`. The tokens page queries `/admin/users?userType=agent&perPage=100`.

    **8. Backend — admin-users.service.ts (findAll filter):**
    - Add optional `userType?: string` parameter to `findAll(page, perPage, userType?)`.
    - When `userType` is provided, add `where: { userType: userType as $Enums.UserType }` to the Prisma query.

    **9. Backend — admin-users controller:**
    - Add `@Query('userType') userType?: string` to the `findAll` handler. Pass to service.

    **10. Backend — household.service.ts:**
    - Update member mapping to include `userType` field from the user record.

    **11. Backend — auth.service.ts validateUser:**
    - Add a check: if the found user has `userType !== 'normal'`, return null (only normal users can log in via session). This prevents kids and agents from logging in via the web UI.

    **12. Backend — admin-tokens.service.ts create:**
    - Add validation: the `userId` must point to a user with `userType === 'agent'`. If not, throw `BadRequestException('Solo se pueden crear tokens para usuarios de tipo agente')`.

    **13. Seed — seed-dev.ts:**
    - Add a sample kid user: `{ name: 'Sofia', gender: 'female', dateOfBirth: new Date('2018-06-15'), userType: 'kid', householdId }`.
    - Add a sample agent user: `{ name: 'Recipe Bot', userType: 'agent', householdId }`.
    - The existing test user gets `userType: 'normal'` explicitly (migration default handles it but explicit is clearer).

    **14. Backend — admin-tokens `TOKEN_SELECT` and response:**
    - Update TOKEN_SELECT to include `user: { select: { name: true, userType: true, household: { select: { name: true } } } }`.
    - Update `toAdminTokenResponse` to return `userName` and `householdName`.
  </action>
  <verify>
    <automated>cd /home/solanoe/code/recipe-manager && npx prisma generate --schema=apps/api/prisma/schema.prisma && yarn workspace @recipe-manager/shared build && yarn workspace @recipe-manager/api build</automated>
  </verify>
  <done>
    - UserType enum exists in shared and Prisma schema
    - User model has userType field defaulting to 'normal'
    - gender and dateOfBirth are optional on User model
    - Migration applied successfully
    - Backend compiles with type-conditional validation
    - Agent users get auto-token on creation
    - Auth rejects non-normal users from session login
    - Token creation restricted to agent-type users
    - Admin users endpoint supports ?userType= filter
    - Token list response includes userName and householdName
  </done>
</task>

<task type="auto">
  <name>Task 2: Update frontend — household member forms and admin tokens page</name>
  <files>
    apps/web/src/app/(app)/household/page.tsx
    apps/web/src/app/(admin)/admin/panel/households/page.tsx
    apps/web/src/app/(admin)/admin/panel/tokens/page.tsx
  </files>
  <action>
    **1. User-facing household page (apps/web/src/app/(app)/household/page.tsx):**
    - Import `UserType` from `@recipe-manager/shared`.
    - Show a badge/tag next to each member name indicating their type. Use Spanish labels: "Adulto" for normal, "Nino/a" for kid, "Agente" for agent.
    - For kids, show age. For agents, show "Bot" or similar indicator instead of age.

    **2. Admin households page — member creation form:**
    - Add a `formMemberUserType` state (default: `'normal'`).
    - Add a "Tipo de miembro" select as the FIRST field in the member creation form with options: Adulto (normal), Nino/a (kid), Agente (agent).
    - Conditionally show/hide fields based on selected type:
      - **normal**: Show name, email (required), password (required), gender (required), dateOfBirth (required).
      - **kid**: Show name (required), dateOfBirth (required), gender (optional). Hide email and password.
      - **agent**: Show only name (required). Hide email, password, gender, dateOfBirth.
    - On submit, include `userType` in the mutation payload. For kid/agent, do NOT send empty strings for hidden fields — omit them entirely.
    - When editing a member, pre-fill `formMemberUserType` from `user.userType`. Conditionally show fields based on type.
    - Update the `handleOpenEditMember` to read `user.userType` (use `(user as any).userType ?? 'normal'` to handle the new field gracefully — or better, since AdminUserResponse now has `userType`, use it directly).
    - Hide "Restablecer contrasena" button for kid and agent members (they have no password).
    - In the member list inside HouseholdRow, show a small type badge next to member name (e.g., light gray tag "nino" or "agente").

    **3. Admin tokens page:**
    - Change the users query to filter by `userType=agent`: `adminApi.get<PaginatedResponse<AdminUserResponse>>('/admin/users?userType=agent&page=1&perPage=100')`.
    - Update the user dropdown to show household name next to agent name. Since AdminUserResponse has `householdId` but not `householdName`, we need to resolve it. Two options:
      - Option A: Fetch households list and join client-side.
      - Option B: Add `householdName` to `AdminUserResponse` (cleaner).

      Use Option B: Add optional `householdName?: string` to `AdminUserResponse` in shared types. Populate it in admin-users.service.ts by including `household: { select: { name: true } }` in USER_SELECT. Update the user dropdown: `{u.name} — {u.householdName ?? ''}`.

    - Update the "Usuario" column in the tokens table to show `userName` and `householdName` from the token response (already added in Task 1). Format: "{userName} ({householdName})".
    - Remove the separate `usersData` query for `resolveUserName` — the token response now has `userName` and `householdName` directly.

    **4. If `AdminUserCreatedResponse` was added (with autoToken), show a OneTimeDisplay on the admin households page after creating an agent member, showing the auto-generated token.**
  </action>
  <verify>
    <automated>cd /home/solanoe/code/recipe-manager && yarn workspace @recipe-manager/web build</automated>
  </verify>
  <done>
    - Household page shows member type badges
    - Admin member creation form shows type selector with conditional fields
    - Kid form shows only name + dateOfBirth + optional gender
    - Agent form shows only name
    - Normal form shows all fields (name, email, password, gender, dateOfBirth)
    - Admin tokens page user dropdown only shows agent users
    - Token dropdown shows agent name with household name for identification
    - Token table shows user name and household name per token
    - Password reset button hidden for kid and agent members
    - Frontend builds without errors
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>Full user types integration across schema, backend, and frontend. Three user types (normal, kid, agent) with type-specific field requirements, auto-token for agents, and filtered token assignment.</what-built>
  <how-to-verify>
    1. Start the API and web app.
    2. Go to Admin panel > Hogares. Expand a household.
    3. Click "Agregar miembro". Verify type selector appears (Adulto/Nino/Agente).
    4. Select "Nino/a" — verify only name, fecha de nacimiento, and optional genero fields appear. Create a kid member.
    5. Select "Agente" — verify only name field appears. Create an agent. Verify a one-time token is displayed.
    6. Select "Adulto" — verify all fields (name, email, password, gender, DOB) appear and are required. Create a normal member.
    7. Go to Admin panel > Tokens. Click "Crear token". Verify user dropdown only shows agent users with household name visible.
    8. Go to the user-facing Household page. Verify member type badges appear next to each member name.
    9. Try logging in as a kid or agent user — should be rejected.
  </how-to-verify>
  <resume-signal>Type "approved" or describe issues</resume-signal>
</task>

</tasks>

<verification>
- `yarn workspace @recipe-manager/shared build` succeeds
- `yarn workspace @recipe-manager/api build` succeeds
- `yarn workspace @recipe-manager/web build` succeeds
- Prisma migration applies cleanly
- Existing users default to userType=normal (migration default)
</verification>

<success_criteria>
- Three user types exist and are enforced at schema and API level
- Frontend forms adapt to selected user type
- Agent users automatically get an API token on creation
- Token creation restricted to agent users only
- Token page shows agent name + household name for identification
- Session login rejects non-normal users
- Existing data unaffected (defaults to normal)
</success_criteria>

<output>
After completion, create `.planning/quick/260320-ffj-integrate-user-types-normal-users-kids-a/260320-ffj-SUMMARY.md`
</output>
