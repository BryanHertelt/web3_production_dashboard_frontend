/** axios-config */
export type { AxiosInstance, AxiosResponse, AxiosError } from "axios";
/** cancel-registry */
export type CancelRegistryType = Record<string, unknown>;
type Cell = { controller?: AbortController };
export type AbortRegistryObject = Record<string, Cell>;

/**
 * shape of query parameters you can include in a GET request (things that become ?search=bitcoin&... in the URL).
 * @extends QueryObj so values stay URL-safe.
 * @interface searchQuery
 */
export interface searchQuery extends QueryObj {
  search?: string;
}

/**
 * @type {HttpMethod} is a union type of allowed HTTP methods. (must be one of these strings)
 */
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type QueryObj = Record<
  string,
  string | number | boolean | null | undefined
>;
/**
 * @type {RequestOptions} defines the shape of the options object passed to the request function.
 * It includes the
 * @property {string} url - The endpoint URL.
 * @property {HttpMethod} method - The HTTP method to use (GET, POST, etc.).
 * @property {TQuery} [query] - Optional query parameters to include in the request URL.
 * @property {TBody} [body] - Optional request body for methods like POST or PUT.
 * URL, HTTP method, optional query parameters, and optional request body.
 */
export interface RequestOptions<
  TBody = undefined,
  TQuery extends QueryObj | undefined = undefined,
> {
  url: string;
  method: HttpMethod;
  query?: TQuery;
  body?: TBody;
}

/**
 * Helper types for axios-config helpers.
 */
/**
 * @type { KnownHttpStatus } is a narrow subset of HTTP status codes we care about for logging
 * or later mapping to UI messages.
 * @type { KnownHttpStatus } tells us that our error status is one of these exact known values.
 */
export type KnownHttpStatus =
  | 400
  | 401
  | 403
  | 404
  | 409
  | 422
  | 429
  | 500
  | 502
  | 503
  | 504;
