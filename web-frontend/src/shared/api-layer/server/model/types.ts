/**
 * Type definitions for server-side API layer
 */

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/**
 * Configuration options for making API requests, including URL, method, and optional parameters.
 *
 * @export
 * @interface RequestOptions
 * @typedef {RequestOptions}
 * @template [TQuery=unknown]
 * @template [TBody=unknown]
 */
export interface RequestOptions<TQuery = unknown, TBody = unknown> {
  /** API endpoint path (e.g., '/users' or '/users/123') */
  url: string;

  /** HTTP method */
  method: HttpMethod;

  /** Query parameters object */
  query?: TQuery;

  /** Request body (for POST/PUT/PATCH) */
  body?: TBody;

  /** Custom headers */
  headers?: Record<string, string>;

  /** Next.js cache strategy */
  cache?: RequestCache;

  /** Next.js ISR revalidation time in seconds */
  revalidate?: number | false;

  /** Next.js cache tags for on-demand revalidation */
  tags?: string[];

  /** Request timeout in milliseconds (default: 15000) */
  timeout?: number;

  /** Number of retry attempts (default: 3) */
  retries?: number;
}

/**
 * API response wrapper with metadata
 */
export interface ApiResponse<T> {
  /**
   * The response data from the API.
   *
   * @type {T}
   */
  data: T;
  /**
   * The HTTP status code of the response.
   *
   * @type {number}
   */
  status: number;
  /**
   * The response headers.
   *
   * @type {Headers}
   */
  headers: Headers;
  /**
   * The timestamp when the response was received.
   *
   * @type {?string}
   */
  timestamp?: string;
}

/**
 * Paginated response structure
 */
export interface PaginatedResponse<T> {
  /**
   * The array of items for the current page.
   *
   * @type {T[]}
   */
  data: T[];
  /**
   * Pagination metadata including current page, items per page, total items, and total pages.
   *
   * @type {{
   *     page: number;
   *     limit: number;
   *     total: number;
   *     totalPages: number;
   *   }}
   */
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Error details for logging and debugging
 */
export interface ErrorDetails {
  /**
   * The error message describing what went wrong.
   *
   * @type {string}
   */
  message: string;
  /**
   * The HTTP status code associated with the error, if applicable.
   *
   * @type {?number}
   */
  status?: number;
  /**
   * A string code identifying the specific type of error.
   *
   * @type {?string}
   */
  code?: string;
  /**
   * Additional details about the error, which can be of any type.
   *
   * @type {?unknown}
   */
  details?: unknown;
  /**
   * The original error that caused this error, if any.
   *
   * @type {?Error}
   */
  originalError?: Error;
}

/**
 * Success response structure
 */
export interface SuccessResponse<T = void> {
  /**
   * Indicates that the operation was successful.
   *
   * @type {true}
   */
  success: true;
  /**
   * The data returned from the successful operation.
   *
   * @type {T}
   */
  data: T;
  /**
   * An optional success message.
   *
   * @type {?string}
   */
  message?: string;
}

/**
 * Error response structure
 */
export interface ErrorResponse {
  /**
   * Indicates that the operation failed.
   *
   * @type {false}
   */
  success: false;
  /**
   * Details about the error that occurred.
   *
   * @type {{
   *     message: string;
   *     code?: string;
   *     details?: unknown;
   *   }}
   */
  error: {
    message: string;
    code?: string;
    details?: unknown;
  };
}

/**
 * Generic API response (success or error)
 */
export type ApiResult<T> = SuccessResponse<T> | ErrorResponse;
