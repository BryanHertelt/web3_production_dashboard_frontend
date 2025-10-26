import { API_BASE_URL } from "../config/fetch-config";
import { fetchWithTimeout } from "../config/fetch-config";
import { ServerApiError } from "./errors";
import {
  buildUrl,
  sanitizeForLogging,
  isJsonResponse,
  handleErrorResponse,
  handleRequestError,
} from "../model/helpers";
import { serverLogger } from "../../../logger/server-logger/model/logger";
import type { RequestOptions } from "../model/types";

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
  TQuery = undefined,
>(options: RequestOptions<TQuery, TBody>): Promise<TResponse> {
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
    signal,
  } = options;

  // Validate URL
  if (!url) {
    throw new ServerApiError("URL is required", {
      status: 400,
      code: "INVALID_URL",
      isOperational: false,
    });
  }

  // Build full URL with query parameters
  const fullUrl = buildUrl(API_BASE_URL, url, query as Record<string, unknown>);

  // Prepare request configuration
  const requestConfig: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    cache,
  };

  // Add body for POST/PUT/PATCH requests
  if (body && ["POST", "PUT", "PATCH"].includes(method)) {
    requestConfig.body = JSON.stringify(body);
  }

  // Prepare Next.js config
  const nextConfig =
    revalidate !== undefined || tags !== undefined
      ? {
          revalidate,
          tags,
        }
      : undefined;

  // Log request in development
  if (process.env.NODE_ENV === "development") {
    await serverLogger.info(`[Server API] ${method} ${url}`, {
      query: sanitizeForLogging(query),
      body: sanitizeForLogging(body),
    });
  }

  try {
    // Make request with timeout and retry logic
    const response = await fetchWithTimeout(
      fullUrl,
      {
        ...requestConfig,
        method,
        timeout,
        retries,
        signal,
      },
      nextConfig
    );

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
    if (process.env.NODE_ENV === "development") {
      await serverLogger.info(
        `[Server API] ${method} ${url} - ${response.status} OK`
      );
    }

    return data;
  } catch (error) {
    // Handle and log errors appropriately
    return handleRequestError(error, url, method);
  }
}

/**
 * Performs a GET request to the specified URL with optional query parameters.
 *
 * @template TResponse - The expected response data type.
 * @template TQuery - The type of query parameters.
 * @param url - The API endpoint path.
 * @param query - Optional query parameters to append to the URL.
 * @param options - Additional request options.
 * @returns A Promise that resolves to the response data.
 */
export async function get<TResponse, TQuery = undefined>(
  url: string,
  query?: TQuery,
  options?: Partial<RequestOptions<TQuery, undefined>>
): Promise<TResponse> {
  return serverRequest<TResponse, undefined, TQuery>({
    url,
    method: "GET",
    query,
    ...options,
  });
}

/**
 * Performs a POST request to the specified URL with an optional request body.
 *
 * @template TResponse - The expected response data type.
 * @template TBody - The type of the request body.
 * @param url - The API endpoint path.
 * @param body - The request body data.
 * @param options - Additional request options.
 * @returns A Promise that resolves to the response data.
 */
export async function post<TResponse, TBody = unknown>(
  url: string,
  body?: TBody,
  options?: Partial<RequestOptions<undefined, TBody>>
): Promise<TResponse> {
  return serverRequest<TResponse, TBody, undefined>({
    url,
    method: "POST",
    body,
    ...options,
  });
}

/**
 * Performs a PUT request to the specified URL with an optional request body.
 *
 * @template TResponse - The expected response data type.
 * @template TBody - The type of the request body.
 * @param url - The API endpoint path.
 * @param body - The request body data.
 * @param options - Additional request options.
 * @returns A Promise that resolves to the response data.
 */
export async function put<TResponse, TBody = unknown>(
  url: string,
  body?: TBody,
  options?: Partial<RequestOptions<undefined, TBody>>
): Promise<TResponse> {
  return serverRequest<TResponse, TBody, undefined>({
    url,
    method: "PUT",
    body,
    ...options,
  });
}

/**
 * Performs a PATCH request to the specified URL with an optional request body.
 *
 * @template TResponse - The expected response data type.
 * @template TBody - The type of the request body.
 * @param url - The API endpoint path.
 * @param body - The request body data.
 * @param options - Additional request options.
 * @returns A Promise that resolves to the response data.
 */
export async function patch<TResponse, TBody = unknown>(
  url: string,
  body?: TBody,
  options?: Partial<RequestOptions<undefined, TBody>>
): Promise<TResponse> {
  return serverRequest<TResponse, TBody, undefined>({
    url,
    method: "PATCH",
    body,
    ...options,
  });
}

/**
 * Performs a DELETE request to the specified URL.
 *
 * @template TResponse - The expected response data type.
 * @param url - The API endpoint path.
 * @param options - Additional request options.
 * @returns A Promise that resolves to the response data.
 */
export async function del<TResponse>(
  url: string,
  options?: Partial<RequestOptions<undefined, undefined>>
): Promise<TResponse> {
  return serverRequest<TResponse, undefined, undefined>({
    url,
    method: "DELETE",
    ...options,
  });
}
