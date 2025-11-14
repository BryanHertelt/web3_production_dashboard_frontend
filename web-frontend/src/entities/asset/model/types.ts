import { searchQuery } from "@/shared/api-layer/client";
import { UseQueryOptions } from "@tanstack/react-query";

export interface Asset {
  asset_id: string;
  symbol: string;
  icon: string;
  name: string;
  abs_value_change: string;
  rel_value_change: string;
  amount: number;
  abs_value: number;
  allocation_percent: number;
}

export interface AssetInfo {
  portfolio_id: string;
  data: Asset[];
  abs_total_val: number;
}

//Query hook types
export interface UseAssetInfoOptions {
  portfolioId: string;
  query?: searchQuery;
  queryOptions?: Omit<
    UseQueryOptions<AssetInfo, Error>,
    "queryKey" | "queryFn"
  >;
}
