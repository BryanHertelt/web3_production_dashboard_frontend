import type { LogPayload, UserContext, FailedLogEntry } from "./types";
import { sanitizePayload } from "../../helpers";

/**
 * Configuration constants for logging behavior
 */
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

/**
 * Time limit for batch retry in milliseconds (30 seconds)
 */
const BATCH_RETRY_TIME_LIMIT = 30000;
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
      timeZone: "Europe/Berlin",
    })
    .replace(" ", "T");
}

export { sanitizePayload };

/**
 * Determines whether a log should be sampled based on sample rate
 * @param logData - Log data object that may contain a sample_rate property
 * @returns True if the log should be sent, false if it should be dropped
 */
export function shouldSampleLog(logData: LogPayload): boolean {
  if (logData.sample_rate !== undefined) {
    return Math.random() < logData.sample_rate;
  }

  return true;
}

interface WindowWithLogState extends Window {
  __failedLogs?: FailedLogEntry[];
  __currentOperationId?: string;
  __currentOperationName?: string;
}

interface GlobalWithLogState {
  batchRetryTimerId?: NodeJS.Timeout | null;
  sendLogWithRetry?: (payload: LogPayload, attempt: number) => Promise<void>;
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
  const timeoutId = setTimeout(() => controller.abort(), 10000);

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
  } catch (err) {
    clearTimeout(timeoutId);
    const error = err as Error;
    if (attempt < LOG_CONFIG.MAX_RETRIES) {
      const delay = LOG_CONFIG.RETRY_DELAY * Math.pow(2, attempt - 1);

      await new Promise((resolve) => setTimeout(resolve, delay));
      return sendLogWithRetry(payload, attempt + 1);
    } else {
      if (typeof window !== "undefined") {
        const win = window as WindowWithLogState;
        win.__failedLogs = win.__failedLogs || [];
        win.__failedLogs.push({ payload, timestamp: Date.now() });

        if (!batchRetryTimerId) {
          batchRetryTimerId = setTimeout(() => {
            sendBatchRetry();
          }, BATCH_RETRY_TIME_LIMIT);
        }

        if (win.__failedLogs.length > 100) {
          if (batchRetryTimerId) {
            clearTimeout(batchRetryTimerId);
            batchRetryTimerId = null;
          }
          sendBatchRetry();
          win.__failedLogs = [];
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
  if (typeof window === "undefined") {
    return;
  }

  const win = window as WindowWithLogState;
  if (!win.__failedLogs || win.__failedLogs.length === 0) {
    return;
  }

  if (batchRetryTimerId) {
    clearTimeout(batchRetryTimerId);
    batchRetryTimerId = null;
  }

  const globalState = global as unknown as GlobalWithLogState;
  if (globalState.batchRetryTimerId) {
    clearTimeout(globalState.batchRetryTimerId);
    globalState.batchRetryTimerId = null;
  }

  const FIVE_MINUTES = 5 * 60 * 1000;
  win.__failedLogs = win.__failedLogs.filter(
    (log) => Date.now() - log.timestamp < FIVE_MINUTES
  );

  const logsToSend: FailedLogEntry[] = [...win.__failedLogs];
  win.__failedLogs = [];
  for (const logEntry of logsToSend) {
    try {
      await (globalState.sendLogWithRetry
        ? globalState.sendLogWithRetry(logEntry.payload, 1)
        : sendLogWithRetry(logEntry.payload, 1));
    } catch {
      /** Silent failure - log already attempted retry */
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

  const win = window as WindowWithLogState;
  const storedId = win.__currentOperationId;
  if (storedId) return storedId;

  const newId = crypto.randomUUID();
  win.__currentOperationId = newId;
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
    const win = window as WindowWithLogState;
    win.__currentOperationId = operationId;
    win.__currentOperationName = operationName;
  }
  return operationId;
}

/**
 * End the current operation
 * Clears the operation ID and name from window object
 */
export function endOperation(): void {
  if (typeof window !== "undefined") {
    const win = window as WindowWithLogState;
    delete win.__currentOperationId;
    delete win.__currentOperationName;
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
    try {
      sessionStorage.setItem("sessionId", sessionId);
    } catch {
      /** Silent failure in private browsing mode or when storage is disabled */
    }
  }

  return {
    user_id:
      typeof window !== "undefined" && typeof localStorage !== "undefined"
        ? localStorage.getItem("userId") || "anonymous"
        : "server_side_user",
    session_id: sessionId || "server_session",
  };
}
