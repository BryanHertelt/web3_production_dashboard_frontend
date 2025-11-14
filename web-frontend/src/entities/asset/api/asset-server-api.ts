import { get } from "@/shared/api-layer/server";
import type { AssetInfo } from "../model/types";
import type { RequestOptions } from "@/shared/api-layer/server/model/types";

/**
 * Asset Server API - for server-side data fetching
 * Use this in Server Components, Route Handlers, and Server Actions
 */
export const AssetServerAPI = {
  /**
   * Fetch asset information for a specific portfolio
   *
   * @param portfolioId - The portfolio identifier (e.g., "shc34")
   * @param options - Optional Next.js cache and request options
   * @returns Promise resolving to asset information
   *
   * @example
   * // In a Server Component
   * const assetInfo = await AssetServerAPI.get("shc34");
   *
   * @example
   * // With cache revalidation
   * const assetInfo = await AssetServerAPI.get("shc34", {
   *   revalidate: 60, // Revalidate every 60 seconds
   *   tags: ["portfolio-assets"]
   * });
   */
  get: async (
    portfolioId: string,
    options?: Partial<RequestOptions<undefined, undefined>>
  ): Promise<AssetInfo> => {
    return get<AssetInfo>(`/portfolio/${portfolioId}/asset-info`, undefined, {
      ...options,
    });
  },
};
