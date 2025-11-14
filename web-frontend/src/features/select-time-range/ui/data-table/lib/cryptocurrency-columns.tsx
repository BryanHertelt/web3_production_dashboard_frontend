import { ColumnDef } from "@tanstack/react-table";
import { Asset } from "@/entities/asset";

export const assetColumns: ColumnDef<Asset>[] = [
  {
    accessorKey: "name",
    header: "Asset",
  },
  {
    accessorKey: "abs_price_change_daily",
    header: "Price/24h",
  },
  {
    accessorKey: "abs_profit_loss",
    header: "Profit loss",
  },
  {
    accessorKey: "abs_value",
    header: "Value/Amount",
  },
];
