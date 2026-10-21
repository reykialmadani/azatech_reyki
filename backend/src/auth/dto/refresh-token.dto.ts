import { IsJWT } from 'class-validator';

export class RefreshTokenDto {
  /** Refresh token dari response login / refresh sebelumnya. */
  @IsJWT({ message: 'Refresh token tidak valid' })
  refresh_token: string;
}
