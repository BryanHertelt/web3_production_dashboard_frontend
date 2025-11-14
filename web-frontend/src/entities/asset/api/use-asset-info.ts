"use client";

import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { AssetClientAPI } from "./asset-client-api";
import type { AssetInfo } from "../model/types";
import type { searchQuery } from "@/shared/api-layer/client/model/types";
import { UseAssetInfoOptions } from "../model/types";

/**
 * Query key factory for asset-related queries
 */
export const assetKeys = {
  all: ["assets"] as const,
  info: (portfolioId: string) => [...assetKeys.all, "info", portfolioId] as const,
  infoWithQuery: (portfolioId: string, query?: searchQuery) =>
    [...assetKeys.info(portfolioId), query] as const,
};


/**
 * React Query hook to fetch asset information for a specific portfolio
 *
 * @param options - Hook configuration options
 * @returns React Query result with asset information
 *
 * @example
 * // Basic usage
 * const { data, isLoading, error } = useAssetInfo({
 *   portfolioId: "shc34"
 * });
 *
 * @example
 * // With query parameters
 * const { data } = useAssetInfo({
 *   portfolioId: "shc34",
 *   query: { filter: "crypto" }
 * });
 *
 * @example
 * // With custom React Query options
 * const { data } = useAssetInfo({
 *   portfolioId: "shc34",
 *   queryOptions: {
 *     staleTime: 5 * 60 * 1000, // 5 minutes
 *     refetchOnWindowFocus: false,
 *   }
 * });
 */
export function useAssetInfo({
  portfolioId,
  queryOptions,
  query,
}: UseAssetInfoOptions): UseQueryResult<AssetInfo, Error> {
  return useQuery<AssetInfo, Error>({
    queryKey: assetKeys.infoWithQuery(portfolioId, query),
    queryFn: async () => {
      return AssetClientAPI.get(portfolioId, query, true);
    },
    ...queryOptions,
  });
}
