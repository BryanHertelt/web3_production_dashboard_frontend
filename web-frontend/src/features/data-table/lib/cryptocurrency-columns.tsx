import { ColumnDef } from "@tanstack/react-table";
import { Asset } from "@/entities/asset";
import { formatValue, formatCurrency } from "@/shared/utils";
import { SortingArrows } from "@/shared/core-table/ui/sorting-arrows";
import { logger } from "@/shared/logger/client-logger";

export const assetColumns: ColumnDef<Asset>[] = [
  {
    accessorKey: "name",
    header: () => {
      return <div className="px-3.5"> Assets </div>;
    },
    cell: (row) => {
      const hasNoIcon =
        !row.row.original.icon || row.row.original.icon.length === 0;

      if (hasNoIcon) {
        logger.warn(
          {
            component: "AssetIcon",
            assetSymbol: row.row.original.symbol,
            assetName: row.row.original.name,
            fallbackUsed: "plain-X",
            reason: "Icon URL missing or empty",
          },
          "Asset icon fallback triggered - displaying plain X"
        );
      }

      return (
        <div key={row.row.id} className="flex flex-row">
          <div className="flex flex-col justify-center w-8 h-8 flex-shrink-0 items-center mr-2">
            {hasNoIcon ? (
              "X"
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={row.row.original.icon}
                alt={row.row.original.name}
                width={20}
                height={20}
                onError={(e) => {
                  logger.warn(
                    {
                      component: "AssetIcon",
                      assetSymbol: row.row.original.symbol,
                      assetName: row.row.original.name,
                      iconUrl: row.row.original.icon,
                      fallbackUsed: "error-display",
                      reason: "SVG encoding failed.",
                    },
                    "Asset icon failed to load"
                  );
                  e.currentTarget.style.display = "X";
                }}
              />
            )}
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
    enableSorting: true,
    header: ({ header }) => {
      return (
        <div
          className="flex flex-row justify-end items-center cursor-pointer group"
          onClick={header.column.getToggleSortingHandler()}
        >
          <SortingArrows header={header} />

          <p className="h-full"> Price/24h</p>
        </div>
      );
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
    enableSorting: true,
    header: ({ header }) => {
      return (
        <div
          className="flex flex-row justify-end items-center cursor-pointer group"
          onClick={header.column.getToggleSortingHandler()}
        >
          <SortingArrows header={header} />

          <p className="h-full"> Profit loss</p>
        </div>
      );
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
    enableSorting: true,
    header: ({ header }) => {
      return (
        <div
          className="flex flex-row justify-end items-center cursor-pointer group"
          onClick={header.column.getToggleSortingHandler()}
        >
          <SortingArrows header={header} />

          <p className="h-full"> Value/Amount</p>
        </div>
      );
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
