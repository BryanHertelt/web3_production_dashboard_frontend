import {
  buildUrl,
  isNetworkError,
  isTimeoutError,
  extractErrorDetails,
  logError,
  getStatusCategory,
  sanitizeForLogging,
  isJsonResponse,
  safeJsonParse,
} from "../../../../shared/api-layer/server/model/helpers";
import { serverLogger } from "../../../../shared/logger/server-logger/model/logger";

describe("buildUrl", () => {
  it("builds URL without query parameters", () => {
    const result = buildUrl("http://example.com", "/api/test");
    expect(result).toBe("http://example.com/api/test");
  });

  it("builds URL with baseUrl ending with slash", () => {
    const result = buildUrl("http://example.com/", "/api/test");
    expect(result).toBe("http://example.com/api/test");
  });

  it("builds URL with path not starting with slash", () => {
    const result = buildUrl("http://example.com", "api/test");
    expect(result).toBe("http://example.com/api/test");
  });

  it("builds URL with simple query parameters", () => {
    const result = buildUrl("http://example.com", "/api/test", {
      param1: "value1",
      param2: "value2",
    });
    expect(result).toBe(
      "http://example.com/api/test?param1=value1&param2=value2"
    );
  });

  it("builds URL with array query parameters", () => {
    const result = buildUrl("http://example.com", "/api/test", {
      tags: ["tag1", "tag2"],
    });
    expect(result).toBe("http://example.com/api/test?tags=tag1&tags=tag2");
  });

  it("ignores undefined and null query parameters", () => {
    const result = buildUrl("http://example.com", "/api/test", {
      valid: "value",
      undefined: undefined,
      null: null,
    });
    expect(result).toBe("http://example.com/api/test?valid=value");
  });

  it("handles empty query object", () => {
    const result = buildUrl("http://example.com", "/api/test", {});
    expect(result).toBe("http://example.com/api/test");
  });

  it("handles undefined query", () => {
    const result = buildUrl("http://example.com", "/api/test");
    expect(result).toBe("http://example.com/api/test");
  });
});

describe("isNetworkError", () => {
  it("returns true for TypeError", () => {
    const error = new TypeError("Failed to fetch");
    expect(isNetworkError(error)).toBe(true);
  });

  it("returns true for fetch-related messages", () => {
    const error = new Error("fetch failed");
    expect(isNetworkError(error)).toBe(true);
  });

  it("returns true for network-related messages", () => {
    const error = new Error("network error occurred");
    expect(isNetworkError(error)).toBe(true);
  });

  it("returns true for ECONNREFUSED", () => {
    const error = new Error("ECONNREFUSED");
    expect(isNetworkError(error)).toBe(true);
  });

  it("returns true for ENOTFOUND", () => {
    const error = new Error("ENOTFOUND");
    expect(isNetworkError(error)).toBe(true);
  });

  it("returns true for ECONNRESET", () => {
    const error = new Error("ECONNRESET");
    expect(isNetworkError(error)).toBe(true);
  });

  it("returns true for ETIMEDOUT", () => {
    const error = new Error("ETIMEDOUT");
    expect(isNetworkError(error)).toBe(true);
  });

  it("returns false for other errors", () => {
    const error = new Error("some other error");
    expect(isNetworkError(error)).toBe(false);
  });

  it("returns false for non-Error objects", () => {
    expect(isNetworkError("string error")).toBe(false);
    expect(isNetworkError(null)).toBe(false);
    expect(isNetworkError(undefined)).toBe(false);
  });
});

describe("isTimeoutError", () => {
  it("returns true for AbortError", () => {
    const error = new Error("Request aborted");
    error.name = "AbortError";
    expect(isTimeoutError(error)).toBe(true);
  });

  it("returns true for timeout messages", () => {
    const error = new Error("Request timeout");
    expect(isTimeoutError(error)).toBe(true);
  });

  it("returns true for timed out messages", () => {
    const error = new Error("Request timed out");
    expect(isTimeoutError(error)).toBe(true);
  });

  it("returns false for other errors", () => {
    const error = new Error("some other error");
    expect(isTimeoutError(error)).toBe(false);
  });

  it("returns false for non-Error objects", () => {
    expect(isTimeoutError("string error")).toBe(false);
    expect(isTimeoutError(null)).toBe(false);
    expect(isTimeoutError(undefined)).toBe(false);
  });
});

