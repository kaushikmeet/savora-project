export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  user?: AuthUser;
}