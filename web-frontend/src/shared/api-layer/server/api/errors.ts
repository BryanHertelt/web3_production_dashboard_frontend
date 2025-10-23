/**
 * Custom error classes for server-side API operations
 */

export class ServerApiError extends Error {
  /**
   * The HTTP status code associated with the error, if applicable.
   *
   * @readonly
   * @type {?number}
   */
  readonly status?: number;
  /**
   * A string code identifying the specific type of error.
   *
   * @readonly
   * @type {string}
   */
  readonly code: string;
  /**
   * Additional details about the error, which can be of any type.
   *
   * @readonly
   * @type {?unknown}
   */
  readonly details?: unknown;
  /**
   * Indicates whether the error is operational (expected runtime error) or a programming error.
   *
   * @readonly
   * @type {boolean}
   */
  readonly isOperational: boolean;
  /**
   * The original error that caused this ServerApiError, if any.
   *
   * @readonly
   * @type {?Error}
   */
  readonly originalError?: Error;

  /**
   * Creates an instance of ServerApiError.
   *
   * @constructor
   * @param {string} message
   * @param {{
   *       status?: number;
   *       code?: string;
   *       details?: unknown;
   *       isOperational?: boolean;
   *       originalError?: Error;
   *     }} [options={}]
   */
  constructor(
    message: string,
    options: {
      status?: number;
      code?: string;
      details?: unknown;
      isOperational?: boolean;
      originalError?: Error;
    } = {}
  ) {
    super(message);
    this.name = "ServerApiError";
    this.status = options.status;
    this.code = options.code || "API_ERROR";
    this.details = options.details;
    this.isOperational = options.isOperational ?? true;
    this.originalError = options.originalError;

    // Maintains proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Converts the error to a safe client response by removing sensitive data and exposing only necessary information.
   */
  toClientSafe() {
    return {
      message: this.message,
      status: this.status,
      code: this.code,
      // Only expose details in development
      ...(process.env.NODE_ENV === "development" && {
        details: this.details,
        stack: this.stack,
      }),
    };
  }

  /**
   * Determines if the error is retryable based on the HTTP status code.
   */
  isRetryable(): boolean {
    if (!this.status) return false;
    // Retry on 408, 429, 502, 503, 504
    return [408, 429, 502, 503, 504].includes(this.status);
  }
}

/**
 * Represents network-related errors that occur during API requests, such as connection failures.
 *
 * @export
 * @class NetworkError
 * @typedef {NetworkError}
 * @extends {ServerApiError}
 */
export class NetworkError extends ServerApiError {
  /**
   * Creates an instance of NetworkError.
   *
   * @constructor
   * @param {string} [message='Network request failed']
   * @param {?Error} [originalError]
   */
  constructor(message = "Network request failed", originalError?: Error) {
    super(message, {
      code: "NETWORK_ERROR",
      originalError,
      details: originalError?.message,
    });
    this.name = "NetworkError";
  }
}

/**
 * Represents errors caused by request timeouts during API operations.
 *
 * @export
 * @class TimeoutError
 * @typedef {TimeoutError}
 * @extends {ServerApiError}
 */
export class TimeoutError extends ServerApiError {
  /**
   * Creates an instance of TimeoutError.
   *
   * @constructor
   * @param {string} [message='Request timeout']
   * @param {?Error} [originalError]
   */
  constructor(message = "Request timeout", originalError?: Error) {
    super(message, {
      status: 408,
      code: "TIMEOUT",
      originalError,
    });
    this.name = "TimeoutError";
  }
}

/**
 * Represents errors due to invalid input or data validation failures in API requests.
 *
 * @export
 * @class ValidationError
 * @typedef {ValidationError}
 * @extends {ServerApiError}
 */
export class ValidationError extends ServerApiError {
  /**
   * Creates an instance of ValidationError.
   *
   * @constructor
   * @param {string} message
   * @param {?unknown} [details]
   */
  constructor(message: string, details?: unknown) {
    super(message, {
      status: 400,
      code: "VALIDATION_ERROR",
      details,
    });
    this.name = "ValidationError";
  }
}

/**
 * Represents errors when a requested resource is not found on the server.
 *
 * @export
 * @class NotFoundError
 * @typedef {NotFoundError}
 * @extends {ServerApiError}
 */
export class NotFoundError extends ServerApiError {
  /**
   * Creates an instance of NotFoundError.
   *
   * @constructor
   * @param {string} resource
   */
  constructor(resource: string) {
    super(`${resource} not found`, {
      status: 404,
      code: "NOT_FOUND",
    });
    this.name = "NotFoundError";
  }
}

/**
 * Represents errors when the API server is down or not responding.
 *
 * @export
 * @class ServerDownError
 * @typedef {ServerDownError}
 * @extends {ServerApiError}
 */
export class ServerDownError extends ServerApiError {
  /**
   * Creates an instance of ServerDownError.
   *
   * @constructor
   * @param {string} [message='API server is not responding']
   * @param {?Error} [originalError]
   */
  constructor(message = "API server is not responding", originalError?: Error) {
    super(message, {
      status: 503,
      code: "SERVER_DOWN",
      originalError,
    });
    this.name = "ServerDownError";
  }
}

/**
 * Represents errors when the API rate limit has been exceeded.
 *
 * @export
 * @class RateLimitError
 * @typedef {RateLimitError}
 * @extends {ServerApiError}
 */
export class RateLimitError extends ServerApiError {
  /**
   * The number of seconds to wait before retrying the request, if provided by the server.
   *
   * @readonly
   * @type {?number}
   */
  readonly retryAfter?: number;

  /**
   * Creates an instance of RateLimitError.
   *
   * @constructor
   * @param {string} [message='Rate limit exceeded']
   * @param {?number} [retryAfter]
   */
  constructor(message = "Rate limit exceeded", retryAfter?: number) {
    super(message, {
      status: 429,
      code: "RATE_LIMIT",
      details: { retryAfter },
    });
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
}

/**
 * Represents errors when authentication is required but not provided or invalid.
 *
 * @export
 * @class UnauthorizedError
 * @typedef {UnauthorizedError}
 * @extends {ServerApiError}
 */
export class UnauthorizedError extends ServerApiError {
  /**
   * Creates an instance of UnauthorizedError.
   *
   * @constructor
   * @param {string} [message='Unauthorized']
   */
  constructor(message = "Unauthorized") {
    super(message, {
      status: 401,
      code: "UNAUTHORIZED",
      isOperational: true,
    });
    this.name = "UnauthorizedError";
  }
}

/**
 * Represents errors when access to a resource is forbidden due to insufficient permissions.
 *
 * @export
 * @class ForbiddenError
 * @typedef {ForbiddenError}
 * @extends {ServerApiError}
 */
export class ForbiddenError extends ServerApiError {
  /**
   * Creates an instance of ForbiddenError.
   *
   * @constructor
   * @param {string} [message='Forbidden']
   */
  constructor(message = "Forbidden") {
    super(message, {
      status: 403,
      code: "FORBIDDEN",
      isOperational: true,
    });
    this.name = "ForbiddenError";
  }
}
