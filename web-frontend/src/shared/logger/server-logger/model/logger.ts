/**
 * @logger Server-side structured logger for the ZENET web server.
 *
 * Uses Pino for local logging and pushes logs to Grafana Loki if remote configuration is available.
 *
 * Includes retry logic, structured metadata, duration tracking,
 * and sampling support for performance monitoring.
 */

import os from "os";
import pino, { Logger as PinoLogger } from "pino";
import {
  epochNanos,
  formatTimestamp,
  sanitizePayload,
  shouldSample,
  basicAuthHeader,
  delay,
  normalizeError,
} from "./helpers";
import type { LogLevel, LogFields, ServerLogger } from "./types";

/**
 * Default metadata fields automatically attached to every log entry.
 * These provide context about the running environment.
 * @param service The service name (prefix used for Loki stream separation).
 * @param env Current environment name (e.g. 'development', 'production').
 * @param hostname Host machine name.
 * @param pid Current process ID.
 * @param version Application version or build identifier.
 */
const DEFAULT_FIELDS = {
  service: "zenet_web_server",
  env: process.env.NODE_ENV ?? "development",
  hostname: os.hostname(),
  pid: process.pid,
  version: process.env.APP_VERSION ?? "unknown",
};

const { LOKI_URL, API_USERNAME, API_KEY_LOKI } = process.env;

/**
 * Indicates whether remote logging to Loki is enabled.
 * True only if all required configuration variables are present.
 */
const REMOTE_ENABLED = Boolean(LOKI_URL && API_USERNAME && API_KEY_LOKI);

/**
 * Retry configuration for failed Loki push attempts.
 */
const MAX_RETRIES = 2;
const RETRY_BASE_MS = 250;

/**
 * Whether to emit local stdout logs in addition to remote Loki pushes.
 * Useful for debugging or local development.
 */
const EMIT_STDOUT = false;

/**
 * Local Pino logger instance. Defaults to silent mode if EMIT_STDOUT is false.
 */
const out: PinoLogger = pino({
  level: EMIT_STDOUT ? "info" : "silent",
  base: {},
  timestamp: pino.stdTimeFunctions.isoTime,
});

/**
 * Pushes a single log entry to Grafana Loki.
 *
 * Builds a structured JSON payload containing the log message, metadata,
 * and per-level stream labels for easy loki separation. Includes basic retry logic for network errors.
 *
 * @async
 * @param {LogLevel} level - The log level (e.g. 'info', 'error').
 * @param {string} msg - Log message text.
 * @param {LogFields} [fields={}] - Additional structured metadata custom fields- we can pass as many as we want using the logger.
 * @param {number} [nowMs=Date.now()] - Timestamp of the log event in milliseconds.
 * @returns {Promise<void>} Resolves when the log has been successfully pushed or retries are exhausted.
 * @const body The structured log payload including default and custom fields.
 * @const payload The Loki-specific payload structure with streams and values.
 * @const headers HTTP headers including Content-Type and Authorization for Loki - Loki docs on how it accepts requests.
 */
async function pushToLoki(
  level: LogLevel,
  msg: string,
  fields: LogFields = {},
  nowMs: number = Date.now()
): Promise<void> {
  if (!REMOTE_ENABLED) return;

  const body = {
    level,
    time: formatTimestamp(nowMs),
    msg: `[Server] - ${msg}`,
    ...sanitizePayload(DEFAULT_FIELDS),
    ...sanitizePayload(fields),
  };

  const lokiTimestamp = epochNanos(nowMs);
  const lokiLogBody = JSON.stringify(body);

  const payload = {
    streams: [
      {
        stream: { service: "zenet_web_server" },
        values: [[lokiTimestamp, lokiLogBody]],
      },
      {
        stream: { service: `zenet_web_server_${level}` },
        values: [[lokiTimestamp, lokiLogBody]],
      },
    ],
  };

  const headers = {
    "Content-Type": "application/json",
    Authorization: basicAuthHeader(API_USERNAME!, API_KEY_LOKI!),
  };

  /**
   * Attempt to send the log payload to Loki, retrying failures.
   *
   * Retry policy:
   * - Retries up to `MAX_RETRIES` times on network errors or 5xx responses.
   * - Skips retry on 4xx client errors (e.g. bad credentials).
   * - Uses exponential backoff: 250ms, 500ms...
   *
   * Control flow:
   * - Each retry attempt occurs within a `for` loop.
   * - A thrown error inside the loop signals a retriable failure and is caught immediately
   *   to trigger the next delay/attempt.
   * - The function never throws outward — it fails silently after exhausting retries
   *   (best-effort design to avoid impacting application flow).
   * @throws {Error} Throws on final failure after retries.
   * @returns res.ok true on success.
   * @returns {Promise<void>} Resolves when log is sent or retries are exhausted.
   */
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(LOKI_URL!, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (res.ok) return;
      if (res.status >= 400 && res.status < 500) return;

      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    } catch {
      if (attempt === MAX_RETRIES) return;
      await delay(RETRY_BASE_MS * 2 ** attempt);
    }
  }
}

/**
 * Factory function that creates an async logger method for a given level.
 *
 * Handles duration measurement, error normalization, sampling, and both
 * local + remote output.
 *
 * @param {level<LogLevel>} - The log level for this logger method (warn/error/debug).
 * @returns {(msg: string, fields?: LogFields, sampleRate?: number) => Promise<void>}
 * Async log function for the given level.
 */
function make(level: LogLevel) {
  return async (
    msg: string,
    fields: LogFields = {},
    sampleRate = 1
  ): Promise<void> => {
    /** Calculate duration if timing start was provided */
    if (typeof fields.duration_start_ms === "number") {
      const start = fields.duration_start_ms;
      const now = performance.now();
      fields.duration_ms = Number((now - start).toFixed(2));
      delete fields.duration_start_ms;
    }

    /** Normalize error field */
    if ("err" in fields) {
      fields.err = normalizeError(fields.err);
    }

    /** Local (pino) logging */
    (out[level] as PinoLogger["info"])(
      { ...DEFAULT_FIELDS, ...fields, level },
      `[Server] - ${msg}`
    );

    /** Sample (if not 1) and send to loki */
    if (!shouldSample(sampleRate)) return;
    await pushToLoki(level, msg, fields);
  };
}

/**
 * The global server logger instance for ZENET.
 *
 * Provides async methods for each log level:
 * - `debug()`
 * - `info()`
 * - `warn()`
 * - `error()`
 * - `fatal()`
 *
 * Each method supports structured fields and optional sampling.
 */
export const serverLogger: ServerLogger = {
  debug: make("debug"),
  info: make("info"),
  warn: make("warn"),
  error: make("error"),
  fatal: make("fatal"),
};
