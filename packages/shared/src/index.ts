/**
 * @recipe-manager/shared — API boundary type definitions.
 *
 * This package is the source of truth for the API contract between
 * apps/api (NestJS) and apps/web (Next.js).
 *
 * Phase 1–3 domains exported here:
 *   - auth: LoginRequest, MeResponse, LogoutResponse
 *   - setup: SetupStatusResponse, CreateAdminRequest, SetupResponse
 *   - profile: ProfileResponse, UpdateProfileRequest
 *   - household: HouseholdResponse, HouseholdMemberResponse, CreateMemberRequest, UpdateMemberRequest
 *   - common: PaginatedResponse<T>, ErrorResponse
 *   - enums: Gender, MealType
 *
 * Later domains (recipes, ingredients, steps, images, meal-plan, foods, units, admin)
 * are added by the phase that implements them.
 */
export * from './api/auth';
export * from './api/setup';
export * from './api/profile';
export * from './api/household';
export * from './common';
export * from './enums';
export * from './api/recipes';
export * from './api/meal-plan';
export * from './api/admin';
