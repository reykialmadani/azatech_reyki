const UNIT_SECONDS = { s: 1, m: 60, h: 3600, d: 86_400 } as const;

export const DURATION_PATTERN = /^(\d+)([smhd])$/;

/** "15m" → 900. Format dijaga oleh validasi env (DURATION_PATTERN). */
export function durationToSeconds(value: string): number {
  const match = DURATION_PATTERN.exec(value);
  if (!match) throw new Error(`Format durasi tidak valid: ${value}`);
  const [, amount, unit] = match as unknown as [string, string, keyof typeof UNIT_SECONDS];
  return Number(amount) * UNIT_SECONDS[unit];
}
