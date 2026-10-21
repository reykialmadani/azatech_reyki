import { createHash, randomUUID } from 'node:crypto';
import { Injectable, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { durationToSeconds } from '../common/utils/duration.js';
import type { Env } from '../config/env.validation.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  AuthTokensResponse,
  AuthUser,
  TokenPayload,
  UserResponse,
} from './auth.types.js';

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

const INVALID_SESSION = 'Sesi tidak valid atau telah berakhir';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly accessTtl: number;
  private readonly refreshTtl: number;
  /** Hash palsu agar waktu respons sama walau email tidak terdaftar (anti user-enumeration). */
  private dummyHash = '';

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    config: ConfigService<Env, true>,
  ) {
    this.accessSecret = config.get('JWT_ACCESS_SECRET', { infer: true });
    this.refreshSecret = config.get('JWT_REFRESH_SECRET', { infer: true });
    this.accessTtl = durationToSeconds(config.get('JWT_ACCESS_TTL', { infer: true }));
    this.refreshTtl = durationToSeconds(config.get('JWT_REFRESH_TTL', { infer: true }));
  }

  async onModuleInit(): Promise<void> {
    this.dummyHash = await argon2.hash(randomUUID());
  }

  async login(email: string, password: string): Promise<AuthTokensResponse> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    const passwordValid = await argon2.verify(user?.password ?? this.dummyHash, password);
    if (!user || !passwordValid) {
      throw new UnauthorizedException('Email atau password salah');
    }

    const sessionId = randomUUID();
    const tokens = await this.signTokens(user.id, sessionId);
    await this.prisma.session.create({
      data: {
        id: sessionId,
        userId: user.id,
        refreshTokenHash: sha256(tokens.refresh_token),
        expiresAt: this.refreshExpiry(),
      },
    });
    return { ...tokens, user: toUserResponse(user) };
  }

  /**
   * Rotasi refresh token: token lama hanya bisa dipakai sekali. Jika token lama
   * dipakai ulang (indikasi dicuri), seluruh sesi di-revoke.
   */
  async refresh(refreshToken: string): Promise<AuthTokensResponse> {
    const payload = await this.verify(refreshToken, this.refreshSecret);
    const session = await this.prisma.session.findUnique({
      where: { id: payload.sid },
      include: { user: true },
    });
    if (!session || !isActive(session) || session.userId !== payload.sub) {
      throw new UnauthorizedException(INVALID_SESSION);
    }

    const presentedHash = sha256(refreshToken);
    if (session.refreshTokenHash !== presentedHash) {
      await this.revokeSession(session.id);
      throw new UnauthorizedException(INVALID_SESSION);
    }

    const tokens = await this.signTokens(session.userId, session.id);
    // Compare-and-swap: dua refresh bersamaan dengan token yang sama → hanya satu yang menang.
    const { count } = await this.prisma.session.updateMany({
      where: { id: session.id, refreshTokenHash: presentedHash, revokedAt: null },
      data: { refreshTokenHash: sha256(tokens.refresh_token), expiresAt: this.refreshExpiry() },
    });
    if (count === 0) throw new UnauthorizedException(INVALID_SESSION);

    return { ...tokens, user: toUserResponse(session.user) };
  }

  async logout(sessionId: string): Promise<void> {
    await this.revokeSession(sessionId);
  }

  /** Dipakai JwtAuthGuard: token valid DAN sesinya masih aktif (belum logout). */
  async authenticate(accessToken: string): Promise<AuthUser> {
    const payload = await this.verify(accessToken, this.accessSecret);
    const session = await this.prisma.session.findUnique({
      where: { id: payload.sid },
      select: {
        expiresAt: true,
        revokedAt: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });
    if (!session || !isActive(session) || session.user.id !== payload.sub) {
      throw new UnauthorizedException(INVALID_SESSION);
    }
    return { ...session.user, sessionId: payload.sid };
  }

  private async signTokens(userId: string, sessionId: string) {
    const payload: TokenPayload = { sub: userId, sid: sessionId };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, { secret: this.accessSecret, expiresIn: this.accessTtl }),
      // jwtid unik → setiap rotasi menghasilkan token (dan hash) yang berbeda.
      this.jwt.signAsync(payload, {
        secret: this.refreshSecret,
        expiresIn: this.refreshTtl,
        jwtid: randomUUID(),
      }),
    ]);
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer' as const,
      expires_in: this.accessTtl,
    };
  }

  private async verify(token: string, secret: string): Promise<TokenPayload> {
    try {
      return await this.jwt.verifyAsync<TokenPayload>(token, { secret });
    } catch {
      throw new UnauthorizedException(INVALID_SESSION);
    }
  }

  private async revokeSession(sessionId: string) {
    await this.prisma.session.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private refreshExpiry() {
    return new Date(Date.now() + this.refreshTtl * 1000);
  }
}

const isActive = (session: { revokedAt: Date | null; expiresAt: Date }) =>
  session.revokedAt === null && session.expiresAt > new Date();

export const toUserResponse = (user: UserResponse): UserResponse => ({
  id: user.id,
  name: user.name,
  email: user.email,
});
