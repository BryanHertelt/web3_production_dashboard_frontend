/**
 * Type definitions for server-side API layer
 */

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

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
  data: T;
  status: number;
  headers: Headers;
  timestamp?: string;
}

/**
 * Paginated response structure
 */
export interface PaginatedResponse<T> {
  data: T[];
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
  message: string;
  status?: number;
  code?: string;
  details?: unknown;
  originalError?: Error;
}

/**
 * Success response structure
 */
export interface SuccessResponse<T = void> {
  success: true;
  data: T;
  message?: string;
}

/**
 * Error response structure
 */
export interface ErrorResponse {
  success: false;
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