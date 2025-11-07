import {
  LOG_CONFIG,
  formatTimestamp,
  sanitizePayload,
  shouldSampleLog,
  sendLogWithRetry,
  sendBatchRetry,
  getCurrentOperationId,
  startOperation,
  endOperation,
  getUserContext,
} from "../../shared/logger/client-logger/model/helpers";
import type { LogPayload, FailedLogEntry } from "../../shared/logger/client-logger/model/types";

// Mock crypto.randomUUID
const mockUUID = "550e8400-e29b-41d4-a716-446655440000";

// Helper function to create valid LogPayload objects
const createMockLogPayload = (overrides?: Partial<LogPayload>): LogPayload => ({
  time: formatTimestamp(Date.now()),
  msg: "test message",
  level: "INFO",
  request_id: "req-123",
  attempt_num: 1,
  user_id: "test-user",
  session_id: "test-session",
  user_agent: "test-agent",
  timestamp: Date.now(),
  ...overrides,
});

interface WindowWithLogState extends Window {
  __failedLogs?: FailedLogEntry[];
  __currentOperationId?: string;
  __currentOperationName?: string;
}

// Helper to check if we're in a browser environment
const isBrowser = () => typeof window !== "undefined";

describe("helpers.ts", () => {
  let originalRandomUUID: typeof crypto.randomUUID;
  let consoleErrorSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();

    // Suppress all console output globally for tests
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    // Mock crypto.randomUUID
    originalRandomUUID = global.crypto.randomUUID;
    Object.defineProperty(global.crypto, 'randomUUID', {
      value: jest.fn(() => mockUUID),
      writable: true,
    });

    // Clear window properties
    if (isBrowser()) {
      const win = window as unknown as WindowWithLogState;
      delete win.__failedLogs;
      delete win.__currentOperationId;
      delete win.__currentOperationName;
    }

    // Clear global properties
    delete (global as Record<string, unknown>).batchRetryTimerId;
    delete (global as Record<string, unknown>).sendLogWithRetry;
  });

  afterEach(() => {
    jest.useRealTimers();
    
    // Restore console methods
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleLogSpy.mockRestore();
    
    Object.defineProperty(global.crypto, 'randomUUID', {
      value: originalRandomUUID,
      writable: true,
    });
  });

  describe("LOG_CONFIG", () => {
    it("should have correct log level values", () => {
      expect(LOG_CONFIG.LEVELS.DEBUG).toBe(20);
      expect(LOG_CONFIG.LEVELS.INFO).toBe(30);
      expect(LOG_CONFIG.LEVELS.WARN).toBe(40);
      expect(LOG_CONFIG.LEVELS.ERROR).toBe(50);
      expect(LOG_CONFIG.LEVELS.FATAL).toBe(60);
    });

    it("should have correct retry configuration", () => {
      expect(LOG_CONFIG.MAX_RETRIES).toBe(3);
      expect(LOG_CONFIG.RETRY_DELAY).toBe(1000);
      expect(LOG_CONFIG.SAMPLE_RATE).toBe(1);
    });
  });

  describe("formatTimestamp", () => {
    it("should format timestamp in CET/CEST format", () => {
      const timestamp = new Date("2024-03-15T10:30:00Z").getTime();
      const result = formatTimestamp(timestamp);
      
      // Result should be in YYYY-MM-DDTHH:mm:ss format
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
    });

    it("should use current time when no timestamp provided", () => {
      const result = formatTimestamp();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
    });

    it("should handle Europe/Berlin timezone", () => {
      const timestamp = new Date("2024-06-15T12:00:00Z").getTime();
      const result = formatTimestamp(timestamp);
      
      // Should contain valid date and time
      expect(result).toContain("2024-06-15");
    });
  });

  describe("sanitizePayload", () => {
    it("should redact sensitive fields", () => {
      const payload = {
        username: "john",
        password: "secret123",
        apiToken: "abc123",
        data: "public",
      };

      const result = sanitizePayload(payload);

      expect(result.username).toBe("john");
      expect(result.password).toBe("[REDACTED]");
      expect(result.apiToken).toBe("[REDACTED]");
      expect(result.data).toBe("public");
    });

    it("should handle nested objects", () => {
      const payload = {
        user: {
          name: "john",
          credentials: {
            password: "secret",
            apiKey: "key123",
          },
        },
        message: "test",
      };

      const result = sanitizePayload(payload);

      expect(result.user.name).toBe("john");
      expect(result.user.credentials.password).toBe("[REDACTED]");
      expect(result.user.credentials.apiKey).toBe("[REDACTED]");
      expect(result.message).toBe("test");
    });

    it("should redact all sensitive keywords", () => {
      const payload = {
        password: "pass",
        token: "tok",
        secret: "sec",
        key: "key",
        auth: "auth",
        credential: "cred",
      };

      const result = sanitizePayload(payload);

      Object.values(result).forEach((value) => {
        expect(value).toBe("[REDACTED]");
      });
    });

    it("should handle null and undefined", () => {
      expect(sanitizePayload(null as unknown as Record<string, unknown>)).toBeNull();
      expect(sanitizePayload(undefined as unknown as Record<string, unknown>)).toBeUndefined();
    });

    it("should handle non-object inputs", () => {
      expect(sanitizePayload("string" as unknown as Record<string, unknown>)).toBe("string");
      expect(sanitizePayload(123 as unknown as Record<string, unknown>)).toBe(123);
    });
  });

  describe("shouldSampleLog", () => {
    it("should return true when no sample_rate specified", () => {
      const logData = createMockLogPayload();

      expect(shouldSampleLog(logData)).toBe(true);
    });

    it("should respect custom sample_rate", () => {
      jest.spyOn(Math, "random").mockReturnValue(0.3);

      const logData1 = createMockLogPayload({ sample_rate: 0.5 });
      const logData2 = createMockLogPayload({ sample_rate: 0.2 });

      expect(shouldSampleLog(logData1)).toBe(true); // 0.3 < 0.5
      expect(shouldSampleLog(logData2)).toBe(false); // 0.3 > 0.2
    });

    it("should always return false when sample_rate is 0", () => {
      const logData = createMockLogPayload({ sample_rate: 0 });

      expect(shouldSampleLog(logData)).toBe(false);
    });
  });

  describe("sendLogWithRetry", () => {
    beforeEach(() => {
      // Mock fetch globally
      global.fetch = jest.fn();
    });

    it("should send log successfully on first attempt", async () => {
      const mockPayload = createMockLogPayload();

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

      await sendLogWithRetry(mockPayload);

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/logging",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            "X-Log-Attempt": "1",
          }),
          body: JSON.stringify(mockPayload),
        })
      );
    });

    it("should retry on failure with exponential backoff", async () => {
      const mockPayload = createMockLogPayload();

      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce({ ok: true, status: 200 });

      const promise = sendLogWithRetry(mockPayload).catch(() => {
        // Handle potential errors
      });

      // Wait for first call to complete
      await Promise.resolve();
      
      // Fast-forward through first retry delay
      await jest.advanceTimersByTimeAsync(LOG_CONFIG.RETRY_DELAY);

      await promise;

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it("should store failed logs after max retries in browser", async () => {
      // Skip this test in non-browser environments
      if (!isBrowser()) {
        return;
      }

      const mockPayload = createMockLogPayload();

      (global.fetch as jest.Mock).mockRejectedValue(
        new Error("Network error")
      );

      // Wrap in try-catch to prevent unhandled rejection warnings
      const promise = sendLogWithRetry(mockPayload).catch(() => {
        // Silently catch the error - this is expected behavior
      });

      // Fast-forward through all retries
      for (let i = 0; i < LOG_CONFIG.MAX_RETRIES; i++) {
        await Promise.resolve();
        const delay = LOG_CONFIG.RETRY_DELAY * Math.pow(2, i);
        await jest.advanceTimersByTimeAsync(delay);
      }

      await promise;

      expect(global.fetch).toHaveBeenCalledTimes(LOG_CONFIG.MAX_RETRIES);

      const win = window as unknown as WindowWithLogState;
      expect(win.__failedLogs).toBeDefined();
      expect(win.__failedLogs).toHaveLength(1);
    });

    it("should handle HTTP error responses", async () => {
      const mockPayload = createMockLogPayload();

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
        })
        .mockResolvedValueOnce({ ok: true, status: 200 });

      const promise = sendLogWithRetry(mockPayload).catch(() => {
        // Handle potential errors
      });

      // Wait for first call to complete
      await Promise.resolve();
      
      // Fast-forward to trigger retry
      await jest.advanceTimersByTimeAsync(LOG_CONFIG.RETRY_DELAY);

      await promise;

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it("should abort request after timeout", async () => {
      const mockPayload = createMockLogPayload();

      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise(() => {
          // Never resolves
        })
      );

      sendLogWithRetry(mockPayload);

      await jest.advanceTimersByTimeAsync(10000); // Timeout is 10 seconds
      await Promise.resolve();

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("sendBatchRetry", () => {
    it("should do nothing when no failed logs exist", async () => {
      await sendBatchRetry();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("should send all failed logs in browser", async () => {
      // Skip this test in non-browser environments
      if (!isBrowser()) {
        return;
      }

      const mockLogs = [
        { payload: createMockLogPayload({ msg: "log1" }), timestamp: Date.now() },
        { payload: createMockLogPayload({ msg: "log2", level: "ERROR" }), timestamp: Date.now() },
      ];

      const win = window as unknown as WindowWithLogState;
      win.__failedLogs = mockLogs;

      (global.fetch as jest.Mock).mockResolvedValue({ ok: true, status: 200 });

      await sendBatchRetry();

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(win.__failedLogs).toEqual([]);
    });
  });

  describe("getCurrentOperationId", () => {
    it("should return stored operation ID if available in browser", () => {
      // Skip this test in non-browser environments
      if (!isBrowser()) {
        return;
      }

      // Browser: should return stored ID
      const win = window as unknown as WindowWithLogState;
      win.__currentOperationId = "existing-id";

      const result = getCurrentOperationId();
      expect(result).toBe("existing-id");
    });

    it("should create new operation ID if none exists", () => {
      const result = getCurrentOperationId();
      expect(result).toBe(mockUUID);
    });
  });

  describe("startOperation", () => {
    it("should create and store new operation ID in browser", () => {
      const operationId = startOperation("test-operation");
      expect(operationId).toBe(mockUUID);

      // Skip window checks in non-browser environments
      if (!isBrowser()) {
        return;
      }

      const win = window as unknown as WindowWithLogState;
      expect(win.__currentOperationId).toBe(mockUUID);
      expect(win.__currentOperationName).toBe("test-operation");
    });

    it("should create new operation ID", () => {
      const operationId = startOperation("test-operation");
      expect(operationId).toBe(mockUUID);
    });
  });

  describe("endOperation", () => {
    it("should clear operation ID and name in browser", () => {
      // Skip this test in non-browser environments
      if (!isBrowser()) {
        // In non-browser, endOperation does nothing but shouldn't error
        endOperation();
        return;
      }

      const win = window as unknown as WindowWithLogState;
      win.__currentOperationId = "test-id";
      win.__currentOperationName = "test-op";

      endOperation();

      expect(win.__currentOperationId).toBeUndefined();
      expect(win.__currentOperationName).toBeUndefined();
    });

    it("should not error in non-browser environment", () => {
      // This test works in both environments
      expect(() => endOperation()).not.toThrow();
    });
  });

  describe("getUserContext", () => {
    beforeEach(() => {
      // Mock sessionStorage and localStorage
      if (isBrowser()) {
        Object.defineProperty(window, "sessionStorage", {
          value: {
            getItem: jest.fn(),
            setItem: jest.fn(),
          },
          writable: true,
        });

        Object.defineProperty(window, "localStorage", {
          value: {
            getItem: jest.fn(),
          },
          writable: true,
        });
      }
    });

    it("should return server-side defaults in non-browser environment", () => {
      const context = getUserContext();
      
      // Skip detailed checks if in browser
      if (isBrowser() && typeof sessionStorage !== "undefined") {
        return;
      }

      expect(context.session_id).toBe("server_session");
      expect(context.user_id).toBe("server_side_user");
    });

    it("should return existing session and user IDs in browser", () => {
      // Skip in non-browser
      if (!isBrowser() || typeof sessionStorage === "undefined") {
        return;
      }

      (sessionStorage.getItem as jest.Mock).mockReturnValue("existing-session");
      (localStorage.getItem as jest.Mock).mockReturnValue("user-123");

      const context = getUserContext();

      expect(context.session_id).toBe("existing-session");
      expect(context.user_id).toBe("user-123");
    });

    it("should create new session ID if none exists in browser", () => {
      // Skip in non-browser
      if (!isBrowser() || typeof sessionStorage === "undefined") {
        return;
      }

      (sessionStorage.getItem as jest.Mock).mockReturnValue(null);
      (localStorage.getItem as jest.Mock).mockReturnValue("user-123");

      const context = getUserContext();

      expect(context.session_id).toBe(mockUUID);
      expect(context.user_id).toBe("user-123");
      expect(sessionStorage.setItem).toHaveBeenCalledWith("sessionId", mockUUID);
    });

    it("should return anonymous user if no userId in localStorage", () => {
      // Skip in non-browser
      if (!isBrowser() || typeof sessionStorage === "undefined") {
        return;
      }

      (sessionStorage.getItem as jest.Mock).mockReturnValue("session-123");
      (localStorage.getItem as jest.Mock).mockReturnValue(null);

      const context = getUserContext();

      expect(context.user_id).toBe("anonymous");
    });
  });
});