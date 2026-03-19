/**
 * Profile domain types.
 * Endpoints: GET /api/profile, PATCH /api/profile
 * Sources: mvp_plans/03_api_design.md + mvp_plans/01_tech_stack_and_data_model.md
 */
import { Gender } from '../enums';

/**
 * GET /api/profile — authenticated user's full profile.
 * Includes nullable fields from User entity.
 */
export interface ProfileResponse {
  id: string;
  householdId: string;
  name: string;
  email: string | null;
  gender: Gender | null;
  dateOfBirth: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * PATCH /api/profile — update profile fields.
 * All fields optional — only provided fields are updated.
 * password triggers passwordHash update server-side; requires currentPassword.
 */
export interface UpdateProfileRequest {
  name?: string;
  email?: string;
  gender?: Gender | null;
  dateOfBirth?: string | null;
  currentPassword?: string;
  password?: string;
}
