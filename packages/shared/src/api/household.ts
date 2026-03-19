/**
 * Household domain types.
 * Endpoints:
 *   GET /api/household
 *   GET /api/household/members
 *   POST /api/household/members
 *   GET /api/household/members/:id
 *   PATCH /api/household/members/:id
 *   DELETE /api/household/members/:id
 * Sources: mvp_plans/03_api_design.md + mvp_plans/01_tech_stack_and_data_model.md
 */
import { Gender } from '../enums';

/**
 * A single household member (User row with safe fields).
 * Used in member list and member detail responses.
 */
export interface HouseholdMemberResponse {
  id: string;
  name: string;
  email: string | null;
  username: string | null;
  gender: Gender;
  dateOfBirth: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * GET /api/household — household info with member list.
 * Household entity: id, name, createdAt, updatedAt.
 */
export interface HouseholdResponse {
  id: string;
  name: string;
  members: HouseholdMemberResponse[];
  createdAt: string;
  updatedAt: string;
}

/**
 * POST /api/household/members — add a no-login member (e.g. a child).
 * email, username, password are optional for no-login members.
 */
export interface CreateMemberRequest {
  name: string;
  email?: string;
  username?: string;
  password?: string;
  gender: Gender;
  dateOfBirth: string;
}

/**
 * PATCH /api/household/members/:id — edit a household member.
 * All fields optional.
 */
export interface UpdateMemberRequest {
  name?: string;
  email?: string | null;
  username?: string | null;
  gender?: Gender;
  dateOfBirth?: string;
}
