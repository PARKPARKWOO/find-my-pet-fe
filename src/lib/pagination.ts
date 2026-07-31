export function clampPageToTotal(requested: number, totalCount: number, pageSize: number): number {
  const safeRequested = Number.isInteger(requested) && requested >= 1 ? requested : 1;
  const safeTotalCount = Number.isFinite(totalCount) && totalCount > 0 ? totalCount : 0;
  const safePageSize = Number.isFinite(pageSize) && pageSize > 0 ? Math.floor(pageSize) : 1;
  const totalPages = safeTotalCount > 0 ? Math.ceil(safeTotalCount / safePageSize) : 1;

  return Math.min(safeRequested, totalPages);
}

/** `page` 쿼리는 2 이상의 선행 0 없는 정수만 명시적으로 허용한다. */
export function isCanonicalPageQuery(raw: string | null, parsedPage: number): boolean {
  if (raw === null) return parsedPage === 1;

  return parsedPage > 1 && raw === String(parsedPage);
}
