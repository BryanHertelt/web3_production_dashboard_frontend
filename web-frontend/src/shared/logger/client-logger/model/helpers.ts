import type {
  LogPayload,
  LogFields,
  UserContext,
  FailedLogEntry,
} from "./types";

// Configuration constants
export const LOG_CONFIG = {
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
} as const;

// Batch retry timer configuration
const BATCH_RETRY_TIME_LIMIT = 30000; // 30 seconds time limit for batch retry
let batchRetryTimerId: NodeJS.Timeout | null = null;

/**
 * Convert timestamp to Central European Time string in YYYY-MM-DDTHH:mm:ss format
 * @param timestamp - Unix timestamp in milliseconds
 * @returns CET/CEST formatted timestamp string (ISO-like format)
 */
export function formatTimestamp(timestamp?: number): string {
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
 * @param obj - Object to sanitize
 * @param visited - WeakSet to track visited objects and prevent circular reference loops
 * @returns Sanitized object with sensitive fields replaced with '[REDACTED]'
 */
export function sanitizePayload<T>(obj: T, visited = new WeakSet<object>()): T {
  if (!obj || typeof obj !== "object") return obj;

  // Prevent circular reference infinite loop
  if (visited.has(obj as object)) return obj;
  visited.add(obj as object);

  const sensitive = [
    "password",
    "token",
    "secret",
    "key",
    "auth",
    "credential",
  ];

  // Handle arrays separately to preserve array type
  if (Array.isArray(obj)) {
    return obj.map((item) => {
      if (typeof item === "object" && item !== null) {
        return sanitizePayload(item, visited);
      }
      return item;
    }) as T;
  }

  const sanitized = { ...obj } as Record<string, any>;

  Object.keys(sanitized).forEach((key) => {
    if (typeof sanitized[key] === "object" && sanitized[key] !== null) {
      sanitized[key] = sanitizePayload(sanitized[key], visited);
    } else if (sensitive.some((s) => key.toLowerCase().includes(s))) {
      sanitized[key] = "[REDACTED]";
    }
  });

  return sanitized as T;
}

/**
 * Determines whether a log should be sampled based on sample rate
 * @param logData - Log data object that may contain a sample_rate property
 * @returns True if the log should be sent, false if it should be dropped
 */
export function shouldSampleLog(logData: LogPayload): boolean {
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
 * @param payload - Log payload to send
 * @param attempt - Current attempt number (1-indexed)
 */
export async function sendLogWithRetry(
  payload: LogPayload,
  attempt = 1
): Promise<void> {
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
    const error = err as Error;
    if (attempt < LOG_CONFIG.MAX_RETRIES) {
      const delay = LOG_CONFIG.RETRY_DELAY * Math.pow(2, attempt - 1); // Exponential backoff
      console.warn(
        `Log delivery failed (attempt ${attempt}), retrying in ${delay}ms:`,
        error.message
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
      return sendLogWithRetry(payload, attempt + 1);
    } else {
      console.error(
        `Log delivery failed after ${LOG_CONFIG.MAX_RETRIES} attempts:`,
        error.message
      );

      // Store failed logs in memory for potential retry
      if (typeof window !== "undefined") {
        (window as any).__failedLogs = (window as any).__failedLogs || [];
        (window as any).__failedLogs.push({ payload, timestamp: Date.now() });

        // Start timer if not already started
        if (!batchRetryTimerId) {
          batchRetryTimerId = setTimeout(() => {
            sendBatchRetry();
          }, BATCH_RETRY_TIME_LIMIT);
        }

        // Keep only last 100 failed logs to prevent memory leak
        if ((window as any).__failedLogs.length > 100) {
          if (batchRetryTimerId) {
            clearTimeout(batchRetryTimerId);
            batchRetryTimerId = null;
          }
          sendBatchRetry();
          (window as any).__failedLogs = [];
        }
      }

      throw error;
    }
  }
}

/**
 * Send all failed logs in memory as batch retry
 * Clears the batch retry timer and attempts to send all stored failed logs
 */
export async function sendBatchRetry(): Promise<void> {
  if (
    typeof window === "undefined" ||
    !(window as any).__failedLogs ||
    (window as any).__failedLogs.length === 0
  ) {
    return;
  }

  // Clear the timer since batch is being sent now
  if (batchRetryTimerId) {
    clearTimeout(batchRetryTimerId);
    batchRetryTimerId = null;
  }

  // Also clear global timer if set
  if ((global as any).batchRetryTimerId) {
    clearTimeout((global as any).batchRetryTimerId);
    (global as any).batchRetryTimerId = null;
  }

  const logsToSend: FailedLogEntry[] = [...(window as any).__failedLogs];
  (window as any).__failedLogs = [];
  for (const logEntry of logsToSend) {
    try {
      await ((global as any).sendLogWithRetry
        ? (global as any).sendLogWithRetry(logEntry.payload, 1)
        : sendLogWithRetry(logEntry.payload, 1));
    } catch (err) {
      console.error("Batch retry failed for log:", logEntry, err);
    }
  }
}

/**
 * Get or create current operation ID
 * Returns existing operation ID if available, otherwise creates a new UUID
 * @returns Current operation ID
 */
export function getCurrentOperationId(): string {
  if (typeof window === "undefined") return crypto.randomUUID();

  // Check if there's an active operation ID
  const storedId = (window as any).__currentOperationId;
  if (storedId) return storedId;

  // No active operation, create new one
  const newId = crypto.randomUUID();
  (window as any).__currentOperationId = newId;
  return newId;
}

/**
 * Start a new operation and return the operation ID
 * Stores the operation ID and name in window object for tracking
 * @param operationName - Name of the operation to track
 * @returns New operation ID (UUID)
 */
export function startOperation(operationName: string): string {
  const operationId = crypto.randomUUID();
  if (typeof window !== "undefined") {
    (window as any).__currentOperationId = operationId;
    (window as any).__currentOperationName = operationName;
  }
  return operationId;
}

/**
 * End the current operation
 * Clears the operation ID and name from window object
 */
export function endOperation(): void {
  if (typeof window !== "undefined") {
    delete (window as any).__currentOperationId;
    delete (window as any).__currentOperationName;
  }
}

/**
 * Get current user context including user ID and session ID
 * Creates new session ID if one doesn't exist
 * @returns User context object with user_id and session_id
 */
export function getUserContext(): UserContext {
  let sessionId: string | null = null;

  if (typeof window !== "undefined" && typeof sessionStorage !== "undefined") {
    sessionId = sessionStorage.getItem("sessionId");
  }

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
