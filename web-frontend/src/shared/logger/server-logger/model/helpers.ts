import type { NormalizedError } from "./types";
import { sanitizePayload } from "../../helpers";

/**
 * Helper utilities for the server logger.
 */

// Re-export sanitizePayload for backward compatibility
export { sanitizePayload };

/**
 * Convert a `Date.now()`-style millisecond timestamp to a Loki-compatible
 * nanosecond epoch (as a decimal string).
 */
let lastNs = 0n;
export function epochNanos(nowMs: number = Date.now()): string {
  let ns = BigInt(nowMs) * 1_000_000n;
  if (ns <= lastNs) ns = lastNs + 1n;
  lastNs = ns;
  return ns.toString();
}

/**
 * Format a timestamp for human readability.
 */
export function formatTimestamp(ms: number = Date.now()): string {
  return new Date(ms)
    .toLocaleString("sv-SE", { timeZone: "Europe/Berlin" })
    .replace(" ", "T");
}

/**
 * Simple probabilistic sampling gate for logs.
 */
export function shouldSample(sampleRate: number = 1): boolean {
  if (sampleRate >= 1) return true;
  if (sampleRate <= 0) return false;
  return Math.random() < sampleRate;
}

/**
 * Build a HTTP `Authorization` header value for Basic auth (Grafana Cloud Loki).
 */
export function basicAuthHeader(username: string, apiKey: string): string {
  const token = Buffer.from(`${username}:${apiKey}`, "utf8").toString("base64");
  return `Basic ${token}`;
}

/**
 * Promise-based sleep utility for retry of failed log sends.
 */
export function delay(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}

/**
 * Normalize arbitrary error-like input into a plain, serializable shape suitable
 * for structured logging.
 */
export function normalizeError(err: unknown): unknown {
  if (err instanceof Error) {
    const withField = err as Partial<Error> & {
      code?: string;
      status?: number;
      statusCode?: number;
      method?: string;
      url?: string;
    };

    const serverError: NormalizedError = {
      name: err.name,
      message: err.message,
      status: withField.status ?? withField.statusCode,
      method: withField.method,
      url: withField.url,
      code: withField.code,
      stack: err.stack,
      cause: err.cause ? String(err.cause) : undefined,
    };
    return serverError;
  }
  return err;
}
