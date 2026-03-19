---
phase: quick
plan: 260319-qsa
type: execute
wave: 1
depends_on: []
files_modified:
  - apps/web/src/app/(app)/profile/page.tsx
  - apps/web/src/app/(admin)/admin/panel/households/page.tsx
autonomous: true
requirements: []
must_haves:
  truths:
    - "Profile edit form shows gender dropdown and date of birth input"
    - "Admin create member form requires gender and dateOfBirth"
    - "Admin edit member form shows gender and dateOfBirth with existing values"
    - "All three forms send gender/dateOfBirth to the API on save"
  artifacts:
    - path: "apps/web/src/app/(app)/profile/page.tsx"
      provides: "Profile form with gender + dateOfBirth fields"
    - path: "apps/web/src/app/(admin)/admin/panel/households/page.tsx"
      provides: "Admin member forms with gender + dateOfBirth fields"
  key_links:
    - from: "apps/web/src/app/(app)/profile/page.tsx"
      to: "PATCH /api/profile"
      via: "updateMutation payload includes gender and dateOfBirth"
    - from: "apps/web/src/app/(admin)/admin/panel/households/page.tsx"
      to: "POST /api/admin/users"
      via: "createMember mutation payload includes gender and dateOfBirth"
---

<objective>
Add gender and dateOfBirth fields to three UI forms: (1) the user profile edit page, (2) the admin households panel create-member form, and (3) the admin households panel edit-member form.

Purpose: The backend already accepts and returns these fields. The shared types already define them. The UI forms simply never rendered inputs for them.
Output: Updated profile page and admin households page with working gender/dateOfBirth inputs.
</objective>

<execution_context>
@/home/solanoe/code/recipe-manager/.claude/get-shit-done/workflows/execute-plan.md
@/home/solanoe/code/recipe-manager/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@packages/shared/src/enums.ts (Gender enum: Male='male', Female='female', Other='other')
@packages/shared/src/api/profile.ts (ProfileResponse has gender: Gender, dateOfBirth: string; UpdateProfileRequest has optional gender/dateOfBirth)
@packages/shared/src/api/admin.ts (AdminUserResponse has gender: string, dateOfBirth: string)
@packages/shared/src/api/household.ts (CreateMemberRequest requires gender: Gender and dateOfBirth: string)

<interfaces>
From packages/shared/src/enums.ts:
```typescript
export enum Gender {
  Male = 'male',
  Female = 'female',
  Other = 'other',
}
```

From packages/shared/src/api/profile.ts:
```typescript
export interface ProfileResponse {
  id: string; householdId: string; name: string; email: string | null;
  gender: Gender; dateOfBirth: string; createdAt: string; updatedAt: string;
}
export interface UpdateProfileRequest {
  name?: string; email?: string; gender?: Gender; dateOfBirth?: string;
  currentPassword?: string; password?: string;
}
```

From packages/shared/src/api/admin.ts:
```typescript
export interface AdminUserResponse {
  id: string; householdId: string; name: string; email: string | null;
  username: string | null; gender: string; dateOfBirth: string;
  createdAt: string; updatedAt: string;
}
```

Backend DTOs (apps/api/src/admin/users/dto/):
- CreateAdminUserDto: gender (required string), dateOfBirth (required ISO date string)
- UpdateAdminUserDto: gender (optional string), dateOfBirth (optional string)
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add gender and dateOfBirth to profile edit form</name>
  <files>apps/web/src/app/(app)/profile/page.tsx</files>
  <action>
Import Gender enum from @recipe-manager/shared (add to the existing import line that pulls ProfileResponse and UpdateProfileRequest).

Add two state variables initialized from profile data:
- `gender` (type Gender, default Gender.Male)
- `dateOfBirth` (type string, default '')

In useEffect where profile data populates state, add:
- setGender(profile.gender)
- setDateOfBirth(profile.dateOfBirth ?? '')

Add two form fields after the email field and before the "Cambiar contrasena" button:

1. Gender select dropdown:
   - Label: "Genero" (text-[13px] text-secondary mb-1 block)
   - `<select>` with same styling as inputs (bg-subtle border-[1.5px] border-border rounded-[12px] py-4 px-4 text-[15px] text-foreground focus:outline-none focus:border-foreground)
   - Options: Masculino (male), Femenino (female), Otro (other) — using Gender enum values

