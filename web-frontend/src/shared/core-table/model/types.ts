import { ColumnDef } from "@tanstack/react-table";

//core table 
export interface CoreTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
  }



  //table-builders 
export interface TableBuilderProps extends React.HTMLAttributes<HTMLTableElement> {
    ref?: React.Ref<HTMLTableElement>;
  }

export interface TableHeaderProps
extends React.HTMLAttributes<HTMLTableSectionElement> {
ref?: React.Ref<HTMLTableSectionElement>;
}

export interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  ref?: React.Ref<HTMLTableSectionElement>;
}

export interface TableFooterProps
  extends React.HTMLAttributes<HTMLTableSectionElement> {
  ref?: React.Ref<HTMLTableSectionElement>;
}

export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
    ref?: React.Ref<HTMLTableRowElement>;
  }

export interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
    ref?: React.Ref<HTMLTableCellElement>;
  }

export interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
    ref?: React.Ref<HTMLTableCellElement>;
  }

export interface TableCaptionProps
extends React.HTMLAttributes<HTMLTableCaptionElement> {
ref?: React.Ref<HTMLTableCaptionElement>;
}