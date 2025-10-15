"use client";
import pino from "pino";

/**
 * Logger module for client-side logging with Pino
 * Provides structured logging with IP caching, retry logic, sampling, and operation tracking
 * @module logger
 */

// Configuration constants
const LOG_CONFIG = {
  LEVELS: {
    DEBUG: 20,
    INFO: 30,
    WARN: 40,
    ERROR: 50,
    FATAL: 60,
  },
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  SAMPLE_RATE: 1,
};

// Batch retry timer configuration
const BATCH_RETRY_TIME_LIMIT = 30000; // 30 seconds time limit for batch retry
let batchRetryTimerId = null;

/**
 * Convert timestamp to Central European Time string in YYYY-MM-DDTHH:mm:ss format
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {string} CET/CEST formatted timestamp string (ISO-like format)
 */
function formatTimestamp(timestamp) {
  const date = new Date(timestamp || Date.now());
  return date
    .toLocaleString("sv-SE", {
      // ISO-like (YYYY-MM-DD HH:mm:ss)
      timeZone: "Europe/Berlin",
    })
    .replace(" ", "T");
}

/**
 * Sanitize sensitive data from log payload
 * Recursively redacts fields containing sensitive keywords (password, token, secret, etc.)
 * @param {Object} obj - Object to sanitize
 * @returns {Object} Sanitized object with sensitive fields replaced with '[REDACTED]'
 */
function sanitizePayload(obj) {
  if (!obj || typeof obj !== "object") return obj;

  const sensitive = [
    "password",
    "token",
    "secret",
    "key",
    "auth",
    "credential",
  ];
  const sanitized = { ...obj };

  Object.keys(sanitized).forEach((key) => {
    if (sensitive.some((s) => key.toLowerCase().includes(s))) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof sanitized[key] === "object" && sanitized[key] !== null) {
      sanitized[key] = sanitizePayload(sanitized[key]);
    }
  });

  return sanitized;
}

/**
 * Determines whether a log should be sampled based on sample rate
 * @param {Object} logData - Log data object that may contain a sample_rate property
 * @returns {boolean} True if the log should be sent, false if it should be dropped
 */
function shouldSampleLog(logData) {
  // Individuelle Sample-Rate verwenden
  if (logData.sample_rate !== undefined) {
    return Math.random() < logData.sample_rate;
  }

  // Standard: alle Logs senden
  return true;
}

/**
 * Send log payload with retry logic directly to Loki
 * Implements exponential backoff and stores failed logs for batch retry
 * @param {Object} payload - Log payload to send
 * @param {number} [attempt=1] - Current attempt number (1-indexed)
 */
async function sendLogWithRetry(payload, attempt = 1) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

  try {
    const response = await fetch("/api/logging", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Log-Attempt": attempt.toString(),
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Log successful retry if not first attempt
    if (attempt > 1) {
      console.info(`Log delivery succeeded on attempt ${attempt}`);
    }
  } catch (err) {
    clearTimeout(timeoutId);
    if (attempt < LOG_CONFIG.MAX_RETRIES) {
      const delay = LOG_CONFIG.RETRY_DELAY * Math.pow(2, attempt - 1); // Exponential backoff
      console.warn(
        `Log delivery failed (attempt ${attempt}), retrying in ${delay}ms:`,
        err.message
      );

      setTimeout(() => {
        sendLogWithRetry(payload, attempt + 1);
      }, delay);
    } else {
      console.error(
        `Log delivery failed after ${LOG_CONFIG.MAX_RETRIES} attempts:`,
        err.message
      );

      // Store failed logs in memory for potential retry
      if (typeof window !== "undefined") {
        window.__failedLogs = window.__failedLogs || [];
        window.__failedLogs.push({ payload, timestamp: Date.now() });

        // Start timer if not already started
        if (!batchRetryTimerId) {
          batchRetryTimerId = setTimeout(() => {
            sendBatchRetry();
          }, BATCH_RETRY_TIME_LIMIT);
        }

        // Keep only last 100 failed logs to prevent memory leak
        if (window.__failedLogs.length > 100) {
          clearTimeout(batchRetryTimerId);
          batchRetryTimerId = null;
          sendBatchRetry();
          window.__failedLogs = [];
        }
      }
    }
  }
}

/**
 * Send all failed logs in memory as batch retry
 * Clears the batch retry timer and attempts to send all stored failed logs
 */
async function sendBatchRetry() {
  if (
    typeof window === "undefined" ||
    !window.__failedLogs ||
    window.__failedLogs.length === 0
  ) {
    return;
  }

  // Clear the timer since batch is being sent now
  if (batchRetryTimerId) {
    clearTimeout(batchRetryTimerId);
    batchRetryTimerId = null;
  }

  // Also clear global timer if set
  if (global.batchRetryTimerId) {
    clearTimeout(global.batchRetryTimerId);
    global.batchRetryTimerId = null;
  }

  const logsToSend = [...window.__failedLogs];
  window.__failedLogs = [];
  for (const logEntry of logsToSend) {
    try {
      await (global.sendLogWithRetry
        ? global.sendLogWithRetry(logEntry.payload, 1)
        : sendLogWithRetry(logEntry.payload, 1));
    } catch (err) {
      console.error("Batch retry failed for log:", logEntry, err);
    }
  }
}

