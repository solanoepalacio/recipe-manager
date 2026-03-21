/**
 * Household domain types.
 * Endpoints:
 *   GET /api/household
 *   GET /api/household/members
 *   POST /api/household/members
 *   GET /api/household/members/:id
 *   PATCH /api/household/members/:id
 *   DELETE /api/household/members/:id
 * Sources: plans/01_App/03_api_design.md + plans/01_App/01_tech_stack_and_data_model.md
 */
import { Gender, UserType } from '../enums';

/**
 * A single household member (User row with safe fields).
 * Used in member list and member detail responses.
 */
export interface HouseholdMemberResponse {
  id: string;
  name: string;
  email: string | null;
  username: string | null;
  userType: UserType;
  gender: Gender | null;
  dateOfBirth: string | null;
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
 * POST /api/household/members — add a member.
 * Required fields depend on userType:
 *   normal: name, email, password, gender, dateOfBirth
 *   kid: name, dateOfBirth (gender optional)
 *   agent: name only
 */
export interface CreateMemberRequest {
  userType: UserType;
  name: string;
  email?: string;
  username?: string;
  password?: string;
  gender?: Gender;
  dateOfBirth?: string;
}

/**
 * PATCH /api/household/members/:id — edit a household member.
 * All fields optional.
 */
export interface UpdateMemberRequest {
  userType?: UserType;
  name?: string;
  email?: string | null;
  username?: string | null;
  gender?: Gender;
  dateOfBirth?: string;
}
