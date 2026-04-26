import { searchQuery } from "@/shared/api-layer/client";
import { UseQueryOptions } from "@tanstack/react-query";

export interface AssetDistribution {
  asset_id: string;
  asset_type: string;
  symbol: string;
  icon: string;
  name: string;
  abs_price_change_24h: number;
  rel_price_change_24h: number;
  abs_profit_loss: number;
  rel_profit_loss: number;
  amount: number;
  abs_value: number;
  allocation_percent: number;
}

export interface Asset {
abs_total_value: number, 
total_assets: number, 
asset_distribution: AssetDistribution[]
}

export interface AssetData {
id: string, 
data: Asset
}

export interface AssetInfo {
  id: string;
  data: Asset;
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
