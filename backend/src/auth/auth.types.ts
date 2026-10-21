import type { Request } from 'express';

/** User yang menempel di request setelah lolos JwtAuthGuard. */
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  sessionId: string;
}

export interface AuthenticatedRequest extends Request {
  user: AuthUser;
}

/** Payload access & refresh token: `sid` mengikat token ke baris `sessions`. */
export interface TokenPayload {
  sub: string;
  sid: string;
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
}

export interface AuthTokensResponse {
  access_token: string;
  refresh_token: string;
  token_type: 'Bearer';
  /** Umur access token dalam detik. */
  expires_in: number;
  user: UserResponse;
}
