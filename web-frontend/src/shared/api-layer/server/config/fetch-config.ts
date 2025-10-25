/**
 * Server-side fetch configuration with timeout, retries, and Next.js cache control
 */

import type { ServerFetchConfig, NextConfig } from "../model/types";

/**
 * The base URL for the API server, configurable via environment variable.
 */
export const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:3001";
/**
 * The default timeout for API requests in milliseconds.
 *
 * @type {5000}
 */
export const API_TIMEOUT = 5000; // 5 seconds
/**
 * The maximum number of retry attempts for failed requests.
 *
 * @type {3}
 */
export const MAX_RETRIES = 3;
/**
 * The base delay between retry attempts in milliseconds.
 *
 * @type {1000}
 */
export const RETRY_DELAY = 1000; // 1 second
/**
 * The maximum delay allowed for retry backoff in milliseconds.
 *
 * @type {10000}
 */
export const MAX_RETRY_DELAY = 10000; // 10 seconds max backoff

/**
 * Performs a fetch request with enhanced timeout, retry logic, and Next.js caching support.
 * Handles network failures, timeouts, and transient server errors with exponential backoff.
 *
 * @param url - The URL to fetch.
 * @param config - The fetch configuration options, including timeout and retry settings.
 * @param nextConfig - Optional Next.js specific configuration for caching and revalidation.
 * @returns A Promise that resolves to the Response object.
 */
export async function fetchWithTimeout(
  url: string,
  config: ServerFetchConfig = {},
  nextConfig?: NextConfig
): Promise<Response> {
  const {
    timeout = API_TIMEOUT,
    retries = MAX_RETRIES,
    retryDelay = RETRY_DELAY,
    ...fetchConfig
  } = config;

  let lastError: Error | undefined;

  for (let attempt = 0; attempt < retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchConfig,
        signal: controller.signal,
        // Add Next.js config if provided
        ...(nextConfig && { next: nextConfig }),
      });

      clearTimeout(timeoutId);

      // Retry on specific server errors (502, 503, 504)
      if (
        response.status >= 502 &&
        response.status <= 504 &&
        attempt < retries - 1
      ) {
        const delay = calculateBackoff(attempt, retryDelay);
        await sleep(delay);
        continue;
      }

      // Retry on 429 (rate limit) if Retry-After header is reasonable
      if (response.status === 429 && attempt < retries - 1) {
        const retryAfter = parseRetryAfter(response.headers.get("Retry-After"));
        if (retryAfter && retryAfter <= MAX_RETRY_DELAY) {
          await sleep(retryAfter);
          continue;
        }
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error as Error;

      // Don't retry on certain errors or last attempt
      if (!shouldRetry(error, attempt, retries)) {
        break;
      }

      // Exponential backoff with jitter
      const delay = calculateBackoff(attempt, retryDelay);
      await sleep(delay);
    }
  }

  throw lastError || new Error("Request failed after retries");
}

/**
 * Calculates the delay for exponential backoff with jitter to prevent thundering herd problems.
 *
 * @param attempt - The current attempt number (starting from 0).
 * @param baseDelay - The base delay in milliseconds.
 * @returns The calculated delay in milliseconds, capped at MAX_RETRY_DELAY.
 */
function calculateBackoff(attempt: number, baseDelay: number): number {
  const exponentialDelay = baseDelay * Math.pow(2, attempt);
  const jitter = Math.random() * 0.3 * exponentialDelay; // 0-30% jitter
  return Math.min(exponentialDelay + jitter, MAX_RETRY_DELAY);
}

/**
 * Parses the Retry-After header from HTTP responses, supporting both seconds and HTTP date formats.
 *
 * @param header - The Retry-After header value.
 * @returns The retry delay in milliseconds, or null if parsing fails.
 */
function parseRetryAfter(header: string | null): number | null {
  if (!header) return null;

  // Try parsing as seconds
  const seconds = parseInt(header, 10);
  if (!isNaN(seconds)) {
    return seconds * 1000; // Convert to milliseconds
  }

  // Try parsing as HTTP date
  const date = new Date(header);
  if (!isNaN(date.getTime())) {
    return Math.max(0, date.getTime() - Date.now());
  }

  return null;
}

/**
 * Determines whether a request should be retried based on the error type and remaining attempts.
 *
 * @param error - The error that occurred.
 * @param attempt - The current attempt number.
 * @param maxRetries - The maximum number of retry attempts allowed.
 * @returns True if the request should be retried, false otherwise.
 */
function shouldRetry(
  error: unknown,
  attempt: number,
  maxRetries: number
): boolean {
  // No more attempts left
  if (attempt >= maxRetries - 1) return false;

  if (error instanceof Error) {
    // Timeout errors are retryable
    if (error.name === "AbortError") return true;

    // Network errors are retryable (except connection refused which indicates server is down)
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      // Don't retry if it's clearly a connection refused
      if (error.message.includes("ECONNREFUSED")) return false;
      return true;
    }

    // Other network errors
    if (
      error.message.includes("network") ||
      error.message.includes("ETIMEDOUT")
    ) {
      return true;
    }
  }

  // Unknown errors - don't retry
  return false;
}

/**
 * Creates a promise that resolves after a specified delay, used for implementing retry delays.
 *
 * @param ms - The delay in milliseconds.
 * @returns A Promise that resolves after the specified delay.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
