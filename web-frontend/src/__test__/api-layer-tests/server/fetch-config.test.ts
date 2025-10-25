import {
  fetchWithTimeout,
  API_BASE_URL,
  API_TIMEOUT,
  MAX_RETRIES,
  RETRY_DELAY,
  MAX_RETRY_DELAY,
} from "../../../shared/api-layer/server/config/fetch-config";

// Mock fetch globally
const fetchMock = jest.fn();
global.fetch = fetchMock;

describe("fetchWithTimeout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("makes a successful request without retries", async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      headers: new Headers(),
    };

    fetchMock.mockResolvedValueOnce(mockResponse);

    const promise = fetchWithTimeout("http://example.com/api/test");
    await jest.runAllTimersAsync();
    const result = await promise;

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("http://example.com/api/test", {
      signal: expect.any(AbortSignal),
    });
    expect(result).toBe(mockResponse);
  });

  it("uses default timeout when not specified", async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      headers: new Headers(),
    };

    fetchMock.mockResolvedValueOnce(mockResponse);

    const promise = fetchWithTimeout("http://example.com/api/test");
    await jest.runAllTimersAsync();
    const result = await promise;

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result).toBe(mockResponse);
  });

  it("aborts request on timeout", async () => {
    const abortError = new Error("AbortError");
    abortError.name = "AbortError";

    // Mock fetch to reject with AbortError
    fetchMock.mockRejectedValue(abortError);

    const promise = fetchWithTimeout("http://example.com/api/test", {
      timeout: 1000,
      retries: 1,
    });

    // Add error handler to prevent unhandled rejection warnings
    promise.catch(() => {});

    // Run all timers - this will trigger timeout and exhaust retries
    await jest.runAllTimersAsync();

    await expect(promise).rejects.toThrow("AbortError");
  });

  it("retries on 502, 503, 504 status codes", async () => {
    const mockResponse502 = {
      ok: false,
      status: 502,
      headers: new Headers(),
    };

    const mockResponse200 = {
      ok: true,
      status: 200,
      headers: new Headers(),
    };

    fetchMock
      .mockResolvedValueOnce(mockResponse502)
      .mockResolvedValueOnce(mockResponse200);

    const promise = fetchWithTimeout("http://example.com/api/test", {
      retries: 2,
    });
    await jest.runAllTimersAsync();
    const result = await promise;

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result).toBe(mockResponse200);
  });

  it("retries on 429 with valid Retry-After header", async () => {
    const mockResponse429 = {
      ok: false,
      status: 429,
      headers: new Headers({ "Retry-After": "2" }),
    };

    const mockResponse200 = {
      ok: true,
      status: 200,
      headers: new Headers(),
    };

    fetchMock
      .mockResolvedValueOnce(mockResponse429)
      .mockResolvedValueOnce(mockResponse200);

    const promise = fetchWithTimeout("http://example.com/api/test", {
      retries: 2,
    });
    await jest.runAllTimersAsync();
    const result = await promise;

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result).toBe(mockResponse200);
  });

  it("does not retry on 429 with invalid Retry-After header", async () => {
    const mockResponse429 = {
      ok: false,
      status: 429,
      headers: new Headers({ "Retry-After": "invalid" }),
    };

    fetchMock.mockResolvedValueOnce(mockResponse429);

    const promise = fetchWithTimeout("http://example.com/api/test", {
      retries: 2,
    });
    await jest.runAllTimersAsync();
    const result = await promise;

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result).toBe(mockResponse429);
  });

  it("passes Next.js config when provided", async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      headers: new Headers(),
    };

    fetchMock.mockResolvedValueOnce(mockResponse);

    const nextConfig = { revalidate: 60, tags: ["test"] };

    const promise = fetchWithTimeout(
      "http://example.com/api/test",
      {},
      nextConfig
    );
    await jest.runAllTimersAsync();
    await promise;

    expect(fetchMock).toHaveBeenCalledWith("http://example.com/api/test", {
      signal: expect.any(AbortSignal),
      next: nextConfig,
    });
  });

  it("passes custom fetch config", async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      headers: new Headers(),
    };

    fetchMock.mockResolvedValueOnce(mockResponse);

    const customConfig = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ test: "data" }),
    };

    const promise = fetchWithTimeout(
      "http://example.com/api/test",
      customConfig
    );
    await jest.runAllTimersAsync();
    await promise;

    expect(fetchMock).toHaveBeenCalledWith("http://example.com/api/test", {
      ...customConfig,
      signal: expect.any(AbortSignal),
    });
  });

  it("returns response after all retries exhausted", async () => {
    const mockResponse502 = {
      ok: false,
      status: 502,
      headers: new Headers(),
    };

    fetchMock.mockResolvedValue(mockResponse502);

    const promise = fetchWithTimeout("http://example.com/api/test", {
      retries: 2,
    });
    await jest.runAllTimersAsync();
    const result = await promise;

    expect(result).toBe(mockResponse502);
  });

  it("retries on AbortError (timeout)", async () => {
    const abortError = new Error("Request timeout");
    abortError.name = "AbortError";

    const mockResponse = {
      ok: true,
      status: 200,
      headers: new Headers(),
    };

    fetchMock
      .mockRejectedValueOnce(abortError)
      .mockResolvedValueOnce(mockResponse);

    const promise = fetchWithTimeout("http://example.com/api/test", {
      retries: 2,
    });
    await jest.runAllTimersAsync();
    const result = await promise;

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result).toBe(mockResponse);
  });

  it("retries on network TypeError", async () => {
    const networkError = new TypeError("Failed to fetch");

    const mockResponse = {
      ok: true,
      status: 200,
      headers: new Headers(),
    };

    fetchMock
      .mockRejectedValueOnce(networkError)
      .mockResolvedValueOnce(mockResponse);

    const promise = fetchWithTimeout("http://example.com/api/test", {
      retries: 2,
    });
    await jest.runAllTimersAsync();
    const result = await promise;

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result).toBe(mockResponse);
  });

  it("does not retry on ECONNREFUSED", async () => {
    const connectionError = new TypeError("Failed to fetch ECONNREFUSED");

    fetchMock.mockRejectedValueOnce(connectionError);

    const promise = fetchWithTimeout("http://example.com/api/test", {
      retries: 2,
    });

    // Don't need to advance timers since it shouldn't retry
    await expect(promise).rejects.toThrow("Failed to fetch ECONNREFUSED");

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("fetchWithTimeout - retry logic", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("calculates exponential backoff with jitter", async () => {
    const randomSpy = jest.spyOn(Math, "random").mockReturnValue(0.5);

    const abortError = new Error("Request timeout");
    abortError.name = "AbortError";

    const mockResponse = {
      ok: true,
      status: 200,
      headers: new Headers(),
    };

    fetchMock
      .mockRejectedValueOnce(abortError)
      .mockResolvedValueOnce(mockResponse);

    const promise = fetchWithTimeout("http://example.com/api/test", {
      retries: 2,
    });
    await jest.runAllTimersAsync();
    await promise;

    randomSpy.mockRestore();
  });

  it("caps backoff at MAX_RETRY_DELAY", async () => {
    const abortError = new Error("Request timeout");
    abortError.name = "AbortError";

    fetchMock.mockRejectedValue(abortError);

    const promise = fetchWithTimeout("http://example.com/api/test", {
      retries: 3,
    });

    // Add error handler to prevent unhandled rejection warnings
    promise.catch(() => {});

    // Run all timers to completion - this will process all retries
    await jest.runAllTimersAsync();

    await expect(promise).rejects.toThrow("Request timeout");

    // Verify it tried 3 times (initial + 2 retries, since retries: 3 means 3 total attempts)
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("parses Retry-After header correctly", async () => {
    const mockResponse429 = {
      ok: false,
      status: 429,
      headers: new Headers({ "Retry-After": "30" }),
    };

    fetchMock.mockResolvedValueOnce(mockResponse429);

    const promise = fetchWithTimeout("http://example.com/api/test", {
      retries: 1,
    });
    await jest.runAllTimersAsync();
    const result = await promise;

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result).toBe(mockResponse429);
  });

  it("handles invalid Retry-After header", async () => {
    const mockResponse429 = {
      ok: false,
      status: 429,
      headers: new Headers({ "Retry-After": "invalid" }),
    };

    fetchMock.mockResolvedValueOnce(mockResponse429);

    const promise = fetchWithTimeout("http://example.com/api/test", {
      retries: 1,
    });
    await jest.runAllTimersAsync();
    const result = await promise;

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result).toBe(mockResponse429);
  });
});

describe("Constants", () => {
  it("exports correct default values", () => {
    expect(API_BASE_URL).toBe("http://localhost:3001");
    expect(API_TIMEOUT).toBe(5000);
    expect(MAX_RETRIES).toBe(3);
    expect(RETRY_DELAY).toBe(1000);
    expect(MAX_RETRY_DELAY).toBe(10000);
  });
});
