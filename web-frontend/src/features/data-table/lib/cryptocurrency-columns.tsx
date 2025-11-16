import { ColumnDef } from "@tanstack/react-table";
import { Asset } from "@/entities/asset";
import { formatValue, formatCurrency } from "@/shared/utils";

export const assetColumns: ColumnDef<Asset>[] = [
  {
    accessorKey: "name",
    header: "Asset",
    cell: (row) => {
      return (
        <div key={row.row.id} className="flex flex-row">
          <div className="flex flex-col justify-center w-8 h-8 flex-shrink-0 items-center mr-2 border border-gray-50">
            {row.row.original.icon}
          </div>
          <div className="flex flex-col min-w-0 text-xs justify-center">
            <p className="overflow-hidden text-ellipsis whitespace-nowrap">
              {" "}
              {row.row.original.symbol}{" "}
            </p>
            <p className="overflow-hidden text-ellipsis whitespace-nowrap">
              {row.row.original.name}{" "}
            </p>
          </div>
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
      const absPriceChangeDaily = row.row.original.abs_price_change_daily;
      const absColor =
        absPriceChangeDaily > 0
          ? "text-profit-green"
          : absPriceChangeDaily < 0
            ? "text-loss-red"
            : "";
      return (
        <div
          key={row.row.id}
          className={`flex flex-row justify-end ${absColor} items-center text-xs`}
        >
          {formatCurrency(absPriceChangeDaily)}
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
      const absProfitLoss = row.row.original.abs_profit_loss;
      const relProfitLoss = row.row.original.rel_profit_loss;
      const relColor =
        absProfitLoss > 0
          ? "text-profit-green"
          : absProfitLoss < 0
            ? "text-loss-red"
            : "";
      return (
        <div
          key={row.row.id}
          className={`flex flex-col items-end justify-center font-extralight text-xs`}
        >
          <p className=""> {formatCurrency(absProfitLoss)} </p>
          <p className={relColor}> +{formatValue(relProfitLoss)} </p>
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
      const absValue = row.row.original.abs_value;
      const amount = row.row.original.amount;
      return (
        <div
          key={row.row.id}
          className="flex flex-col items-end font-extralight text-xs justify-center"
        >
          <p> {formatCurrency(absValue)} </p>
          <p className="text-color-neutral-100"> {formatValue(amount)} </p>
        </div>
      );
    },
  },
];
