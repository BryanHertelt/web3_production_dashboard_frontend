import axios from "axios";
import type { AxiosInstance, AxiosResponse } from "../model/types";
import { isCancel, isAxiosErr, statusOf, logByStatus } from "../model/helpers";

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
 * onRejected runs for non-2xx responses or network errors.
 * We centralize logging here and still reject so callers can handle errors.
 *  @isCancel errors are ignored (not logged) as they are expected in many cases.
 *  @isAxiosErr errors are logged by status code @logByStatus for clarity.
 *  Unknown errors (non-Axios) are logged once for visibility.
 */
export const onRejected = (error: unknown) => {
  if (isCancel(error)) return Promise.reject(error);

  if (isAxiosErr(error)) {
    logByStatus(error, statusOf(error));
    return Promise.reject(error);
  } else {
    console.error("[API] Unknown error object thrown:", error);
    return Promise.reject(error);
  }
};

instance.interceptors.response.use(onFulfilled, onRejected);
