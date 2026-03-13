import type { MemberResponse } from './household';

export interface AdminLoginRequest {
  email: string;
  password: string;
}

export interface AdminLoginResponse {
  id: string;
  name: string;
  email: string;
}

export interface AdminUserResponse {
  id: string;
  name: string;
  email: string | null;
  username: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  householdId: string;
  householdName: string;
  canLogin: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCreateUserRequest {
  name: string;
  householdId: string;
  email?: string;
  username?: string;
  password?: string;
  gender?: string;
  dateOfBirth?: string;
}

export interface AdminUpdateUserRequest {
  name?: string;
  email?: string;
  username?: string;
  password?: string;
  gender?: string;
  dateOfBirth?: string;
  householdId?: string;
}

export interface AdminHouseholdResponse {
  id: string;
  name: string;
  members: MemberResponse[];
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminCreateHouseholdRequest {
  name: string;
}

export interface AdminUpdateHouseholdRequest {
  name?: string;
}

export interface AdminFoodRequest {
  name: string;
}

export interface AdminUnitRequest {
  name: string;
  abbreviation?: string;
}

export interface AdminTokenResponse {
  id: string;
  name: string;
  userId: string;
  userName: string;
  createdAt: string;
  lastUsedAt: string | null;
}

export interface AdminCreateTokenRequest {
  name: string;
  userId: string;
}

export interface AdminCreateTokenResponse {
  id: string;
  name: string;
  token: string; // raw token shown once
}

export interface PasswordResetUrlResponse {
  resetUrl: string;
}
