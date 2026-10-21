export interface PaginationMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

/** Hasil list ber-pagination; ResponseInterceptor memecahnya menjadi `data` + `meta`. */
export class Paginated<T> {
  constructor(
    readonly data: T[],
    readonly meta: PaginationMeta,
  ) {}
}

export const toSkipTake = (page: number, perPage: number) => ({
  skip: (page - 1) * perPage,
  take: perPage,
});

export function paginate<T>(
  data: T[],
  total: number,
  page: number,
  perPage: number,
): Paginated<T> {
  return new Paginated(data, {
    page,
    per_page: perPage,
    total,
    total_pages: Math.max(1, Math.ceil(total / perPage)),
  });
}
