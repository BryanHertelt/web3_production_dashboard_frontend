import ArrowRight from "../../assets/icons/data-table-icons/arrow_right.svg";
import { PaginationItemProps } from "../model/types";

export const PaginationItem = <TData,>({
  table,
}: PaginationItemProps<TData>) => {
  const generatePaginationItems = (currentPage: number, totalPages: number) => {
    const items: (number | "ellipsis")[] = [];
    const currentPageNum = currentPage + 1;

    if (totalPages <= 4) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(i);
      }
      return items;
    }

    items.push(1);

    const prevPage = currentPageNum - 1;
    const nextPage = currentPageNum + 1;

    if (prevPage > 2) {
      items.push("ellipsis");
    }

    if (prevPage > 1) {
      items.push(prevPage);
    }

    if (currentPageNum > 1 && currentPageNum < totalPages) {
      items.push(currentPageNum);
    }

    if (nextPage < totalPages) {
      items.push(nextPage);
    }

    if (nextPage < totalPages - 1) {
      items.push("ellipsis");
    }

    items.push(totalPages);

    return items;
  };

  const currentPageIndex = table.getState().pagination.pageIndex;
  const totalPages = table.getPageCount();
  const paginationItems = generatePaginationItems(currentPageIndex, totalPages);
  const paginationButtonDesign =
    "border border-color-neutral-300 text-sm w-7 h-7 rounded-md";

  return (
    <div className="flex flex-row items-center justify-center space-x-2 py-4">
      <button
        onClick={() => table.previousPage()}
        disabled={!table.getCanPreviousPage()}
      >
        <div
          className={`${paginationButtonDesign} flex flex-row justify-center items-center`}
        >
          <ArrowRight
            className={`rotate-180 ${currentPageIndex === 0 ? "text-color-neutral-300" : "text-white"}`}
          />
        </div>
      </button>
      <div className="flex items-center space-x-1">
        {paginationItems.map((item, index) => {
          if (item === "ellipsis") {
            return (
              <span
                key={`ellipsis-${index}`}
                className={`px-2 ${paginationButtonDesign} flex flex-row justify-center items-center`}
              >
                ...
              </span>
            );
          }

          const isCurrentPage = currentPageIndex === item - 1;
          return (
            <button
              key={item}
              onClick={() => table.setPageIndex(item - 1)}
              className={`${isCurrentPage ? "bg-color-neutral-300 shadow-sm shadow-color-neutral-300" : ""} ${paginationButtonDesign}`}
            >
              {item}
            </button>
          );
        })}
      </div>
      <button
        onClick={() => table.nextPage()}
        disabled={!table.getCanNextPage()}
      >
        <div
          className={`${paginationButtonDesign} flex flex-row justify-center items-center`}
        >
          <ArrowRight
            className={`${
              currentPageIndex === totalPages - 1
                ? "text-color-neutral-300"
                : "text-white"
            } `}
          />
        </div>
      </button>
    </div>
  );
};
