import { ColumnDef } from "@tanstack/react-table";
import { Asset } from "@/entities/asset";
import { formatValue, formatCurrency } from "@/shared/utils";

export const assetColumns: ColumnDef<Asset>[] = [
  {
    accessorKey: "name",
    header: "Asset",
    cell: (row) => {
      return (
        <div
          key={row.row.id}
          className="overflow-hidden text-ellipsis whitespace-nowrap"
        >
          {row.row.original.name}
        </div>
      );
    },
  },
  {
    accessorKey: "abs_price_change_daily",
    header: () => {
      return <div className="flex flex-row justify-end"> Price/24h </div>;
    },
    cell: (row) => {
      return (
        <div key={row.row.id} className="flex flex-row justify-end">
          {formatCurrency(row.row.original.abs_price_change_daily)}
        </div>
      );
    },
  },
  {
    accessorKey: "abs_profit_loss",
    header: () => {
      return <div className="flex flex-row justify-end "> Profit loss </div>;
    },
    cell: (row) => {
      return (
        <div key={row.row.id} className="flex flex-row justify-end">
          {formatCurrency(row.row.original.abs_profit_loss)}
        </div>
      );
    },
  },
  {
    accessorKey: "abs_value",
    header: () => {
      return <div className="flex flex-row justify-end"> Value/Amount</div>;
    },
    cell: (row) => {
      return (
        <div key={row.row.id} className="flex flex-row justify-end">
          {formatValue(row.row.original.abs_value)}
        </div>
      );
    },
  },
];
