/**
 * Admin domain — response and request interfaces for all admin endpoints.
 * Used by apps/api admin controllers (DTOs implement these) and apps/web admin panel.
 * Omits all sensitive fields: passwordHash, resetToken, resetTokenExpiry, tokenHash.
 */

export interface AdminUserResponse {
  id: string;
  householdId: string;
  householdName?: string;
  name: string;
  email: string | null;
  username: string | null;
  userType: string;
  gender: string | null;
  dateOfBirth: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Returned by POST /admin/users when userType=agent — autoToken shown once */
export interface AdminUserCreatedResponse extends AdminUserResponse {
  autoToken?: string;
}

export interface AdminHouseholdResponse {
  id: string;
  name: string;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminHouseholdDetailResponse {
  id: string;
  name: string;
  members: AdminUserResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminFoodResponse {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUnitResponse {
  id: string;
  name: string;
  abbreviation: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Returned by GET /admin/tokens — tokenHash is NEVER exposed */
export interface AdminTokenResponse {
  id: string;
  name: string;
  userId: string;
  userName?: string;
  householdName?: string;
  createdById: string;
  createdAt: string;
  lastUsedAt: string | null;
}

/** Returned by POST /admin/tokens ONLY — raw token shown once */
export interface AdminTokenCreatedResponse extends AdminTokenResponse {
  token: string;
}

/** Returned by GET /admin/auth/me */
export interface AdminMeResponse {
  id: string;
  email: string;
  name: string;
}
