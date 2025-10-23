import {
  serverRequest,
  get,
  post,
  put,
  patch,
  del,
} from "../../../shared/api-layer/server/api/request";
import {
  ServerApiError,
  NetworkError,
  TimeoutError,
  ServerDownError,
} from "../../../shared/api-layer/server/api/errors";

// Mock fetch globally
const fetchMock = jest.fn();
global.fetch = fetchMock;

// Mock the fetch-config module
jest.mock("../../../shared/api-layer/server/config/fetch-config", () => ({
  API_BASE_URL: "http://localhost:3001",
  API_TIMEOUT: 15000,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  fetchWithTimeout: jest.fn(),
}));

describe("serverRequest", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment
    delete process.env.NODE_ENV;
  });

  it("makes a successful GET request", async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ data: "test" }),
      headers: new Headers({ "content-type": "application/json" }),
    };

    const {
      fetchWithTimeout,
    } = require("../../../shared/api-layer/server/config/fetch-config");
    fetchWithTimeout.mockResolvedValue(mockResponse);

    const result = await serverRequest({
      url: "/test",
      method: "GET",
    });

    expect(result).toEqual({ data: "test" });
    expect(fetchWithTimeout).toHaveBeenCalledWith(
      "http://localhost:3001/test",
      expect.objectContaining({
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }),
      undefined
    );
  });

  it("makes a POST request with body", async () => {
    const mockResponse = {
      ok: true,
      status: 201,
      json: jest.fn().mockResolvedValue({ id: 1 }),
      headers: new Headers({ "content-type": "application/json" }),
    };

    const {
      fetchWithTimeout,
    } = require("../../../shared/api-layer/server/config/fetch-config");
    fetchWithTimeout.mockResolvedValue(mockResponse);

    const body = { name: "test" };
    const result = await serverRequest({
      url: "/test",
      method: "POST",
      body,
    });

    expect(result).toEqual({ id: 1 });
    expect(fetchWithTimeout).toHaveBeenCalledWith(
      "http://localhost:3001/test",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(body),
      }),
      undefined
    );
  });

  it("handles non-JSON responses", async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      text: jest.fn().mockResolvedValue("plain text"),
      headers: new Headers({ "content-type": "text/plain" }),
    };

    const {
      fetchWithTimeout,
    } = require("../../../shared/api-layer/server/config/fetch-config");
    fetchWithTimeout.mockResolvedValue(mockResponse);

    const result = await serverRequest({
      url: "/test",
      method: "GET",
    });

    expect(result).toBe("plain text");
  });

  it("throws ServerApiError for non-2xx responses", async () => {
    const mockResponse = {
      ok: false,
      status: 404,
      json: jest.fn().mockResolvedValue({ message: "Not found" }),
      headers: new Headers({ "content-type": "application/json" }),
    };

    const {
      fetchWithTimeout,
    } = require("../../../shared/api-layer/server/config/fetch-config");
    fetchWithTimeout.mockResolvedValue(mockResponse);

    await expect(
      serverRequest({
        url: "/test",
        method: "GET",
      })
    ).rejects.toThrow(ServerApiError);

    const error = await serverRequest({
      url: "/test",
      method: "GET",
    }).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ServerApiError);
    expect((error as ServerApiError).status).toBe(404);
  });

  it("throws specific error types based on status", async () => {
    const testCases = [
      { status: 401, expectedError: "UnauthorizedError" },
      { status: 403, expectedError: "ForbiddenError" },
      { status: 429, expectedError: "RateLimitError" },
    ];

    for (const { status, expectedError } of testCases) {
      const mockResponse = {
        ok: false,
        status,
        json: jest.fn().mockResolvedValue({ message: "Error" }),
        headers: new Headers({ "content-type": "application/json" }),
      };

      const {
        fetchWithTimeout,
      } = require("../../../shared/api-layer/server/config/fetch-config");
      fetchWithTimeout.mockResolvedValue(mockResponse);

      const error = await serverRequest({
        url: "/test",
        method: "GET",
      }).catch((e: unknown) => e);

      expect((error as any).constructor.name).toBe(expectedError);
    }
  });

  it("throws ServerApiError when URL is not provided", async () => {
    await expect(
      serverRequest({
        url: "",
        method: "GET",
      })
    ).rejects.toThrow(ServerApiError);
  });

  it("builds URL with query parameters", async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({}),
      headers: new Headers({ "content-type": "application/json" }),
    };

    const {
      fetchWithTimeout,
    } = require("../../../shared/api-layer/server/config/fetch-config");
    fetchWithTimeout.mockResolvedValue(mockResponse);

    await serverRequest({
      url: "/test",
      method: "GET",
      query: { param1: "value1", param2: "value2" },
    });

    expect(fetchWithTimeout).toHaveBeenCalledWith(
      "http://localhost:3001/test?param1=value1&param2=value2",
      expect.any(Object),
      undefined
    );
  });

  it("handles array query parameters", async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({}),
      headers: new Headers({ "content-type": "application/json" }),
    };

    const {
      fetchWithTimeout,
    } = require("../../../shared/api-layer/server/config/fetch-config");
    fetchWithTimeout.mockResolvedValue(mockResponse);

    await serverRequest({
      url: "/test",
      method: "GET",
      query: { tags: ["tag1", "tag2"] },
    });

    expect(fetchWithTimeout).toHaveBeenCalledWith(
      "http://localhost:3001/test?tags=tag1&tags=tag2",
      expect.any(Object),
      undefined
    );
  });

  it("passes custom headers", async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({}),
      headers: new Headers({ "content-type": "application/json" }),
    };

    const {
      fetchWithTimeout,
    } = require("../../../shared/api-layer/server/config/fetch-config");
    fetchWithTimeout.mockResolvedValue(mockResponse);

    const customHeaders = { Authorization: "Bearer token" };

    await serverRequest({
      url: "/test",
      method: "GET",
      headers: customHeaders,
    });

    expect(fetchWithTimeout).toHaveBeenCalledWith(
      "http://localhost:3001/test",
      expect.objectContaining({
        headers: {
          "Content-Type": "application/json",
          ...customHeaders,
        },
      }),
      undefined
    );
  });

  it("passes Next.js config when provided", async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({}),
      headers: new Headers({ "content-type": "application/json" }),
    };

    const {
      fetchWithTimeout,
    } = require("../../../shared/api-layer/server/config/fetch-config");
    fetchWithTimeout.mockResolvedValue(mockResponse);

    const nextConfig = { revalidate: 60, tags: ["test"] };

    await serverRequest({
      url: "/test",
      method: "GET",
      revalidate: 60,
      tags: ["test"],
    });

    expect(fetchWithTimeout).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Object),
      nextConfig
    );
  });
});

