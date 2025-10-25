import type { AxiosRequestConfig } from "axios";
import { instance } from "../configs/axios-config";
import { ApiError } from "./errors";
import type { RequestOptions, QueryObj } from "../model/types";
import { isAxiosErr, extractMessage } from "../model/helpers";

/** Makes an HTTP request.
 * @param opts - The request options with URL, method, query parameters, and body.
 * @param signal - An optional AbortSignal to cancel the request.
 * @extractMessage
 * @returns The response data (res.data) or throws an ApiError on failure.
 */
export async function request<
  TResponse,
  TBody = undefined,
  TQuery extends QueryObj | undefined = undefined,
>(
  opts: RequestOptions<TBody, TQuery>,
  signal?: AbortSignal
): Promise<TResponse> {
  const config: AxiosRequestConfig<TBody> = {
    url: opts.url,
    method: opts.method,
    data: opts.body,
    params: opts.query,
    signal,
  };
  /**
   * only ApiError is thrown from this function for easier handling by callers.
   * It wraps axios errors and unknown errors with a consistent shape.
   * @isAxiosErr check to see if error is from axios.
   * @extractMessage to get a readable message from axios error responses.
   */
  try {
    const res = await instance.request<TResponse>(config);
    return res.data;
  } catch (err: unknown) {
    if (isAxiosErr(err)) {
      if (err.code === "ERR_CANCELED") {
        throw new ApiError("Request canceled", undefined, { canceled: true });
      }

      const status = err.response?.status;
      const { message, details } = extractMessage(err, "Request failed");
      throw new ApiError(message, status, details);
    }

    throw new ApiError("Unknown error", undefined, err);
  }
}
