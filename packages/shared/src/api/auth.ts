export interface LoginRequest {
  login: string; // email or username
  password: string;
}

export interface LoginResponse {
  id: string;
  name: string;
  email: string | null;
  username: string | null;
  householdId: string;
}

export interface MeResponse {
  id: string;
  name: string;
  email: string | null;
  username: string | null;
  householdId: string;
}

export interface LogoutResponse {
  message: string;
}
