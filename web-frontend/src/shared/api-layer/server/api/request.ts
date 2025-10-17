import { API_BASE_URL } from '../config/fetch-config';
import { fetchWithTimeout } from '../config/fetch-config';
import {
  ServerApiError,
  NetworkError,
  TimeoutError,
  ServerDownError,
  RateLimitError,
  UnauthorizedError,
  ForbiddenError,
} from './errors';
import {
  buildUrl,
  isNetworkError,
  isTimeoutError,
  logError,
  getStatusCategory,
  extractErrorDetails,
  sanitizeForLogging,
  isJsonResponse,
  safeJsonParse,
} from '../model/helpers';
import type { RequestOptions } from '../model/types';

/**
 * Server-side request function
 * 
 * @template TResponse - Expected response data type
 * @template TBody - Request body type
 * @template TQuery - Query parameters type
 * 
 * @param options - Request configuration
 * @returns Promise resolving to typed response data
 * 
 * @throws {ServerApiError} - For API errors with status codes
 * @throws {NetworkError} - For network/connectivity issues
 * @throws {TimeoutError} - For request timeouts
 * @throws {ServerDownError} - When API server is unreachable
 * 
 * @example
 * // GET request
 * const users = await serverRequest<User[]>({
 *   url: '/users',
 *   method: 'GET',
 *   query: { role: 'admin' }
 * });
 * 
 * @example
 * // POST request with error handling
 * try {
 *   const newUser = await serverRequest<User, CreateUserDto>({
 *     url: '/users',
 *     method: 'POST',
 *     body: { name: 'John', email: 'john@example.com' }
 *   });
 * } catch (error) {
 *   if (error instanceof ValidationError) {
 *     // Handle validation error
 *   }
 * }
 */
export async function serverRequest<
  TResponse,
  TBody = undefined,
  TQuery = undefined
>(
  options: RequestOptions<TQuery, TBody>
): Promise<TResponse> {
  const {
    url,
    method,
    query,
    body,
    headers = {},
    cache,
    revalidate,
    tags,
    timeout,
    retries,
  } = options;

  // Validate URL
  if (!url) {
    throw new ServerApiError('URL is required', { 
      status: 400, 
      code: 'INVALID_URL',
      isOperational: false 
    });
  }

  // Build full URL with query parameters
  const fullUrl = buildUrl(API_BASE_URL, url, query as Record<string, unknown>);

  // Prepare request configuration
  const requestConfig: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    cache,
  };

  // Add body for POST/PUT/PATCH requests
  if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
    requestConfig.body = JSON.stringify(body);
  }

  // Prepare Next.js config
  const nextConfig = revalidate !== undefined || tags !== undefined ? {
    revalidate,
    tags,
  } : undefined;

  // Log request in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Server API] ${method} ${url}`, {
      query: sanitizeForLogging(query),
      body: sanitizeForLogging(body),
    });
  }

  try {
    // Make request with timeout and retry logic
    const response = await fetchWithTimeout(fullUrl, {
      ...requestConfig,
      timeout,
      retries,
    }, nextConfig);

    // Handle non-2xx responses
    if (!response.ok) {
      await handleErrorResponse(response, url, method);
    }

    // Parse response based on content type
    let data: TResponse;
    
    if (isJsonResponse(response)) {
      data = await response.json();
    } else {
      // Handle non-JSON responses (text, blob, etc.)
      const text = await response.text();
      data = text as unknown as TResponse; // Type assertion for non-JSON responses
    }
    
    // Log successful request in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Server API] ${method} ${url} - ${response.status} OK`);
    }

    return data;

  } catch (error) {
    // Handle and log errors appropriately
    return handleRequestError(error, url, method);
  }
}

/**
 * Handle non-2xx HTTP responses
 */
