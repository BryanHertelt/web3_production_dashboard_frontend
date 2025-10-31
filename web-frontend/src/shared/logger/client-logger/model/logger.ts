"use client";

import pino from "pino";
import {
  formatTimestamp,
  sanitizePayload,
  shouldSampleLog,
  sendLogWithRetry,
  getCurrentOperationId,
  startOperation,
  endOperation,
  getUserContext,
} from "./helpers";
import type { LogPayload, LogFields, ClientLogger } from "./types";

/**
 * Pino logger instance configured for browser use
 * Automatically transmits logs to backend API with structured metadata
 */
const baseLogger = pino({
  level: process.env.NODE_ENV === "development" ? "debug" : "info",

  browser: {
    asObject: true,
    transmit: {
      send: async (level: string | number, logEvent: any) => {
        try {
          // Check sampling from logEvent (merged from obj) or bindings
          const bindings = logEvent.bindings?.[0] || {};
          // Extract and process bindings
          const {
            attempt_num = 1,
            request_id = getCurrentOperationId(),
            ...otherBindings
          } = bindings;

          // Get user context
          const userContext = getUserContext();

          // Process messages
          let msgParts: string[] = [];
          let contextFromMessages: LogFields = {};

          for (const msg of logEvent.messages) {
            if (typeof msg === "string") {
              msgParts.push(msg);
            } else if (typeof msg === "object" && msg !== null) {
              // Extract message string
              if (msg.msg) {
                msgParts.push(msg.msg);
              } else if (msg.message) {
                msgParts.push(msg.message);
              }
              // Merge all other properties as context
              const { msg: _, message: __, ...otherProps } = msg;
              contextFromMessages = { ...contextFromMessages, ...otherProps };
            }
          }

          // Create structured log payload
          const logPayload: LogPayload = {
            // Core fields
            level:
              typeof level === "string"
                ? level
                : pino.levels.labels[level] || "info",
            time: formatTimestamp(logEvent.ts),
            msg: msgParts.join(" ") || "Log entry",

            // Request tracking
            request_id,
            operation_name:
              typeof window !== "undefined"
                ? (window as any).__currentOperationName
                : undefined,
            attempt_num,

            // User context
            ...userContext,
            user_agent:
              typeof navigator !== "undefined"
                ? navigator.userAgent
                : "unknown",

            // Page context (browser only)
            ...(typeof window !== "undefined" && {
              page_url: window.location.href,
              page_title: document.title,
              referrer: document.referrer || "direct",
            }),

            // Additional context from bindings
            ...sanitizePayload(otherBindings),

            // Context from log messages (userId, action, etc.)
            ...sanitizePayload(contextFromMessages),

            // Performance timing (if available)
            ...(typeof performance !== "undefined" && {
              navigation_timing: performance.timing
                ? {
                    page_load_time:
                      performance.timing.loadEventEnd -
                      performance.timing.navigationStart,
                  }
                : undefined,
            }),
          };

          // SAMPLING: Check if log should be sent
          if (!shouldSampleLog(logPayload)) {
            return; // Log will not be sent
          }

          // Send the log
          await sendLogWithRetry(logPayload);
        } catch (err) {
          // Fallback to console if all else fails
          console.error("Critical logging failure:", err);
          console.log("Original log:", { level, logEvent });
        }
      },
    },
  },
});

/**
 * Create a child logger with a specific sample rate
 * Useful for reducing log volume on high-frequency operations
 * @param sampleRate - Sample rate between 0 and 1 (e.g., 0.1 = 10%)
 * @param context - Additional context to include in all logs
 * @returns Child logger with sample rate applied
 * @example
 * const sampledLogger = logger.withSampleRate(0.1, { component: 'highFrequency' });
 * sampledLogger.info('This log has a 10% chance of being sent');
 */
(baseLogger as any).withSampleRate = (sampleRate: number, context: LogFields = {}): ClientLogger => {
  return baseLogger.child({
    sample_rate: sampleRate,
    ...sanitizePayload(context),
  }) as ClientLogger;
};

/**
 * Start a new operation and return a logger with operation context
 * The returned logger automatically includes operation ID and name in all logs
 * Call endOperation() on the returned logger when the operation completes
 * @param operationName - Name of the operation to track
 * @param context - Additional context to include in all logs for this operation
 * @returns Operation logger with endOperation method
 * @example
 * const opLogger = logger.startOperation('processPayment', { userId: '123' });
 * opLogger.info('Payment processing started');
 * // ... do work ...
 * opLogger.endOperation();
 */
(baseLogger as any).startOperation = (operationName: string, context: LogFields = {}): ClientLogger & { endOperation: () => void } => {
  const operationId = startOperation(operationName);

  const operationLogger = baseLogger.child({
    request_id: operationId,
    operation_name: operationName,
    ...sanitizePayload(context),
  }) as ClientLogger;

  // Add endOperation method
  (operationLogger as any).endOperation = () => {
    endOperation();
  };

  return operationLogger as ClientLogger & { endOperation: () => void };
};

export const logger: ClientLogger = baseLogger as ClientLogger;
