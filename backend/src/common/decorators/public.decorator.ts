import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Membuka route dari JwtAuthGuard global (secure by default). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
