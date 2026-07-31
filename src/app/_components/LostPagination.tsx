import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
  } from "@/app/_components/ui/pagination";
import { Dispatch, SetStateAction } from "react";
import { ITEM_PER_PAGE } from "../constant/constant";

interface IProps {
    currentPage: number;
    totalCount: number;
    setCurrentPage: Dispatch<SetStateAction<number>>
}

export default function LostPagination({currentPage, setCurrentPage, totalCount}: IProps){
    const totalPages = Math.ceil(totalCount / ITEM_PER_PAGE);
    if (totalPages <= 0) return null;

    const page = Array.from(
        { length: Math.min(5, totalPages - (Math.floor((currentPage - 1) / 5) * 5)) },
        (_, i) => 1 + i + Math.floor((currentPage - 1) / 5) * 5
    );

    return (
        <Pagination className="my-4">
            <PaginationContent>
                <PaginationItem>
                    <PaginationPrevious 
                        onClick={() => currentPage > 1 && setCurrentPage(currentPage-1)}
                        disabled={currentPage <= 1}
                        aria-disabled={currentPage <= 1}
                        tabIndex={currentPage <= 1 ? -1 : undefined}
                        className={
                            currentPage <= 1 ? "pointer-events-none opacity-50" : undefined
                          }
                    />
                </PaginationItem>
                {
                 page.map((pageNumber) => {
                    return (
                    <PaginationItem key={pageNumber}>
                        <PaginationLink isActive={pageNumber === currentPage} onClick={() => setCurrentPage(pageNumber)}>{pageNumber}</PaginationLink>
                      </PaginationItem>
                    )
                 })   
                }
                <PaginationItem>
                    <PaginationNext 
                        onClick={() => currentPage < totalPages && setCurrentPage(currentPage+1)}
                        disabled={totalPages <= currentPage}
                        aria-disabled={totalPages <= currentPage}
                        tabIndex={totalPages <= currentPage ? -1 : undefined}
                        className={
                            totalPages <= currentPage ? "pointer-events-none opacity-50" : undefined
                          }
                    />
                </PaginationItem>
            </PaginationContent>
        </Pagination>
    )
}
