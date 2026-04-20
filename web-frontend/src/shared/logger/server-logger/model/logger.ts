/**
 * @logger Server-side structured logger for the ZENET web server.
 *
 * Uses Pino for local logging and pushes logs to Grafana Loki if remote configuration is available.
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

const DEFAULT_FIELDS = {
  service: "zenet_web_server",
  env: process.env.NODE_ENV ?? "development",
  hostname: os.hostname(),
  pid: process.pid,
  version: process.env.APP_VERSION ?? "unknown",
};

const { LOKI_URL, API_USERNAME, API_KEY_LOKI } = process.env;

const REMOTE_ENABLED = Boolean(LOKI_URL && API_USERNAME && API_KEY_LOKI);

const MAX_RETRIES = 2;
const RETRY_BASE_MS = 250;

const EMIT_STDOUT = false;

const out: PinoLogger = pino({
  level: EMIT_STDOUT ? "info" : "silent",
  base: {},
  timestamp: pino.stdTimeFunctions.isoTime,
});

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

function make(level: LogLevel) {
  return async (
    msg: string,
    fields: LogFields = {},
    sampleRate = 1
  ): Promise<void> => {
    if (typeof fields.duration_start_ms === "number") {
      const start = fields.duration_start_ms;
      const now = performance.now();
      fields.duration_ms = Number((now - start).toFixed(2));
      delete fields.duration_start_ms;
    }

    if ("err" in fields) {
      fields.err = normalizeError(fields.err);
    }

    (out[level] as PinoLogger["info"])(
      { ...DEFAULT_FIELDS, ...fields, level },
      `[Server] - ${msg}`
    );

    if (!shouldSample(sampleRate)) return;
    await pushToLoki(level, msg, fields);
  };
}

export const serverLogger: ServerLogger = {
  debug: make("debug"),
  info: make("info"),
  warn: make("warn"),
  error: make("error"),
  fatal: make("fatal"),
};
