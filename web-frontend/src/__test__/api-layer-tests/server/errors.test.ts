import {
  ServerApiError,
  NetworkError,
  TimeoutError,
  ValidationError,
  NotFoundError,
  ServerDownError,
  RateLimitError,
  UnauthorizedError,
  ForbiddenError,
} from "../../../shared/api-layer/server/api/errors";

describe("ServerApiError", () => {
  it("is an instance of ServerApiError and Error", () => {
    const err = new ServerApiError("test error");
    expect(err).toBeInstanceOf(ServerApiError);
    expect(err).toBeInstanceOf(Error);
  });

  it("sets name and message", () => {
    const err = new ServerApiError("Not Found");
    expect(err.name).toBe("ServerApiError");
    expect(err.message).toBe("Not Found");
  });

  it("sets default code when not provided", () => {
    const err = new ServerApiError("test");
    expect(err.code).toBe("API_ERROR");
  });

  it("sets custom code when provided", () => {
    const err = new ServerApiError("test", { code: "CUSTOM_ERROR" });
    expect(err.code).toBe("CUSTOM_ERROR");
  });

  it("sets optional properties when provided", () => {
    const originalError = new Error("original");
    const details = { endpoint: "/portfolio/1" };
    const err = new ServerApiError("Oops", {
      status: 404,
      code: "NOT_FOUND",
      details,
      isOperational: false,
      originalError,
    });
    expect(err.status).toBe(404);
    expect(err.code).toBe("NOT_FOUND");
    expect(err.details).toBe(details);
    expect(err.isOperational).toBe(false);
    expect(err.originalError).toBe(originalError);
  });

  it("defaults isOperational to true when not provided", () => {
    const err = new ServerApiError("test");
    expect(err.isOperational).toBe(true);
  });

  it("toClientSafe returns safe client response in production", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    const details = { sensitive: "data" };
    const err = new ServerApiError("test error", {
      status: 500,
      code: "INTERNAL_ERROR",
      details,
    });

    const safe = err.toClientSafe();
    expect(safe).toEqual({
      message: "test error",
      status: 500,
      code: "INTERNAL_ERROR",
    });

    process.env.NODE_ENV = originalEnv;
  });

  it("toClientSafe includes details and stack in development", () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    const details = { debug: "info" };
    const err = new ServerApiError("test error", {
      status: 500,
      code: "INTERNAL_ERROR",
      details,
    });

    const safe = err.toClientSafe();
    expect(safe.message).toBe("test error");
    expect(safe.status).toBe(500);
    expect(safe.code).toBe("INTERNAL_ERROR");
    expect(safe.details).toBe(details);
    expect(safe.stack).toBeDefined();

    process.env.NODE_ENV = originalEnv;
  });

  it("isRetryable returns true for retryable status codes", () => {
    const retryableStatuses = [408, 429, 502, 503, 504];
    retryableStatuses.forEach((status) => {
      const err = new ServerApiError("test", { status });
      expect(err.isRetryable()).toBe(true);
    });
  });

  it("isRetryable returns false for non-retryable status codes", () => {
    const nonRetryableStatuses = [200, 400, 401, 403, 404, 500];
    nonRetryableStatuses.forEach((status) => {
      const err = new ServerApiError("test", { status });
      expect(err.isRetryable()).toBe(false);
    });
  });

  it("isRetryable returns false when no status is set", () => {
    const err = new ServerApiError("test");
    expect(err.isRetryable()).toBe(false);
  });
});

describe("NetworkError", () => {
  it("extends ServerApiError with correct properties", () => {
    const originalError = new Error("network failure");
    const err = new NetworkError("Network request failed", originalError);

    expect(err).toBeInstanceOf(NetworkError);
    expect(err).toBeInstanceOf(ServerApiError);
    expect(err.name).toBe("NetworkError");
    expect(err.message).toBe("Network request failed");
    expect(err.code).toBe("NETWORK_ERROR");
    expect(err.originalError).toBe(originalError);
    expect(err.details).toBe("network failure");
  });

  it("uses default message when not provided", () => {
    const err = new NetworkError();
    expect(err.message).toBe("Network request failed");
  });
});

