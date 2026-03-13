export interface SetupStatusResponse {
  required: boolean;
}

export interface CreateAdminRequest {
  name: string;
  email: string;
  password: string;
}

export interface CreateAdminResponse {
  id: string;
  name: string;
  email: string;
}
