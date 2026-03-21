/**
 * Setup domain types.
 * Endpoints: GET /api/setup, POST /api/setup
 * Sources: plans/01_App/03_api_design.md + plans/01_App/01_tech_stack_and_data_model.md
 */

/** GET /api/setup — check if setup is required */
export interface SetupStatusResponse {
  required: boolean;
}

/**
 * POST /api/setup — create the Admin account.
 * Admin fields: name, email, password (passwordHash stored server-side).
 * Only accessible when no Admin record exists (enforced by SetupGuard).
 */
export interface CreateAdminRequest {
  name: string;
  email: string;
  password: string;
}

/** POST /api/setup response — Admin created */
export interface SetupResponse {
  message: string;
}
