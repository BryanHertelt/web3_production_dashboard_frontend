// src/shared/logger/server-logger/model/helpers.ts
import type { Redactable, NormalizedError } from "./types";

/**
 * Helper utilities for the server logger.
 */
/**
 * Convert a `Date.now()`-style millisecond timestamp to a Loki-compatible
 * nanosecond epoch (as a decimal string).
 *
 * Loki requires timestamps at ns precision and expects them to be **monotonic**.
 * To guarantee monotonicity under high throughput, this function remembers the last
 * emitted value and, if the next computed value is not strictly larger, it bumps
 * it by **1 ns**.
 *
 * @param nowMs Millisecond timestamp to convert. Defaults to `Date.now()`.
 * @returns A decimal string representing epoch time in **nanoseconds**.
 *
 * @example
 * const ns = epochNanos();         // "1729412345678000000"
 * const nsFromGiven = epochNanos(1700000000000);
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
 *
 * This is **not** used for Loki indexing—only for convenience when reading raw JSON.
 * Uses the `Europe/Berlin` timezone and an ISO-like Swedish locale format
 * (`sv-SE`) to produce a stable `YYYY-MM-DDTHH:mm:ss` string (no milliseconds).
 *
 * @param ms Milliseconds since epoch. Defaults to `Date.now()`.
 * @returns A string like `2025-10-20T09:15:42` in the Europe/Berlin timezone.
 *
 * @example
 * const humanTime = formatTimestamp(); // "2025-10-20T09:15:42"
 */
export function formatTimestamp(ms: number = Date.now()): string {
  return new Date(ms)
    .toLocaleString("sv-SE", { timeZone: "Europe/Berlin" })
    .replace(" ", "T");
}

/**
 * Recursively redacts sensitive keys in an arbitrary structure.
 *
 * Keys are matched **case-insensitively** against a small built-in list
 * (e.g., `password`, `authorization`, `apiKey`, `token`, `secret`, `cookie`, …).
 * Primitive values are returned as-is. Arrays and plain objects are traversed
 * and sensitive values replaced with the literal string `"[REDACTED]"`.
 *
 * This function **does not** mutate the input object; it returns a sanitized copy.
 *
 * @typeParam T The input value type, preserved in the return type.
 * @param value Any JSON-like value (object/array/primitive).
 * @returns The same structure with sensitive fields replaced by `"[REDACTED]"`.
 *
 * @example
 * sanitizePayload({ token: "abc", nested: { password: "p" } });
 * // => { token: "[REDACTED]", nested: { password: "[REDACTED]" } }
 */
export function sanitizePayload<T extends Redactable>(value: T): T {
  const sensitive = new Set([
     "password",
    "authorization",
    "apiKey",
    "api_key",
    "apikey",
    "token",
    "secret",
    "cookie",
    "set-cookie",
    "auth",
    "credential",
    "mail",
    "wallet",
    "address",
  ]);
  /**
   * --- Step 1 ---
   * If the value is not an object (i.e. primitive or null),
   * return it as-is because there’s nothing to sanitize.
   */
  if (value === null || typeof value !== "object") return value;

  /**
   * If the value is an array:
   * - Iterate over each element.
   * - Recursively sanitize each item (which may itself be an object or array).
   * - Return a new array.
   *
   * The `as unknown as T` cast tells TypeScript that the returned array has the same structural type as the input.
   */
  if (Array.isArray(value)) {
    return value.map((v) => sanitizePayload(v)) as unknown as T;
  }

  /**
   * Handle the case of a plain object.
   * We iterate through its own enumerable properties and recursively sanitize nested structures.
   * `out` is a fresh object to avoid mutating the original.
   */
  const obj = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  /**
   * destructure each key-value pair with `Object.entries()`.
   * If the key (lowercased) is in the `sensitive` set, replace its value with `"[REDACTED]"`.
   * Otherwise, recursively go into the value to sanitize nested objects/arrays.
   */
  for (const [k, v] of Object.entries(obj)) {
    out[k] = sensitive.has(k.toLowerCase()) ? "[REDACTED]" : sanitizePayload(v);
  }
  return out as T;
}

/**
 * Simple probabilistic sampling gate for logs.
 *
 * - `sampleRate = 1` → always log
 * - `sampleRate = 0` → never log
 * - `0 < sampleRate < 1` → log with probability `sampleRate`
 *
 * @param sampleRate Fraction in between 0 and 1. Defaults to `1`.
 * @returns `true` if the log should be emitted, otherwise `false`.
 *
 * @example
 * if (shouldSample(0.1)) { /* emit ~10% of logs *\/ }
 */
export function shouldSample(sampleRate: number = 1): boolean {
  if (sampleRate >= 1) return true;
  if (sampleRate <= 0) return false;
  return Math.random() < sampleRate;
}

/**
 * Build a HTTP `Authorization` header value for Basic auth (Grafana Cloud Loki).
 *
 * Concatenates `username:apiKey`, UTF-8 encodes it, Base64-encodes the bytes,
 * and prefixes with `"Basic "`. Suitable for the `Authorization` header.
 *
 * @param username Loki (Grafana Cloud) account username.
 * @param apiKey Loki API key (password component for Basic auth).
 * @returns A string like `"Basic dXNlcjphcGlLZXk="`.
 *
 * @example
 * fetch(url, { headers: { Authorization: basicAuthHeader(user, key) } });
 */
export function basicAuthHeader(username: string, apiKey: string): string {
  const token = Buffer.from(`${username}:${apiKey}`, "utf8").toString("base64");
  return `Basic ${token}`;
}

/**
 * Promise-based sleep utility for retry of failed log sends.
 *
 * @param ms Milliseconds to wait.
 * @returns A promise that resolves after the specified delay.
 *
 * @example
 * await delay(250); // pause 250ms
 */
export function delay(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}

/**
 * Normalize arbitrary error-like input into a plain, serializable shape suitable
 * for structured logging. Real `Error` instances are converted to a
 * `NormalizedError` object with selected fields preserved; all other values are
 * returned unchanged to avoid losing context.
 *
 * Preserved fields (when `err instanceof Error`):
 * - `name`, `message`, `stack` which are always present on `Error`
 * - @param withField extracts additional common fields if present:
 *   `status`, `method`, `url`, `code` and more can be added or removed as needed
 * - `cause` is stringified if defined
 *
 * @param err Unknown error-like value (could be `Error`, string, object, etc.).
 * @returns
 * - If `err` is an `Error`: a `NormalizedError` POJO with safe fields.
 * - Otherwise: the original `err` value (unchanged).
 *
 * @example
 *  fields.err = normalizeError(fields.err);
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