async function handleErrorResponse(
  response: Response,
  url: string,
  method: string
): Promise<never> {
  const errorData = await safeJsonParse<Record<string, unknown>>(response, {});
  const message = typeof errorData?.message === 'string' ? errorData.message : `Request failed with status ${response.status}`;
  const category = getStatusCategory(response.status);

  // Log error with details
  logError(`${method} ${url}`, message, {
    status: response.status,
    category,
    errorData: sanitizeForLogging(errorData),
  });

  // Throw specific error types based on status
  switch (response.status) {
    case 401:
      throw new UnauthorizedError(message);
    case 403:
      throw new ForbiddenError(message);
    case 429:
      const retryAfter = response.headers.get('Retry-After');
      const retryAfterSeconds = retryAfter ? parseInt(retryAfter, 10) : undefined;
      throw new RateLimitError(message, retryAfterSeconds);
    default:
      throw new ServerApiError(message, { 
        status: response.status, 
        details: errorData 
      });
  }
}

/**
 * Handle request errors (network, timeout, etc.)
 */
function handleRequestError(
  error: unknown,
  url: string,
  method: string
): never {
  // Already a ServerApiError - just log and rethrow
  if (error instanceof ServerApiError) {
    logError(`${method} ${url}`, error, {
      status: error.status,
      code: error.code,
    });
    throw error;
  }

  // Timeout error
  if (isTimeoutError(error)) {
    const timeoutError = new TimeoutError(
      'Request timeout exceeded',
      error as Error
    );
    logError(`${method} ${url}`, timeoutError, {
      originalError: extractErrorDetails(error),
    });
    throw timeoutError;
  }

  // Network error (connection refused, DNS failure, etc.)
  if (isNetworkError(error)) {
    const networkError = new ServerDownError(
      'API server is not responding',
      error as Error
    );
    logError(`${method} ${url}`, networkError, {
      originalError: extractErrorDetails(error),
    });
    throw networkError;
  }

  // Unknown error - wrap and log
  const details = extractErrorDetails(error);
  const unknownError = new ServerApiError(
    details.message || 'Unknown error occurred',
    {
      status: 500,
      details,
      isOperational: false,
      originalError: error as Error,
    }
  );

  logError(`${method} ${url}`, unknownError, {
    originalError: details,
  });

  throw unknownError;
}

/**
 * Convenience wrapper for GET requests
 */
export async function get<TResponse, TQuery = undefined>(
  url: string,
  query?: TQuery,
  options?: Partial<RequestOptions<TQuery, undefined>>
): Promise<TResponse> {
  return serverRequest<TResponse, undefined, TQuery>({
    url,
    method: 'GET',
    query,
    ...options,
  });
}

/**
 * Convenience wrapper for POST requests
 */
export async function post<TResponse, TBody = unknown>(
  url: string,
  body?: TBody,
  options?: Partial<RequestOptions<undefined, TBody>>
): Promise<TResponse> {
  return serverRequest<TResponse, TBody, undefined>({
    url,
    method: 'POST',
    body,
    ...options,
  });
}

/**
 * Convenience wrapper for PUT requests
 */
export async function put<TResponse, TBody = unknown>(
  url: string,
  body?: TBody,
  options?: Partial<RequestOptions<undefined, TBody>>
): Promise<TResponse> {
  return serverRequest<TResponse, TBody, undefined>({
    url,
    method: 'PUT',
    body,
    ...options,
  });
}

/**
 * Convenience wrapper for PATCH requests
 */
export async function patch<TResponse, TBody = unknown>(
  url: string,
  body?: TBody,
  options?: Partial<RequestOptions<undefined, TBody>>
): Promise<TResponse> {
  return serverRequest<TResponse, TBody, undefined>({
    url,
    method: 'PATCH',
    body,
    ...options,
  });
}

/**
 * Convenience wrapper for DELETE requests
 */
export async function del<TResponse>(
  url: string,
  options?: Partial<RequestOptions<undefined, undefined>>
): Promise<TResponse> {
  return serverRequest<TResponse, undefined, undefined>({
    url,
    method: 'DELETE',
    ...options,
  });
}