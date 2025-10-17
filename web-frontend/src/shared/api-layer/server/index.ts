/**
 * Main export file for server-side API layer
 * 
 * Usage:
 * ```typescript
 * import { get, post, ServerApiError } from '@/lib/api-layer/server';
 * 
 * try {
 *   const users = await get<User[]>('/users');
 * } catch (error) {
 *   if (error instanceof ServerApiError) {
 *     console.error(error.toClientSafe());
 *   }
 * }
 * ```
 */

// Main request functions
export { serverRequest, get, post, put, patch, del } from './api/request';

// Error classes
export {
  ServerApiError,
  NetworkError,
  TimeoutError,
  ValidationError,
  NotFoundError,
  ServerDownError,
  RateLimitError,
  UnauthorizedError,
  ForbiddenError,
} from './api/errors';

// Configuration
export {
  API_BASE_URL,
  API_TIMEOUT,
  MAX_RETRIES,
  RETRY_DELAY,
} from './config/fetch-config';

// Types
export type {
  RequestOptions,
  ApiResponse,
  HttpMethod,
  ErrorDetails,
  PaginatedResponse,
  SuccessResponse,
  ErrorResponse,
  ApiResult,
} from './model/types';

// Helper functions (optional - export if needed externally)
export {
  buildUrl,
  sanitizeForLogging,
  getStatusCategory,
} from './model/helpers';