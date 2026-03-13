export interface ProfileResponse {
  id: string;
  name: string;
  email: string | null;
  username: string | null;
  gender: string | null;
  dateOfBirth: string | null; // ISO date string
  householdId: string;
}

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
  username?: string;
  password?: string;
  gender?: string;
  dateOfBirth?: string;
}