describe("extractErrorDetails", () => {
  it("handles null/undefined errors", () => {
    expect(extractErrorDetails(null)).toEqual({
      message: "Unknown error occurred",
      details: null,
    });

    expect(extractErrorDetails(undefined)).toEqual({
      message: "Unknown error occurred",
      details: undefined,
    });
  });

  it("extracts details from error-like objects", () => {
    const errorObj = {
      message: "Custom error",
      status: 404,
      code: "NOT_FOUND",
      details: { extra: "info" },
    };

    const result = extractErrorDetails(errorObj);
    expect(result).toEqual({
      message: "Custom error",
      status: 404,
      code: "NOT_FOUND",
      details: { extra: "info" },
      originalError: undefined,
    });
  });

  it("extracts details from Error instances", () => {
    const error = new Error("Test error");
    error.name = "CustomError";

    const result = extractErrorDetails(error);
    expect(result.message).toBe("Test error");
    expect(result.originalError).toBe(error);
    expect(result.details).toEqual({
      name: "CustomError",
      stack: expect.any(String),
    });
  });

  it("handles primitive errors", () => {
    expect(extractErrorDetails("string error")).toEqual({
      message: "string error",
      details: "string error",
    });

    expect(extractErrorDetails(42)).toEqual({
      message: "42",
      details: 42,
    });
  });

  it("handles objects without message/status", () => {
    const errorObj = { custom: "value" };
    const result = extractErrorDetails(errorObj);
    expect(result.message).toBe("Unknown error");
    expect(result.details).toBe(errorObj);
  });
});

describe("logError", () => {
  let serverLoggerWarnSpy: jest.SpyInstance;
  let serverLoggerErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    serverLoggerWarnSpy = jest
      .spyOn(serverLogger, "warn")
      .mockResolvedValue(undefined);
    serverLoggerErrorSpy = jest
      .spyOn(serverLogger, "error")
      .mockResolvedValue(undefined);
  });

  afterEach(() => {
    serverLoggerWarnSpy.mockRestore();
    serverLoggerErrorSpy.mockRestore();
  });

  it("logs client errors as warnings", async () => {
    const error = { message: "Not found", status: 404 };

    await logError("test context", error, { extra: "data" });

    expect(serverLoggerWarnSpy).toHaveBeenCalledWith(
      "[Server API Warning]",
      expect.objectContaining({
        context: "test context",
        message: "Not found",
        status: 404,
        extra: "data",
      })
    );
  });

  it("logs server errors as errors", async () => {
    const error = { message: "Server error", status: 500 };

    await logError("test context", error);

    expect(serverLoggerErrorSpy).toHaveBeenCalledWith(
      "[Server API Error]",
      expect.objectContaining({
        context: "test context",
        message: "Server error",
        status: 500,
      })
    );
  });

  it("logs stack trace in development", async () => {
    const originalEnv = process.env;
    Object.defineProperty(process, "env", {
      value: { ...originalEnv, NODE_ENV: "development" },
      writable: true,
      configurable: true,
    });

    const error = new Error("Test error");

    await logError("test context", error);

    // Check that serverLogger.error was called for the main error
    expect(serverLoggerErrorSpy).toHaveBeenCalledWith(
      "[Server API Error]",
      expect.objectContaining({
        context: "test context",
        message: "Test error",
      })
    );

    // Check that stack trace was logged separately
    expect(serverLoggerErrorSpy).toHaveBeenCalledWith(
      "Stack trace:",
      expect.objectContaining({
        stack: expect.any(String),
      })
    );

    Object.defineProperty(process, "env", {
      value: originalEnv,
      writable: true,
      configurable: true,
    });
  });

  it("does not log stack trace in production", async () => {
    const originalEnv = process.env;
    Object.defineProperty(process, "env", {
      value: { ...originalEnv, NODE_ENV: "production" },
      writable: true,
      configurable: true,
    });

    const error = new Error("Test error");

    await logError("test context", error);

    // Should only call serverLogger.error once (for the main error, not stack trace)
    expect(serverLoggerErrorSpy).toHaveBeenCalledTimes(1);
    expect(serverLoggerErrorSpy).toHaveBeenCalledWith(
      "[Server API Error]",
      expect.objectContaining({
        context: "test context",
        message: "Test error",
      })
    );

    Object.defineProperty(process, "env", {
      value: originalEnv,
      writable: true,
      configurable: true,
    });
  });
});

describe("getStatusCategory", () => {
  it("returns success for 2xx status codes", () => {
    expect(getStatusCategory(200)).toBe("success");
    expect(getStatusCategory(201)).toBe("success");
    expect(getStatusCategory(299)).toBe("success");
  });

  it("returns redirect for 3xx status codes", () => {
    expect(getStatusCategory(300)).toBe("redirect");
    expect(getStatusCategory(301)).toBe("redirect");
    expect(getStatusCategory(399)).toBe("redirect");
  });

  it("returns client_error for 4xx status codes", () => {
    expect(getStatusCategory(400)).toBe("client_error");
    expect(getStatusCategory(401)).toBe("client_error");
    expect(getStatusCategory(404)).toBe("client_error");
    expect(getStatusCategory(499)).toBe("client_error");
  });

  it("returns server_error for 5xx status codes", () => {
    expect(getStatusCategory(500)).toBe("server_error");
    expect(getStatusCategory(502)).toBe("server_error");
    expect(getStatusCategory(599)).toBe("server_error");
  });

  it("returns unknown for other status codes", () => {
    expect(getStatusCategory(100)).toBe("unknown");
    expect(getStatusCategory(600)).toBe("unknown");
    expect(getStatusCategory(999)).toBe("unknown");
  });
});

