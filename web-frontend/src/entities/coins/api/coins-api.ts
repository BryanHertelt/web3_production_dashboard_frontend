import { request } from "../../../shared/api-layer/api/request";
import { defineCancelRegistry } from "../../../shared/api-layer/api/cancel-registry";
import type { Coins } from "../model/types";
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
export const CoinsAPI = {
  /**
   * Fetch all coins.
   * @param cancel - When true, aborts any previous in-process `getAll` request.
   * Generic type T allows specifying the expected return type, defaulting to Users[] type.
   */
  get: async (query?: searchQuery, cancel = false): Promise<Coins[]> => {
    const signal = cancelRegistry.signalFor("get", cancel);
    return request<Coins[], undefined, searchQuery>(
      { url: "/coins", method: "GET", query },
      signal
    );
  },
};