2. Date of birth input:
   - Label: "Fecha de nacimiento" (text-[13px] text-secondary mb-1 block)
   - `<input type="date">` with same styling as other inputs
   - value bound to dateOfBirth state

In handleSave, add gender and dateOfBirth to the payload:
```typescript
const payload: UpdateProfileRequest = { name };
if (email) payload.email = email;
if (gender) payload.gender = gender;
if (dateOfBirth) payload.dateOfBirth = dateOfBirth;
```
  </action>
  <verify>
    <automated>cd /home/solanoe/code/recipe-manager && npx tsc --noEmit -p apps/web/tsconfig.json 2>&1 | head -30</automated>
  </verify>
  <done>Profile page renders gender dropdown and date-of-birth date picker; saving sends both fields to PATCH /api/profile</done>
</task>

<task type="auto">
  <name>Task 2: Add gender and dateOfBirth to admin create/edit member forms</name>
  <files>apps/web/src/app/(admin)/admin/panel/households/page.tsx</files>
  <action>
Import Gender enum from @recipe-manager/shared (add to the existing import line).

Add two state variables in AdminHouseholdsPage:
- `formMemberGender` (type string, default Gender.Male as string)
- `formMemberDateOfBirth` (type string, default '')

Reset them in closeForm():
- setFormMemberGender(Gender.Male)
- setFormMemberDateOfBirth('')

Populate them in handleOpenEditMember(user):
- setFormMemberGender(user.gender)
- setFormMemberDateOfBirth(user.dateOfBirth ?? '')

Add two form fields inside the member form section (after email field, before password field for create; after username field for edit):

1. Gender select:
   - Label: "Genero *" (required for create, optional label for edit)
   - `<select>` matching existing input styling (bg-subtle border border-border rounded-[8px] py-3 px-4 text-[15px] text-foreground)
   - Options: Masculino (male), Femenino (female), Otro (other)
   - value={formMemberGender} onChange={e => setFormMemberGender(e.target.value)}

2. Date of birth:
   - Label: "Fecha de nacimiento *" (required for create, optional label for edit)
   - `<input type="date">` matching existing input styling
   - value={formMemberDateOfBirth} onChange={e => setFormMemberDateOfBirth(e.target.value)}
   - required attribute on create mode only

These two fields should appear for BOTH createMember and editMember form modes (they are inside the `formMode.type === 'createMember' || formMode.type === 'editMember'` block).

Update handleSubmit:
- For createMember: add gender: formMemberGender and dateOfBirth: formMemberDateOfBirth to the mutate body. Update the createMember mutationFn type to include gender and dateOfBirth.
- For editMember: add gender: formMemberGender and dateOfBirth: formMemberDateOfBirth to the updateMember mutate body. Update the updateMember mutationFn type to include gender and dateOfBirth.
  </action>
  <verify>
    <automated>cd /home/solanoe/code/recipe-manager && npx tsc --noEmit -p apps/web/tsconfig.json 2>&1 | head -30</automated>
  </verify>
  <done>Admin create-member form sends gender+dateOfBirth as required fields; admin edit-member form sends them as optional fields; both display correct values from existing data</done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit -p apps/web/tsconfig.json` — no type errors
2. Manual: open profile page, verify gender dropdown and date picker appear with current values
3. Manual: admin panel > households > expand > "Agregar miembro" shows gender/dateOfBirth fields
4. Manual: admin panel > households > expand > member "Editar" shows pre-filled gender/dateOfBirth
</verification>

<success_criteria>
- Profile edit page has working gender dropdown (Masculino/Femenino/Otro) and date-of-birth date input
- Admin create-member form requires gender and dateOfBirth (both marked required)
- Admin edit-member form pre-fills gender and dateOfBirth from existing user data
- All forms include gender and dateOfBirth in their API mutation payloads
- TypeScript compiles without errors
</success_criteria>

<output>
After completion, create `.planning/quick/260319-qsa-add-dateofbirth-and-gender-fields-to-the/260319-qsa-SUMMARY.md`
</output>