describe("TimeoutError", () => {
  it("extends ServerApiError with correct properties", () => {
    const originalError = new Error("timeout");
    const err = new TimeoutError("Request timeout", originalError);

    expect(err).toBeInstanceOf(TimeoutError);
    expect(err).toBeInstanceOf(ServerApiError);
    expect(err.name).toBe("TimeoutError");
    expect(err.message).toBe("Request timeout");
    expect(err.code).toBe("TIMEOUT");
    expect(err.status).toBe(408);
    expect(err.originalError).toBe(originalError);
  });

  it("uses default message when not provided", () => {
    const err = new TimeoutError();
    expect(err.message).toBe("Request timeout");
  });
});

describe("ValidationError", () => {
  it("extends ServerApiError with correct properties", () => {
    const details = { field: "email", reason: "invalid format" };
    const err = new ValidationError("Invalid email format", details);

    expect(err).toBeInstanceOf(ValidationError);
    expect(err).toBeInstanceOf(ServerApiError);
    expect(err.name).toBe("ValidationError");
    expect(err.message).toBe("Invalid email format");
    expect(err.code).toBe("VALIDATION_ERROR");
    expect(err.status).toBe(400);
    expect(err.details).toBe(details);
  });
});

describe("NotFoundError", () => {
  it("extends ServerApiError with correct properties", () => {
    const err = new NotFoundError("user");

    expect(err).toBeInstanceOf(NotFoundError);
    expect(err).toBeInstanceOf(ServerApiError);
    expect(err.name).toBe("NotFoundError");
    expect(err.message).toBe("user not found");
    expect(err.code).toBe("NOT_FOUND");
    expect(err.status).toBe(404);
  });
});

describe("ServerDownError", () => {
  it("extends ServerApiError with correct properties", () => {
    const originalError = new Error("connection refused");
    const err = new ServerDownError(
      "API server is not responding",
      originalError
    );

    expect(err).toBeInstanceOf(ServerDownError);
    expect(err).toBeInstanceOf(ServerApiError);
    expect(err.name).toBe("ServerDownError");
    expect(err.message).toBe("API server is not responding");
    expect(err.code).toBe("SERVER_DOWN");
    expect(err.status).toBe(503);
    expect(err.originalError).toBe(originalError);
  });

  it("uses default message when not provided", () => {
    const err = new ServerDownError();
    expect(err.message).toBe("API server is not responding");
  });
});

describe("RateLimitError", () => {
  it("extends ServerApiError with correct properties", () => {
    const err = new RateLimitError("Rate limit exceeded", 60);

    expect(err).toBeInstanceOf(RateLimitError);
    expect(err).toBeInstanceOf(ServerApiError);
    expect(err.name).toBe("RateLimitError");
    expect(err.message).toBe("Rate limit exceeded");
    expect(err.code).toBe("RATE_LIMIT");
    expect(err.status).toBe(429);
    expect(err.retryAfter).toBe(60);
    expect(err.details).toEqual({ retryAfter: 60 });
  });

  it("uses default message when not provided", () => {
    const err = new RateLimitError();
    expect(err.message).toBe("Rate limit exceeded");
  });
});

describe("UnauthorizedError", () => {
  it("extends ServerApiError with correct properties", () => {
    const err = new UnauthorizedError("Unauthorized");

    expect(err).toBeInstanceOf(UnauthorizedError);
    expect(err).toBeInstanceOf(ServerApiError);
    expect(err.name).toBe("UnauthorizedError");
    expect(err.message).toBe("Unauthorized");
    expect(err.code).toBe("UNAUTHORIZED");
    expect(err.status).toBe(401);
    expect(err.isOperational).toBe(true);
  });

  it("uses default message when not provided", () => {
    const err = new UnauthorizedError();
    expect(err.message).toBe("Unauthorized");
  });
});

describe("ForbiddenError", () => {
  it("extends ServerApiError with correct properties", () => {
    const err = new ForbiddenError("Forbidden");

    expect(err).toBeInstanceOf(ForbiddenError);
    expect(err).toBeInstanceOf(ServerApiError);
    expect(err.name).toBe("ForbiddenError");
    expect(err.message).toBe("Forbidden");
    expect(err.code).toBe("FORBIDDEN");
    expect(err.status).toBe(403);
    expect(err.isOperational).toBe(true);
  });

  it("uses default message when not provided", () => {
    const err = new ForbiddenError();
    expect(err.message).toBe("Forbidden");
  });
});
