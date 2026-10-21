import { plainToInstance, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';
import { DURATION_PATTERN } from '../common/utils/duration.js';

class EnvironmentVariables {
  @IsOptional()
  @IsIn(['development', 'production', 'test'])
  NODE_ENV: 'development' | 'production' | 'test' = 'development';

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT = 4000;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL: string;

  // Boleh lebih dari satu origin, dipisah koma.
  @IsString()
  @IsNotEmpty()
  FRONTEND_URL: string;

  @IsString()
  @MinLength(16)
  JWT_ACCESS_SECRET: string;

  @IsString()
  @MinLength(16)
  JWT_REFRESH_SECRET: string;

  @Matches(DURATION_PATTERN, { message: 'JWT_ACCESS_TTL harus berformat <angka><s|m|h|d>, mis. 15m' })
  JWT_ACCESS_TTL = '15m';

  @Matches(DURATION_PATTERN, { message: 'JWT_REFRESH_TTL harus berformat <angka><s|m|h|d>, mis. 7d' })
  JWT_REFRESH_TTL = '7d';
}

export type Env = EnvironmentVariables;

/** Fail-fast saat boot jika env wajib hilang / tidak valid. */
export function validateEnv(config: Record<string, unknown>): Env {
  const env = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: false,
  });
  const errors = validateSync(env, { skipMissingProperties: false });
  if (errors.length > 0) {
    const detail = errors
      .map((e) => `${e.property}: ${Object.values(e.constraints ?? {}).join(', ')}`)
      .join('\n  ');
    throw new Error(`Konfigurasi environment tidak valid:\n  ${detail}`);
  }
  return env;
}
