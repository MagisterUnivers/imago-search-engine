import { SearchParams } from "@/types/search-layer";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../ui/pagination";

interface Props {
  currentPage: number;
  totalPages: number;
  searchParams: SearchParams;
}

export const ContentShowdownPagination = ({
  currentPage,
  totalPages,
  searchParams,
}: Props) => {
  // Build page href — preserves all existing search params, only changes page
  const buildPageHref = (page: number) => {
    const params = new URLSearchParams(searchParams as Record<string, string>);
    params.set("page", String(page));
    return `?${params.toString()}`;
  };

  return (
    <div className="col-span-full flex justify-center mt-6">
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            {/* Prev */}
            <PaginationItem>
              <PaginationPrevious
                href={buildPageHref(currentPage - 1)}
                aria-disabled={currentPage <= 1}
                className={
                  currentPage <= 1 ? "pointer-events-none opacity-50" : ""
                }
              />
            </PaginationItem>

            {/* First page */}
            <PaginationItem>
              <PaginationLink
                href={buildPageHref(1)}
                isActive={currentPage === 1}
              >
                1
              </PaginationLink>
            </PaginationItem>

            {/* Ellipsis if currentPage is far from start */}
            {currentPage > 3 && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}

            {/* Pages around current */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (p) =>
                  p !== 1 && p !== totalPages && Math.abs(p - currentPage) <= 1,
              )
              .map((p) => (
                <PaginationItem key={p}>
                  <PaginationLink
                    href={buildPageHref(p)}
                    isActive={p === currentPage}
                  >
                    {p}
                  </PaginationLink>
                </PaginationItem>
              ))}

            {/* Ellipsis if currentPage is far from end */}
            {currentPage < totalPages - 2 && (
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            )}

            {/* Last page */}
            {totalPages > 1 && (
              <PaginationItem>
                <PaginationLink
                  href={buildPageHref(totalPages)}
                  isActive={currentPage === totalPages}
                >
                  {totalPages}
                </PaginationLink>
              </PaginationItem>
            )}

            {/* Next */}
            <PaginationItem>
              <PaginationNext
                href={buildPageHref(currentPage + 1)}
                aria-disabled={currentPage >= totalPages}
                className={
                  currentPage >= totalPages
                    ? "pointer-events-none opacity-50"
                    : ""
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
};