describe("sanitizeForLogging", () => {
  it("returns primitives unchanged", () => {
    expect(sanitizeForLogging("string")).toBe("string");
    expect(sanitizeForLogging(42)).toBe(42);
    expect(sanitizeForLogging(null)).toBe(null);
    expect(sanitizeForLogging(undefined)).toBe(undefined);
  });

  it("sanitizes sensitive fields", () => {
    const data = {
      username: "user",
      password: "secret",
      token: "abc123",
      apiKey: "key456",
      authorization: "bearer token",
      cookie: "session=123",
      normalField: "normal",
    };

    const result = sanitizeForLogging(data);
    expect(result).toEqual({
      username: "user",
      password: "[REDACTED]",
      token: "[REDACTED]",
      apiKey: "[REDACTED]",
      authorization: "[REDACTED]",
      cookie: "[REDACTED]",
      normalField: "normal",
    });
  });

  it("handles nested objects", () => {
    const data = {
      user: {
        name: "John",
        password: "secret",
      },
      config: {
        apiKey: "key123",
        timeout: 5000,
      },
    };

    const result = sanitizeForLogging(data);
    expect(result).toEqual({
      user: {
        name: "John",
        password: "[REDACTED]",
      },
      config: {
        apiKey: "[REDACTED]",
        timeout: 5000,
      },
    });
  });

  it("handles arrays", () => {
    const data = [
      { password: "secret1", name: "user1" },
      { password: "secret2", name: "user2" },
    ];

    const result = sanitizeForLogging(data);
    expect(result).toEqual([
      { password: "[REDACTED]", name: "user1" },
      { password: "[REDACTED]", name: "user2" },
    ]);
  });

  it("handles case-insensitive matching", () => {
    const data = {
      Password: "secret",
      APIKEY: "key123",
      Authorization: "bearer token",
    };

    const result = sanitizeForLogging(data);
    expect(result).toEqual({
      Password: "[REDACTED]",
      APIKEY: "[REDACTED]",
      Authorization: "[REDACTED]",
    });
  });
});

describe("isJsonResponse", () => {
  it("returns true for JSON content type", () => {
    const response = {
      headers: new Headers({ "content-type": "application/json" }),
    } as Response;

    expect(isJsonResponse(response)).toBe(true);
  });

  it("returns true for JSON with charset", () => {
    const response = {
      headers: new Headers({
        "content-type": "application/json; charset=utf-8",
      }),
    } as Response;

    expect(isJsonResponse(response)).toBe(true);
  });

  it("returns false for non-JSON content types", () => {
    const response = {
      headers: new Headers({ "content-type": "text/html" }),
    } as Response;

    expect(isJsonResponse(response)).toBe(false);
  });

  it("returns false when no content-type header", () => {
    const response = {
      headers: new Headers(),
    } as Response;

    expect(isJsonResponse(response)).toBe(false);
  });
});

describe("safeJsonParse", () => {
  it("parses valid JSON response", async () => {
    const mockJson = jest.fn().mockResolvedValue({ data: "test" });
    const response = {
      headers: new Headers({ "content-type": "application/json" }),
      json: mockJson,
    } as unknown as Response;

    const result = await safeJsonParse(response);
    expect(result).toEqual({ data: "test" });
    expect(mockJson).toHaveBeenCalled();
  });

  it("returns fallback for non-JSON response", async () => {
    const response = {
      headers: new Headers({ "content-type": "text/html" }),
    } as Response;

    const result = await safeJsonParse(response, "fallback");
    expect(result).toBe("fallback");
  });

  it("returns fallback for JSON parse error", async () => {
    const mockJson = jest.fn().mockRejectedValue(new Error("Invalid JSON"));
    const response = {
      headers: new Headers({ "content-type": "application/json" }),
      json: mockJson,
    } as unknown as Response;

    const result = await safeJsonParse(response, "fallback");
    expect(result).toBe("fallback");
  });

  it("returns null when no fallback provided", async () => {
    const response = {
      headers: new Headers({ "content-type": "text/html" }),
    } as Response;

    const result = await safeJsonParse(response);
    expect(result).toBe(null);
  });
});
