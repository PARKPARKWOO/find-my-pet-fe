import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/app/_components/ui/pagination";

interface IProps {
  currentPage: number;
  /** 백엔드 `PaginatedApiResponseDto.totalCount`. 0 이면 페이지네이션 자체를 렌더하지 않는다. */
  totalCount: number;
  /** 목록이 실제로 요청하는 numOfRows. 전역 ITEM_PER_PAGE(5) 와 다르므로 반드시 주입받는다. */
  pageSize: number;
  onPageChange: (page: number) => void;
}

/**
 * 유기동물 목록 페이지네이션.
 *
 * 예전에는 totalCount 를 받지 않아 **끝을 모른 채 항상 5개 번호를 무한 생성**했다.
 * 공고 종료분이 목록에서 빠지면 전체 건수가 크게 줄어 빈 페이지 노출이 잦아지므로,
 * LostPagination 과 같은 방식(총 페이지 수 계산 + 양끝 비활성)으로 맞춘다.
 */
export default function AbandonmentPagination({
  currentPage,
  totalCount,
  pageSize,
  onPageChange,
}: IProps) {
  const totalPages = pageSize > 0 ? Math.ceil(totalCount / pageSize) : 0;
  if (totalPages <= 0) return null;

  const blockStart = Math.floor((currentPage - 1) / 5) * 5;
  const pages = Array.from(
    { length: Math.max(0, Math.min(5, totalPages - blockStart)) },
    (_, i) => blockStart + i + 1,
  );

  const isFirst = currentPage <= 1;
  const isLast = currentPage >= totalPages;

  return (
    <Pagination className="my-4">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => !isFirst && onPageChange(currentPage - 1)}
            aria-disabled={isFirst}
            tabIndex={isFirst ? -1 : undefined}
            className={isFirst ? "pointer-events-none opacity-50" : undefined}
          />
        </PaginationItem>
        {pages.map((pageNumber) => (
          <PaginationItem key={pageNumber}>
            <PaginationLink
              isActive={pageNumber === currentPage}
              onClick={() => onPageChange(pageNumber)}
            >
              {pageNumber}
            </PaginationLink>
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext
            onClick={() => !isLast && onPageChange(currentPage + 1)}
            aria-disabled={isLast}
            tabIndex={isLast ? -1 : undefined}
            className={isLast ? "pointer-events-none opacity-50" : undefined}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
