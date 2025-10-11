import { request } from "../../../shared/api-layer/api/request";
import { defineCancelRegistry } from "../../../shared/api-layer/api/cancel-registry";
import type { Users } from "../model/types";
import type { searchQuery } from "../../../shared/api-layer/model/types";
/**
 * Cancel registry for UsersAPI calls.
 * Keeps abort controllers for each method.
 */
const cancelRegistry = defineCancelRegistry({
  get: null,
});

/**
 * Users API — typed and cancellable endpoints.
 */
export const UsersAPI = {
  /**
   * Fetch all users.
   * @param cancel - When true, aborts any previous in-process `getAll` request.
   * Generic type T allows specifying the expected return type, defaulting to Users[] type.
   */
  get: async <T = Users[]>(query?: searchQuery, cancel = false): Promise<T> => {
    const signal = cancelRegistry.signalFor("get", cancel);
    return request<T, undefined, searchQuery>(
      { url: "/users", method: "GET", query },
      signal
    );
  },
};
