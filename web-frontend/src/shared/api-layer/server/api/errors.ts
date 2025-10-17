/**
 * Custom error classes for server-side API operations
 */

export class ServerApiError extends Error {
  readonly status?: number;
  readonly code: string;
  readonly details?: unknown;
  readonly isOperational: boolean;
  readonly originalError?: Error;

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
    this.name = 'ServerApiError';
    this.status = options.status;
    this.code = options.code || 'API_ERROR';
    this.details = options.details;
    this.isOperational = options.isOperational ?? true;
    this.originalError = options.originalError;

    // Maintains proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Convert to safe client response (removes sensitive data)
   */
  toClientSafe() {
    return {
      message: this.message,
      status: this.status,
      code: this.code,
      // Only expose details in development
      ...(process.env.NODE_ENV === 'development' && { 
        details: this.details,
        stack: this.stack
      }),
    };
  }

  /**
   * Check if error is retryable
   */
  isRetryable(): boolean {
    if (!this.status) return false;
    // Retry on 408, 429, 502, 503, 504
    return [408, 429, 502, 503, 504].includes(this.status);
  }
}

export class NetworkError extends ServerApiError {
  constructor(message = 'Network request failed', originalError?: Error) {
    super(message, {
      code: 'NETWORK_ERROR',
      originalError,
      details: originalError?.message,
    });
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends ServerApiError {
  constructor(message = 'Request timeout', originalError?: Error) {
    super(message, {
      status: 408,
      code: 'TIMEOUT',
      originalError,
    });
    this.name = 'TimeoutError';
  }
}

export class ValidationError extends ServerApiError {
  constructor(message: string, details?: unknown) {
    super(message, {
      status: 400,
      code: 'VALIDATION_ERROR',
      details,
    });
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends ServerApiError {
  constructor(resource: string) {
    super(`${resource} not found`, {
      status: 404,
      code: 'NOT_FOUND',
    });
    this.name = 'NotFoundError';
  }
}

export class ServerDownError extends ServerApiError {
  constructor(message = 'API server is not responding', originalError?: Error) {
    super(message, {
      status: 503,
      code: 'SERVER_DOWN',
      originalError,
    });
    this.name = 'ServerDownError';
  }
}

export class RateLimitError extends ServerApiError {
  readonly retryAfter?: number;

  constructor(message = 'Rate limit exceeded', retryAfter?: number) {
    super(message, {
      status: 429,
      code: 'RATE_LIMIT',
      details: { retryAfter },
    });
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class UnauthorizedError extends ServerApiError {
  constructor(message = 'Unauthorized') {
    super(message, {
      status: 401,
      code: 'UNAUTHORIZED',
      isOperational: true,
    });
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends ServerApiError {
  constructor(message = 'Forbidden') {
    super(message, {
      status: 403,
      code: 'FORBIDDEN',
      isOperational: true,
    });
    this.name = 'ForbiddenError';
  }
}