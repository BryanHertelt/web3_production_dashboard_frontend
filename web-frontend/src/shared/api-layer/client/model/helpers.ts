import axios from "axios";
import type { AxiosError, KnownHttpStatus } from "./types";

/**
 * isCancel — type guard for "expected" axios cancel errors.
 * Returns true when the thrown value is an AxiosError representing a cancellation.
 */
export function isCancel(e: unknown): e is AxiosError {
  return (
    axios.isAxiosError(e) &&
    (e.code === "ERR_CANCELED" ||
      e.name === "CanceledError" ||
      e.message === "canceled")
  );
}

/**
 * isAxiosErr — type guard that narrows an unknown error to AxiosError.
 * if e is an AxiosError, you can access response, request, config and other axios error properties.
 */
export function isAxiosErr(e: unknown): e is AxiosError {
  return axios.isAxiosError(e);
}

/**
 * statusOf — extracts HTTP status from an unknown error if it’s an AxiosError.
 * Returns undefined when status isn’t present (e.g., network failure, CORS, etc.).
 */
export function statusOf(e: unknown): number | undefined {
  return axios.isAxiosError(e) ? e.response?.status : undefined;
}

/**
 * extractMessage — tries to get a human-readable message from an AxiosError response.
 * Priority:
 *   1) server-provided JSON: { message: string }
 *   2) axios error message
 *   3) fallback (default: "Request failed")
 *   If server responded with { message: string }, prefer that.
 */
export function extractMessage(
  err: AxiosError,
  fallback = "Request failed"
): {
  message: string;
  details: unknown;
} {
  const details: unknown = err.response?.data;

  const message =
    (typeof details === "object" &&
      details !== null &&
      "message" in details &&
      typeof (details as { message?: unknown }).message === "string" &&
      (details as { message: string }).message) ||
    err.message ||
    fallback;

  return { message, details };
}

/**
 * Maps an AxiosError's HTTP status code to a log level and readable message.
 *
 * Used to classify errors for logging (warn vs error) and to provide
 * meaningful descriptions for common client and server status codes.
 *
 * @param {AxiosError} err - The Axios error to analyze.
 * @returns {{ level: "warn" | "error"; message: string }} Log level and descriptive message.
 */

export function describeStatus(err: AxiosError): {
  level: "warn" | "error";
  message: string;
} {
  const status = statusOf(err);

  if (!status)
    return { level: "error", message: "No HTTP status (network/CORS?)" };

  if (status >= 500) {
    switch (status as KnownHttpStatus) {
      case 502:
        return {
          level: "error",
          message: "Bad Gateway (upstream down/misconfigured)",
        };
      case 503:
        return {
          level: "error",
          message: "Service Unavailable (overloaded/maintenance)",
        };
      case 504:
        return {
          level: "error",
          message: "Gateway Timeout (upstream slow/unreachable)",
        };
      case 500:
        return { level: "error", message: "Internal Server Error" };
      default:
        return { level: "error", message: "Server error" };
    }
  }

  switch (status as KnownHttpStatus) {
    case 400:
      return { level: "warn", message: "Bad Request (invalid client input)" };
    case 401:
      return { level: "warn", message: "Unauthorized" };
    case 403:
      return { level: "warn", message: "Forbidden (insufficient permissions)" };
    case 404:
      return { level: "warn", message: "Not Found" };
    case 409:
      return { level: "warn", message: "Conflict (state/version clash)" };
    case 422:
      return {
        level: "warn",
        message: "Unprocessable Entity (validation failed)",
      };
    case 429:
      return { level: "warn", message: "Too Many Requests (rate limited)" };
    default:
      return { level: "warn", message: "Client error" };
  }
}