/**
 * Get or create current operation ID
 * Returns existing operation ID if available, otherwise creates a new UUID
 * @returns {string} Current operation ID
 */
function getCurrentOperationId() {
  if (typeof window === "undefined") return crypto.randomUUID();

  // Check if there's an active operation ID
  const storedId = window.__currentOperationId;
  if (storedId) return storedId;

  // No active operation, create new one
  const newId = crypto.randomUUID();
  window.__currentOperationId = newId;
  return newId;
}

/**
 * Start a new operation and return the operation ID
 * Stores the operation ID and name in window object for tracking
 * @param {string} operationName - Name of the operation to track
 * @returns {string} New operation ID (UUID)
 */
function startOperation(operationName) {
  const operationId = crypto.randomUUID();
  if (typeof window !== "undefined") {
    window.__currentOperationId = operationId;
    window.__currentOperationName = operationName;
  }
  return operationId;
}

/**
 * End the current operation
 * Clears the operation ID and name from window object
 */
function endOperation() {
  if (typeof window !== "undefined") {
    delete window.__currentOperationId;
    delete window.__currentOperationName;
  }
}

/**
 * Get current user context including user ID and session ID
 * Creates new session ID if one doesn't exist
 * @returns {Object} User context object with user_id and session_id
 */
function getUserContext() {
  let sessionId =
    typeof window !== "undefined" && typeof sessionStorage !== "undefined"
      ? sessionStorage.getItem("sessionId")
      : null;

  if (
    !sessionId &&
    typeof window !== "undefined" &&
    typeof sessionStorage !== "undefined"
  ) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem("sessionId", sessionId);
  }

  return {
    user_id:
      typeof window !== "undefined" && typeof localStorage !== "undefined"
        ? localStorage.getItem("userId") || "anonymous"
        : "server_side_user",
    session_id: sessionId || "server_session",
  };
}
/**
 * Pino logger instance configured for browser use
 * Automatically transmits logs to backend API with structured metadata
 * @type {pino.Logger}
 */
const logger = pino({
  level: process.env.NODE_ENV === "development" ? "debug" : "info",

  browser: {
    asObject: true,
    transmit: {
      send: async (level, logEvent) => {
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
          let msgParts = [];
          let contextFromMessages = {};

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
          const logPayload = {
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
                ? window.__currentOperationName
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

            // ADD THIS LINE - Context from log messages (userId, action, etc.)
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

          // SAMPLING: PrÃ¼fen ob Log gesendet werden soll
          if (!shouldSampleLog(logPayload)) {
            return; // Log wird nicht gesendet
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

// SAMPLING FUNKTION

/**
 * Create a child logger with a specific sample rate
 * Useful for reducing log volume on high-frequency operations
 * @param {number} sampleRate - Sample rate between 0 and 1 (e.g., 0.1 = 10%)
 * @param {Object} [context={}] - Additional context to include in all logs
 * @returns {pino.Logger} Child logger with sample rate applied
 * @example
 * const sampledLogger = logger.withSampleRate(0.1, { component: 'highFrequency' });
 * sampledLogger.info('This log has a 10% chance of being sent');
 */
logger.withSampleRate = (sampleRate, context = {}) => {
  return logger.child({
    sample_rate: sampleRate,
    ...sanitizePayload(context),
  });
};

/**
 * Start a new operation and return a logger with operation context
 * The returned logger automatically includes operation ID and name in all logs
 * Call endOperation() on the returned logger when the operation completes
 * @param {string} operationName - Name of the operation to track
 * @param {Object} [context={}] - Additional context to include in all logs for this operation
 * @returns {pino.Logger & {endOperation: Function}} Operation logger with endOperation method
 * @example
 * const opLogger = logger.startOperation('processPayment', { userId: '123' });
 * opLogger.info('Payment processing started');
 * // ... do work ...
 * opLogger.endOperation();
 */
logger.startOperation = (operationName, context = {}) => {
  const operationId = startOperation(operationName);

  const operationLogger = logger.child({
    request_id: operationId,
    operation_name: operationName,
    ...sanitizePayload(context),
  });

  // Füge endOperation Methode hinzu
  operationLogger.endOperation = () => {
    endOperation();
  };

  return operationLogger;
};
// Export logger and utilities
export default logger;

// Named exports for convenience
export {
  LOG_CONFIG,
  sanitizePayload,
  getUserContext,
  startOperation,
  endOperation,
  shouldSampleLog,
  formatTimestamp,
  getCurrentOperationId,
};

// Export internal functions for testing
export { sendLogWithRetry, sendBatchRetry };
