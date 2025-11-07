import axios from "axios";
import type { AxiosInstance, AxiosResponse } from "../model/types";
import { isCancel, isAxiosErr, describeStatus } from "../model/helpers";
import { logger } from "@/shared/logger/client-logger/model/logger";

export const instance: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  withCredentials: false,
  timeout: 10000,
});

/**
 * onFulfilled runs for successful responses (2xx).
 * We pass through unchanged so callers get response.data directly.
 */
export const onFulfilled = (res: AxiosResponse) => res;

/**
 * Handles failed Axios responses or thrown errors within the response interceptor.
 *
 * This function centralizes error processing and logging for all API requests made
 * through the configured Axios instance. It distinguishes between Axios-specific
 * errors (including HTTP errors and cancellations) and unexpected thrown values.
 *
 * Behavior:
 * - If the error is an AxiosError:
 *   - Extracts the HTTP method, URL, and status code.
 *   - Uses `describeStatus` to determine an appropriate log level and human-readable message.
 *   - Logs a structured error object via `logger` sending to Grafana Loki.
 *   - Returns a rejected Promise containing the original AxiosError.
 * - If the error is not an AxiosError:
 *   - Logs the thrown value as an unknown error for diagnostic visibility.
 *   - Returns a rejected Promise containing the original value.
 *
 * @param {unknown} error - The error object caught by Axios during a failed response or request -> type gets narrowed down with isAxiosError.
 * @returns {Promise<never>} Always rejects. Rejects with the same error that was caught.
 *
 */

export const onRejected = (error: unknown) => {
  if (isCancel(error)) return Promise.reject(error);

  if (isAxiosErr(error)) {
    const method = error.config?.method?.toUpperCase?.();
    const url = error.config?.url || "(unknown url)";
    const status = error.response?.status;
    const { level, message } = describeStatus(error);

    logger[level](
      {
        err: {
          message: error.message,
          name: error.name,
          status,
          method,
          url,
        },
      },
      `[API] - ${message} Code - ${status}`
    );

    return Promise.reject(error);
  }

  logger.error({ thrown: String(error) }, "[API] Unknown error object thrown");
  return Promise.reject(error);
};

instance.interceptors.response.use(onFulfilled, onRejected);
