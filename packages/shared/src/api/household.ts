export interface MemberResponse {
  id: string;
  name: string;
  email: string | null;
  username: string | null;
  gender: string | null;
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
  gender?: string;
  dateOfBirth?: string;
}

export interface UpdateMemberRequest {
  name?: string;
  email?: string;
  username?: string;
  gender?: string;
  dateOfBirth?: string;
}
