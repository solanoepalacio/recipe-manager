import type { Gender } from '../enums';

export interface MemberResponse {
  id: string;
  name: string;
  email: string | null;
  username: string | null;
  gender: Gender | null;
  dateOfBirth: string | null;
  canLogin: boolean; // true if passwordHash is not null
}

export interface HouseholdResponse {
  id: string;
  name: string;
  members: MemberResponse[];
}

export interface CreateMemberRequest {
  name: string;
  email?: string;
  username?: string;
  gender?: Gender;
  dateOfBirth?: string;
}

export interface UpdateMemberRequest {
  name?: string;
  email?: string;
  username?: string;
  gender?: Gender;
  dateOfBirth?: string;
}