describe("Convenience methods", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const {
      fetchWithTimeout,
    } = require("../../../shared/api-layer/server/config/fetch-config");
    fetchWithTimeout.mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ data: "success" }),
      headers: new Headers({ "content-type": "application/json" }),
    });
  });

  it("get method calls serverRequest with GET method", async () => {
    const result = await get("/test", { param: "value" });
    expect(result).toEqual({ data: "success" });
  });

  it("post method calls serverRequest with POST method", async () => {
    const body = { name: "test" };
    const result = await post("/test", body);
    expect(result).toEqual({ data: "success" });
  });

  it("put method calls serverRequest with PUT method", async () => {
    const body = { name: "test" };
    const result = await put("/test", body);
    expect(result).toEqual({ data: "success" });
  });

  it("patch method calls serverRequest with PATCH method", async () => {
    const body = { name: "test" };
    const result = await patch("/test", body);
    expect(result).toEqual({ data: "success" });
  });

  it("del method calls serverRequest with DELETE method", async () => {
    const result = await del("/test");
    expect(result).toEqual({ data: "success" });
  });
});

describe("Error handling", () => {
  it("handles network errors", async () => {
    const {
      fetchWithTimeout,
    } = require("../../../shared/api-layer/server/config/fetch-config");
    fetchWithTimeout.mockRejectedValue(new TypeError("fetch failed"));

    await expect(
      serverRequest({
        url: "/test",
        method: "GET",
      })
    ).rejects.toThrow(ServerDownError);
  });

  it("handles timeout errors", async () => {
    const {
      fetchWithTimeout,
    } = require("../../../shared/api-layer/server/config/fetch-config");
    const abortError = new Error("Request timeout");
    abortError.name = "AbortError";
    fetchWithTimeout.mockRejectedValue(abortError);

    await expect(
      serverRequest({
        url: "/test",
        method: "GET",
      })
    ).rejects.toThrow(TimeoutError);
  });

  it("handles unknown errors", async () => {
    const {
      fetchWithTimeout,
    } = require("../../../shared/api-layer/server/config/fetch-config");
    fetchWithTimeout.mockRejectedValue(new Error("Unknown error"));

    await expect(
      serverRequest({
        url: "/test",
        method: "GET",
      })
    ).rejects.toThrow(ServerApiError);
  });
});
