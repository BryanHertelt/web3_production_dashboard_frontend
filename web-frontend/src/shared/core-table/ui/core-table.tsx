"use client";

import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import ArrowRight from "../../assets/icons/data-table-icons/arrow_right.svg";

import { CoreTableProps } from "../model/types";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../model/table-builders";

const generatePaginationItems = (currentPage: number, totalPages: number) => {
  const items: (number | "ellipsis")[] = [];
  const currentPageNum = currentPage + 1; // Convert from 0-based to 1-based

  // If 4 or fewer pages, show all
  if (totalPages <= 4) {
    for (let i = 1; i <= totalPages; i++) {
      items.push(i);
    }
    return items;
  }

  // Always add first page
  items.push(1);

  // Calculate the pages around current (prev, current, next)
  const prevPage = currentPageNum - 1;
  const nextPage = currentPageNum + 1;

  // Add ellipsis after first page if there's a gap
  if (prevPage > 2) {
    items.push("ellipsis");
  }

  // Add previous page if it's not the first page
  if (prevPage > 1) {
    items.push(prevPage);
  }

  // Add current page if it's not the first or last page
  if (currentPageNum > 1 && currentPageNum < totalPages) {
    items.push(currentPageNum);
  }

  // Add next page if it's not the last page
  if (nextPage < totalPages) {
    items.push(nextPage);
  }

  // Add ellipsis before last page if there's a gap
  if (nextPage < totalPages - 1) {
    items.push("ellipsis");
  }

  // Always add last page
  items.push(totalPages);

  return items;
};

export function CoreTable<TData, TValue>({
  columns,
  data,
}: CoreTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const currentPageIndex = table.getState().pagination.pageIndex;
  const totalPages = table.getPageCount();
  const paginationItems = generatePaginationItems(currentPageIndex, totalPages);
  const paginationButtonDesign =
    "border border-color-neutral-300 text-xs w-5 h-5 rounded-md";

  return (
    <div className="overflow-hidden rounded-md bg-base-dark-bg text-white">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <div className="flex items-center justify-end space-x-2 py-4">
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
    </div>
  );
}
