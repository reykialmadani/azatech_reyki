export interface User {
  id: string;
  name: string;
  email: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

// Dipakai juga oleh POST /auth/refresh (rotasi: refresh token lama hangus).
export interface LoginResult {
  access_token: string;
  refresh_token: string;
  token_type: "Bearer";
  expires_in: number; // detik
  user: User;
}
