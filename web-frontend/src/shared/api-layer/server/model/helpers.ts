/**
 * Helper functions for server-side API operations
 */

import type { ErrorDetails } from "./types";

/**
 * Constructs a full URL by combining a base URL, path, and optional query parameters.
 *
 * @param baseUrl - The base URL (e.g., 'https://api.example.com').
 * @param path - The API endpoint path (e.g., '/users' or 'users/123').
 * @param query - An optional object of query parameters to append to the URL.
 * @returns The fully constructed URL as a string.
 */
export function buildUrl(
  baseUrl: string,
  path: string,
  query?: Record<string, unknown>
): string {
  // Ensure baseUrl doesn't end with slash and path starts with slash
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  const url = new URL(normalizedPath, normalizedBase);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        // Handle arrays for query params
        if (Array.isArray(value)) {
          value.forEach((v) => url.searchParams.append(key, String(v)));
        } else {
          url.searchParams.append(key, String(value));
        }
      }
    });
  }

  return url.toString();
}

/**
 * Determines if the given error is a network-related error, such as connection failures or DNS issues.
 *
 * @param error - The error to check.
 * @returns True if the error is network-related, false otherwise.
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.name === "TypeError" ||
      error.message.includes("fetch") ||
      error.message.includes("network") ||
      error.message.includes("ECONNREFUSED") ||
      error.message.includes("ENOTFOUND") ||
      error.message.includes("ECONNRESET") ||
      error.message.includes("ETIMEDOUT")
    );
  }
  return false;
}

/**
 * Determines if the given error is a timeout error, such as request timeouts or aborted requests.
 *
 * @param error - The error to check.
 * @returns True if the error is a timeout error, false otherwise.
 */
export function isTimeoutError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.name === "AbortError" ||
      error.message.includes("timeout") ||
      error.message.includes("timed out")
    );
  }
  return false;
}

/**
 * Extracts standardized error details from various types of errors, including standard Error instances and custom error objects.
 *
 * @param error - The error to extract details from.
 * @returns An ErrorDetails object containing the extracted information.
 */
export function extractErrorDetails(error: unknown): ErrorDetails {
  // Handle null/undefined
  if (!error) {
    return {
      message: "Unknown error occurred",
      details: error,
    };
  }

  // Standard Error instances
  if (error instanceof Error) {
    return {
      message: error.message,
      originalError: error,
      details: {
        name: error.name,
        stack: error.stack,
      },
    };
  }

  // ServerApiError or error-like objects (not Error instances)
  if (typeof error === "object") {
    const errorObj = error as Record<string, unknown>;

    if ("message" in errorObj || "status" in errorObj) {
      return {
        message:
          typeof errorObj.message === "string"
            ? errorObj.message
            : "Unknown error",
        status:
          typeof errorObj.status === "number" ? errorObj.status : undefined,
        code: typeof errorObj.code === "string" ? errorObj.code : undefined,
        details: errorObj.details,
        originalError: undefined,
      };
    }

    // Plain object without message/status - treat as unknown error
    return {
      message: "Unknown error",
      details: error,
    };
  }

  // Primitive or unknown type
  return {
    message: String(error),
    details: error,
  };
}

/**
 * Logs an error with additional context and details, using appropriate log levels and including environment-specific handling.
 *
 * @param context - A string describing the context where the error occurred (e.g., 'API Request').
 * @param error - The error to log.
 * @param details - Optional additional details to include in the log.
 */
export function logError(
  context: string,
  error: unknown,
  details?: Record<string, unknown>
): void {
  const errorDetails = extractErrorDetails(error);

  const logData = {
    context,
    message: errorDetails.message,
    status: errorDetails.status,
    code: errorDetails.code,
    ...details,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  };

  // Use appropriate log level based on error type
  if (errorDetails.status && errorDetails.status < 500) {
    // Client errors - less severe
    console.warn("[Server API Warning]", logData);
  } else {
    // Server errors or unknown - more severe
    console.error("[Server API Error]", logData);
  }

  // In development, also log stack trace
  if (
    process.env.NODE_ENV === "development" &&
    errorDetails.originalError?.stack
  ) {
    console.error("Stack trace:", errorDetails.originalError.stack);
  }

  // In production, send to error tracking service
  if (process.env.NODE_ENV === "production") {
    // TODO: Send to Sentry, DataDog, LogRocket, etc.
    // Example:
    // Sentry.captureException(error, { contexts: { api: logData } });
  }
}

/**
 * Categorizes an HTTP status code into predefined categories for easier handling.
 *
 * @param status - The HTTP status code to categorize.
 * @returns The category of the status code: 'success', 'redirect', 'client_error', 'server_error', or 'unknown'.
 */
export function getStatusCategory(
  status: number
): "success" | "redirect" | "client_error" | "server_error" | "unknown" {
  if (status >= 200 && status < 300) return "success";
  if (status >= 300 && status < 400) return "redirect";
  if (status >= 400 && status < 500) return "client_error";
  if (status >= 500 && status < 600) return "server_error";
  return "unknown";
}

/**
 * Removes or redacts sensitive information from objects before logging to prevent data leaks.
 *
 * @param data - The data to sanitize.
 * @returns The sanitized data with sensitive fields redacted.
 */
export function sanitizeForLogging(data: unknown): unknown {
  if (!data || typeof data !== "object") return data;

  const sensitive = [
    "password",
    "token",
    "secret",
    "apikey",
    "authorization",
    "cookie",
  ];

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeForLogging(item));
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (sensitive.some((s) => lowerKey.includes(s))) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "object") {
      sanitized[key] = sanitizeForLogging(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Checks if the given Response object has a JSON content type.
 *
 * @param response - The Response object to check.
 * @returns True if the response is JSON, false otherwise.
 */
export function isJsonResponse(response: Response): boolean {
  const contentType = response.headers.get("content-type");
  return contentType?.includes("application/json") ?? false;
}

/**
 * Safely parses JSON from a Response object, providing a fallback value if parsing fails or the response is not JSON.
 *
 * @template T - The expected type of the parsed JSON.
 * @param response - The Response object to parse.
 * @param fallback - An optional fallback value to return if parsing fails.
 * @returns A Promise that resolves to the parsed JSON or the fallback value.
 */
export async function safeJsonParse<T>(
  response: Response,
  fallback?: T
): Promise<T | null> {
  try {
    if (!isJsonResponse(response)) {
      return fallback ?? null;
    }
    return await response.json();
  } catch {
    return fallback ?? null;
  }
}
