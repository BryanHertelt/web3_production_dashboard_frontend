import * as React from "react";

import {
  TableBuilderProps,
  TableHeaderProps,
  TableBodyProps,
  TableFooterProps,
  TableRowProps,
  TableHeadProps,
  TableCellProps,
  TableCaptionProps,
} from "./types";

//This table elements are the base for the CoreTable

function Table({ className, ref, ...props }: TableBuilderProps) {
  return (
    <div className="relative w-full overflow-auto">
      <table
        ref={ref}
        className={`w-full caption-bottom text-sm table-fixed ${className || ""}`}
        {...props}
      />
    </div>
  );
}

function TableHeader({ className, ref, ...props }: TableHeaderProps) {
  return (
    <thead
      ref={ref}
      className={`[&_tr]:border-b [&_tr]:border-color-neutral-100  ${className || ""}`}
      {...props}
    />
  );
}

function TableBody({ className, ref, ...props }: TableBodyProps) {
  return (
    <tbody
      ref={ref}
      className={`[&_tr:last-child]:border-0 ${className || ""}`}
      {...props}
    />
  );
}

function TableFooter({ className, ref, ...props }: TableFooterProps) {
  return (
    <tfoot
      ref={ref}
      className={`border-t bg-gray-50 font-medium [&>tr]:last:border-b-0 ${className || ""}`}
      {...props}
    />
  );
}

function TableRow({ className, ref, ...props }: TableRowProps) {
  return (
    <tr
      ref={ref}
      className={`border-b border-color-neutral-300 transition-colors hover:bg-gray-800 h-12 data-[state=selected]:bg-gray-100 ${className || ""}`}
      {...props}
    />
  );
}

function TableHead({ className, ref, ...props }: TableHeadProps) {
  return (
    <th
      ref={ref}
      className={`h-12 px-4 text-left align-middle font-medium text-color-neutral-100 [&:has([role=checkbox])]:pr-0 ${className || ""}`}
      {...props}
    />
  );
}

function TableCell({ className, ref, ...props }: TableCellProps) {
  return (
    <td
      ref={ref}
      className={`p-4 align-middle w-1/4 [&:has([role=checkbox])]:pr-0 ${className || ""}`}
      {...props}
    />
  );
}

function TableCaption({ className, ref, ...props }: TableCaptionProps) {
  return (
    <caption
      ref={ref}
      className={`mt-4 text-sm text-gray-500 ${className || ""}`}
      {...props}
    />
  );
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
