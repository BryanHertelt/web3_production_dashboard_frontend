/**
 * ApiError represents an error from the API. It extends the built-in Error class to include more context about API failures like details, status, and cause.
 * @class ApiError
 * @extends Error
 */
export class ApiError extends Error {
  readonly status?: number;
  readonly details?: unknown;

  constructor(
    message: string,
    status?: number,
    details?: unknown,
    cause?: unknown
  ) {
    super(message, { cause });
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}
