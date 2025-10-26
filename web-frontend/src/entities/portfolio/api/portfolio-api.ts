import { request } from "../../../shared/api-layer/api/request";
import { defineCancelRegistry } from "../../../shared/api-layer/api/cancel-registry";
import type { Portfolio } from "../model/types";
import type { searchQuery } from "../../../shared/api-layer/model/types";
/**
 * Cancel registry for Portfolio calls.
 * Keeps abort controllers for each method.
 */
const cancelRegistry = defineCancelRegistry({
  get: null,
});

/**
 * Users API — typed and cancellable endpoints.
 */
export const PortfolioAPI = {
  /**
   * Fetch all portfolios.
   * @param cancel - When true, aborts any previous in-process `getAll` request.
   * Generic type T allows specifying the expected return type, defaulting to Users[] type.
   */
  get: async (query?: searchQuery, cancel = false): Promise<Portfolio[]> => {
    const signal = cancelRegistry.signalFor("get", cancel);
    return request<Portfolio[], undefined, searchQuery>(
      { url: "/portfolio", method: "GET", query },
      signal
    );
  },
};
