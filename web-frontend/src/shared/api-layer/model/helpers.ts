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
 * logByStatus — centralized, status-aware logging for AxiosErrors.
 * Keeps axios-config short and easy to read.
 * Ignores 401
 * @const url is for visibility in logs, falls back to "(unknown url)".
 * @const method  falls back to "(unknown method)". Logs a concise, human-readable message for common status codes.
 * For truly unknown status codes, logs a generic message indicating client/server error or network issue.
 * @const baseMsg combines method, url, and status for clarity.
 */
export function logByStatus(
  err: AxiosError,
  status: KnownHttpStatus | number | undefined
) {
  if (status === 401) return;

  const url = err.config?.url || "(unknown url)";
  const method =
    (err.config?.method && err.config.method.toUpperCase()) ||
    "(unknown method)";
  const baseMsg = `[API ${method} ${url}] ${status || "no-status"}`;

  switch (status as KnownHttpStatus) {
    case 404:
      console.error(`${baseMsg} – Not found.`);
      break;
    case 502:
      console.error(
        `${baseMsg} – Bad Gateway (upstream down or misconfigured).`
      );
      break;
    case 503:
      console.error(
        `${baseMsg} – Service Unavailable (overloaded/maintenance).`
      );
      break;
    case 504:
      console.error(
        `${baseMsg} – Gateway Timeout (upstream slow/unreachable).`
      );
      break;
    case 400:
      console.error(`${baseMsg} – Bad Request (invalid client input).`);
      break;
    case 403:
      console.error(`${baseMsg} – Forbidden (insufficient permissions).`);
      break;
    case 409:
      console.error(`${baseMsg} – Conflict (state/version clash).`);
      break;
    case 422:
      console.error(`${baseMsg} – Unprocessable Entity (validation failed).`);
      break;
    case 429:
      console.error(`${baseMsg} – Too Many Requests (rate limited).`);
      break;
    case 500:
      console.error(`${baseMsg} – Internal Server Error.`);
      break;
    default: {
      if (typeof status === "number") {
        if (status >= 500) {
          console.error(`${baseMsg} – Server error.`);
        } else if (status >= 400) {
          console.error(`${baseMsg} – Client error.`);
        } else {
          console.error(`${baseMsg} – Unexpected error.`);
        }
      } else {
        console.error(
          `${baseMsg} – No HTTP status available (network error?).`
        );
      }
    }
  }
}
