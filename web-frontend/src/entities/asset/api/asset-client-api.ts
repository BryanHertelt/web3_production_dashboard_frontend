import { request } from "@/shared/api-layer/client/api/request";
import { defineCancelRegistry } from "@/shared/api-layer/client/api/cancel-registry";
import type { AssetInfo } from "../model/types";
import type { searchQuery } from "@/shared/api-layer/client/model/types";


const cancelRegistry = defineCancelRegistry({
  get: null,
});

/**
 * Asset Client API - for client-side data fetching
 * Use this in Client Components with React Query or useEffect
 */
export const AssetClientAPI = {
  /**
   * Fetch asset information for a specific portfolio
   *
   * @param portfolioId - The portfolio identifier (e.g., "shc34")
   * @param query - Optional search/filter parameters
   * @param cancel - When true, aborts any previous in-process get request
   * @returns Promise resolving to asset information
   *
   * @example
   * // In a Client Component
   * const assetInfo = await AssetClientAPI.get("shc34");
   *
   * @example
   * // With request cancellation
   * const assetInfo = await AssetClientAPI.get("shc34", undefined, true);
   *
   * @example
   * // With query parameters
   * const assetInfo = await AssetClientAPI.get("shc34", { filter: "crypto" });
   */
  get: async (
    portfolioId: string,
    query?: searchQuery,
    cancel = false
  ): Promise<AssetInfo> => {
    const signal = cancelRegistry.signalFor("get", cancel);
    return request<AssetInfo, undefined, searchQuery>(
      {
        url: `/portfolio/${portfolioId}/asset-info`,
        method: "GET",
        query,
      },
      signal
    );
  },
};
