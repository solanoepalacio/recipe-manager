/**
 * Auth domain types.
 * Endpoints: POST /api/auth/login, POST /api/auth/logout, GET /api/auth/me
 * Sources: mvp_plans/03_api_design.md + mvp_plans/01_tech_stack_and_data_model.md
 */

/** POST /api/auth/login — login with email + password */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * GET /api/auth/me — authenticated user info.
 * Derived from User entity fields exposed via the API.
 * Does NOT include passwordHash, resetToken, or internal fields.
 */
export interface MeResponse {
  id: string;
  householdId: string;
  name: string;
  email: string | null;
  createdAt: string;
  updatedAt: string;
}

/** POST /api/auth/logout — no body, no meaningful response body */
export interface LogoutResponse {
  message: string;
}
